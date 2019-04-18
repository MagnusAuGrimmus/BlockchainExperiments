const ShareCenter = require('../../src/shareCenter');
const { HTTP_PROVIDER } = require('../config.json');

function initCenter (account) {
  if(account)
    return new ShareCenter(HTTP_PROVIDER, account, {testingMode: true});
  return ShareCenter;
}

async function createShare (center, uri, groupIDs, time = 0, access = ShareCenter.ACCESS.WRITE) {
  let data = await center.createShare(uri, groupIDs, time, access);
  return data.value.shareID
}

async function createGroup (center) {
  let data = await center.createGroup();
  return data.value.groupID
}

function contains (shares, shareID) {
  return shares.some(share => share.id === shareID);
}

function checkIfShareIsOwned (shares, groupID, shareID) {
  assert(typeof shares === 'object', 'Shares is not an object');
  assert(Object.keys(shares).includes(groupID.toString()), `Share does not have any shares from groupID ${groupID}`);
  assert(contains(shares[groupID], shareID), `User does not have ${shareID} in shares under groupID ${groupID}`);
  return true
}

async function checkError (call, expectedErrorCode = null) {
  let success = false;
  try {
    let data = await call();
    console.log(data);
    success = true
  }
  catch (err) {
    if (expectedErrorCode !== null)
      assert(err.id === expectedErrorCode, `Error Code ${err.id} != Expected Error Code ${expectedErrorCode}`);
  }
  assert(!success, 'Did not throw an Error')
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
  initCenter,
  createShare,
  contains,
  createGroup,
  checkIfShareIsOwned,
  checkError,
  sleep
};