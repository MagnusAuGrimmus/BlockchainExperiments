var ShareCenter = artifacts.require("ShareCenter");
const { initCenter, addShare, createGroup, sleep } = require('./TestingUtils');

contract('ShareCenter Event Test', function(accounts) {
  var groupID, center;

  before('setup', async function() {
    center = initCenter(accounts[0]);
    await center.watchEvents({
      ShareAdded: console.log
    });
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0]);
    groupID = await createGroup(center);
  })

  it("should log the ether costs of all mutator methods", async function() {
    await addShare(center, "uri/path", groupID);
    await sleep(1000)
  })

  it('turn off event listener', async function() {
    center._setEventListener('ShareAdded', () => {})
  })
})