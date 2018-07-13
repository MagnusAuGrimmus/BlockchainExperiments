const url = require('url');

function parseURI(uri) {
  let { host, path } = url.parse(uri);
  host = host || '';
  path = path || '';
  return { host, path };
}

function makeURI(host, path) {
  if (host) { return `${host}/${path}`; }
  return path;
}

function makeURIs(hosts, paths) {
  return hosts.map((host, index) => makeURI(host, paths[index]));
}

function zip(key1, arr1, key2, arr2) {
  return arr1.map((element, index) => ({ [key1]: element, [key2]: arr2[index] }));
}

function convertBigNumbers(arr) {
  return arr.map(num => num.toNumber());
}

function getDuration(date) {
  return (date - new Date()) / 1000;
}

function parseEvent(response) {
  if(!response)
    return;
  for (const key in response.args) {
    const arg = response.args[key];
    if(typeof arg === 'object')
      response.args[key] = arg.toNumber();
    else if(!isAddress(arg))
      response.args[key] = this.web3.toUtf8(arg);
  }
}

function isAddress(key) {
  return typeof key === 'string' && key.length === 42;
}

module.exports = {  parseURI, makeURIs, zip, parseEvent, convertBigNumbers, getDuration };
