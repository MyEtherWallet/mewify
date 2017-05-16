"use strict";
var parityOutputProcessor = require('./parityOutputProcessor');
var rpcClient = function(server) {
    this.server = server;
    this.request = netIO.request.defaults({ jar: true });
    this.parityOutputProcessor = new parityOutputProcessor();
    this.rateLimiter = rpcClient.rateLimiter();
}
rpcClient.prototype.call = function(body, retries, callback) {
    var _this = this,
        pre   = this.rateLimiter.preProcess(body);

    //skip network request if everything is cached
    if (pre.allCached) return callback(null, null, pre.response, retries);

    _this.request({
        url: _this.server,
        method: "POST",
        json: true,
        body: pre.body
    }, function(error, response, body) {
        console.log(body);
        var post = _this.rateLimiter.postProcess(pre, error, body);
        callback(error, response, post.body, retries);
    });
}
rpcClient.prototype.getResponse = function(body, callback) {
    var _this = this;
    var _body = body;
    _this.parityOutputProcessor.preProcess(body);
    var resHandler = function(err, res, body, retries) {
        if (err) {
            if (retries >= 5) {
                console.log(err);
                Events.Error(err.message);
                callback({ "jsonrpc": "2.0", "error": { "code": -1, "message": "Connection Error", "data": null }, "id": _body.id });
            } else {
                _this.call(_body, (retries + 1), resHandler);
            }
        } else {
            body = _this.parityOutputProcessor.postProcess(body);
            callback(body);
        }
    };
    _this.call(body, 0, resHandler);
}

rpcClient.rateLimiter = function() {
  var paramHashCache = {};

  // uncomment below to enable rate calculation ( 1 of 3 )
  // var rateCalculator = rpcClient.rateCalculator();

  return {
    preProcess  : preProcess,
    postProcess : postProcess
  }

  function preProcess(body) {
    var now             = (new Date()).getTime(),
        returnBody      = [],
        returnResponse  = [],
        idToParams      = {},
        originallyArray = false,
        paramHash, cache, allCached, resp;

    if (Array.isArray(body)) originallyArray = true;
    else body = [body];

    // uncomment below to enable rate calculation ( 2 of 3 )
    // rateCalculator.calcUnthrottled(body);

    body.forEach(function(req) {
      //return if rpc method isn't subject to throttling
      if (!isMethodThrottled(req.method)) return returnBody.push(req);

      //create a hash string from the request params
      paramHash = calcHashFromReq(req);

      idToParams[req.id] = {
        method  : req.method,
        hash    : paramHash
      };

      cache = paramHashCache[paramHash];

      //return and proceed with request if a cached version doesn't exist
      if (!cache) return returnBody.push(req);

      //proceed with original request if timeout has expired
      if (now >= cache.timeout) return returnBody.push(req);

      //use the cached request and assign the current expected id
      resp = Object.assign({}, cache.response, { id: req.id });
      returnResponse.push(resp);
    });

    //flag if the entire request has been cached
    if (!returnBody.length) allCached = true;

    //pull out return response from array if needed
    if (allCached && returnResponse.length === 1 && !originallyArray) {
      returnResponse = returnResponse[0];
    }

    // uncomment below to enable rate calculation ( 3 of 3 )
    // rateCalculator.calcThrottled(returnBody, allCached);

    //pull out return body from array if needed
    if (returnBody.length === 1 && !originallyArray) returnBody = returnBody[0];

    return {
      body            : returnBody,
      allCached       : allCached,
      idToParams      : idToParams,
      response        : returnResponse,
      originallyArray : originallyArray
    }
  }

  function postProcess(preProcess, error, resBody) {
    if (error) return { body: resBody };
    if (!Array.isArray(resBody)) resBody = [resBody];

    var now = (new Date()).getTime(),
        finalBody = Array.from(preProcess.response);

    resBody.forEach(function(resp) {
      var params = preProcess.idToParams[resp.id],
          method, hash;

      finalBody.push(resp);

      //return if request wasn't flagged to be cached
      if (!params) return;

      method = params.method;
      hash = params.hash;

      //set timeout, cache response
      paramHashCache[hash] = {
        timeout   : now + getMethodTimeout(method),
        response  : useRespOrStockConfig(method, resp)
      }
    });

    //pull response out of array if necessary
    if (finalBody.length === 1 && !preProcess.originallyArray) {
      finalBody = finalBody[0];
    }

    return {
      body: finalBody
    }
  }

  function isMethodThrottled(method) {
    return Object.keys(configs.default.cachedMethods).indexOf(method) !== -1;
  }

  function getMethodTimeout(method) {
    return configs.default.cachedMethods[method].timeout;
  }

  function calcHashFromReq(req) {
    var options = { method: req.method, params: req.params };

    return require('crypto').createHash('sha256')
      .update(JSON.stringify(options), 'utf8')
      .digest('hex');
  }

  function useRespOrStockConfig(method, resp) {
    var conf = configs.default.cachedMethods[method];

    return conf.response === 'cache' ? resp : conf.response;
  }
}

rpcClient.rateCalculator = function() {
  var rate = {
    throttled: {
      rpcRpm    : [],
      netRpm    : [],
      rpcTotal  : 0,
      netTotal  : 0
    },
    unthrottled: {
      rpcRpm    : [],
      netRpm    : [],
      rpcTotal  : 0,
      netTotal  : 0
    }
  };

  setInterval(reporter, 10000);

  return {
    calcUnthrottled : calcUnthrottled,
    calcThrottled   : calcThrottled
  }

  function reporter() {
    var now = (new Date()).getTime(),
        msg = '';

    //filter out requests older than one minute
    rate.throttled.rpcRpm = rate.throttled.rpcRpm
      .filter(oneMinute);

    rate.throttled.netRpm = rate.throttled.netRpm
      .filter(oneMinute);

    rate.unthrottled.rpcRpm = rate.unthrottled.rpcRpm
      .filter(oneMinute);

    rate.unthrottled.netRpm = rate.unthrottled.netRpm
      .filter(oneMinute);

    msg += 'Network Usage Throttled\n';
    msg += '  network rpm   : ' + rate.throttled.netRpm.length + '\n';
    msg += '  network total : ' + rate.throttled.netTotal + '\n';
    msg += '  rpc rpm       : ' + rate.throttled.rpcRpm.length + '\n';
    msg += '  rpc total     : ' + rate.throttled.rpcTotal + '\n\n';

    msg += 'Network Usage Unthrottled\n';
    msg += '  network rpm   : ' + rate.unthrottled.netRpm.length + '\n';
    msg += '  network total : ' + rate.unthrottled.netTotal + '\n';
    msg += '  rpc rpm       : ' + rate.unthrottled.rpcRpm.length + '\n';
    msg += '  rpc total     : ' + rate.unthrottled.rpcTotal + '\n';

    console.log(msg);

    function oneMinute(time) { return (time > (now - 60000)); }
  }


  function calcUnthrottled(body) {
    var now = (new Date()).getTime();

    rate.unthrottled.netRpm.push(now);
    rate.unthrottled.netTotal++;

    body.forEach(function() {
      rate.unthrottled.rpcRpm.push(now);
      rate.unthrottled.rpcTotal++;
    });
  }

  function calcThrottled(body, allCached) {
    var now = (new Date()).getTime();

    if (allCached) return;

    rate.throttled.netRpm.push(now);
    rate.throttled.netTotal++;

    body.forEach( function() {
      rate.throttled.rpcRpm.push(now);
      rate.throttled.rpcTotal++;
    });
  }
}

module.exports = rpcClient;
