async function getID(center) {
  var data = await center.getPersonalGroupID();
  return data.value;
}

async function getAllShares(center) {
  var data = await center.getAllShares();
  return data.value;
}

async function createShare(center, uri, groupID) {
  var data = await center.createShare(uri, groupID);
  return data.value.id;
}

async function createGroup(center) {
  var data = await center.createGroup();
  return data.value.groupID;
}

function contains(shares, shareID) {
  return shares.filter(share => share.id === shareID).length > 0;
}

function checkIfShareExists(shares, groupID, shareID) {
  var { authorizedWrite } = shares[groupID];
  assert.equal(authorizedWrite.length, 1);
  assert(contains(authorizedWrite, shareID));
}

async function checkError(call, expectedErrorCode) {
  var success = false;
  try {
    await call();
    success = true;
  }
  catch(err) {
    assert.equal(err.value.id, expectedErrorCode, "Incorrect Error Code");
  }
  assert(!success, "Did not throw an Error");
}

module.exports = { getID, getAllShares, createShare, contains, createGroup, checkIfShareExists, checkError };