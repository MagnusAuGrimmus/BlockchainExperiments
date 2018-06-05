var ShareCenter = artifacts.require("ShareCenter");
//var duration = 60 * 60 * 24 * 365;
contract('ShareCenter JS Unit Tests', function(accounts) {
  var center;

  async function getGroup(addr) {
    var id =  await center.getGroupID.call(addr);
    return id.toNumber();
  }

  async function getShares(addr, opts) {
    var id = await getGroup(addr);
    return await center.getShares.call(id, opts);
  }

  beforeEach('setup', async function() {
    center = await ShareCenter.new();
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
  })

  it('should create a share', async function() {
    var data = await center.createShare("uri", {from: accounts[0]});
    var result = await getShares(accounts[0], {from: accounts[0]});
    var idOwn = result[1];
    var uriOwn = result[2];
    var idRead = result[3];
    var uriRead = result[4];
    assert.equal(data.logs[0].event, "ShareCreated");
    assert.equal(idOwn[0].toNumber(), 1);
    assert.equal(web3.toUtf8(uriOwn[0]), "uri");
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })

  it('should delete a share', async function() {
    await center.createShare("uri", {from: accounts[0]});
    var data = await center.deleteShare(1);
    var result = await getShares(accounts[0], {from: accounts[0]});
    var idOwn = result[1];
    var uriOwn = result[2];
    var idRead = result[3];
    var uriRead = result[4];
    assert.equal(data.logs[0].event, "ShareDeleted");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })

  it('should authorize ownership of a share', async function() {
    await center.createShare("uri", {from: accounts[0]});
    var id = await getGroup(accounts[1]);
    var data = await center.authorizeWrite(1, id, 0, {from: accounts[0]});
    var result = await getShares(accounts[1], {from: accounts[1]});
    var idOwn = result[1];
    var uriOwn = result[2];
    var idRead = result[3];
    var uriRead = result[4];
    assert.equal(data.logs[0].event, "WriterAdded");
    assert.equal(idOwn[0].toNumber(), 1);
    assert.equal(web3.toUtf8(uriOwn[0]), "uri");
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })

  it('should authorize reading of a share', async function() {
    await center.createShare("uri", {from: accounts[0]});
    var id = await getGroup(accounts[1]);
    var data = await center.authorizeRead(1, id, 0, {from: accounts[0]});
    var result = await getShares(accounts[1], {from: accounts[1]});
    var idOwn = result[1];
    var uriOwn = result[2];
    var idRead = result[3];
    var uriRead = result[4];
    assert.equal(data.logs[0].event, "ReaderAdded");
    assert.equal(idRead[0].toNumber(), 1);
    assert.equal(web3.toUtf8(uriRead[0]), "uri");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
  })

  it('should revoke ownership of a share', async function() {
    await center.createShare("uri", {from: accounts[0]});
    var id = await getGroup(accounts[1]);
    await center.authorizeWrite(1, id, 0, {from: accounts[0]});
    var data = await center.revokeWrite(1, id, {from: accounts[0]});
    var result = await getShares(accounts[1], {from: accounts[1]});
    var idOwn = result[1];
    var uriOwn = result[2];
    var idRead = result[3];
    var uriRead = result[4];
    assert.equal(data.logs[0].event, "WriterRevoked");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })

  it('should revoke reading of a share', async function() {
    await center.createShare("uri", {from: accounts[0]});
    var id = await getGroup(accounts[1]);
    await center.authorizeRead(1, id, 0, {from: accounts[0]});
    var data = await center.revokeRead(1, id, {from: accounts[0]});
    var result = await getShares(accounts[1], {from: accounts[1]});
    var idOwn = result[1];
    var uriOwn = result[2];
    var idRead = result[3];
    var uriRead = result[4];
    assert.equal(data.logs[0].event, "ReaderRevoked");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});