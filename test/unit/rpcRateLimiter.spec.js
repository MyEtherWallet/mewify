/* eslint-env mocha */

const path            = require('path'),
      sinon           = require('sinon'),
      Promise         = require('bluebird'),
      chai            = require('chai'),
      expect          = chai.expect,
      srcRoot         = path.resolve(__dirname + '/../../src'),
      rpcRateLimiter  = require(srcRoot + '/scripts/libs/rpcRateLimiter');

let totalRequestCount = 0;

describe('rpcRateLimiter', function() {
  this.timeout(10000);
  
  describe('when under normal operating conditions', function() {

  let configs, netIO, netIOSpy, netIOBase, callsToComplete, callsPlaced, callsCompleted, uniqueResponses, 
      repeatResponses, startTime, stopTime, serverInterval, allResponses, serverStats, priorityResponses;
    
    before(done => {
      uniqueResponses = [],
      repeatResponses = [],
      callsToComplete = 30;
      callsCompleted = 0;
      callsPlaced = 0;
      serverStats = {};
      priorityResponses = [];

      netIOSpy = sinon.spy(netIOFactory(serverStats));
      netIOBase = {
        request: {
          defaults: () => {
            return netIOSpy
          }
        }
      };
      configs = global.configs = configsFactory();
      netIO = global.netIO = netIOBase;

      serverInterval = configs.default.rpcRateLimit.serverInterval;
      rpcRateLimiter.init('serverUrl');
      startTime = (new Date()).getTime();
      

      let rpcCaller = setInterval(() => {
        if (callsPlaced === callsToComplete) return;

        let uniqueReq = genRequest({
          method: 'uniqueRequest',
          params: callsPlaced
        });

        let repeatReq = genRequest({
          method: 'repeatRequest',
        });

        let priorityReq = genRequest({
          method: 'priorityRequest',
        });

        rpcRateLimiter.processRequest(uniqueReq, (error, resp, body) => {
          uniqueResponses.push({
            req: uniqueReq,
            resp: body
          });
          finish();
        });
        callsPlaced++;

        rpcRateLimiter.processRequest(repeatReq, (error, resp, body) => {
          repeatResponses.push({
            req: repeatReq,
            resp: body
          });
          finish();
        });
        callsPlaced++;

        rpcRateLimiter.processRequest(priorityReq, (error, resp, body) => {
          priorityResponses.push({
            req: priorityReq,
            resp: body
          });
          finish();
        });
        callsPlaced++;

      }, (serverInterval * 0.25) );


      function finish() {
        callsCompleted++;
        if (callsToComplete !== callsCompleted) return;

        clearInterval(rpcCaller);
        stopTime = (new Date()).getTime();
        allResponses = uniqueResponses.concat(repeatResponses, priorityResponses);
        done();
      }
  });


    it('should poll server number of times relative to configured interval', () => {
      let diff = stopTime - startTime;
      expect(netIOSpy.callCount).to.equal(Math.floor(diff/serverInterval));
    });

    it('should respond to all calls with the correct ids', () => {
      allResponses.forEach(obj => {
        expect(obj.req.id).to.equal(obj.resp.id);
      });
    });

    it('should return the correct number of responses ', () => {
      expect(allResponses.length).to.equal(callsToComplete);
    });

    it('should return the correct server result for each call', () => {
      allResponses.forEach(obj => {
        expect(obj.resp.result.split('_')[0]).to.equal('requestCount');
      });
    });

    it('should swap out the original id set by the client before reaching the server', () => {
      allResponses.forEach(obj1 => {
        let repeatedIds = serverStats.rpcRequests.filter(obj2 => obj1.req.id === obj2.id);
        expect(repeatedIds.length).to.equal( 0 );
      });
    });

    it('should limit repeat calls relative to configured interval', () => {
      let repeatedReqsToServer = serverStats.rpcRequests.filter(o => o.method === 'repeatRequest');
      expect(repeatedReqsToServer.length).to.equal(netIOSpy.callCount);
    });

    it('should let all unique calls through to the server', () => {
      let uniqueReqsToServer = serverStats.rpcRequests.filter(o => o.method === 'uniqueRequest');
      expect(uniqueReqsToServer.length).to.equal(callsToComplete / 3);
    });

    it('should let all priority calls through to the server', () => {
      let priorityReqsToServer = serverStats.rpcRequests.filter(o => o.method === 'priorityRequest');
      expect(priorityReqsToServer.length).to.equal(callsToComplete / 3);
    });
  });

  describe('when under error conditions', () => {

    let netIO, netIOSpy, netIOBase, configs, callsPlaced, serverStats;
      
    before(done => {
      serverStats = {};
      callsPlaced = 0;

      netIOSpy = sinon.spy(netIOErrorFactory(serverStats));
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

      let normalReqA = genRequest({
        method: 'normalRequestA'
      });

  
      let normalReqB = genRequest({
        method: 'normalRequestB'
      });

      let errorReq = genRequest({
        method: 'errorRequest'
      });
      
      makeReq( [ normalReqA, normalReqB, errorReq ] )
        .then( () => makeReq( [ normalReqA, normalReqB, errorReq ] ) )
        .then( () => makeReq( [ normalReqA, normalReqB, errorReq ] ) )
        .then( () => done() );

      function makeReq(req) {
        return new Promise(resolve => {
          rpcRateLimiter.processRequest(req, (error, resp, body) => {
            resolve();
          });
          callsPlaced++;
        });
      }
    });

    it('should initially send all methods in one batch request', () => {
      let firstBody = netIOSpy.getCall(0).args[0].body;
      expect(firstBody).to.be.an('array').with.lengthOf(3);
    });


    it('should resend each method of a failed request as individual network requests', () => {
      let secondBody  = netIOSpy.getCall(1).args[0].body,
          thirdBody   = netIOSpy.getCall(2).args[0].body,
          fourthBody  = netIOSpy.getCall(3).args[0].body;

      expect(secondBody).to.be.an('object');
      expect(thirdBody).to.be.an('object');
      expect(fourthBody).to.be.an('object');
    });

    it('should send an error method as an individual request', () => {
      let fifthBody = netIOSpy.getCall(4).args[0].body,
          sixthBody = netIOSpy.getCall(5).args[0].body;

      //we can expect the fifthBody to be the normal calls because
      //they're placed in the body array first when sent with makeReq
      expect(fifthBody).to.be.an('array').with.lengthOf(2);

      fifthBody.forEach(resp => {
        expect(resp.method).to.not.equal('errorRequest');
      });

      expect(sixthBody).to.be.an('object');
      expect(sixthBody.method).to.equal('errorRequest');
    });

    it('should allow error methods back into the normal batch request if they return successfully', () => {
      let seventhBody = netIOSpy.getCall(6).args[0].body;
      expect(seventhBody).to.be.an('array').with.lengthOf(3);
    });
  });
});


