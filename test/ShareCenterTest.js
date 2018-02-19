var ShareCenter = artifacts.require("ShareCenter");
var Set = artifacts.require("Set");
contract('ShareCenter', function(accounts) {
  var center;
  var set;
  beforeEach('setup', async function() {
    center = await ShareCenter.new();
    set = await Set.new();
    await center.addSystem(accounts[0]);
    await center.addUser(accounts[0], "user");
    await center.addUser(accounts[1], "user");
  })

  it('should not add a user twice', async function() {
    assert.equal(false, await center.addUser.call(accounts[0], "Avi"), "Added account twice");
  })

  it('should throw an exception when adding a user from a unregistered system', async function() {
    try {
      await center.addUser(accounts[0], "Avi", {from : accounts[1]});
      assert(false, "Should have thrown an exception")
    }
    catch (e) {

    }
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

  it('should throw an exception when creating a share from an unregistered system', async function() {
    try {
      await center.createShare("uri", {from: accounts[9]});
      assert(false, "Should have thrown an exception");
    }
    catch(e) {}
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

  it('should throw an exception when deleteShare is called incorrectly', async function() {
    await center.createShare("uri", {from: accounts[0]});
    try {
      await center.deleteShare(1, {from: accounts[0]});
      assert(false, "Allowed user to delete nonexistent share");
    }
    catch(e) {}

    try {
      await center.deleteShare(1, {from: accounts[9]});
      assert(false, "Allowed unregistered user to delete share");
    }
    catch(e) {}

    try {
      await center.deleteShare(1, {from: accounts[1]});
      assert(false, "Allowed user to delet share it doesn't own");
    }
    catch(e) {}
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

  it('should throw exceptions when authorizeOwn is called incorrectly', async function() {
    await center.createShare("uri", {from: accounts[0]});
    try {
      await center.authorizeOwn(0, accounts[9], {from: accounts[0]});
      assert(false, "authorized unregistered user");
    }
    catch(e){}

    try {
      await center.authorizeOwn(0, accounts[1], {from: accounts[9]});
      assert(false, "allowed unregistered user to authorize ownership");
    }
    catch(e) {}
    try {
      await center.authorizeOwn(1, accounts[1], {from: accounts[0]});
      assert(false, "authorized ownership of nonexistent share");
    }
    catch(e){}
    try{
      await center.createShare("uri", {from: accounts[1]});
      await center.authorizeOwn(1, accounts[2], {from: accounts[1]});
      assert(false, "Allowed user to authorize ownership of share it didn't own");
    }
    catch(e) {}
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

  it('should throw exceptions when authorizeRead is called incorrectly', async function() {
    await center.createShare("uri", {from: accounts[0]});
    try {
      await center.authorizeRead(0, accounts[9], {from: accounts[0]});
      assert(false, "authorized unregistered user");
    }
    catch(e){}

    try {
      await center.authorizeRead(0, accounts[1], {from: accounts[9]});
      assert(false, "allowed unregistered user to authorize ownership");
    }
    catch(e) {}
    try {
      await center.authorizeRead(1, accounts[1], {from: accounts[0]});
      assert(false, "authorized ownership of nonexistent share");
    }
    catch(e){}
    try{
      await center.createShare("uri", {from: accounts[1]});
      await center.authorizeRead(1, accounts[2], {from: accounts[1]});
      assert(false, "Allowed user to authorize ownership of share it didn't own");
    }
    catch(e) {}
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

  it('should throw exceptions when revokeOwn is called incorrectly', async function() {
    await center.createShare("uri", {from: accounts[0]});
    await center.authorizeOwn(0, accounts[1], {from: accounts[0]});
    try {
      await center.revokeRead(0, accounts[9], {from: accounts[0]});
      assert(false, "Revoked unregistered user");
    }
    catch(e){}

    try {
      await center.revokeRead(0, accounts[1], {from: accounts[9]});
      assert(false, "allowed unregistered user to revoke ownership");
    }
    catch(e) {}
    try {
      await center.revokeRead(1, accounts[1], {from: accounts[0]});
      assert(false, "Revoked ownership of nonexistent share");
    }
    catch(e){}
    try{
      await center.createShare("uri", {from: accounts[1]});
      await center.revokeRead(1, accounts[2], {from: accounts[1]});
      assert(false, "Allowed user to revoke ownership of share it didn't own");
    }
    catch(e) {}
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

  it('should throw exceptions when revokeRead is called incorrectly', async function() {
    await center.createShare("uri", {from: accounts[0]});
    await center.authorizeRead(0, accounts[1], {from: accounts[0]});
    try {
      await center.revokeRead(0, accounts[9], {from: accounts[0]});
      assert(false, "Revoked unregistered user");
    }
    catch(e){}

    try {
      await center.revokeRead(0, accounts[1], {from: accounts[9]});
      assert(false, "allowed unregistered user to revoke reading");
    }
    catch(e) {}
    try {
      await center.revokeRead(1, accounts[1], {from: accounts[0]});
      assert(false, "Revoked reading of nonexistent share");
    }
    catch(e){}
    try{
      await center.createShare("uri", {from: accounts[1]});
      await center.revokeRead(1, accounts[2], {from: accounts[1]});
      assert(false, "Allowed user to revoke reading of share it didn't own");
    }
    catch(e) {}
  })

});