/* eslint-env mocha */

var path = require('path'),
    chai = require('chai'),
    assert = chai.assert,
    sinon = require('sinon'),
    srcRoot = path.resolve(__dirname + '/../../src'),
    parityOutputProcessor = require(srcRoot + '/scripts/libs/parityOutputProcessor');


//written to support additional processMethods
describe('parityOutputProcessor.processMethods', function() {
  it('should have a corresponding method for all listed processMethods', function() {
    var pop = new parityOutputProcessor(),
        processKeys = Object.keys(pop.processMethods);

    processKeys.forEach(function(key) {
      var methodName = pop.processMethods[key],
          method = parityOutputProcessor[methodName];
      assert(method instanceof Function, 'expected ' + key + ' to have a corresponding method');
    });
  });
});

//written to support additional process methods
describe('parityOutputProcessor.prototype.preProcess', function() {
  it('should correctly process all processMethods when passed singular request', function() {
    var pop = new parityOutputProcessor,
        processKeys = Object.keys(pop.processMethods);

    processKeys.forEach(function(key, index) {
      pop.preProcess({id: index, method: key});
    });
    assert(Object.keys(pop.queue).length === processKeys.length, "not all processMethods made it to queue");
  });

  it('should correctly process all processMethods when passed array of requests', function() {
    var pop = new parityOutputProcessor(),
        processKeys = Object.keys(pop.processMethods);

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

describe('parityOutputProcessor.prototype.postProcess', function() {
  //TODO
});

//the below is accessed without 'new' because this method otherwise becomes private
//not sure if this is the best way to go about testing, will circle back...
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
