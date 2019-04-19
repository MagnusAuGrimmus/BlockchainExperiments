const { initCenter, createShare, checkIfShareIsOwned, createGroup } = require('./TestingUtils');

contract('Test System Added', function (accounts) {
  let center;
  it('should add a system', async function () {
    center = initCenter(accounts[0]);
    await center.addSystem(accounts[0]);
    assert(await center.isAddedSystem(accounts[0]));
    assert(!(await center.isAddedSystem(accounts[1])))
  })
});

contract('Test Get Groups', function (accounts) {
  let center, user,
    personalGroupID, groupID;
  before(async () => {
    center = initCenter(accounts[0]);
    user = initCenter(accounts[1]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0]);
    await center.createUser(accounts[1]);
    personalGroupID = await center.getPersonalGroupID(accounts[0]);
    groupID = await createGroup(center);
  });

  it('should include the personal group ID in the call', async () => {
    const groups = await center.getGroupIDs();
    assert(groups.includes(personalGroupID), 'Personal Group ID is not included');
  });

  it('should get the groups after share', async () => {
    await center.addShareGroup(groupID, personalGroupID);

    const users = await center.getShareGroups(personalGroupID);
    assert(users.includes(groupID), 'user1 not in group');
  })
});

contract('Test Create Share', function (accounts) {
  let center;
  before('setup', async function () {
    center = initCenter(accounts[0]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0]);
    await center.createUser(accounts[1]);
  });

  it('should create a share', async function () {
    let groupID = await createGroup(center);
    let data = await center.createShare('nucleushealth.com/abc123', groupID, center.DURATION.INDEFINITE, center.ACCESS.WRITE);
    let shares = (await center.getAllShares())[groupID];
    assert(data.logs[0].event === 'ShareAdded', 'Incorrect event triggered');
    assert(shares[0].id === data.value.shareID, 'Share ID not correct');
    assert(shares[0].uri === 'nucleushealth.com/abc123', 'Share URI not correct');
  })
});

contract('Test Delete Share', function (accounts) {
  let center,
    groupID, shareID;
  before('setup', async function () {
    center = initCenter(accounts[0]);
    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0]);
    await center.createUser(accounts[1]);

    groupID = await createGroup(center);
    shareID = await createShare(center, 'nucleushealth.com/abc123', [groupID]);
  });

  it('should delete a share', async function () {

    let data = await center.deleteShare(shareID);
    let shares = (await center.getAllShares())[groupID];
    assert(data.logs[0].event === 'ShareDeleted', 'Incorrect event triggered');
    assert(!shares.includes(shareID), 'Share still active');
  })
});

// contract('Test Family Get All Shares', function (accounts) {
//   let center,
//     grandfather, mother, son,
//     grandfatherGroupID, motherGroupID, sonGroupID,
//     grandfatherShareID, motherShareID, sonShareID;
//   it('setup', async function () {
//     center = initCenter(accounts[0]);
//     grandfather = initCenter(accounts[1]);
//     mother = initCenter(accounts[2]);
//     son = initCenter(accounts[3]);
//     await center.addSystem(accounts[0]);
//     await center.createUser(accounts[1]);
//     await center.createUser(accounts[2]);
//     await center.createUser(accounts[3]);
//     grandfatherGroupID = await createGroup(grandfather);
//     motherGroupID = await createGroup(mother);
//     sonGroupID = await createGroup(son);
//     await createScenario();
//   });
//
//   async function createScenario () {
//     grandfatherShareID = await addShare(grandfather, 'grandfatherURI', grandfatherGroupID);
//     motherShareID = await addShare(mother, 'motherURI', motherGroupID);
//     sonShareID = await addShare(son, 'sonURI', sonGroupID);
//     // Create a potential sharing scenario with duplication of relationships
//     await grandfather.addShareGroup(grandfatherGroupID, motherGroupID);
//     await grandfather.addShareGroup(grandfatherGroupID, sonGroupID);
//     await mother.addShareGroup(motherGroupID, sonGroupID)
//   }
//
//   it('should get all shares for grandfather', async function () {
//     let shares = await grandfather.getAllShares();
//     checkIfShareIsOwned(shares, grandfatherGroupID, grandfatherShareID)
//   });
//
//   it('should get all shares for mother', async function () {
//     let shares = await mother.getAllShares();
//     // Mother should get the parent group's shares along with her own
//     checkIfShareIsOwned(shares, grandfatherGroupID, grandfatherShareID);
//     checkIfShareIsOwned(shares, motherGroupID, motherShareID)
//   });
//
//   it('should get all shares for son', async function () {
//     let shares = await son.getAllShares();
//     //Son should get the parent and grandparent group's shares along with his own
//     checkIfShareIsOwned(shares, grandfatherGroupID, grandfatherShareID);
//     checkIfShareIsOwned(shares, motherGroupID, motherShareID);
//     checkIfShareIsOwned(shares, sonGroupID, sonShareID)
//   })
// });