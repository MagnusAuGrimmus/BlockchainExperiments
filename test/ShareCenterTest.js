const { getGroupID, createShare, getShares } = require('./utils/TestingUtils');

var ShareCenter = artifacts.require("ShareCenter");
contract('ShareCenter JS Unit Tests', function(accounts) {
  var center;

  beforeEach('setup', async function() {
    center = await ShareCenter.new();
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should create a share', async function() {
    var data = await createShare(center, accounts[0]);
    var { idOwn, uriOwn, idRead, uriRead } = await getShares(center, accounts[0]);
    assert.equal(data.logs[0].event, "ShareCreated");
    assert.equal(idOwn[0].toNumber(), 1);
    assert.equal(web3.toUtf8(uriOwn[0]), "uri");
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })

  it('should delete a share', async function() {
    await createShare(center, accounts[0]);
    var data = await center.deleteShare(1);
    var { idOwn, uriOwn, idRead, uriRead } = await getShares(center, accounts[0]);
    assert.equal(data.logs[0].event, "ShareDeleted");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })

  it('should authorize ownership of a share', async function() {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[1]);
    var data = await center.authorizeWrite(1, id, 0, {from: accounts[0]});
    var { idOwn, uriOwn, idRead, uriRead } = await getShares(center, accounts[1]);
    assert.equal(data.logs[0].event, "WriterAdded");
    assert.equal(idOwn[0].toNumber(), 1);
    assert.equal(web3.toUtf8(uriOwn[0]), "uri");
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })

  it('should authorize reading of a share', async function() {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[1]);
    var data = await center.authorizeRead(1, id, 0, {from: accounts[0]});
    var { idOwn, uriOwn, idRead, uriRead } = await getShares(center, accounts[1]);
    assert.equal(data.logs[0].event, "ReaderAdded");
    assert.equal(idRead[0].toNumber(), 1);
    assert.equal(web3.toUtf8(uriRead[0]), "uri");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
  })

  it('should revoke ownership of a share', async function() {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[1]);
    await center.authorizeWrite(1, id, 0, {from: accounts[0]});
    var data = await center.revokeWrite(1, id, {from: accounts[0]});
    var { idOwn, uriOwn, idRead, uriRead } = await getShares(center, accounts[1]);
    assert.equal(data.logs[0].event, "WriterRevoked");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })

  it('should revoke reading of a share', async function() {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[1]);
    await center.authorizeRead(1, id, 0, {from: accounts[0]});
    var data = await center.revokeRead(1, id, {from: accounts[0]});
    var { idOwn, uriOwn, idRead, uriRead } = await getShares(center, accounts[1]);
    assert.equal(data.logs[0].event, "ReaderRevoked");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});