/* eslint-env mocha */

let path        = require('path'),
    chai        = require('chai'),
    request     = require('request'),
    testRoot    = path.resolve(__dirname + '/../../test'),
    utils       = require(testRoot + '/utils/utils'),
    expect      = chai.expect,
    genReqOpts  = utils.generateRequestOptions,
    isValidHex  = utils.isValidHexResponse;

describe('watcher rpc methods', function(){
  let filters = [];
  this.timeout(100000);

  describe('setting filters', function() {

    describe('eth_newFilter', function() {
      let allPassed = true,
          results, error;

      before(done => {
        let options = genReqOpts({
          method: 'eth_newFilter',
          params: [{
            fromBlock : "latest",
            toBlock : "latest"
          }]
        });

        request(options, (err, res, body) => {
          results = JSON.parse(body);
          error = err;
          done();
        });
      });

      afterEach(function() {
        if (this.currentTest.state === 'failed') allPassed = false;
      });

      after(function() {
        if (allPassed) filters.push(results.result);
      });

      it('should not error', () => {
        expect(error).to.be.null;
        expect(results).to.not.have.property('error');
      });

      it('should return a result with valid hex', () => {
        expect(results.result).to.be.a('string');
        expect(results.result).to.have.length.of.at.least(1);
        expect( isValidHex(results.result) ).to.be.true;
      });
    });

    describe('eth_newBlockFilter', function() {
      let allPassed = true,
          results, error;

      before(done => {
        let options = genReqOpts({ method: 'eth_newBlockFilter' });

        request(options, (err, res, body) => {
          results = JSON.parse(body);
          error = err;
          done();
        });
      });

      afterEach(function() {
        if (this.currentTest.state === 'failed') allPassed = false;
      });

      after(() => {
        if (allPassed) filters.push(results.result);
      });

      it('should not error', () => {
        expect(error).to.be.null;
        expect(results).to.not.have.property('error');
      });

      it('should return a result with valid hex', () => {
        expect(results.result).to.be.a('string');
        expect(results.result).to.have.length.of.at.least(1);
        expect( isValidHex(results.result) ).to.be.true;
      });
    });

    describe('eth_newPendingTransactionFilter', function() {
      let allPassed = true,
          results, error;

      before(done => {
        let options = genReqOpts({ method: 'eth_newPendingTransactionFilter' });

        request(options, (err, res, body) => {
          results = JSON.parse(body);
          error = err;
          done();
        });
      });

      afterEach(function() {
        if (this.currentTest.state === 'failed') allPassed = false;
      });

      after(() => {
        if (allPassed) filters.push(results.result);
      });

      it('should not error', () => {
        expect(error).to.be.null;
        expect(results).to.not.have.property('error');
      });

      it('should return a result with valid hex', () => {
        expect(results.result).to.be.a('string');
        expect(results.result).to.have.length.of.at.least(1);
        expect( isValidHex(results.result) ).to.be.true;
      });
    });
  });
  describe('getting filters', function() {

    describe('eth_getFilterChanges', function() {
      let result;
      this.timeout(120000)

      before(done => {
        let doneCalled;

        filters.forEach(filter => {
          let polling = setInterval(() => {
            let options = genReqOpts({
              method: 'eth_getFilterChanges',
              params: [filter]
            });

            if (doneCalled) return;
            request(options, (err, res, body) => {
              if (doneCalled) return;

              if (err) throw err;
              let results = JSON.parse(body);
              if (results.error) throw new Error(results.error);

              if (!results.result.length) return;

              doneCalled = true;
              result = results.result;
              clearInterval(polling);
              done();
            });
          }, 3000)
        });
      });

      it('should not error', () => {
        expect(result).to.not.have.property('error');
      });

      it('should return an array with some length', () => {
        expect(result).to.be.an('array');
        expect(result).to.have.length.of.at.least(1);
      });

    });

    describe('eth_getFilterLogs', function() {
      let result;
      this.timeout(50000)

      before(done => {
        let doneCalled;

        filters.forEach(filter => {
          let polling = setInterval(() => {
            let options = genReqOpts({
              method: 'eth_getFilterLogs',
              params: [filter]
            });

            if (doneCalled) return;

            request(options, (err, res, body) => {
              if (doneCalled) return;

              if (err) throw err;
              let results = JSON.parse(body);
              if (results.error) throw new Error(results.error);

              if (!results.result.length) return;

              doneCalled = true;
              result = results.result;
              clearInterval(polling);
              done();
            });
          }, 3000)
        });
      });

      it('should not error', () => {
        expect(result).to.not.have.property('error');
      });

      it('should return an array with some length', () => {
        expect(result).to.be.an('array');
        expect(result).to.have.length.of.at.least(1);
      });
    });
  });

  describe('unsetting filters', function() {
    let results = [];

    describe('eth_uninstallFilter', function() {

      before(done => {
        filters.forEach(filter => {
          let options = genReqOpts({
            method: 'eth_uninstallFilter',
            params: [filter]
          });

          request(options, (err, res, body) => {
            results.push({
              error: err,
              response: JSON.parse(body)
            });

            if (results.length === filters.length) done();
          });
        });
      });

      it('should correctly uninstall all previously registered filters', () => {
        results.forEach(result => {
          expect(result.error).to.be.null;
          expect(result.response.result).to.be.a('boolean');
          expect(result.response.result).to.be.true;
        });
      });
    });
  });
});
