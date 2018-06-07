async function getGroupID(center, addr) {
  var id =  await center.getPersonalGroupID.call(addr);
  return id.toNumber();
}

async function getShares(center, addr) {
  var id = await getGroupID(center, addr);
  var result = await center.getShares.call(id);
  return {
    idOwn: result[1],
    uriOwn: result[2],
    idRead: result[3],
    uriRead: result[4]
  }
}

async function createShare(center, address, options = {}) {
  var data = await center.createShare("uri", await getGroupID(center, address), {from: address, ...options});
  return data;
}

module.exports = { getGroupID, createShare, getShares };