/* eslint-env mocha */

var path = require('path'),
    chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    srcRoot = path.resolve(__dirname + '/../../src'),
    privMethodHandlerPath = srcRoot + '/scripts/libs/privMethodHandler',
    privMethodHandler = require(privMethodHandlerPath),

    keyfilePathExample = "/path/to/keys/UTC--2017-04-22T02-30-52.646Z--0cb19b15fe19414c93d59c599e94b2e497b620e9",
    keyfileContentExample = "{\"version\":3,\"id\":\"deaf3c18-196a-498f-8c8c-d484a25fa770\",\"address\":\"0cb19b15fe19414c93d59c599e94b2e497b620e9\",\"crypto\":{\"ciphertext\":\"3fcf507efcb128dfa209d09b7ee992a473dbb7ba629184f2a4ff2b767f266bf0\",\"cipherparams\":{\"iv\":\"79d459f090bce09cc81c4c7fcd52ee69\"},\"cipher\":\"aes-128-ctr\",\"kdf\":\"scrypt\",\"kdfparams\":{\"dklen\":32,\"salt\":\"781c9fd9ad45e068bf85844184636033806cdb68c7b6b84b1bdab9644d4e08fa\",\"n\":262144,\"r\":8,\"p\":1},\"mac\":\"eb742afe0c1e75386a83b915aaa9d9bc76ce96e341d4de46588eee3b1dafd5be\"}}",
    keyFileAddressExample = "0x0cb19b15fe19414c93d59c599e94b2e497b620e9";


    /*
    ██   ██ ███████ ██      ██████  ███████ ██████  ███████
    ██   ██ ██      ██      ██   ██ ██      ██   ██ ██
    ███████ █████   ██      ██████  █████   ██████  ███████
    ██   ██ ██      ██      ██      ██      ██   ██      ██
    ██   ██ ███████ ███████ ██      ███████ ██   ██ ███████
    */


function resetPrivMethodHandler() {
  delete require.cache[require.resolve(privMethodHandlerPath)];
  privMethodHandler = require(privMethodHandlerPath);
}

function fileIOStubFactory() {
  return sinon.stub({
    readAllFiles: function() {},
    writeFile   : function() {}
  });
}

function configsStubFactory() {
  return sinon.stub({
    getKeysPath: function() {}
  });
}

function eventsStubFactory() {
  return sinon.stub({
    Error: function() {}
  })
}

function ethUtilStubFactory() {
  return {
    Wallet: sinon.stub({
      generate: function() {}
    })
  }
}

function validateCallbackObj(obj) {
  expect(obj).to.have.property('error');
  expect(obj).to.have.property('msg');
  expect(obj).to.have.property('data');
}

/*
████████ ███████ ███████ ████████ ███████
   ██    ██      ██         ██    ██
   ██    █████   ███████    ██    ███████
   ██    ██           ██    ██         ██
   ██    ███████ ███████    ██    ███████
*/


describe('privMethodHandler.accounts', function() {

  it('should init with accounts as an empty array', function() {
    expect(privMethodHandler.accounts).to.be.instanceof(Array);
    expect(privMethodHandler.accounts).to.be.empty;
  });
});

