/* eslint-env mocha */

var path = require('path'),
    chai = require('chai'),
    assert = chai.assert,
    srcRoot = path.resolve(__dirname + '/../../../src'),
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

    assert(
      actual === expected,
      'expected privMethods to have length ' + expected + ', got ' + actual
    );
  });

  it('should have every expected method', function() {
    privMethodsExpected.forEach(function(method) {
      var actual = privMethodsActual.indexOf(method);

      assert(actual !== -1, 'could not find method ' + method);
    });
  });
});
