const equal = require('deep-equal');
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

function containsInvite(invites, invite) {
  return invites.some(item => equal(item, invite));
}

function checkIfShareIsOwned (shares, groupID, shareID) {
  var shares = shares[groupID]
  assert(contains(shares, shareID))
  return true
}

async function checkError (call, expectedErrorCode = undefined) {
  var success = false
  try {
    var data = await call()
    console.log(data)
    success = true
  }
  catch (err) {
    if (expectedErrorCode !== undefined)
      assert.equal(err.id, expectedErrorCode, 'Incorrect Error Code')
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
  containsInvite,
  createGroup,
  checkIfShareIsOwned,
  checkError,
  sleep
}