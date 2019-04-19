const { initCenter, addUserToGroup, createGroup, checkIfShareIsOwned } = require('./TestingUtils');

contract('Test Professional Share', function (accounts) {
  let requestID;
  before('setup', async function() {
    await initScenario(this, accounts);
  });

  beforeEach('create a pro share', async function () {
    const shareParams = {
      uri: 'bannerURI',
      time: 0,
      access: initCenter().ACCESS.WRITE
    };

    requestID = await createProShare(
      this.bannerUser1,
      this.verdadUser1Address,
      this.verdadCardiologists,
      shareParams);
  });

  it('should accept a pro share', async function () {
    const [orgShareID, userShareID] = await acceptProShare(this.verdad, this.verdadUser1, requestID);
    assert(orgShareID === userShareID);

    const userShares = await this.verdadUser1.getAllShares();
    const verdadShares = await this.verdad.getAllShares();
    checkIfShareIsOwned(userShares, await this.verdadUser1.getPersonalGroupID(), userShareID);
    checkIfShareIsOwned(verdadShares, this.verdadCardiologists, orgShareID);
  });

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
   * @param {number} shareParams.access access privileges of both the user and the organization
   * @returns {number} the groupID where the share exists
   */
  async function createProShare (sender, recipientAddress, orgGroupID, shareParams) {
    const { uri, time, access } = shareParams;
    const userPersonalGroupID = await sender.getPersonalGroupID(recipientAddress);
    const groupIDs = [userPersonalGroupID, orgGroupID];
    return sender.createShareRequest(groupIDs, uri, time, access)
      .then(({ value }) => value.requestID);
  }

  async function acceptProShare(org, user, requestID) {
    return Promise.all([org, user].map(center => {
      return center.acceptShareRequest(requestID)
        .then(({ value }) => value.shareIDs[0]);
    }))
  }
});

contract('Test Organizational Share', function (accounts) {
  let requestID;
  before('setup', async function() {
    await initScenario(this, accounts);
  });

  beforeEach('create an org share', async function () {
    const shareParams = {
      uri: 'bannerURI',
      time: 0,
      access: initCenter().ACCESS.WRITE
    };

    requestID = await createOrgShare(
      this.bannerUser1,
      this.verdadAddress,
      shareParams);
  });

  it('should create an org share', async function () {
    const shareID = await acceptOrgShare(this.verdad, requestID);

    const verdadShares = await this.verdad.getAllShares();
    const groupID = await this.verdad.getPersonalGroupID();
    assert(checkIfShareIsOwned(verdadShares, groupID, shareID), 'Verdad did not receive share')
  });

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
    const { uri, time, access } = shareParams;
    const groupID = await sender.getPersonalGroupID(orgAddress);
    return sender.createShareRequest([groupID], uri, time, access)
      .then(({ value }) => value.requestID);
  }

  function acceptOrgShare(org, requestID) {
    return org.acceptShareRequest(requestID)
      .then(({ value }) => value.shareIDs[0]);
  }
});


async function initScenario(self, accounts) {
  self.bannerAddress = accounts[1];
  self.verdadAddress = accounts[2];
  self.bannerUser1Address = accounts[3];
  self.bannerUser2Address = accounts[4];
  self.verdadUser1Address = accounts[5];

  //Loading ShareCenter Instances
  self.center = initCenter(accounts[0]);
  self.banner = initCenter(self.bannerAddress);
  self.verdad = initCenter(self.verdadAddress);
  self.bannerUser1 = initCenter(self.bannerUser1Address);
  self.bannerUser2 = initCenter(self.bannerUser2Address);
  self.verdadUser1 = initCenter(self.verdadUser1Address);
  // Adding the systems into the blockchain
  await self.center.addSystem(accounts[0]);
  await self.center.addSystem(accounts[1]);
  await self.center.addSystem(accounts[2]);
  await self.center.createUser(accounts[1]);
  await self.center.createUser(accounts[2]);
  // Creating blockchain users
  await self.banner.createUser(self.bannerUser1Address);
  await self.banner.createUser(self.bannerUser2Address);
  await self.verdad.createUser(self.verdadUser1Address);
  // Creating groups and group connections
  self.bannerRadiologists = await createGroup(self.banner);
  self.verdadCardiologists = await createGroup(self.verdad);
  await addUserToGroup(self.banner, self.bannerRadiologists, self.bannerUser1);
  await addUserToGroup(self.banner, self.bannerRadiologists, self.bannerUser2);
  await addUserToGroup(self.verdad, self.verdadCardiologists, self.verdadUser1);
}