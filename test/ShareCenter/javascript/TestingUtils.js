async function getID(center) {
    var data = await center.getPersonalGroupID();
    return data.value;
}

async function getAllShares(center) {
    var data = await center.getAllShares();
    return data.value;
}

async function addShare(center, uri, groupID) {
    var data = await center.addShare(uri, groupID);
    return data.value.id;
}

async function createGroup(center) {
    var data = await center.createGroup();
    return data.value.groupID;
}

function contains(shares, shareID) {
    return shares.filter(share => share.id === shareID).length > 0;
}

function checkIfShareIsOwned(shares, groupID, shareID) {
    var { authorizedWrite } = shares[groupID];
    assert(contains(authorizedWrite, shareID));
    return true;
}

async function checkError(call, expectedErrorCode = undefined) {
    var success = false;
    try {
        var data = await call();
        console.log(data);
        success = true;
    }
    catch (err) {
        if(expectedErrorCode !== undefined)
            assert.equal(err.id, expectedErrorCode, "Incorrect Error Code");
    }
    assert(!success, "Did not throw an Error");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {getID, getAllShares, addShare, contains, createGroup, checkIfShareIsOwned, checkError, sleep};