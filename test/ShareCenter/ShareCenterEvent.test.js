let ShareCenter = artifacts.require('ShareCenter');
const { initCenter, createShare, createGroup, sleep } = require('./TestingUtils');

contract.skip('ShareCenter Event Test', function(accounts) {
  let groupID, center;

  before('setup', async function() {
    center = initCenter(accounts[0]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0]);
    groupID = await createGroup(center);
  });

  after('turn off event listener', async function () {
    center._setEventListener('ShareAdded', () => {
    })
  });

  it("should log the ether costs of all mutator methods", async function() {
    let found = false;
    const callback = () => found = true;
    await center.watchEvents({
      ShareAdded: callback
    });

    await createShare(center, "uri/path", [groupID]);
    await sleep(1000);
    assert(found);
  });
});