function netIOFactory(stats) {
  var requestCount = 0;

  if (!stats.rpcRequests) stats.rpcRequests = [];

  return (params, callback) => {
    if (!callback) return;

    let body    = params.body,
        isArr   = Array.isArray(body),
        resp    = [];

    if (!isArr) body = [body];

    body.forEach(req => {
      stats.rpcRequests.push(req);
      resp.push({
        jsonrpc : "2.0",
        id      : req.id,
        result  : 'requestCount_' + requestCount
      });
      requestCount++;
    });

    if (!isArr) {
      resp = resp[0]; 
    }
    return callback(null, null, resp);      
  };
}

function netIOErrorFactory(stats) {
  var requestCount = 0,
      errorRequestCount = 0;

  if (!stats.rpcRequests) stats.rpcRequests = [];
  if (!stats.errRequestCount) stats.errRequestCount = 0;

  return (params, callback) => {
    if (!callback) return;

    let errorRequest  = false,
        body          = params.body,
        isArr         = Array.isArray(body),
        resp          = [];

    if (!isArr) body = [body];

    body.forEach(req => {
      if (req.method === 'errorRequest') {
        errorRequest = true;
      }
      stats.rpcRequests.push(req);
      resp.push({
        jsonrpc : "2.0",
        id      : req.id,
        result  : 'requestCount_' + requestCount
      });
      requestCount++;
    });


    if (!isArr) {
      resp = resp[0]; 
    }
    if (errorRequest && errorRequestCount < 2) {
      errorRequestCount++;
      return callback(null, null, { message: 'Internal server error' });
    }
    return callback(null, null, resp);      
  };
}

function configsFactory(config) {
  let defaultConfigParams = {
    default: {
      rpcRateLimit: {
        "priorityMethods": [
          "priorityRequest"
        ],
        "reporter": false,
        "reporterInterval": 7000,
        "serverInterval": 100,
        "serverErrorTimeout": 10000,
        "cachedMethods": {
          "throttledMethod": {
            "timeout": 2000,
            "response": "cache"
          }
        }
      }
    }
  };
  defaultConfigParams.default.rpcRateLimit = Object.assign({}, defaultConfigParams.default.rpcRateLimit, config);
  return defaultConfigParams;
}

function genRequest(params) {
  let obj = { id: generateUUID() };
  return Object.assign({}, obj, params);
}

function generateUUID() {
  return 'requestNumber_' + totalRequestCount++;
}

