/* eslint-env mocha */

var path = require('path'),
    chai = require('chai'),
    assert = chai.assert,
    srcRoot = path.resolve(__dirname + '/../../../src'),
    remoteMethodsActual = require(srcRoot + '/scripts/libs/methods/remoteMethods');

var remoteMethodsExpected = [
    "web3_clientVersion",
    "web3_sha3",
    "net_version",
    "net_peerCount",
    "net_listening",
    "eth_protocolVersion",
    "eth_syncing",
    "eth_gasPrice",
    "eth_blockNumber",
    "eth_getBalance",
    "eth_getStorageAt",
    "eth_getTransactionCount",
    "eth_getBlockTransactionCountByHash",
    "eth_getBlockTransactionCountByNumber",
    "eth_getUncleCountByBlockHash",
    "eth_getUncleCountByBlockNumber",
    "eth_getCode",
    "eth_sendRawTransaction",
    "eth_call",
    "eth_estimateGas",
    "eth_getBlockByHash",
    "eth_getBlockByNumber",
    "eth_getTransactionByHash",
    "eth_getTransactionByBlockHashAndIndex",
    "eth_getTransactionByBlockNumberAndIndex",
    "eth_getTransactionReceipt",
    "eth_getUncleByBlockHashAndIndex",
    "eth_getUncleByBlockNumberAndIndex",
    "eth_getCompilers",
    "eth_compileSolidity",
    "eth_newFilter",
    "eth_newBlockFilter",
    "eth_newPendingTransactionFilter",
    "eth_uninstallFilter",
    "eth_getFilterChanges",
    "eth_getFilterLogs",
    "eth_getLogs",
    "trace_call",
    "trace_rawTransaction",
    "trace_replayTransaction",
    "trace_filter",
    "trace_get",
    "trace_transaction",
    "trace_block"
];


//may seem redundant, but should prevent accidental
//addition or removal of methods from remoteMethods.json

describe('remoteMethods.json', function() {

  it('should not have more methods than expected', function() {
    var actual = remoteMethodsActual.length,
        expected = remoteMethodsExpected.length;

    assert(
      actual === expected,
      'expected privMethods to have length ' + expected + ', got ' + actual
    );
  });

  it('should have every expected method', function() {
    remoteMethodsExpected.forEach(function(method) {
      var actual = remoteMethodsActual.indexOf(method);

      assert(actual !== -1, 'could not find method ' + method);
    });
  });
});
