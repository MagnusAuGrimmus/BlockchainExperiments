const {initCenter, addShare, checkIfShareIsOwned, createGroup} = require('./TestingUtils')

contract('Test System Added', function (accounts) {
  var center
  it('should add a system', async function () {
    center = initCenter(accounts[0])
    await center.addSystem(accounts[0])
    assert(await center.isAddedSystem(accounts[0]))
    assert(!(await center.isAddedSystem(accounts[1])))
  })
})

contract('Test Get Users', function (accounts) {
  var center, user
  it('should get the users', async function () {
    center = initCenter(accounts[0])
    user = initCenter(accounts[1])
    await center.addSystem(accounts[0])
    await center.createUser(accounts[0])
    await center.createUser(accounts[1])
    const groupID = await createGroup(center)
    await center.addUserToGroup(groupID, accounts[1])
    const users = await center.getUsers(groupID)
    assert(users.includes(accounts[0].toLowerCase()), 'user1 not in group')
    assert(users.includes(accounts[1].toLowerCase()), 'user2 not in group')
  })
})

contract('Test Create Share', function (accounts) {
  var center
  before('setup', async function () {
    center = initCenter(accounts[0])
    await center.addSystem(accounts[0])
    await center.createUser(accounts[0])
    await center.createUser(accounts[1])
  })

  it('should add a share', async function () {
    var groupID = await createGroup(center)
    var data = await center.addShare('nucleushealth.com/abc123', groupID, center.DURATION.INDEFINITE, center.ACCESS.WRITE)
    var shares = (await center.getAllShares())[groupID]
    assert(data.logs[0].event === 'ShareAdded', 'Incorrect event triggered')
    assert(shares[0].id === data.value.shareID, 'Share ID not correct')
    assert(shares[0].uri === 'nucleushealth.com/abc123', 'Share URI not correct')
  })
})

contract('Test Delete Share', function (accounts) {
  var center
  before('setup', async function () {
    center = initCenter(accounts[0])
    await center.addSystem(accounts[0])
    await center.createUser(accounts[0])
    await center.createUser(accounts[1])
  })

  it('should delete a share', async function () {
    var groupID = await createGroup(center)
    var shareID = await addShare(center, 'nucleushealth.com/abc123', groupID)
    var data = await center.deleteShare(shareID)
    var shares = (await center.getAllShares())[groupID]
    assert(data.logs[0].event === 'ShareDeleted', 'Incorrect event triggered')
    assert(!shares.includes(shareID), 'Share still active')
  })
})

contract('Test Blacklist', function (accounts) {
  var centerAddress, badUserAddress,
    center, badUser,
    groupID, subgroupID;
  before('setup', async function() {
    centerAddress = accounts[0];
    badUserAddress = accounts[9];
    center = initCenter(centerAddress);
    badUser = initCenter(badUserAddress);
    await center.addSystem(centerAddress);
    await center.createUser(centerAddress);
    await center.createUser(badUserAddress);
    await center.blacklist(badUserAddress);
    groupID = await createGroup(badUser);
    subgroupID = await createGroup(center);
  })

  async function checkIfGroupWasAdded(center) {
    const groupIDs = await center.getGroupIDs();
    return groupIDs.includes(groupID)
  }

  it('should prevent badUser from adding center (by address) to group', async function() {
    await badUser.addUserToGroup(groupID, centerAddress);

    assert(!(await checkIfGroupWasAdded(center)), 'Group ID was added from blacklisted source');
  })

  it('should prevent badUser from adding center (by groupID) to group', async function() {
    await badUser.addGroupToGroup(groupID, subgroupID);

    assert(!(await checkIfGroupWasAdded(center)), 'Group ID was added from blacklisted source');
  })
})

contract('Test Family Get All Shares', function (accounts) {
  var center,
    grandfather, mother, son,
    grandfatherGroupID, motherGroupID, sonGroupID,
    grandfatherShareID, motherShareID, sonShareID
  it('setup', async function () {
    center = initCenter(accounts[0])
    grandfather = initCenter(accounts[1])
    mother = initCenter(accounts[2])
    son = initCenter(accounts[3])
    await center.addSystem(accounts[0])
    await center.createUser(accounts[1])
    await center.createUser(accounts[2])
    await center.createUser(accounts[3])
    grandfatherGroupID = await createGroup(grandfather)
    motherGroupID = await createGroup(mother)
    sonGroupID = await createGroup(son)
    await createScenario()
  })

  async function createScenario () {
    grandfatherShareID = await addShare(grandfather, 'grandfatherURI', grandfatherGroupID)
    motherShareID = await addShare(mother, 'motherURI', motherGroupID)
    sonShareID = await addShare(son, 'sonURI', sonGroupID)
    // Create a potential sharing scenario with duplication of relationships
    await grandfather.addGroupToGroup(grandfatherGroupID, motherGroupID)
    await grandfather.addGroupToGroup(grandfatherGroupID, sonGroupID)
    await mother.addGroupToGroup(motherGroupID, sonGroupID)
  }

  it('should get all shares for grandfather', async function () {
    var shares = await grandfather.getAllShares()
    checkIfShareIsOwned(shares, grandfatherGroupID, grandfatherShareID)
  })

  it('should get all shares for mother', async function () {
    var shares = await mother.getAllShares()
    // Mother should get the parent group's shares along with her own
    checkIfShareIsOwned(shares, grandfatherGroupID, grandfatherShareID)
    checkIfShareIsOwned(shares, motherGroupID, motherShareID)
  })

  it('should get all shares for son', async function () {
    var shares = await son.getAllShares()
    //Son should get the parent and grandparent group's shares along with his own
    checkIfShareIsOwned(shares, grandfatherGroupID, grandfatherShareID)
    checkIfShareIsOwned(shares, motherGroupID, motherShareID)
    checkIfShareIsOwned(shares, sonGroupID, sonShareID)
  })
})