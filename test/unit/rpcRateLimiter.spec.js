/* eslint-env mocha */

var path = require('path'),
    chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    srcRoot = path.resolve(__dirname + '/../../src'),
    rpcRateLimiter = require(srcRoot + '/scripts/libs/rpcRateLimiter'),
    rpl = rpcRateLimiter;

    



/**
 * notes!
 * 
 * polls every config seconds
 * returns correct response
 * should return the correct id
 * should return the correct number of responses
 * should return cached when server calls are within configed cache window
 * should return new information when outside of cached window
 * should resolve all requests made to it in a given window
 * 
 * should send error methods in seperate requests
 * 
 */


describe('rpcRateLimiter', function() {
  this.timeout(100000);

  let configs, netIO, netIOSpy, netIOBase, callsToComplete, callsPlaced, callsCompleted, regularResps, 
      throttledResps;
  
  describe('normal operating conditions', function() {
    before(done => {
      regularResps = [],
      throttledResps = [],
      callsToComplete = 40;
      callsCompleted = 0;
      callsPlaced = 0;

      netIOSpy = sinon.spy(netIOFactory());
      netIOBase = {
        request: {
          defaults: () => {
            return netIOSpy
          }
        }
      };
      configs = global.configs = configsFactory();
      netIO = global.netIO = netIOBase;

      rpcRateLimiter.init('serverUrl');

      let serverInterval = configs.default.rpcRateLimit.serverInterval,
          rpcCaller = setInterval(() => {
            if (callsPlaced === callsToComplete) return;

            console.log('TICK! callsCompleted: ' + callsCompleted);

            let regReq = genRequest({
              method: 'unthrottledMethod'
            });

            let throttledReq = genRequest({
              method: 'throttledMethod'
            });
            
            rpcRateLimiter.processRequest(regReq, (error, resp, body) => {
              regularResps.push({
                req: regReq,
                resp: body
              });
              console.log('LOOK WHAT CAME BACK REG: ', body);
              finish();
            });
            callsPlaced++;

            rpcRateLimiter.processRequest(throttledReq, (error, resp, body) => {
              throttledResps.push({
                req: throttledReq,
                resp: body
              });
              console.log('LOOK WHAT CAME BACK THRO: ', body);
              finish();
            });
            callsPlaced++;

          }, (serverInterval * 0.25) );

      console.log('THE SERVER INTERVAL: ' + serverInterval);

      function finish() {
        callsCompleted++;
        console.log(callsCompleted + '/' + callsToComplete);
        if (callsToComplete !== callsCompleted) return;
        console.log('finish()');
        clearInterval(rpcCaller);
        done();
      }
  });


    it('string', done => {
      console.log('TEST UP!');
      done();
    });
  });
});


function clearIntervals(arrOfIntervals) {
  arrOfIntervals.forEach(arr => clearInterval(arr));
}


function netIOFactory() {
  var requestCount = 0;

  return (params, callback) => {
    if (!callback) return;

    let body    = params.body,
        isArr   = Array.isArray(body),
        resp    = [];

    if (!isArr) body = [body];

    body.forEach(req => {
      resp.push({
        jsonrpc : "2.0",
        id      : req.id,
        result  : 'requestCount_' + requestCount
      });
      requestCount++;
    });

    if (!isArr) resp = resp[0]; 
    return callback(null, null, resp);
  };
}



function configsFactory(config) {
  let obj = {
    default: {
      rpcRateLimit: {
        "reporter": true,
        "reporterInterval": 5000,
        "serverInterval": 100,
        "serverErrorTimeout": 10000,
        "cachedMethods": {
          "throttledMethod": {
            "timeout": 200,
            "response": "cache"
          }
        }
      }
    }
  };
  obj.default.rpcRateLimit = Object.assign({}, obj.default.rpcRateLimit, config);
  return obj;
}

function genRequest(params) {
  let obj = { id: generateUUID() };
  return Object.assign({}, obj, params);
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
