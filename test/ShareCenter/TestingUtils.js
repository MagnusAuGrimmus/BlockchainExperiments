const ShareCenter = require('../../src/shareCenter')
const {HTTP_PROVIDER} = require('../config.json')

function initCenter (account) {
  if(account)
    return new ShareCenter(HTTP_PROVIDER, account, {testingMode: true});
  return ShareCenter;
}

async function addShare (center, uri, groupID, time = 0, access = ShareCenter.ACCESS.WRITE) {
  var data = await center.addShare(uri, groupID, time, access)
  return data.value.shareID
}

async function createGroup (center) {
  var data = await center.createGroup()
  return data.value.groupID
}

function contains (shares, shareID) {
  return shares.some(share => share.id === shareID);
}

function checkIfShareIsOwned (shares, groupID, shareID) {
  assert(contains(shares[groupID], shareID), `User does not have ${shareID} in shares under groupID ${groupID}`)
  return true
}

async function checkError (call, expectedErrorCode = null) {
  var success = false
  try {
    var data = await call()
    console.log(data)
    success = true
  }
  catch (err) {
    if (expectedErrorCode !== null)
      assert(err.id === expectedErrorCode, 'Incorrect Error Code')
  }
  assert(!success, 'Did not throw an Error')
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
  initCenter,
  addShare,
  contains,
  createGroup,
  checkIfShareIsOwned,
  checkError,
  sleep
}