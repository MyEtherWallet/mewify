/* eslint-env mocha */

let path        = require('path'),
    chai        = require('chai'),
    request     = require('request'),
    expect      = chai.expect,
    testRoot    = path.resolve(__dirname + '/../../test'),
    utils       = require(testRoot + '/utils/index'),
    genReqOpts  = utils.generateRequestOptions;


describe('web3_clientVersion', function() {
  let options = genReqOpts({ method: 'web3_clientVersion'}),
      results;

  before(done => {
    request(options, (err, res, body) => {
      results = JSON.parse(body);
      done();
    });
  });

  it('should be available', () => {
    expect(results).to.not.have.property('error');
  });

  it('should return a result', () => {
    expect(results.result).to.have.length.of.at.least(1);
  });
});

describe('net_peerCount', function() {

});

describe('eth_gasPrice', function() {

});

describe('eth_blockNumber', function() {

});

describe('eth_getBalance', function() {

});

describe('eth_getTransactionCount', function() {

});

describe('eth_getCode', function() {

});
