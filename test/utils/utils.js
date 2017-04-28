let utils = function(){};

utils.generateRequestOptions = (o) => {
  //base options to be used on every request
  let standardOptions = {
    url     : 'http://127.0.0.1:8545',
    method  : 'post',
    headers : { 'Content-Type': 'application/json' },
    body    : { jsonrpc: '2.0', id: 0, params: [] }
  };
  let options = Object.assign({}, standardOptions);

  //add ether-specific props to body
  Object.assign(options.body, o);

  //format body to str
  options.body = JSON.stringify(options.body);

  return options;
}

utils.isValidHexResponse = (str) => {
  return /^0x[0-9A-F]+$/i.test(str);
}


module.exports = utils;
