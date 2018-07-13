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
    await user1.acceptParentGroup(groupID);
    shareID = await addShare(center, 'uri', groupID)
  })

  it('should throw error code 0 when addSystem is called from user that isn\'t the owner', async function () {
    const call = () => user1.addSystem(user1Address)
    await checkError(call, 0)
  })

  it('should throw error code 2 when getPersonalGroupID is called on fake user', async function () {
    const call = () => center.getPersonalGroupID(fakeUserAddress)
    await checkError(call, 2)
  })

  it('should throw error code 7 when getUsers is called from fake group', async function () {
    const call = () => center.getUsers(fakeID)
    await checkError(call, 7)
  })

  it('should throw error code 3 when createUser is called from unregistered system', async function () {
    const call = () => user1.createUser(centerAddress)
    await checkError(call, 3)
  })

  it('should throw error code 1 when createUser is called with existing user', async function () {
    const call = () => center.createUser(centerAddress)
    await checkError(call, 1)
  })

  it('should throw error code 2 when whitelist is called on fake user', async function () {
    const call = () => center.whitelist(fakeUserAddress)
    await checkError(call, 2)
  })
  
  it('should throw error code 2 when whitelist is called from fake user', async function () {
    const call = () => fakeUser.whitelist(user1Address)
    await checkError(call, 2)
  })
  
  it('should throw error code 2 when blacklist is called on fake user', async function () {
    const call = () => center.blacklist(fakeUserAddress)
    await checkError(call, 2)
  })
  
  it('should throw error code 2 when blacklist is called from fake user', async function () {
    const call = () => fakeUser.blacklist(user1Address)
    await checkError(call, 2)
  })

  it('should throw error code 2 when getUserInvites is called from fake user', async function () {
    const call = () => fakeUser.getUserInvites()
    await checkError(call, 2)
  })

  it('should throw error code 2 when getGroupInvites is called from fake user', async function () {
    const call = () => fakeUser.getGroupInvites()
    await checkError(call, 2)
  })

  it('should throw error code 2 when getSubgroupInvites is called from fake user', async function () {
    const call = () => fakeUser.getSubgroupInvites()
    await checkError(call, 2)
  })

  it('should throw error code 2 when getGroupIDs is called on fake user', async function () {
    const call = () => fakeUser.getGroupIDs()
    await checkError(call, 2)
  })

  it('should throw error code 7 when getParentGroups is called from fake group', async function () {
    const call = () => center.getParentGroups(fakeID)
    await checkError(call, 7)
  })

  it('should throw error code 7 when getSubGroups is called from fake group', async function () {
    const call = () => center.getSubGroups(fakeID)
    await checkError(call, 7)
  })

  it('should throw error code 2 when createGroup is called from fake user', async function () {
    const call = () => fakeUser.createGroup()
    await checkError(call, 2)
  })

  it('should throw error code 2 when addGroupToGroup is called from fake user', async function () {
    const call = () => fakeUser.addGroupToGroup(groupID, emptyGroupID);
    await checkError(call, 2)
  })

  it('should throw error code 7 when addGroupToGroup is called with fake group', async function () {
    let call = () => center.addGroupToGroup(groupID, fakeID);
    await checkError(call, 7)
    call = () => center.addGroupToGroup(fakeID, groupID);
    await checkError(call, 7)
  })

  it('should throw error code 9 when addGroupToGroup is called from nonowner', async function () {
    const call = () => user1.addGroupToGroup(groupID, emptyGroupID)
    await checkError(call, 9)
  })

  it('should throw error code 7 when removeGroupFromGroup is called with fake group', async function () {
    let call = () => center.removeGroupFromGroup(groupID, fakeID);
    await checkError(call, 7)
    call = () => center.removeGroupFromGroup(fakeID, groupID);
    await checkError(call, 7)
  })

  it('should throw error code 9 when removeGroupFromGroup is called from nonowner', async function () {
    const call = () => user1.removeGroupFromGroup(groupID, emptyGroupID)
    await checkError(call, 9)
  })
  
  it('should throw error code 11 when acceptParentGroup is called on nonpending group', async function() {
    let call = () => center.acceptParentGroup(fakeID);
    await checkError(call, 11)
    call = () => center.acceptParentGroup(groupID, emptyGroupID);
    await checkError(call, 12);
  })

  it('should throw error code 11 when acceptSubGroup is called on nonpending subgroup', async function() {
    let call = () => center.acceptSubgroup(groupID, emptyGroupID);
    await checkError(call, 13)
  })

  it('should throw error code 7 when addUserToGroup is called with fake group', async function () {
    let call = () => center.addUserToGroup(fakeID, user1Address);
    await checkError(call, 7)
  })

  it('should throw error code 9 when addUserToGroup is called from nonowner', async function () {
    const call = () => user1.addUserToGroup(groupID, centerAddress)
    await checkError(call, 9)
  })

  it('should throw error code 7 when getShares is called with fake group', async function () {
    let call = () => center.getShares(fakeID);
    await checkError(call, 7)
  })

  it('should throw error code 2 when addShare is called from fake user', async function () {
    const call = () => fakeUser.addShare('uri', groupID, center.DURATION.INDEFINITE, center.ACCESS.WRITE)
    await checkError(call, 2)
  })

  it('should throw error code 7 when addShare is called with fake group', async function () {
    const call = () => center.addShare('uri', fakeID, center.DURATION.INDEFINITE, center.ACCESS.WRITE)
    await checkError(call, 7)
  })

  it('should throw error code 100 when addShare is called with really long URL', async function () {
    const call = () => center.addShare('www.nucleusHealthReallyLongDeploymentUrl/reallyLongPathToRecordShare', groupID, 0, center.ACCESS.WRITE)
    await checkError(call, 100)
  })

  it('should throw error code 2 when deleteShare is called from fake user', async function () {
    const call = () => fakeUser.deleteShare(shareID)
    await checkError(call, 2)
  })

  it('should throw error code 6 when deleteShare is called on nonexistant share', async function () {
    const call = () => center.deleteShare(fakeID)
    await checkError(call, 6)
  })

  it('should throw error code 4 when deleteShare is called from user who doesn\'t own share', async function () {
    const call = () => user2.deleteShare(1)
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
    await user.acceptParentGroup(groupMasterID, groupChildID);
  })

  it('should throw an error when user tries to add a group into itself', async function () {
    const call = () => center.addGroupToGroup(groupMasterID, groupMasterID)
    await checkError(call, 101)
  })

  it('should throw an error when user tries to add a group that would create a circular dependency', async function () {
    const call = () => user.addGroupToGroup(groupGrandChildID, groupMasterID)
    await checkError(call, 101)
  })
})