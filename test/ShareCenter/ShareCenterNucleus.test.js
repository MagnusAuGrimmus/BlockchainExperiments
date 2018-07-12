const { initCenter, addShare, createGroup, containsInvite } = require('./TestingUtils');

contract('Test Professional Share', function (accounts) {
  before('setup', async function() {
    await initScenario(this, accounts);
  })

  it('should create a pro share', async function() {
    const shareParams = {
      uri: 'bannerURI',
      time: 0,
      access: initCenter().ACCESS.WRITE
    }

    const groupID = await createProShare(
      this.bannerUser1,
      this.verdadUser1Address,
      this.verdadCardiologists,
      shareParams);

    const userInvites = await this.verdadUser1.getUserInvites();
    const groupInvites = await this.verdad.getSubgroupInvites();
    const targetGroupInvite = { groupID: this.verdadCardiologists, subgroupID: groupID };
    assert(userInvites.includes(groupID), "Verdad User #1 did not receive group invite");
    assert(containsInvite(groupInvites, targetGroupInvite), "Verdad did not receive group invite");
  })

  it("should accept a pro share", async function() {
    const shareParams = {
      uri: 'bannerURI2',
      time: 0,
      access: initCenter().ACCESS.WRITE
    }
    const groupID = await createProShare(
      this.bannerUser1,
      this.verdadUser1Address,
      this.verdadCardiologists,
      shareParams);


    await acceptProShare(this.verdadUser1, this.verdad, groupID, this.verdadCardiologists);
    const userGroups = await this.verdadUser1.getGroupIDs();
    const verdadGroups = await this.verdad.getSubGroups(this.verdadCardiologists);
    assert(userGroups.includes(groupID), "user did not receive share");
    assert(verdadGroups.includes(groupID), "Verdad did not receive share");
  })

  async function createProShare(sender, recipientAddress, orgGroupID, { uri, time, access }) {
    const groupID = await createGroup(sender);
    await sender.addUserToGroup(groupID, recipientAddress);
    await sender.addSubGroup(groupID, orgGroupID);
    await addShare(sender, uri, groupID, time, access);
    return groupID
  }

  async function acceptProShare(user, org, groupID, orgGroupID) {
    return Promise.all([
      org.acceptSubgroup(groupID, orgGroupID),
      user.acceptParentGroup(groupID)
    ]);
  }
})

contract('Test Organizational Share', function (accounts) {
  before('setup', async function() {
    await initScenario(this, accounts);
  })

  it('should create an org share', async function() {
    const shareParams = {
      uri: 'bannerURI',
      time: 0,
      access: initCenter().ACCESS.WRITE
    }

    const groupID = await createOrgShare(
      this.bannerUser1,
      this.verdadCardiologists,
      shareParams);

    const groupInvites = await this.verdad.getSubgroupInvites();
    const targetGroupInvite = { groupID: this.verdadCardiologists, subgroupID: groupID };
    assert(containsInvite(groupInvites, targetGroupInvite), "Verdad did not receive group invite");
  })

  it("should accept an org share", async function() {
    const shareParams = {
      uri: 'bannerURI2',
      time: 0,
      access: initCenter().ACCESS.WRITE
    }
    const groupID = await createOrgShare(
      this.bannerUser1,
      this.verdadCardiologists,
      shareParams);
    await acceptOrgShare(this.verdad, groupID, this.verdadCardiologists);

    const verdadGroups = await this.verdad.getSubGroups(this.verdadCardiologists);
    assert(verdadGroups.includes(groupID), "Verdad did not receive share");
  })

  async function createOrgShare(sender, orgGroupID, { uri, time, access }) {
    const groupID = await createGroup(sender);
    await sender.addSubGroup(groupID, orgGroupID);
    await addShare(sender, uri, groupID, time, access);
    return groupID
  }

  async function acceptOrgShare(org, groupID, orgGroupID) {
    return org.acceptSubgroup(groupID, orgGroupID);
  }
})


async function initScenario(self, accounts) {
  self.bannerUser1Address = accounts[3];
  self.bannerUser2Address = accounts[4];
  self.verdadUser1Address = accounts[5];

  self.center = initCenter(accounts[0]);
  self.banner = initCenter(accounts[1]);
  self.verdad = initCenter(accounts[2]);
  self.bannerUser1 = initCenter(self.bannerUser1Address);
  self.bannerUser2 = initCenter(self.bannerUser2Address);
  self.verdadUser1 = initCenter(self.verdadUser1Address);
  await self.center.addSystem(accounts[0]);
  await self.center.addSystem(accounts[1]);
  await self.center.addSystem(accounts[2]);
  await self.banner.createUser(accounts[1]);
  await self.banner.createUser(accounts[2]);
  await self.banner.createUser(self.bannerUser1Address);
  await self.banner.createUser(self.bannerUser2Address);
  await self.verdad.createUser(self.verdadUser1Address);
  self.bannerRadiologists = await createGroup(self.banner);
  self.verdadCardiologists = await createGroup(self.verdad);
  await self.banner.addUserToGroup(self.bannerRadiologists,self. bannerUser1Address);
  await self.banner.addUserToGroup(self.bannerRadiologists, self.bannerUser2Address);
  await self.verdad.addUserToGroup(self.verdadCardiologists, self.verdadUser1Address);
  await self.bannerUser1.acceptParentGroup(self.bannerRadiologists);
  await self.bannerUser2.acceptParentGroup(self.bannerRadiologists);
  await self.verdadUser1.acceptParentGroup(self.verdadCardiologists);
}