describe('privMethodHandler.prototype.ethAccounts', function() {
  var fileIO, configs, Events;

  before(function() {
    fileIO = global.fileIO = fileIOStubFactory();
    configs = global.configs = configsStubFactory();
    Events = global.Events = eventsStubFactory();
  });

  after(function() {
    delete global.fileIO;
    delete global.configs;
    delete global.Events;
  });

  describe('when privMethodHandler.accounts has accounts', function() {
    var pmh, accountsOriginal;

    before(function() {
      accountsOriginal = privMethodHandler.accounts;
      privMethodHandler.accounts = [
        { address: '0x1' },
        { address: '0x3' }
      ];
      pmh = new privMethodHandler();
    });

    after(function() {
      privMethodHandler.accounts = accountsOriginal;
    });

    it('should return the account addresses in an array', function(done) {
      pmh.ethAccounts([], function(output) {
        validateCallbackObj(output);
        expect(output.data).to.deep.equal(['0x1', '0x3']);
        done();
      });
    });
  });

  describe('when privMethodHandler.accounts has no accounts', function() {

    afterEach(function() {
      fileIO.readAllFiles.reset();
      configs.getKeysPath.reset();
      Events.Error.reset();
      resetPrivMethodHandler();
    });

    it('should call fileIO.readAllFiles with configs.getKeysPath()', function(done) {
      var keysPathExpected = '/path/to/keys/';
      configs.getKeysPath.returns(keysPathExpected);

      fileIO.readAllFiles.callsFake(function(keysPathActual) {
        expect(keysPathExpected).to.equal(keysPathActual);
        done();
      });

      new privMethodHandler();
    });

    it('should parse valid keyfiles, handle invalid keyfiles, and return address in array', function(done) {
      var pmh = new privMethodHandler();

      fileIO.readAllFiles.callsFake(function(keysPath, successCallback) {
        successCallback('filename', 'invalid content', false);
        successCallback('filename', keyfileContentExample, true);
      });

      pmh.ethAccounts([], function(output) {
        validateCallbackObj(output);
        expect(output.data).to.include(keyFileAddressExample);
        done();
      });
    });

    it('should handle errors correctly when fileIO.readAllFiles fails', function() {
      var pmh = new privMethodHandler();

      fileIO.readAllFiles.callsFake(function(keysPath, successCallback, errorCallback) {
        errorCallback('thisIsAnError');
      });

      pmh.ethAccounts([], function(output) {
        validateCallbackObj(output);
        expect(output.error).to.equal(true);
        expect(output.msg).to.equal('thisIsAnError');
      });
    });
  });
});

describe('privMethodHandler.prototype.personalNewAccount', function() {
  var fileIO, configs, ethUtil,
      getV3Filename, toV3String, getAddressString;

  before(function() {
    fileIO = global.fileIO = fileIOStubFactory();
    configs = global.configs = configsStubFactory();
    ethUtil = global.ethUtil = ethUtilStubFactory();
    getAddressString = sinon.stub();
    getV3Filename = sinon.stub();
    toV3String = sinon.stub();

    ethUtil.Wallet.generate.returns({
      getAddressString: getAddressString,
      getV3Filename: getV3Filename,
      toV3String: toV3String,
    });
  });

  after(function() {
    delete global.fileIO;
    delete global.configs;
    delete global.ethUtil;
  });


  describe('when account generation is a success', function() {
    var pmh, output;

    before(function(done) {
      configs.getKeysPath.returns('/path/to');
      getAddressString.returns('0x0');
      getV3Filename.returns('/file');
      toV3String.returns('fileContent');

      fileIO.writeFile.yields({});

      pmh = new privMethodHandler();
      pmh.personalNewAccount(['password'], function(obj) {
        output = obj;
        done();
      });
    });

    after(function() {
      configs.getKeysPath.reset();
      getAddressString.reset();
      fileIO.writeFile.reset();
      getV3Filename.reset();
      toV3String.reset();
    })


    it('should provide fileIO.writeFile a valid path to write the new keyfile', function() {
      expect(fileIO.writeFile.calledWith('/path/to/file')).to.be.true;
    });

    it('should encrypt the wallet with the password', function() {
      expect(toV3String.calledWith('password')).to.be.true;
    });

    it('should add the wallet to pMH\'s list of known accounts', function() {
      var expectedAccount = { address: '0x0', path: '/path/to/file' };
      expect(privMethodHandler.accounts).to.deep.include(expectedAccount);
    });

    it('should return a callback obj with the address string', function() {
      validateCallbackObj(output);
      expect(output.data).to.equal('0x0');
    });
  });

  describe('when account generation is a failure', function() {

    after(function() {
      ethUtil.Wallet.generate.reset();
      fileIO.writeFile.reset();
    });

    it('should catch top-level errors', function(done) {
      var pmh = new privMethodHandler();
      ethUtil.Wallet.generate.throws();
      pmh.personalNewAccount([], function(obj) {
        validateCallbackObj(obj);
        expect(obj.error).to.be.true;
        done();
      });
    });

    it('should handle an error from fileIO.writeFile', function(done) {
      var pmh = new privMethodHandler();
      fileIO.writeFile.yields({error: true});
      pmh.personalNewAccount([], function(obj) {
        validateCallbackObj(obj);
        expect(obj.error).to.be.true;
        done();
      });
    });
  });
});
