const { createShare, getGroupID } = require('../../utils/TestingUtils');
var ShareCenter = artifacts.require("ShareCenter");
contract('ShareCenter Error Testing', function(accounts) {
  var center;
  beforeEach('setup', async function() {
    center = await ShareCenter.new();
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0], "user");
    await center.createUser(accounts[1], "user");
    await center.createUser(accounts[2], "user");
  })

  function check(data, correctId) {
    assert.equal(data.logs.length, 1, "Incorrect number of events triggered");
    assert.equal(data.logs[0].event, "Error", "Error wasn't thrown");
    assert.equal(data.logs[0].args.id.toNumber(), correctId, "Incorrect error id");
  }

  it("should throw error code 0 when addSystem is called from user that isn't the owner", async function() {
    var data = await center.addSystem(accounts[0], {from: accounts[1]});
    check(data, 0);
  })

  it("should throw error code 3 when createUser is called from fake system", async function() {
    var data = await center.createUser(accounts[0], "uri", {from: accounts[9]});
    check(data, 3);
  })

  it("should throw error code 1 when createUser is called with existing user", async function() {
    var data = await center.createUser(accounts[0], "uri");
    check(data, 1);
  })

  it("should throw error code 2 when createShare is called from fake user", async function() {
    var data = await createShare(center, accounts[0], { from: accounts[9] });
    check(data, 2);
  })

  it("should throw error code 2 when deleteShare is called from fake user", async function() {
    await createShare(center, accounts[0]);
    var data = await center.deleteShare(1, {from: accounts[9]});
    check(data, 2);
  })

  it("should throw error code 6 when deleteShare is called on nonexistant share", async function() {
    var data = await center.deleteShare(1, {from: accounts[0]});
    check(data, 6);
  })

  it("should throw error code 4 when deleteShare is called from user who doesn't own share", async function() {
    await createShare(center, accounts[0]);
    var data = await center.deleteShare(1, {from: accounts[1]});
    check(data, 4);
  })

  it("should throw error code 2 when authorizeWrite is called from fake user", async function()
  {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[1]);
    var data = await center.authorizeWrite(1, id, 0, {from: accounts[9]});
    check(data, 2);
  })

  it("should throw error code 7 when authorizeWrite is called on fake user", async function()
  {
    await createShare(center, accounts[0]);
    var data = await center.authorizeWrite(1, accounts[9], 0, {from: accounts[0]});
    check(data, 7);
  })

  it("should throw error code 4 when authorizeWrite is called from user who doesn't own share", async function() {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[2]);
    var data = await center.authorizeWrite(1, id, 0, {from: accounts[1]});
    check(data, 4);
  })

  it("should throw error code 6 when authorizeRead is called on nonexistant share", async function() {
    var id = await getGroupID(center, accounts[2]);
    var data = await center.authorizeRead(1, id, 0, {from: accounts[1]});
    check(data, 6);
  })

  it("should throw error code 2 when authorizeRead is called from fake user", async function()
  {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[0]);
    var data = await center.authorizeRead(1, id, 0, {from: accounts[9]});
    check(data, 2);
  })

  it("should throw error code 4 when authorizeRead is called from user who doesn't own share", async function() {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[2]);
    var data = await center.authorizeRead(1, id, 0, {from: accounts[1]});
    check(data, 4);
  })

  it("should throw error code 6 when authorizeRead is called on nonexistant share", async function() {
    var id = await getGroupID(center, accounts[2]);
    var data = await center.authorizeRead(1, id, 0, {from: accounts[1]});
    check(data, 6);
  })

  it("should throw error code 2 when revokeWrite is called from fake user", async function()
  {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[0]);
    var data = await center.revokeWrite(1, id, {from: accounts[9]});
    check(data, 2);
  })

  it("should throw error code 4 when revokeWrite is called from user who doesn't own share", async function() {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[2]);
    var data = await center.revokeWrite(1, id, {from: accounts[1]});
    check(data, 4);
  })

  it("should throw error code 6 when revokeWrite is called on nonexistant share", async function() {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[2]);
    var data = await center.revokeWrite(10, id, {from: accounts[1]});
    check(data, 6);
  })

  it("should throw error code 2 when revokeRead is called from fake user", async function()
  {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[0]);
    var data = await center.revokeRead(1, id, {from: accounts[9]});
    check(data, 2);
  })

  it("should throw error code 4 when revokeRead is called from user who doesn't own share", async function() {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[2]);
    var data = await center.revokeRead(1, id, {from: accounts[1]});
    check(data, 4);
  })

  it("should throw error code 6 when revokeRead is called on nonexistant share", async function() {
    await createShare(center, accounts[0]);
    var id = await getGroupID(center, accounts[2]);
    var data = await center.revokeRead(10, id, {from: accounts[1]});
    check(data, 6);
  })
})