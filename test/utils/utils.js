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
  if (str.slice(0, 2) !== '0x') return false;
  str = str.substring(2);

  //inspired by 'felgall' from https://www.sitepoint.com/community/t/how-to-check-if-string-is-hexadecimal/162739/6
  try {
    let hex = parseInt(str, 16);
    return (hex.toString(16) === str.toLowerCase() || hex.toString(16) === '0');
  } catch(err) {
    return false;
  }
}

module.exports = utils;
