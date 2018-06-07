const ShareCenter = require('../src/shareCenter');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:9545'));

// async function setup(func) {
//   var center;
//   beforeEach('setup', async function () {
//     center = new ShareCenter(web3, accounts[0]);
//     await center.addSystem(accounts[0]);
//     await center.createUser(accounts[0], "user");
//     await center.createUser(accounts[1], "user");
//   })
//   func(arguments[1]);
// }
contract('Test Create Share', function(accounts) {
  beforeEach('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should create a share', async function () {
    var groupID = await center.getPersonalGroupID();
    var data = await center.createShare("uri");
    var shares = await center.getAllShares();
    var { idWrite, uriWrite, idRead, uriRead } = shares[groupID];
    assert.equal(data.logs[0].event, "ShareCreated");
    assert.equal(idWrite[0], data.value.id);
    assert.equal(uriWrite[0], "uri");
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Delete Share', function(accounts) {
  beforeEach('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })


  it('should delete a share', async function () {
    var groupID = await center.getPersonalGroupID();
    var share = await center.createShare("uri");
    var data = await center.deleteShare(share.value.id);
    var shares = await center.getAllShares();
    var { idWrite, uriWrite, idRead, uriRead } = shares[groupID];
    assert.equal(data.logs[0].event, "ShareDeleted");
    assert.equal(idWrite.length, 0);
    assert.equal(uriWrite.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Authorize Write', function(accounts) {
  beforeEach('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    user = new ShareCenter(web3, accounts[1]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should authorize ownership of a share', async function () {
    var groupID = await user.getPersonalGroupID();
    var share = await center.createShare("uri");
    var data = await center.authorizeWrite(share.value.id, accounts[1]);
    var shares = await user.getAllShares();
    var { idWrite, uriWrite, idRead, uriRead } = shares[groupID];
    assert.equal(data.logs[0].event, "WriterAdded");
    assert.equal(idWrite[0], share.value.id);
    assert.equal(uriWrite[0], "uri");
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Authorize Read', function(accounts) {
  beforeEach('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    user = new ShareCenter(web3, accounts[1]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should authorize reading of a share', async function () {
    var groupID = await user.getPersonalGroupID();
    var share = await center.createShare("uri");
    var data = await center.authorizeRead(share.value.id, accounts[1]);
    var shares = await user.getAllShares();
    var { idWrite, uriWrite, idRead, uriRead } = shares[groupID];
    assert.equal(data.logs[0].event, "ReaderAdded");
    assert.equal(idRead[0], share.value.id);
    assert.equal(uriRead[0], "uri");
    assert.equal(idWrite.length, 0);
    assert.equal(uriWrite.length, 0);
  })
});

contract('Test RevokeWrite', function(accounts) {
  beforeEach('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    user = new ShareCenter(web3, accounts[1]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should revoke ownership of a share', async function () {
    var groupID = await user.getPersonalGroupID();
    var share = await center.createShare("uri");
    await center.authorizeWrite(share.value.id, accounts[1]);
    var data = await center.revokeWrite(share.value.id, accounts[1]);
    var shares = await user.getAllShares();
    var { idWrite, uriWrite, idRead, uriRead } = shares[groupID];
    assert.equal(data.logs[0].event, "WriterRevoked");
    assert.equal(idWrite.length, 0);
    assert.equal(uriWrite.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Revoke Read', function(accounts) {
  beforeEach('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    user = new ShareCenter(web3, accounts[1]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should revoke reading of a share', async function() {
    var groupID = await user.getPersonalGroupID();
    var share = await center.createShare("uri");
    await center.authorizeRead(share.value.id, accounts[1]);
    var data = await center.revokeRead(share.value.id, accounts[1]);
    var shares = await user.getAllShares();
    var { idWrite, uriWrite, idRead, uriRead } = shares[groupID];
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
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[1], "user");
    await center.createUser(accounts[2], "user");
    await center.createUser(accounts[3], "user");
    grandfather = new ShareCenter(web3, accounts[1]);
    mother = new ShareCenter(web3, accounts[2]);
    son = new ShareCenter(web3, accounts[3]);
    grandfatherID = await grandfather.getPersonalGroupID();
    motherID = await mother.getPersonalGroupID();
    sonID = await son.getPersonalGroupID();
    await createScenario();
  })

  async function createScenario() {
    share1 = await grandfather.createShare("uri");
    share2 = await mother.createShare("uri");
    share3 = await son.createShare("uri");
    await grandfather.addGroup(grandfatherID, motherID);
    await grandfather.addGroup(grandfatherID, sonID);
    await mother.addGroup(motherID, sonID);
  }

  it('should get all shares for grandfather', async function() {
    var shares = await grandfather.getAllShares();
    var { idWrite } = shares[grandfatherID];
    assert(idWrite.includes(share1.value.id));
    assert.equal(idWrite.length, 1)
  })

  it('should get all shares for mother', async function() {
    var shares = await mother.getAllShares();
    var { idWrite } = shares[grandfatherID];
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(share1.value.id));
    idWrite  = shares[motherID].idWrite;
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(share2.value.id));
  })

  it('should get all shares for son', async function() {
    var shares = await son.getAllShares();
    var { idWrite } = shares[grandfatherID];
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(share1.value.id));
    idWrite  = shares[motherID].idWrite;
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(share2.value.id));
    idWrite  = shares[sonID].idWrite;
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(share3.value.id));
  })
})

contract('Test Doctor Patient Get All Shares', function(accounts) {
  beforeEach('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    doctor = new ShareCenter(web3, accounts[4]);
    patient = new ShareCenter(web3, accounts[5]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[4], "user");
    await center.createUser(accounts[5], "user");
  })

  it('should share a record', async function() {
    const group = await patient.createGroup();
    const { groupID } = group.value;
    const share = await patient.createShare("uri", groupID);
    const shareID = share.value.id;
    patient.addUserToGroup(groupID, accounts[4]);
    const shares = await doctor.getAllShares();
    const { idWrite } = shares[groupID];
    assert.equal(idWrite.length, 1);
    assert(idWrite.includes(shareID));
  })

})