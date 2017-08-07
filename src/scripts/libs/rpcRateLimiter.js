var Promise = require('bluebird');

var config, cache, server, request, globalQueue, globalErrorQueue, errorHashes,
    serverInterval, reporterInterval, reporter;

exports.init = function(_server) {
  request = netIO.request.defaults({ jar: true, headers : { origin: 'mewify' } });
  config  = configs.default.rpcRateLimit;
  server  = _server;
  cache   = {};

  globalQueue = [];
  globalErrorQueue = [];
  errorHashes = {};

  //init server intervals
  if (serverInterval) clearInterval(serverInterval);
  serverInterval = setInterval(function() {
    processQueue(Array.from(globalQueue));
    globalQueue = [];

    processErrorQueue(Array.from(globalErrorQueue));
    globalErrorQueue = [];
  }, config.serverInterval);


  //init reporter interval
  if (reporterInterval) clearInterval(reporterInterval);
  if (config.reporter) {
    reporter = Reporter();
    reporterInterval = setInterval(function() {
      reporter.report();
    }, config.reporterInterval)
  }
};

exports.processRequest = function(body, callback) {
  var originallyArray = false,
      promises = [];

  if (Array.isArray(body)) originallyArray = true;
  else body = [body];

  body.forEach(function(req) {
    promises.push(processRpcMethod(req));
  });

  if (reporter) reporter.requestReceived(body);

  Promise
    .all(promises)
    .then(function(results) { 
      if (reporter) reporter.requestFinished(results);

      var requestError, serverError;

      results.forEach(function(result) {  
        if (result.requestError) requestError = true;
        if (result.serverError) serverError = true;
      });

      if (requestError) {
        console.log('processRequest - request error detected');
        return callback(true, null, null);
      }
      if (serverError) {
        console.log('processRequest - server error detected');
        return callback(false, null, { message: 'Internal server error' });
      }

      if (!originallyArray && results.length === 1) {
        results = results[0];
      }
      return callback(null, null, results);
    })
};


function processRpcMethod(req) {
  return new Promise(function(resolve, reject) {
    req = Object.assign({}, req);

    var reqHash    = calcHashFromReq(req),
        originalId = req.id,
        cached     = cache[reqHash],
        priority   = false,
        params;

    if (isMethodPriority(req.method)) priority = true;

      if (cached && cached.pending) {
        cached.promises.push({
          originalId  : req.id,
          resolve     : resolve,
          reject      : reject
        });
        return;
      }

      if (!priority) {
        cache[reqHash] = {
          pending : true,
          promises: []        
        }
      }

    req.id = generateUUID();
    params = {
      originalId  : originalId,
      req         : req,
      resolve     : resolve,
      reject      : reject
    }

    if (errorHashes[reqHash]) {
      globalErrorQueue.push(params);
    }
    else {
      globalQueue.push(params);
    }
  });
}


function processQueue(queue) {
  if (!queue.length) return;

  var queueMappedById = {},
      reqBody = [];
  
  queue.forEach(function(params) {
    queueMappedById[params.req.id] = params;
    reqBody.push(params.req);
  });

  if (reporter) reporter.requestSent(reqBody);

  request({
    url     : server,
    method  : "POST",
    json    : true,
    body    : reqBody
  }, 
  function(error, response, resBody) {
    //detect network error
    if (error)  {
      queue.forEach(function(params) {
        cacheResponseFailure(params.req, true, false);
        params.resolve({ requestError: true });
      });

    //detect incorrect response
    } else if (!isValidServerReponseBody(reqBody, resBody)) {
      console.log('Invalid RPC response. Attempting to resolve...');
      globalErrorQueue = globalErrorQueue.concat(queue);

    //success
    } else {
      resBody.forEach(function(res) {
        var queue = queueMappedById[res.id];
        res.id = queue.originalId;
        cacheResponseSuccess(queue.req, res);
        queue.resolve(res);
      });
    }
  }); 
}


//process requests in ErrorQueue
function processErrorQueue(errorQueue) {
  if (!errorQueue.length) return;

  errorQueue.forEach(function(params) {
    var reqHash = calcHashFromReq(params.req);

    if (reporter) reporter.requestSent([params.req]);
    
    request({
      url     : server,
      method  : "POST",
      json    : true,
      body    : params.req
    },
    function(error, response, resBody) {
      //detect network error
      if (error) {
        cacheResponseFailure(params.req, true, false);
        params.resolve({ requestError: true });
      
      //detect incorrect response
      } else if (!isValidServerReponseBody(params.req, resBody)) { 
        errorHashes[reqHash] = true;
        cacheResponseFailure(params.req, false, true);
        params.resolve({ serverError: true });

      //success
    } else {
        if (errorHashes[reqHash]) delete errorHashes[reqHash];
        cacheResponseSuccess(params.req, resBody);
        resBody.id = params.originalId;
        params.resolve(resBody);
      }
    });
  });
}

function cacheResponseSuccess(req, res) {
  var reqHash = calcHashFromReq(req),
      cached  = cache[reqHash];

  if (cached) {
    cached.promises.forEach(function(obj) {
      res = Object.assign({}, res, { id: obj.originalId });
      obj.resolve(res);
    });
  }

  delete cache[reqHash];
}

function cacheResponseFailure(req, reqError, serverError) {
  var reqHash = calcHashFromReq(req),
      cached  = cache[reqHash];

  if (cached) {
    cached.promises.forEach(function(obj) {
      if (reqError) obj.resolve({ requestError: true });
      else obj.resolve({ serverError: true });
    });
  }

  if (serverError) {
    cache[reqHash] = {
      serverError : true
    }
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

    msg += 'Received From Clients\n';
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

    bodyArr.forEach(function(/*req*/) {
      receivedRpcRequests++;
      receivedRpcRpm.push(now);
    });
  }
  
  function requestSent(bodyArr) {
    var now = (new Date()).getTime();

    sentNetworkRequests++;
    sentNetworkRpm.push(now);

    bodyArr.forEach(function(/*req*/) {
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

function isValidServerReponseBody(reqBody, resBody) {
    var isValid = true; 
    if (!resBody || resBody.length !== reqBody.length) {
      console.log('Invalid RPC response: ', resBody);
      isValid = false;
    } else if (resBody.message && resBody.message === 'Internal server error') {
      console.log('Invalid RPC response: ', resBody);
      isValid = false;
    } else if (resBody.errorMessage && resBody.errorMessage === "Cannot read property 'headers' of undefined") {
      console.log('Invalid RPC response: ', resBody);
      isValid = false;
    }
    return isValid;
}

function calcHashFromReq(req) {
  var options = { method: req.method, params: req.params };

  return require('crypto').createHash('sha256')
    .update(JSON.stringify(options), 'utf8')
    .digest('hex');
}


function isMethodPriority(method) {
  var priorityMethods = configs.default.rpcRateLimit.priorityMethods;
  return (priorityMethods.indexOf(method) !== -1)
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

