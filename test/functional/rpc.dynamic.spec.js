/* eslint-env mocha */

let path        = require('path'),
    chai        = require('chai'),
    request     = require('request'),
    expect      = chai.expect,
    testRoot    = path.resolve(__dirname + '/../../test'),
    utils       = require(testRoot + '/utils/utils'),
    genReqOpts  = utils.generateRequestOptions,
    isValidHex  = utils.isValidHexResponse;


describe('web3_clientVersion', function() {
  let options = genReqOpts({ method: 'web3_clientVersion' }),
      error, results;

  before(done => {
    request(options, (err, res, body) => {
      results = JSON.parse(body);
      error = err;
      done();
    });
  });

  it('should not error', () => {
    expect(error).to.be.null;
    expect(results).to.not.have.property('error');
  });

  it('should return a result with some length', () => {
    expect(results.result).to.have.length.of.at.least(1);
  });
});


describe('net_peerCount', function() {
  let options = genReqOpts({ method: 'net_peerCount' }),
      error, results;

  before(done => {
    request(options, (err, res, body) => {
      results = JSON.parse(body);
      error = err;
      done();
    });
  });

  it('should not error', () => {
    expect(error).to.be.null;
    expect(results).to.not.have.property('error');
  });

  it('should return a result with valid hex', () => {
    expect(results.result).to.have.length.of.at.least(1);
    expect( isValidHex(results.result) ).to.be.true;
  });
});


describe('eth_gasPrice', function() {
  let options = genReqOpts({ method: 'eth_gasPrice' }),
      error, results;

  before(done => {
    request(options, (err, res, body) => {
      results = JSON.parse(body);
      error = err;
      done();
    });
  });

  it('should not error', () => {
    expect(error).to.be.null;
    expect(results).to.not.have.property('error');
  });

  it('should return a result with valid hex', () => {
    expect(results.result).to.have.length.of.at.least(1);
    expect( isValidHex(results.result) ).to.be.true;
  });
});


describe('eth_blockNumber', function() {
  let options = genReqOpts({ method: 'eth_blockNumber' }),
      error, results;

  before(done => {
    request(options, (err, res, body) => {
      results = JSON.parse(body);
      error = err;
      done();
    });
  });

  it('should not error', () => {
    expect(error).to.be.null;
    expect(results).to.not.have.property('error');
  });

  it('should return a result with valid hex', () => {
    expect(results.result).to.have.length.of.at.least(1);
    expect( isValidHex(results.result) ).to.be.true;
  });
});


//TODO: test all params[1] permutations
describe('eth_getBalance', function() {
  let options, error, results;

  options = genReqOpts({
    method: 'eth_getBalance',
    params: [
      "0xb794F5eA0ba39494cE839613fffBA74279579268",
      "latest"
    ]
  });

  before(done => {
    request(options, (err, res, body) => {
      results = JSON.parse(body);
      error = err;
      done();
    });
  });

  it('should not error', () => {
    expect(error).to.be.null;
    expect(results).to.not.have.property('error');
  });

  it('should return a result with valid hex', () => {
    expect(results.result).to.have.length.of.at.least(1);
    expect( isValidHex(results.result) ).to.be.true;
  });
});


//TODO: test all params[1] permutations
describe('eth_getTransactionCount', function() {
  let options, error, results;

  options = genReqOpts({
    method: 'eth_getTransactionCount',
    params: [
      "0xb794F5eA0ba39494cE839613fffBA74279579268",
      "latest"
    ]
  });

  before(done => {
    request(options, (err, res, body) => {
      results = JSON.parse(body);
      error = err;
      done();
    });
  });

  it('should not error', () => {
    expect(error).to.be.null;
    expect(results).to.not.have.property('error');
  });

  it('should return a result with valid hex', () => {
    expect(results.result).to.have.length.of.at.least(1);
    expect( isValidHex(results.result) ).to.be.true;
  });
});



describe('net_listening', function() {
  let options = genReqOpts({ method: 'net_listening' }),
      error, results;

  before(done => {
    request(options, (err, res, body) => {
      results = JSON.parse(body);
      error = err;
      done();
    });
  });

  it('should not error', () => {
    expect(error).to.be.null;
    expect(results).to.not.have.property('error');
  });

  it('should return a boolean', () => {
    expect(typeof results.result).to.equal('boolean');
  });
});
