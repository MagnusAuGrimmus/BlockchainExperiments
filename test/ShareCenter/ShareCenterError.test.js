const { initCenter, createShare, createGroup, checkError, addUserToGroup } = require('./TestingUtils');
const { errorCode } = require('../../src/errors');


contract('ShareCenter Error Testing', function (accounts) {
  let center, user1, user2, fakeUser,
    centerAddress, user1Address, user2Address, fakeUserAddress,
    shareID, groupID, fakeID, emptyGroupID;

  before('setup', async function () {
    centerAddress = accounts[0];
    user1Address = accounts[1];
    user2Address = accounts[2];
    fakeUserAddress = accounts[9];
    center = initCenter(centerAddress);
    user1 = initCenter(user1Address);
    user2 = initCenter(user2Address);
    fakeUser = initCenter(fakeUserAddress);
    await center.addSystem(centerAddress);
    await center.createUser(centerAddress);
    await center.createUser(user1Address);
    await center.createUser(user2Address);
    groupID = await createGroup(center);
    emptyGroupID = await createGroup(user2);
    fakeID = 123456789;
    await addUserToGroup(center, groupID, user1);
    shareID = await createShare(center, 'uri', [groupID])
  });

  describe('Add System', () => {
    it('should throw error code 0 when addSystem is called from nonowner', async function () {
      const call = () => user1.addSystem(user1Address);
      await checkError(call, errorCode.IS_NOT_OWNER);
    });
  });

  describe('Get Personal Group ID', () => {
    it('should throw error code 2 when getPersonalGroupID is called on fake user', async function () {
      const call = () => center.getPersonalGroupID(fakeUserAddress);
      await checkError(call, errorCode.IS_NOT_A_USER);
    });
  });

  describe('Create User', () => {
    it('should throw error code 3 when createUser is called from unregistered system', async function () {
      const call = () => user1.createUser(centerAddress);
      await checkError(call, errorCode.IS_NOT_A_REGISTERED_SYSTEM);
    });

    it('should throw error code 1 when createUser is called with existing user', async function () {
      const call = () => center.createUser(centerAddress);
      await checkError(call, errorCode.USER_ALREADY_EXISTS);
    });
  });

  describe('Blacklist', () => {
    it('should throw error code 2 when blacklistUser is called on fake user', async function () {
      const call = () => center.blacklistUser(groupID, fakeUserAddress);
      await checkError(call, errorCode.IS_NOT_A_USER);
    });

    it('should throw error code 2 when blacklistGroup is called on fake group', async function () {
      const call = () => center.blacklistGroup(groupID, fakeID);
      await checkError(call, errorCode.GROUP_NOT_ACTIVE);
    });
  });

  describe('Get Group IDs', () => {
    it('should throw error code 2 when getGroupIDs is called on fake user', async function () {
      const call = () => fakeUser.getGroupIDs();
      await checkError(call, errorCode.IS_NOT_A_USER);
    });
  });

  describe('Get Share Groups', () => {
    it('should throw error code 7 when getShareGroups is called from fake group', async function () {
      const call = () => center.getShareGroups(fakeID);
      await checkError(call, errorCode.GROUP_NOT_ACTIVE);
    });
  });

  describe('Create Group', () => {
    it('should throw error code 2 when createGroup is called from fake user', async function () {
      const call = () => fakeUser.createGroup();
      await checkError(call, errorCode.IS_NOT_A_USER);
    });
  });

  describe('Add Share Group', () => {
    it('should throw error code 2 when addShareGroup is called from fake user', async function () {
      const call = () => fakeUser.addShareGroup(groupID, emptyGroupID);
      await checkError(call, errorCode.IS_NOT_A_USER)
    });

    it('should throw error code 7 when addShareGroup is called with fake group', async function () {
      let call = () => center.addShareGroup(groupID, fakeID);
      await checkError(call, errorCode.GROUP_NOT_ACTIVE);
      call = () => center.addShareGroup(fakeID, groupID);
      await checkError(call, errorCode.GROUP_NOT_ACTIVE);
    });

    it('should throw error code 9 when addShareGroup is called from nonwriter', async function () {
      const call = () => user1.addShareGroup(groupID, emptyGroupID);
      await checkError(call, errorCode.IS_NOT_WRITER);
    });
  });

  describe('Remove Share Group', () => {
    it('should throw error code 7 when removeShareGroup is called with fake group', async function () {
      let call = () => center.removeShareGroup(groupID, fakeID);
      await checkError(call, errorCode.GROUP_NOT_ACTIVE);
      call = () => center.removeShareGroup(fakeID, groupID);
      await checkError(call, errorCode.GROUP_NOT_ACTIVE);
    });

    it('should throw error code 9 when removeShareGroup is called from nonowner', async function () {
      const call = () => user1.removeShareGroup(groupID, emptyGroupID);
      await checkError(call, errorCode.NOT_OWNER_OF_GROUP);
    });
  });

  describe('Get Shares', () => {
    it('should throw error code 7 when getShares is called with fake group', async function () {
      let call = () => center.getShares(fakeID);
      await checkError(call, errorCode.GROUP_NOT_ACTIVE);
    });
  });

  describe('Create Share', () => {
    it('should throw error code 2 when createShare is called from fake user', async function () {
      const call = () => fakeUser.createShare('uri', [groupID], center.DURATION.INDEFINITE, center.ACCESS.WRITE);
      await checkError(call, errorCode.IS_NOT_A_USER);
    });

    it('should throw error code 7 when createShare is called with fake group', async function () {
      const call = () => center.createShare('uri', [fakeID], center.DURATION.INDEFINITE, center.ACCESS.WRITE);
      await checkError(call, errorCode.GROUP_NOT_ACTIVE);
    });

    it('should throw error code 13 when createShare is called with non-owned group', async function () {
      const call = () => center.createShare('uri', [emptyGroupID], center.DURATION.INDEFINITE, center.ACCESS.WRITE);
      await checkError(call, errorCode.IS_NOT_WRITER);
    });

    it('should throw error code 100 when createShare is called with really long URL', async function () {
      const call = () => center.createShare('www.nucleusHealthReallyLongDeploymentUrl/reallyLongPathToRecordShare', [groupID], 0, center.ACCESS.WRITE);
      await checkError(call, errorCode.INVALID_URI);
    });
  });

  describe('Delete Share', () => {
    it('should throw error code 2 when deleteShare is called from fake user', async function () {
      const call = () => fakeUser.deleteShare(shareID);
      await checkError(call, errorCode.IS_NOT_A_USER);
    });

    it('should throw error code 6 when deleteShare is called on nonexistant share', async function () {
      const call = () => center.deleteShare(fakeID);
      await checkError(call, errorCode.SHARE_DOES_NOT_EXIST);
    });

    it('should throw error code 4 when deleteShare is called from user who doesn\'t own share', async function () {
      const call = () => user2.deleteShare(shareID);
      await checkError(call, errorCode.DOES_NOT_OWN_SHARE);
    });
  });
});

