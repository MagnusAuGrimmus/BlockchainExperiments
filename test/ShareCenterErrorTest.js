var ShareCenter = artifacts.require("ShareCenter");
contract('ShareCenter', function(accounts) {
  var center;
  beforeEach('setup', async function() {
    center = await ShareCenter.new();
    await center.addSystem(accounts[0]);
    await center.addUser(accounts[0], "user");
    await center.addUser(accounts[1], "user");
    await center.addUser(accounts[2], "user");
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

  it("should throw error code 1 when createShare is called from fake user", async function() {
    var data = await center.createShare("uri", {from: accounts[9]});
    check(data, 1);
  })

  it("should throw error code 2 when addUser is called with existing user", async function() {
    var data = await center.addUser(accounts[0], "uri");
    check(data, 2);
  })

  it("should throw error code 3 when addUser is called from fake system", async function() {
    var data = await center.addUser(accounts[0], "uri", {from: accounts[9]});
    check(data, 3);
  })

  it("should throw error code 4 when authorizeOwn is called from user who doesn't own share", async function() {
    await center.createShare("uri", {from: accounts[0]});
    var data = await center.authorizeOwn(0, accounts[2], {from: accounts[1]});
    check(data, 4);
  })

  it("should throw error code 6 when authorizeOwn is called on nonexistant share", async function() {
    var data = await center.authorizeOwn(0, accounts[2], {from: accounts[1]});
    check(data, 6);
  })
})