const {initCenter, addShare, createGroup, checkError} = require('./TestingUtils')

contract('ShareCenter Error Testing', function (accounts) {
  var center, user1, user2, fakeUser,
    centerAddress, user1Address, user2Address, fakeUserAddress,
    shareID, groupID, fakeID, emptyGroupID
  before('setup', async function () {
    centerAddress = accounts[0]
    user1Address = accounts[1]
    user2Address = accounts[2]
    fakeUserAddress = accounts[9]
    center = initCenter(centerAddress)
    user1 = initCenter(user1Address)
    user2 = initCenter(user2Address)
    fakeUser = initCenter(fakeUserAddress)
    await center.addSystem(centerAddress)
    await center.createUser(centerAddress)
    await center.createUser(user1Address)
    await center.createUser(user2Address)
    groupID = await createGroup(center)
    emptyGroupID = await createGroup(user2)
    fakeID = 123456789
    await center.addUserToGroup(groupID, user1Address)
    shareID = await addShare(center, 'uri', groupID)
  })

  it('should throw error code 0 when addSystem is called from user that isn\'t the owner', async function () {
    var call = () => user1.addSystem(user1Address)
    await checkError(call, 0)
  })

  it('should throw error code 3 when createUser is called from unregistered system', async function () {
    var call = () => user1.createUser(centerAddress)
    await checkError(call, 3)
  })

  it('should throw error code 1 when createUser is called with existing user', async function () {
    var call = () => center.createUser(centerAddress)
    await checkError(call, 1)
  })

  it('should throw error code 2 when createGroup is called from fake user', async function () {
    var call = () => fakeUser.createGroup()
    await checkError(call, 2)
  })

  it('should throw error code 2 when getGroupIDs is called on fake user', async function () {
    var call = () => fakeUser.getGroupIDs()
    await checkError(call, 2)
  })

  it('should throw error code 7 when getParentGroups is called from fake group', async function () {
    var call = () => center.getParentGroups(fakeID)
    await checkError(call, 7)
  })

  it('should throw error code 7 when getSubGroups is called from fake group', async function () {
    var call = () => center.getSubGroups(fakeID)
    await checkError(call, 7)
  })

  it('should throw error code 9 when addGroupToGroup is called from nonowner', async function () {
    var call = () => user1.addGroupToGroup(groupID, emptyGroupID)
    await checkError(call, 9)
  })

  it('should throw error code 2 when addShare is called from fake user', async function () {
    var call = () => fakeUser.addShare('uri', groupID, 0, center.ACCESS.WRITE)
    await checkError(call, 2)
  })

  it('should throw error code 7 when addShare is called with fake group', async function () {
    var call = () => center.addShare('uri', fakeID, 0, center.ACCESS.WRITE)
    await checkError(call, 7)
  })

  it('should throw error code 100 when addShare is called with really long URL', async function () {
    var call = () => center.addShare('www.nucleusHealthReallyLongDeploymentUrl/reallyLongPathToRecordShare', groupID, 0, center.ACCESS.WRITE)
    await checkError(call, 100)
  })

  it('should throw error code 2 when deleteShare is called from fake user', async function () {
    var call = () => fakeUser.deleteShare(shareID)
    await checkError(call, 2)
  })

  it('should throw error code 6 when deleteShare is called on nonexistant share', async function () {
    var call = () => center.deleteShare(fakeID)
    await checkError(call, 6)
  })

  it('should throw error code 4 when deleteShare is called from user who doesn\'t own share', async function () {
    var call = () => user2.deleteShare(1)
    await checkError(call, 4)
  })
})

contract('Test Circular Dependencies', function (accounts) {
  var center, user,
    groupMasterID, groupChildID, groupGrandChildID

  before('setup', async function () {
    center = initCenter(accounts[0])
    user = initCenter(accounts[1])

    await center.addSystem(accounts[0])
    await center.createUser(accounts[0])
    await center.createUser(accounts[1])

    groupMasterID = await createGroup(center)
    groupChildID = await createGroup(user)
    groupGrandChildID = await createGroup(user)

    await center.addGroupToGroup(groupMasterID, groupChildID)
    await user.addGroupToGroup(groupChildID, groupGrandChildID)
    await user.acceptGroup(groupMasterID);
  })

  it('should throw an error when user tries to add a group into itself', async function () {
    var call = () => center.addGroupToGroup(groupMasterID, groupMasterID)
    await checkError(call, 101)
  })

  it('should throw an error when user tries to add a group that would create a circular dependency', async function () {
    var call = () => user.addGroupToGroup(groupGrandChildID, groupMasterID)
    await checkError(call, 101)
  })
})