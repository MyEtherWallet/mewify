/* eslint-env mocha */

var path = require('path'),
    chai = require('chai'),
    BigNumber = require('bignumber.js'),
    assert = chai.assert,
    srcRoot = path.resolve(__dirname + '/../../src'),
    etherUnits = require(srcRoot + '/scripts/libs/etherUnits');

var validEtherUnits = {
  'wei'       : '1',
  'kwei'      : '1000',
  'ada'       : '1000',
  'femtoether': '1000',
  'mwei'      : '1000000',
  'babbage'   : '1000000',
  'picoether' : '1000000',
  'gwei'      : '1000000000',
  'shannon'   : '1000000000',
  'nanoether' : '1000000000',
  'nano'      : '1000000000',
  'szabo'     : '1000000000000',
  'microether': '1000000000000',
  'micro'     : '1000000000000',
  'finney'    : '1000000000000000',
  'milliether': '1000000000000000',
  'milli'     : '1000000000000000',
  'ether'     : '1000000000000000000',
  'kether'    : '1000000000000000000000',
  'grand'     : '1000000000000000000000',
  'einstein'  : '1000000000000000000000',
  'mether'    : '1000000000000000000000000',
  'gether'    : '1000000000000000000000000000',
  'tether'    : '1000000000000000000000000000000'
};

var validUnitNames = Object.keys(validEtherUnits);

describe('etherUnits.unitMap', function() {
  it('should map the correct units', function() {
    validUnitNames.forEach(function(name) {
      assert.equal(validEtherUnits[name], etherUnits.unitMap[name]);
    });
  });

  it('should map the correct number of units', function() {
    assert.equal(validUnitNames.length, Object.keys(etherUnits.unitMap).length)
  });
});

describe('etherUnits.getValueOfUnit', function() {
  before(function() {
    global.BigNumber = BigNumber;
    global.globalFuncs = {};
    global.globalFuncs.errorMsgs = [];
  });

  after(function() {
    delete global.BigNumber;
    delete global.globalFuncs;
  });

  it('should throw an error when a bad unit is passed', function() {
    try {
      etherUnits.getValueOfUnit('invalid');
    } catch (e) {
      return assert.isTrue(e instanceof Error);
    }
    assert.isTrue(false) //should return before this
  });

  it('should default to ether if unit is undefined', function() {
    assert.equal(etherUnits.getValueOfUnit(), validEtherUnits['ether']);
  });

  it('should return a BigNumber for all valid units', function() {
    validUnitNames.forEach(function(name) {
      assert.isTrue(etherUnits.getValueOfUnit(name) instanceof BigNumber);
    });
  });
});

describe('etherUnits.fiatToWei', function() {

});

describe('etherUnits.toFiat', function() {

});

describe('etherUnits.toEther', function() {

});
