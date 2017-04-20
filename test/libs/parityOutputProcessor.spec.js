/* eslint-env mocha */

var path = require('path'),
    chai = require('chai'),
    assert = chai.assert,
    sinon = require('sinon'),
    srcRoot = path.resolve(__dirname + '/../../src'),
    parityOutputProcessor = require(srcRoot + '/scripts/libs/parityOutputProcessor'),

    processMethods = (new parityOutputProcessor()).processMethods,
    processKeys = Object.keys(processMethods);


//written to support additional process methods
describe('parityOutputProcessor.processMethods', function() {

  it('should have a corresponding method for all listed processMethods', function() {
    var pop = new parityOutputProcessor();

    processKeys.forEach(function(key) {
      var methodName = pop.processMethods[key],
          method = parityOutputProcessor[methodName];

      assert(method instanceof Function, 'expected ' + key + ' to have a corresponding method');
    });
  });
});


//written to support additional process methods
describe('parityOutputProcessor.prototype.preProcess', function() {

  it('should correctly add to queue all processMethods when passed singular request', function() {
    var pop = new parityOutputProcessor;

    processKeys.forEach(function(key, index) {
      pop.preProcess({id: index, method: key});
    });

    assert(Object.keys(pop.queue).length === processKeys.length, "not all processMethods made it to queue");
  });

  it('should correctly process all processMethods when passed array of requests', function() {
    var pop = new parityOutputProcessor();

    processKeys.forEach(function(key, index) {
      pop.preProcess([{id: index, method: key}]);
    });

    assert(Object.keys(pop.queue).length === processKeys.length, "not all processMethods made it to queue");
  });

  it('should not process an invalid method', function() {
    var pop = new parityOutputProcessor();

    pop.preProcess({id: 'X', method: 'invalid'});

    assert(Object.keys(pop.queue).length === 0, 'parityOutputProcessor added an invalid method to queue');
  });
});

//written to support additional process methods
describe('parityOutputProcessor.prototype.postProcess', function() {
  var pop, spies = {};

  beforeEach(function() {
    processKeys.forEach(function(key) {
      spies[key] = sinon.spy(parityOutputProcessor, processMethods[key]);
    });
    pop = new parityOutputProcessor();
  });

  afterEach(function() {
    processKeys.forEach(function(key) {
      parityOutputProcessor[processMethods[key]].restore();
    });
  });

  it('should call each processMethod once when passing in singular requests', function() {
    processKeys.forEach(function(key, index) {
      var req = { id: index, method: key };

      pop.preProcess(req);
      pop.postProcess(req);

      assert(spies[key].calledOnce, 'call count for ' + key + ' was ' + spies[key].callCount);
    });
  });

  it('should call each processMethod once when passing an array of requests', function() {
    processKeys.forEach(function(key, index) {
      var req = { id: index, method: key };

      pop.preProcess([req]);
      pop.postProcess([req]);

      assert(spies[key].calledOnce, 'call count for ' + key + ' was ' + spies[key].callCount);
    });
  });
});

//the below is accessed without 'new' because this method otherwise becomes private
describe('parityOutputProcessor.ethGetTransactionReceipt', function() {
  
  it('should set obj.result to null if obj.result.blockNumber is falsy', function() {
    var actual = parityOutputProcessor.ethGetTransactionReceipt({ result: {} });

    assert(actual.result === null, 'expected null, got ' + actual.result);
  });

  it('should return obj unmodified if obj.result.blockNumber is truthy', function() {
    var obj1 = { result: { blockNumber: true } },
        obj2 = { result: { blockNumber: true } },
        actual = parityOutputProcessor.ethGetTransactionReceipt(obj1);

    assert.deepEqual(obj2, actual, 'expected ' + obj2 + ', got ' + actual);
  });
});
