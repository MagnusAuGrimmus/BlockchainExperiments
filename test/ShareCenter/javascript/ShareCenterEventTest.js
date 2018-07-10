var ShareCenter = artifacts.require("ShareCenter");
const { initCenter, addShare, createGroup } = require('./TestingUtils');

contract('ShareCenter Event Test', function(accounts) {
  var groupID, center;

  before('setup', async function() {
    center = initCenter(accounts[0]);
    center.setEventListener('ShareAdded', console.log);
    await center.watchEvents();
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0]);
    groupID = await createGroup(center);
  })

  it("should log the ether costs of all mutator methods", async function() {
    await addShare(center, "uri/path", groupID);
  })
})