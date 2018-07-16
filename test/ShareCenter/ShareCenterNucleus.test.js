const {initCenter, addShare, createGroup, containsInvite, checkIfShareIsOwned} = require('./TestingUtils')

contract('Test Professional Share', function (accounts) {
  var groupID, shareID
  before('setup', async function() {
    await initScenario(this, accounts);
  })

  beforeEach('create a pro share', async function () {
    const shareParams = {
      uri: 'bannerURI',
      time: 0,
      access: initCenter().ACCESS.WRITE
    }

    const data = await createProShare(
      this.bannerUser1,
      this.verdadUser1Address,
      this.verdadCardiologists,
      shareParams);
    groupID = data.groupID
    shareID = data.shareID
  })

  it('should show the share in user and org pending', async function () {
    const userInvites = await this.verdadUser1.getUserInvites();
    const groupInvites = await this.verdad.getSubgroupInvites();
    const targetGroupInvite = { groupID: this.verdadCardiologists, subgroupID: groupID };
    assert(userInvites.includes(groupID), "Verdad User #1 did not receive group invite");
    assert(containsInvite(groupInvites, targetGroupInvite), "Verdad did not receive group invite");
  })

  it("should accept a pro share", async function() {
    await acceptProShare(this.verdadUser1, this.verdad, groupID, this.verdadCardiologists);
    const userShares = await this.verdadUser1.getAllShares()
    const verdadGroups = await this.verdad.getSubGroups(this.verdadCardiologists);
    checkIfShareIsOwned(userShares, groupID, shareID)
    assert(verdadGroups.includes(groupID), 'Verdad did not get access to group')
  })

  /**
   * Create a professional share.
   * Gives access to both the specific user and the organization
   * @async
   * @param {ShareCenter} sender ShareCenter instance of the sender
   * @param {string} recipientAddress blockchain address of the recipient
   * @param {number} orgGroupID groupID of the organization
   * @param {Object} shareParams
   * @param {string} shareParams.uri
   * @param {number} shareParams.time duration of the claim
   * @param {number} shareParams.access access privleges of both the user and the organization
   * @returns {number} the groupID where the share exists
   */
  async function createProShare (sender, recipientAddress, orgGroupID, shareParams) {
    const {uri, time, access} = shareParams
    const groupID = await createGroup(sender);
    await sender.addUserToGroup(groupID, recipientAddress);
    await sender.addSubGroup(groupID, orgGroupID);
    const shareID = await addShare(sender, uri, groupID, time, access)
    return {groupID, shareID}
  }

  /**
   * Accept a professional share.
   * Called from the context of the recipient user, but also gives access to the recipient organization on call.
   * @async
   * @param {ShareCenter} user ShareCenter instance of the recipient user
   * @param {ShareCenter} org ShareCenter instance of the recipient organization
   * @param {number} groupID groupID of the share
   * @param {number} orgGroupID organization groupID to give access to
   */
  async function acceptProShare(user, org, groupID, orgGroupID) {
    return Promise.all([
      org.acceptSubgroup(groupID, orgGroupID),
      user.acceptParentGroup(groupID)
    ]);
  }
})

contract('Test Organizational Share', function (accounts) {
  var shareID
  before('setup', async function() {
    await initScenario(this, accounts);
  })

  beforeEach('create an org share', async function () {
    const shareParams = {
      uri: 'bannerURI',
      time: 0,
      access: initCenter().ACCESS.WRITE
    }

    shareID = await createOrgShare(
      this.bannerUser1,
      this.verdadAddress,
      shareParams);
  })

  it('should show up in the pending shares for the personal groupID', async function () {
    const groupID = await this.verdad.getPersonalGroupID()
    const groupInvites = await this.verdad.getShareInvites(groupID)
    assert(groupInvites.includes(shareID), 'Verdad did not receive share invite')
  })

  it("should accept an org share", async function() {
    await acceptOrgShare(this.verdad, shareID)

    const verdadShares = await this.verdad.getAllShares()
    const groupID = await this.verdad.getPersonalGroupID()
    assert(checkIfShareIsOwned(verdadShares, groupID, shareID), 'Verdad did not receive share')
  })

  /**
   * Create an organizational share.
   * Gives access to the organization and all of it's users
   * @async
   * @param {ShareCenter} sender ShareCenter instance of the sender
   * @param {string} orgAddress organization address
   * @param {Object} shareParams
   * @param {string} shareParams.uri study URI
   * @param {number} shareParams.time duration of the claim
   * @param {number} shareParams.access access privleges of both the user and the organization
   * @returns {number} the shareID of the new share
   */
  async function createOrgShare (sender, orgAddress, shareParams) {
    const {uri, time, access} = shareParams
    const groupID = await sender.getPersonalGroupID(orgAddress)
    return addShare(sender, uri, groupID, time, access)
  }

  /**
   * Accept an organizational share.
   * Called from the context of the organization.
   * @async
   * @param {ShareCenter} org ShareCenter instance of the recipient organization
   * @param {number} shareID
   */
  async function acceptOrgShare (org, shareID) {
    const groupID = await org.getPersonalGroupID()
    return org.acceptShare(groupID, shareID)
  }
})


async function initScenario(self, accounts) {
  self.bannerAddress = accounts[1]
  self.verdadAddress = accounts[2]
  self.bannerUser1Address = accounts[3];
  self.bannerUser2Address = accounts[4];
  self.verdadUser1Address = accounts[5];

  //Loading ShareCenter Instances
  self.center = initCenter(accounts[0]);
  self.banner = initCenter(self.bannerAddress)
  self.verdad = initCenter(self.verdadAddress)
  self.bannerUser1 = initCenter(self.bannerUser1Address);
  self.bannerUser2 = initCenter(self.bannerUser2Address);
  self.verdadUser1 = initCenter(self.verdadUser1Address);
  // Adding the systems into the blockchain
  await self.center.addSystem(accounts[0]);
  await self.center.addSystem(accounts[1]);
  await self.center.addSystem(accounts[2]);
  await self.center.createUser(accounts[1])
  await self.center.createUser(accounts[2])
  // Creating blockchain users
  await self.banner.createUser(self.bannerUser1Address);
  await self.banner.createUser(self.bannerUser2Address);
  await self.verdad.createUser(self.verdadUser1Address);
  // Creating groups and group connections
  self.bannerRadiologists = await createGroup(self.banner);
  self.verdadCardiologists = await createGroup(self.verdad);
  await self.banner.addUserToGroup(self.bannerRadiologists,self. bannerUser1Address);
  await self.banner.addUserToGroup(self.bannerRadiologists, self.bannerUser2Address);
  await self.verdad.addUserToGroup(self.verdadCardiologists, self.verdadUser1Address);
  await self.bannerUser1.acceptParentGroup(self.bannerRadiologists);
  await self.bannerUser2.acceptParentGroup(self.bannerRadiologists);
  await self.verdadUser1.acceptParentGroup(self.verdadCardiologists);
}