/* eslint-env mocha */

var path = require('path'),
    chai = require('chai'),
    expect = chai.expect,
    srcRoot = path.resolve(__dirname + '/../../src'),
    privMethodsActual = require(srcRoot + '/scripts/libs/methods/privMethods');

var privMethodsExpected = [
    "eth_accounts",
    "eth_coinbase",
    "eth_sign",
    "eth_sendTransaction",
    "personal_listAccounts",
    "personal_newAccount",
    "personal_sendTransaction",
    "personal_signAndSendTransaction",
    "personal_sign",
    "rpc_modules"
];


//may seem redundant, but should prevent accidental
//addition or removal of methods from privMethods.json

describe('privMethods.json', function() {

  it('should not have more methods than expected', function() {
    var actual = privMethodsActual.length,
        expected = privMethodsExpected.length;

    expect(actual).to.equal(expected);
  });

  it('should have every expected method', function() {
    privMethodsExpected.forEach(function(method) {
      var actual = privMethodsActual.indexOf(method);

      expect(actual).to.not.equal(-1);
    });
  });
});
