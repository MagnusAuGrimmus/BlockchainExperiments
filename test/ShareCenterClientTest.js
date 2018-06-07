const ShareCenter = require('../src/shareCenter');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:9545'));

// async function setup(func) {
//   var center;
//   before('setup', async function () {
//     center = new ShareCenter(web3, accounts[0]);
//     await center.addSystem(accounts[0]);
//     await center.createUser(accounts[0], "user");
//     await center.createUser(accounts[1], "user");
//   })
//   func(arguments[1]);
// }

async function getID(center) {
  var data = await center.getPersonalGroupID();
  return data.value;
}

async function getAllShares(center) {
  var data = await center.getAllShares();
  return data.value;
}

async function createShare(center, name, groupID) {
  var data = await center.createShare(name, groupID);
  return data.value.id;
}

async function createGroup(center) {
  var data = await center.createGroup();
  return data.value.groupID;
}

contract('Test Create Share', function(accounts) {
  before('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should create a share', async function () {
    var groupID = await getID(center);
    var data = await center.createShare("uri", groupID);
    var shares = await getAllShares(center);
    var { idWrite, uriWrite, idRead, uriRead } = shares[groupID];
    assert.equal(data.logs[0].event, "ShareCreated");
    assert.equal(idWrite[0], data.value.id);
    assert.equal(uriWrite[0], "uri");
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Delete Share', function(accounts) {
  before('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })


  it('should delete a share', async function () {
    var groupID = await getID(center);
    var shareID = await createShare(center, "uri", groupID);
    var data = await center.deleteShare(shareID);
    var shares = await getAllShares(center);
    var { idWrite, uriWrite, idRead, uriRead } = shares[groupID];
    assert.equal(data.logs[0].event, "ShareDeleted");
    assert.equal(idWrite.length, 0);
    assert.equal(uriWrite.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Authorize Write', function(accounts) {
  before('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    user = new ShareCenter(web3, accounts[1]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should authorize ownership of a share', async function () {
    var groupID = await getID(center);
    var shareID = await createShare(center, "uri", groupID);
    var userGroupID = await getID(user);
    var data = await center.authorizeWrite(shareID, userGroupID);
    var shares = await getAllShares(user);
    var { idWrite, uriWrite, idRead, uriRead } = shares[userGroupID];
    assert.equal(data.logs[0].event, "WriterAdded");
    assert.equal(idWrite[0], shareID);
    assert.equal(uriWrite[0], "uri");
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Authorize Read', function(accounts) {
  before('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    user = new ShareCenter(web3, accounts[1]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should authorize reading of a share', async function () {
    var groupID = await getID(center);
    var userGroupID = await getID(user);
    var shareID = await createShare(center, "uri", groupID);
    var data = await center.authorizeRead(shareID, userGroupID);
    var shares = await getAllShares(user);
    var { idWrite, uriWrite, idRead, uriRead } = shares[userGroupID];
    assert.equal(data.logs[0].event, "ReaderAdded");
    assert.equal(idRead[0], shareID);
    assert.equal(uriRead[0], "uri");
    assert.equal(idWrite.length, 0);
    assert.equal(uriWrite.length, 0);
  })
});

contract('Test RevokeWrite', function(accounts) {
  before('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    user = new ShareCenter(web3, accounts[1]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should revoke ownership of a share', async function () {
    var groupID = await getID(center);
    var shareID = await createShare(center, "uri", groupID);
    var userGroupID = await getID(user);
    await center.authorizeWrite(shareID, userGroupID);
    var data = await center.revokeWrite(shareID, userGroupID);
    var shares = await getAllShares(user);
    var { idWrite, uriWrite, idRead, uriRead } = shares[userGroupID];
    assert.equal(data.logs[0].event, "WriterRevoked");
    assert.equal(idWrite.length, 0);
    assert.equal(uriWrite.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Revoke Read', function(accounts) {
  before('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    user = new ShareCenter(web3, accounts[1]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should revoke reading of a share', async function() {
    var groupID = await getID(center);
    var shareID = await createShare(center, "uri", groupID);
    var userGroupID = await getID(user);
    await center.authorizeRead(shareID, userGroupID);
    var data = await center.revokeRead(shareID, userGroupID);
    var shares = await getAllShares(user);
    var { idWrite, uriWrite, idRead, uriRead } = shares[userGroupID];
    assert.equal(data.logs[0].event, "ReaderRevoked");
    assert.equal(idWrite.length, 0);
    assert.equal(uriWrite.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Family Get All Shares', function(accounts) {
  it('setup', async function() {
    center = new ShareCenter(web3, accounts[0]);
    grandfather = new ShareCenter(web3, accounts[1]);
    mother = new ShareCenter(web3, accounts[2]);
    son = new ShareCenter(web3, accounts[3]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[1], "grandfather");
    await center.createUser(accounts[2], "mother");
    await center.createUser(accounts[3], "son");
    grandfatherID = await getID(grandfather);
    motherID = await getID(mother);
    sonID = await getID(son);
    await createScenario();
  })

  async function createScenario() {
    share1ID = await createShare(grandfather, "grandfatherURI", grandfatherID);
    share2ID = await createShare(mother, "motherURI", motherID);
    share3ID = await createShare(son, "sonURI", sonID);
    await grandfather.addGroupToGroup(grandfatherID, motherID);
    await grandfather.addGroupToGroup(grandfatherID, sonID);
    await mother.addGroupToGroup(motherID, sonID);
  }

  it('should get all shares for grandfather', async function() {
    var shares = await getAllShares(grandfather);
    var { idWrite } = shares[grandfatherID];
    assert(idWrite.includes(share1ID));
    assert.equal(idWrite.length, 1)
  })

  it('should get all shares for mother', async function() {
    var shares = await getAllShares(mother);
    var { idWrite } = shares[grandfatherID];
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(share1ID));
    idWrite  = shares[motherID].idWrite;
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(share2ID));
  })

  it('should get all shares for son', async function() {
    var shares = await getAllShares(son);
    var { idWrite } = shares[grandfatherID];
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(share1ID));
    idWrite  = shares[motherID].idWrite;
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(share2ID));
    idWrite  = shares[sonID].idWrite;
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(share3ID));
  })
})

contract('Test Doctor Patient Get All Shares', function(accounts) {
  before('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    doctor = new ShareCenter(web3, accounts[4]);
    patient = new ShareCenter(web3, accounts[5]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[4], "Doctor");
    await center.createUser(accounts[5], "Patient");
  })

  it('should share a record', async function() {
    const groupID = await createGroup(patient);
    const shareID = await createShare(patient, "PatientURI", groupID);
    await patient.addUserToGroup(groupID, accounts[4]);
    const shares = await getAllShares(doctor);

    const { idWrite } = shares[groupID];
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(shareID));
  })
})

contract('Test Banner Verdad Case', function(accounts) {
  before('setup', async function() {
    center = new ShareCenter(web3, accounts[0]);
    bannerDoctor = new ShareCenter(web3, accounts[1]);
    verdadDoctor = new ShareCenter(web3, accounts[2]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[1], "Banner");
    await center.createUser(accounts[2], "Verdad");
  })

  it('should create a share and groups', async function() {
    bannerGroupID = await createGroup(bannerDoctor);
    verdadGroupID = await createGroup(verdadDoctor);
    shareID = await createShare(bannerDoctor, "BannerURI", bannerGroupID);
  })

  it('should give Verdad group access to share', async function() {
    bannerDoctor.addGroupToGroup(bannerGroupID, verdadGroupID);
    const shares = await getAllShares(verdadDoctor);

    const { idWrite } = shares[bannerGroupID];
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(shareID));
  })

  it('should remove Verdad group access to share', async function() {
    bannerDoctor.removeGroupFromGroup(bannerGroupID, verdadGroupID);
    const shares = await getAllShares(verdadDoctor);

    assert.equal(shares[bannerGroupID], undefined);
  })
})