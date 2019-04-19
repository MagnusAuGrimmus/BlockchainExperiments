const url = require('url');
const Web3 = require('web3');

const { toUtf8 } = new Web3();

/**
 * Split a uri into its host and path
 * @param uri
 * @returns {{host: String.host, path: String.path}}
 */
function parseURI(uri) {
  let { host, path } = url.parse(uri);
  host = host || '';
  path = path || '';
  return { host, path };
}

/**
 * Combine hosts and paths into usable uris
 * @param {[string]} hosts Array of hosts
 * @param {[string]} paths Array of paths
 * @returns {[string]} Array of uris
 */
function makeURIs(hosts, paths) {
  return hosts.map((host, index) => makeURI(host, paths[index]));
}

function makeURI (host, path) {
  if (host) { return `${host}/${path}` }
  return path
}

/**
 * Zip 2 arrays together into 1 array with objects contains elements from both arrays.
 * Similar to the python zip function.
 * @param {String} key1 Key to put the values of the first array under
 * @param {Array} arr1 First array of values
 * @param {String} key2 Key to put the values of the second array under
 * @param {Array} arr2 Second array of values
 * @returns {Array} zipped array of values
 */
function zip(key1, arr1, key2, arr2) {
  return arr1.map((element, index) => ({ [key1]: element, [key2]: arr2[index] }));
}

/**
 * Converts BigNumbers to numbers
 * @param {[BigNumber]} arr Array of BigNumbers
 * @returns {Array} an array of numbers
 */
function convertBigNumbers(arr) {
  return arr.map(num => num.toNumber());
}

/**
 * Gets the number of seconds between the date specified and the current time
 * @param date
 * @returns {number} the number of seconds
 */
function getDuration(date) {
  return (date - new Date()) / 1000;
}

/**
 * Parse the arguments of an event.
 * Converts BigNumbers to numbers and bytes to utf8 strings.
 * @param response
 */
function parseEvent(response) {
  if(!response)
    return;
  for (const key in response.args) {
    const arg = response.args[key];
    if (typeof arg === 'object') {
      if (arg.constructor !== Array)
        response.args[key] = arg.toNumber();
    }
    else if(!isAddress(arg))
      response.args[key] = toUtf8(arg);
  }
}

/**
 * Check to see if the string is a valid address
 * @param key
 * @returns {boolean}
 */
function isAddress(key) {
  return typeof key === 'string' && key.length === 42;
}

module.exports = {  parseURI, makeURIs, zip, parseEvent, convertBigNumbers, getDuration };
