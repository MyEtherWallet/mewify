/* eslint-env mocha */

var path = require('path'),
    BigNumber = require('bignumber.js'),
    chai = require('chai'),
    expect = chai.expect,
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
      var actual = etherUnits.unitMap[name],
          expected = validEtherUnits[name];
      expect(actual).to.equal(expected);
    });
  });

  it('should map the correct number of units', function() {
    var actual = Object.keys(etherUnits.unitMap).length,
        expected = validUnitNames.length;
    expect(actual).to.equal(expected);
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

  it('should throw an error when a bad unit is supplied', function() {
    var caught = false;
    try {
      etherUnits.getValueOfUnit('invalid');
    } catch (e) {
      caught = e;
    }
    expect(caught).to.be.instanceof(Error);
  });

  it('should default to ether if unit is undefined', function() {
    var actual = etherUnits.getValueOfUnit(),
        expected = validEtherUnits['ether'];
    expect(actual.toFixed()).to.equal(expected);
  });

  it('should return the correct BigNumber for all valid units', function() {
    validUnitNames.forEach(function(name) {
      var actual = etherUnits.getValueOfUnit(name),
          expected = validEtherUnits[name];
      expect(actual).to.be.instanceof(BigNumber);
      expect(actual.toFixed()).to.equal(expected);
    });
  });
});

describe('etherUnits.fiatToWei', function() {
  before(function() {
    global.BigNumber = BigNumber;
  });

  after(function() {
    delete global.BigNumber;
  });

  it('should convert $100 to 2000000000000000000 wei at $50/ETH', function() {
    var actual = etherUnits.fiatToWei(100.00, 50.00),
        expected = '2000000000000000000';
    expect(actual).to.equal(expected);
  });
});

describe('etherUnits.toFiat', function() {
  before(function() {
    global.BigNumber = BigNumber;
  });

  after(function() {
    delete global.BigNumber;
  });

  it('should convert 5 ether to $250 at $50/ETH', function() {
    var actual = etherUnits.toFiat(5, 'ether', 50.00),
        expected = '250';
    expect(actual).to.equal(expected);
  });
});

describe('etherUnits.toEther', function() {
  before(function() {
    global.BigNumber = BigNumber;
  });

  after(function() {
    delete global.BigNumber;
  });

  it('should convert 5000000000000000000 wei to 5 ether', function() {
    var actual = etherUnits.toEther('5000000000000000000', 'wei'),
        expected = '5';
    expect(actual).to.equal(expected);
  });
});

describe('etherUnits.toWei', function() {
  before(function() {
    global.BigNumber = BigNumber;
  });

  after(function() {
    delete global.BigNumber;
  });

  it('should convert 5 ether to 5000000000000000000 wei', function() {
    var actual = etherUnits.toWei('5', 'ether'),
        expected = '5000000000000000000';
    expect(actual).to.equal(expected);
  });
});
