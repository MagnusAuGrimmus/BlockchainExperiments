const url = require('url');

function isValidURI(host, path) {
  return host.length <= 32 && path.length <= 32;
}

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

/**
 * Python standard zip function
 * @param ids
 * @param uris
 * @returns {Array} Array with the elements of ids and uris intertwined like a zipper
 */
function zip(ids, uris) {
  return ids.map((id, index) => ({ id, uri: uris[index] }));
}

module.exports = {isValidURI, parseURI, makeURIs, makeURI, zip };