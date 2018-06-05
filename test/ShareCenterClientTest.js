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
    var data = await center.createShare("uri");
    var result = await center.getShares(accounts[0]);
    var idOwn = result.value.idWrite;
    var uriOwn = result.value.uriWrite;
    var idRead = result.value.idRead;
    var uriRead = result.value.uriRead;
    assert.equal(data.logs[0].event, "ShareCreated");
    assert.equal(idOwn[0], data.value.id);
    assert.equal(uriOwn[0], "uri");
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
    var share = await center.createShare("uri");
    var data = await center.deleteShare(share.value.id);
    var result = await center.getShares(accounts[0]);
    var idOwn = result.value.idWrite;
    var uriOwn = result.value.uriWrite;
    var idRead = result.value.idRead;
    var uriRead = result.value.uriRead;
    assert.equal(data.logs[0].event, "ShareDeleted");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Authorize Write', function(accounts) {
  beforeEach('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should authorize ownership of a share', async function () {
    var share = await center.createShare("uri");
    var data = await center.authorizeWrite(share.value.id, accounts[1]);
    var result = await center.getShares(accounts[1]);
    var idOwn = result.value.idWrite;
    var uriOwn = result.value.uriWrite;
    var idRead = result.value.idRead;
    var uriRead = result.value.uriRead;
    assert.equal(data.logs[0].event, "WriterAdded");
    assert.equal(idOwn[0], share.value.id);
    assert.equal(uriOwn[0], "uri");
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Authorize Read', function(accounts) {
  beforeEach('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should authorize reading of a share', async function () {
    var share = await center.createShare("uri");
    var data = await center.authorizeRead(share.value.id, accounts[1]);
    var result = await center.getShares(accounts[1]);
    var idOwn = result.value.idWrite;
    var uriOwn = result.value.uriWrite;
    var idRead = result.value.idRead;
    var uriRead = result.value.uriRead;
    assert.equal(data.logs[0].event, "ReaderAdded");
    assert.equal(idRead[0], share.value.id);
    assert.equal(uriRead[0], "uri");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
  })
});

contract('Test RevokeWrite', function(accounts) {
  beforeEach('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should revoke ownership of a share', async function () {
    var share = await center.createShare("uri");
    await center.authorizeWrite(share.value.id, accounts[1]);
    var data = await center.revokeWrite(share.value.id, accounts[1]);
    var result = await center.getShares(accounts[1]);
    var idOwn = result.value.idWrite;
    var uriOwn = result.value.uriWrite;
    var idRead = result.value.idRead;
    var uriRead = result.value.uriRead;
    assert.equal(data.logs[0].event, "WriterRevoked");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Revoke Read', function(accounts) {
  beforeEach('setup', async function () {
    center = new ShareCenter(web3, accounts[0]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should revoke reading of a share', async function() {
    var share = await center.createShare("uri");
    await center.authorizeRead(share.value.id, accounts[1]);
    var data = await center.revokeRead(share.value.id, accounts[1]);
    var result = await center.getShares(accounts[1]);
    var idOwn = result.value.idWrite;
    var uriOwn = result.value.uriWrite;
    var idRead = result.value.idRead;
    var uriRead = result.value.uriRead;
    assert.equal(data.logs[0].event, "ReaderRevoked");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});

contract('Test Get All Shares', function(accounts) {
  it('setup', async function() {
    center = new ShareCenter(web3, accounts[0]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[1], "user");
    await center.createUser(accounts[2], "user");
    await center.createUser(accounts[3], "user");
    user1 = new ShareCenter(web3, accounts[1]);
    user2 = new ShareCenter(web3, accounts[2]);
    user3 = new ShareCenter(web3, accounts[3]);
    await createScenario();
  })

  async function createScenario() {
    share1 = await user1.createShare("uri");
    share2 = await user2.createShare("uri");
    share3 = await user3.createShare("uri");
    await user1.addGroup(accounts[2]);
    await user1.addGroup(accounts[3]);
    await user2.addGroup(accounts[3]);
  }

  it('should get all shares for user 1', async function() {
    var shares = await user1.getAllShares();
    assert.equal(shares.idWrite.length, 1);
    assert.equal(shares.idWrite[0], share1.value.id);
    assert.equal(shares.idRead.length, 0);
  })

  it('should get all shares for user 2', async function() {
    var shares = await user2.getAllShares();
    assert.equal(shares.idWrite.length, 2);
    assert(shares.idWrite.includes(share1.value.id))
    assert(shares.idWrite.includes(share2.value.id))
    assert.equal(shares.idRead.length, 0);
  })

  it('should get all shares for user 3', async function() {
    var shares = await user3.getAllShares();
    assert.equal(shares.idWrite.length, 3);
    assert(shares.idWrite.includes(share1.value.id))
    assert(shares.idWrite.includes(share2.value.id))
    assert(shares.idWrite.includes(share3.value.id))
    assert.equal(shares.idRead.length, 0);
  })
})