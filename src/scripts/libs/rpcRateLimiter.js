var Promise = require('bluebird');

var config, queue, cache, server, request, 
    serverInterval, reporterInterval, reporter;

exports.init = function(_server) {
  request = netIO.request.defaults({ jar: true });
  config  = configs.default.rpcRateLimit;
  server  = _server;
  cache   = {},
  queue   = [];

  //init server interval
  if (serverInterval) clearInterval(serverInterval);
  serverInterval = setInterval(function() {
    serverTick();
  }, config.serverInterval);

  //init reporter interval
  if (reporterInterval) clearInterval(reporterInterval);
  if (config.reporter) {
    reporter = Reporter();
    reporterInterval = setInterval(function() {
      reporter.report();
    }, config.reporterInterval)
  }
}

exports.processRequest = function(body, callback) {
  var originallyArray = false,
      promises = [];

  if (Array.isArray(body)) originallyArray = true;
  else body = [body];

  body.forEach(function(req) {
    promises.push(processRpcMethod(req));
  });

  Promise.all(promises).then(function(results) { 
    if (reporter) reporter.requestFinished(results);
    if (!originallyArray && results.length === 1) {
      results = results[0];
    }
    callback(null, null, results);
  });

  if (reporter) reporter.requestReceived(body);
}


function processRpcMethod(req) {
  return new Promise(function(resolve) {

    if (isMethodThrottled(req.method)) {
      var now     = (new Date()).getTime(),
          reqHash = calcHashFromReq(req),
          cached  = cache[reqHash],
          resp;

      if (cached && now < cache.timeout) {
        resp = Object.assign({}, cached.resp, { id: req.id });
        resolve(resp);
        return;
      }

      if (cached && cached.pending) {
        cached.promises.push({
          originalId: req.id,
          resolve: resolve
        });
        return;
      }

      cache[reqHash] = {
        pending: true,
        promises: []        
      }
    }

    var originalId = req.id;
    req.id = generateUUID();
    queue.push({
      originalId  : originalId,
      req         : req,
      resolve     : resolve
    });
  });
}


function serverTick() {

  if (!queue.length) return console.log('no requests in queue');

  var localQueue = Array.from(queue),
      localQueueMappedById = {},
      reqBody = [];
  
  queue = [];

  localQueue.forEach(function(params) {
    localQueueMappedById[params.req.id] = params;
    reqBody.push(params.req);
  });


  if (reporter) reporter.requestSent(reqBody);

  request({
    url     : server,
    method  : "POST",
    json    : true,
    body    : reqBody
  }, 
  function(error, response, body) {
    var failed = false;

    //detect errors 
    if (error) {
      failed = true;
    } else if (!body || !body.length || body.length !== reqBody.length) {
      failed = true;
    } else if (body.message && body.message === 'Internal server error') {
      failed = true;
    } 
    if (failed) return handleServerFailure();

    //handle success
    body.forEach(function(res) {
      var queue = localQueueMappedById[res.id];
      res.id = queue.originalId;
      cacheResponse(queue.req, res);
      queue.resolve(res);
    });
  });

  function handleServerFailure() {
    queue = localQueue.concat(queue);
  }
}


function cacheResponse(req, res) {
  if (!isMethodThrottled(req.method)) return;
  var now     = (new Date()).getTime(),
      reqHash = calcHashFromReq(req),
      cached  = cache[reqHash];

  if (cached) {
    cached.promises.forEach(function(obj) {
      res = Object.assign({}, res, { id: obj.originalId })
      obj.resolve(res);
    });
  }

  cache[reqHash] = {
    timeout   : now + getMethodTimeout(req.method),
    response  : res
  }
}


function Reporter() {

  var receivedNetworkRequests = 0,
      receivedRpcRequests = 0,
      receivedNetworkRpm = [],
      receivedRpcRpm = [],

      finishedNetworkRequests = 0,
      finishedRpcRequests = 0,

      sentNetworkRequests = 0,
      sentRpcRequests = 0,
      sentNetworkRpm = [],
      sentRpcRpm = [];


  return {
    report          : report,
    requestReceived : requestReceived,
    requestSent     : requestSent,
    requestFinished : requestFinished
  };

  function report() {
    var now = (new Date()).getTime(),
        msg = '';

    receivedNetworkRpm = receivedNetworkRpm
      .filter(oneMinute);

    receivedRpcRpm = receivedRpcRpm
      .filter(oneMinute);

    sentNetworkRpm = sentNetworkRpm 
      .filter(oneMinute);

    sentRpcRpm = sentRpcRpm
      .filter(oneMinute);

    msg += 'Recieved From Clients\n';
    msg += '  network rpm    : ' + receivedNetworkRpm.length + '\n';
    msg += '  network total  : ' + receivedNetworkRequests + '\n';
    msg += '  network finish : ' + finishedNetworkRequests + '\n';
    msg += '  rpc rpm        : ' + receivedRpcRpm.length + '\n';
    msg += '  rpc total      : ' + receivedRpcRequests + '\n';
    msg += '  rpc finish     : ' + finishedRpcRequests + '\n\n';

    msg += 'Sent To Server\n';
    msg += '  network rpm   : ' + sentNetworkRpm.length + '\n';
    msg += '  network total : ' + sentNetworkRequests + '\n';
    msg += '  rpc rpm       : ' + sentRpcRpm.length + '\n';
    msg += '  rpc total     : ' + sentRpcRequests + '\n';

    console.log(msg);

    function oneMinute(time) { return (time > (now - 60000)); }
  }

  function requestReceived(bodyArr) {
    var now = (new Date()).getTime();

    receivedNetworkRequests++;
    receivedNetworkRpm.push(now);

    bodyArr.forEach(function(req) {
      receivedRpcRequests++;
      receivedRpcRpm.push(now);
    });
  }
  
  function requestSent(bodyArr) {
    var now = (new Date()).getTime();

    sentNetworkRequests++;
    sentNetworkRpm.push(now);

    bodyArr.forEach(function(req) {
      sentRpcRequests++;
      sentRpcRpm.push(now);
    });
  }

  function requestFinished(bodyArr) {
    finishedNetworkRequests++;
    finishedRpcRequests += bodyArr.length;
  }


}


/**
 * HELPERS
 */

function calcHashFromReq(req) {
  var options = { method: req.method, params: req.params };

  return require('crypto').createHash('sha256')
    .update(JSON.stringify(options), 'utf8')
    .digest('hex');
}

function isMethodThrottled(method) {
  return Object.keys(configs.default.rpcRateLimit.cachedMethods).indexOf(method) !== -1;
}

function getMethodTimeout(method) {
  return configs.default.rpcRateLimit.cachedMethods[method].timeout;
}

//https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function generateUUID () { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

