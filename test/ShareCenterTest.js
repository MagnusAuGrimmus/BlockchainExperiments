var ShareCenter = artifacts.require("ShareCenter");
//var duration = 60 * 60 * 24 * 365;
contract('ShareCenter', function(accounts) {
  var center;
  beforeEach('setup', async function() {
    center = await ShareCenter.new();
    await center.addSystem(accounts[0]);
    await center.addUser(accounts[0], "user");
    await center.addUser(accounts[1], "user");
  })

  it('should create a share', async function() {
    var data = await center.createShare("uri", {from: accounts[0]});
    var result = await center.getShares.call({from: accounts[0]});
    var idOwn = result[0];
    var uriOwn = result[1];
    var idRead = result[2];
    var uriRead = result[3];
    assert.equal(data.logs[0].event, "ShareCreated");
    assert.equal(idOwn[0].toNumber(), 0);
    assert.equal(web3.toUtf8(uriOwn[0]), "uri");
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })

  it('should delete a share', async function() {
    await center.createShare("uri", {from: accounts[0]});
    var data = await center.deleteShare(0);
    var result = await center.getShares.call({from: accounts[0]});
    var idOwn = result[0];
    var uriOwn = result[1];
    var idRead = result[2];
    var uriRead = result[3];
    assert.equal(data.logs[0].event, "ShareDeleted");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })

  it('should authorize ownership of a share', async function() {
    await center.createShare("uri", {from: accounts[0]});
    var data = await center.authorizeOwn(0, accounts[1], {from: accounts[0]});
    var result = await center.getShares.call({from: accounts[1]});
    var idOwn = result[0];
    var uriOwn = result[1];
    var idRead = result[2];
    var uriRead = result[3];
    assert.equal(data.logs[0].event, "OwnerAdded");
    assert.equal(idOwn[0].toNumber(), 0);
    assert.equal(web3.toUtf8(uriOwn[0]), "uri");
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })

  it('should authorize reading of a share', async function() {
    await center.createShare("uri", {from: accounts[0]});
    var data = await center.authorizeRead(0, accounts[1], {from: accounts[0]});
    var result = await center.getShares.call({from: accounts[1]});
    var idOwn = result[0];
    var uriOwn = result[1];
    var idRead = result[2];
    var uriRead = result[3];
    assert.equal(data.logs[0].event, "ReaderAdded");
    assert.equal(idRead[0].toNumber(), 0);
    assert.equal(web3.toUtf8(uriRead[0]), "uri");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
  })

  it('should revoke ownership of a share', async function() {
    await center.createShare("uri", {from: accounts[0]});
    await center.authorizeOwn(0, accounts[1], {from: accounts[0]});
    var data = await center.revokeOwn(0, accounts[1], {from: accounts[0]});
    var result = await center.getShares.call({from: accounts[1]});
    var idOwn = result[0];
    var uriOwn = result[1];
    var idRead = result[2];
    var uriRead = result[3];
    assert.equal(data.logs[0].event, "OwnerRevoked");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })

  it('should revoke reading of a share', async function() {
    await center.createShare("uri", {from: accounts[0]});
    await center.authorizeRead(0, accounts[1], {from: accounts[0]});
    var data = await center.revokeRead(0, accounts[1], {from: accounts[0]});
    var result = await center.getShares.call({from: accounts[1]});
    var idOwn = result[0];
    var uriOwn = result[1];
    var idRead = result[2];
    var uriRead = result[3];
    assert.equal(data.logs[0].event, "ReaderRevoked");
    assert.equal(idOwn.length, 0);
    assert.equal(uriOwn.length, 0);
    assert.equal(idRead.length, 0);
    assert.equal(uriRead.length, 0);
  })
});