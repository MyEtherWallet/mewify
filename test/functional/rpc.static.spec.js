/* eslint-env mocha */

let path        = require('path'),
    chai        = require('chai'),
    request     = require('request'),
    expect      = chai.expect,
    testRoot    = path.resolve(__dirname + '/../../test'),
    utils       = require(testRoot + '/utils/utils'),
    genReqOpts  = utils.generateRequestOptions,
    snapshots   = require(__dirname + '/rpcStaticSnapshots.json'),
    snapKeys    = Object.keys(snapshots);


snapKeys.forEach(md5Key => {
  let snapshot = snapshots[md5Key];

  describe(snapshot.options.method, function() {
    let options = genReqOpts(snapshot.options),
        results, error;

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

    it('should be exactly the same as the static file', () => {
      expect(results).to.deep.equal(snapshot.results);
      expect(JSON.stringify(results)).to.equal(JSON.stringify(snapshot.results));
    });
  });
});