contract('Test Circular Dependencies With Share Groups', function (accounts) {
  let center, user,
    groupMasterID, groupChildID, groupGrandChildID;

  before('setup', async function () {
    center = initCenter(accounts[0]);
    user = initCenter(accounts[1]);

    await center.addSystem(accounts[0]);
    await center.createUser(accounts[0]);
    await center.createUser(accounts[1]);

    groupMasterID = await createGroup(center);
    groupChildID = await createGroup(user);
    groupGrandChildID = await createGroup(user);

    const requestID1 = (await center.createInviteRequest(groupMasterID, groupChildID)).value.requestID;
    const requestID2 = (await user.createInviteRequest(groupChildID, groupGrandChildID)).value.requestID;
    await user.acceptRequest(requestID1);
    await user.acceptRequest(requestID2);
  });

  it('should throw an error when user tries to add a group into itself', async function () {
    const call = () => center.addShareGroup(groupMasterID, groupMasterID);
    await checkError(call, errorCode.CIRCULAR_DEPENDENCY);
  });

  it('should throw an error when user tries to add a group that would create a circular dependency', async function () {
    const call = () => user.addShareGroup(groupGrandChildID, groupMasterID);
    await checkError(call, errorCode.CIRCULAR_DEPENDENCY);
  })
});

contract('Test Blacklist', function (accounts) { // TODO: Check this
  var centerAddress, badUserAddress,
    center, badUser,
    groupID, badGroupID;
  before('setup', async function () {
    centerAddress = accounts[0];
    badUserAddress = accounts[9];
    center = initCenter(centerAddress);
    badUser = initCenter(badUserAddress);

    await center.addSystem(centerAddress);
    await center.createUser(centerAddress);
    await center.createUser(badUserAddress);
  });

  describe('Group', () => {
    beforeEach(async () => {
      groupID = await createGroup(center);
      badGroupID = await createGroup(badUser);
    });

    it('should prevent badGroup from adding center to group', async function () {
      await center.blacklistGroup(groupID, badGroupID); // Permissive: Block a group, can be a personal Group ID CODE REVIEW: Create a wrapper for a permissive blacklist user

      const call = () => badUser.createInviteRequest(badGroupID, groupID);
      await checkError(call, errorCode.BLACKLISTED);
    });

    it('should prevent badUser from adding center to group', async function () {
      await center.blacklistUser(groupID, badUserAddress); // Restrictive: if you blacklist a user, then you also blacklist every group the user is in

      const call = () => badUser.createInviteRequest(badGroupID, groupID);
      await checkError(call, errorCode.BLACKLISTED);
    });
  });

  describe('Share', () => {
    it('should prevent badUser from making a share request', async function () {
      const call = () => badUser.createShareRequest([groupID], 'uri', 0, 2);
      await checkError(call, errorCode.BLACKLISTED);
    })
  })
});