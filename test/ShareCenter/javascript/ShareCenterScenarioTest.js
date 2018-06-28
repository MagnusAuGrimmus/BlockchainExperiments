const ShareCenter = require('../../../src/shareCenter');
const { HTTP_PROVIDER } = require('../../config.json');
const { checkIfShareIsOwned, sleep, getAllShares, createGroup, addShare, checkError, getID } = require('./TestingUtils');

contract('Test Doctor Patient Get All Shares', function (accounts) {
    var center, doctor, patient;
    before('setup', async function () {
        center = new ShareCenter(HTTP_PROVIDER, accounts[0], {testingMode: true});
        doctor = new ShareCenter(HTTP_PROVIDER, accounts[4], {testingMode: true});
        patient = new ShareCenter(HTTP_PROVIDER, accounts[5], {testingMode: true});
        await center.addSystem(accounts[0]);
        await center.createUser(accounts[4]);
        await center.createUser(accounts[5]);
    });

    it('should share a record', async function () {
        const groupID = await createGroup(patient);
        const shareID = await addShare(patient, "PatientURI", groupID);
        await patient.addUserToGroup(groupID, accounts[4]);
        const shares = await getAllShares(doctor);

        checkIfShareIsOwned(shares, groupID, shareID);
    })
});

contract('Test Banner Verdad Case', function (accounts) {
    var center, bannerDoctor, verdadDoctor,
        bannerGroupID, verdadGroupID, shareID;

    before('setup', async function () {
        center = new ShareCenter(HTTP_PROVIDER, accounts[0], {testingMode: true});
        bannerDoctor = new ShareCenter(HTTP_PROVIDER, accounts[1], {testingMode: true});
        verdadDoctor = new ShareCenter(HTTP_PROVIDER, accounts[2], {testingMode: true});
        await center.addSystem(accounts[0]);
        await center.createUser(accounts[1]);
        await center.createUser(accounts[2]);
    });

    it('should create a share and groups', async function () {
        bannerGroupID = await createGroup(bannerDoctor);
        verdadGroupID = await createGroup(verdadDoctor);
        shareID = await addShare(bannerDoctor, "BannerURI", bannerGroupID);
    });

    it('should give Verdad group access to share', async function () {
        await bannerDoctor.addGroupToGroup(bannerGroupID, verdadGroupID);
        const shares = await getAllShares(verdadDoctor);

        checkIfShareIsOwned(shares, bannerGroupID, shareID);
    });

    it('should remove Verdad group access to share', async function () {
        await bannerDoctor.removeGroupFromGroup(bannerGroupID, verdadGroupID);
        const shares = await getAllShares(verdadDoctor);

        assert.equal(shares[bannerGroupID], undefined);
    })
});

contract('Test Circular Dependencies', function (accounts) {
    var center, user,
        groupMasterID, groupChildID, groupGrandChildID;

    before('setup', async function() {
        center = new ShareCenter(HTTP_PROVIDER, accounts[0], {testingMode: true});
        user = new ShareCenter(HTTP_PROVIDER, accounts[1], {testingMode: true});

        await center.addSystem(accounts[0]);
        await center.createUser(accounts[0]);
        await center.createUser(accounts[1]);

        groupMasterID = await createGroup(center);
        groupChildID = await createGroup(user);
        groupGrandChildID = await createGroup(user);

        await center.addGroupToGroup(groupMasterID, groupChildID);
        await user.addGroupToGroup(groupChildID, groupGrandChildID);
    });

    it('should throw an error when user tries to add a group into itself', async function() {
        var call = () => center.addGroupToGroup(groupMasterID, groupMasterID);
        await checkError(call, 101);
    });

    it('should throw an error when user tries to add a group that would create a circular dependency', async function() {
        var call = () => user.addGroupToGroup(groupGrandChildID, groupMasterID);
        await checkError(call, 101);
    })
});

contract('Test multiple ShareCenter Instances', function (accounts) {
    var center1, center2;

    async function getContractAddress(center) {
        const instance = await center.getInstance();
        return instance.address;
    }

    it('should instantiate both centers', async function() {
        center1 = new ShareCenter(HTTP_PROVIDER, accounts[0], {testingMode: true});
        const contractAddress = await getContractAddress(center1);
        center2 = new ShareCenter(HTTP_PROVIDER, accounts[0], { contractAddress });
        await center1.addSystem(accounts[0]);
        await center1.createUser(accounts[0]);
    })

    it('should test the second center', async function() {
        await createGroup(center2);
        await center2.getPersonalGroupID();
    })
})

contract('Test Get Shares with multiple shares', function (accounts) {
    var center, user, accountIndex,
      groupID, centerGroupID;
    const URI = "URI";
    before('setup', async function() {
        accountIndex = 0;
        center = new ShareCenter(HTTP_PROVIDER, accounts[0], {testingMode: true});
        await center.addSystem(accounts[0]);
        await center.createUser(accounts[0]);
        centerGroupID = await getID(center);
    })

    beforeEach('setup test case', async function() {
        user = new ShareCenter(HTTP_PROVIDER, accounts[++accountIndex], {testingMode: true});
        await center.createUser(accounts[accountIndex]);
        groupID = await createGroup(user);
    })

  /**
   * Adds a number of shares
   * @param {number} numShares the number of shares to add
   * @returns {Array} the shareIDs of all the shares added
   */
    async function addShares(numShares) {
        let shares = [...Array(numShares)].map(() => addShare(user, URI, groupID));
        return await Promise.all(shares);
    }

    function checkIfSharesAreOwned(shares, shareIDs) {
        return shareIDs.every(shareID => checkIfShareIsOwned(shares, groupID, shareID));
    }

    it('should add a bunch of shares', async function() {
        let shareIDs = await addShares(5);
        let shares = await getAllShares(user);
        checkIfSharesAreOwned(shares, shareIDs);
    })

    it('should remove deleted shares', async function() {
        let shareIDs = await addShares(5);
        await Promise.all(shareIDs.slice(0, 2).map(shareID => user.deleteShare(shareID)));

        let shares = await getAllShares(user);
        checkIfSharesAreOwned(shares, shareIDs.slice(2));
        shareIDs.slice(0, 2).forEach(async (shareID) => await checkError(() => checkIfShareIsOwned(shares, groupID, shareID)));
    })
});

contract('It should test the time limit of authorize claims', function(accounts) {
    var center, user,
      centerGroupID, userGroupID, shareID;

    before('setup', async function() {
        center = new ShareCenter(HTTP_PROVIDER, accounts[0], { testingMode: true });
        user = new ShareCenter(HTTP_PROVIDER, accounts[1], {testingMode: true});
        await center.addSystem(accounts[0]);
        await center.createUser(accounts[0]);
        await center.createUser(accounts[1]);
        centerGroupID = await getID(center);
        userGroupID = await getID(user);
        shareID = await addShare(center, "uri", centerGroupID);
    })

    it('should give write privileges for only 1 second', async function() {
        await center.authorizeWrite(shareID, userGroupID, 1);

        let shares = await getAllShares(user);
        checkIfShareIsOwned(shares, userGroupID, shareID);
        await sleep(2000);
        shares = await getAllShares(user);
        await checkError(() => checkIfShareIsOwned(shares, userGroupID, shareID));
    })
})

contract('It should test interactions with 2 systems', function(accounts) {
    it('should add users from both systems', async function() {
        const center = new ShareCenter(HTTP_PROVIDER, accounts[0], {testingMode: true});
        await center.addSystem(accounts[1]);
        await center.addSystem(accounts[2]);
        const system1 = new ShareCenter(HTTP_PROVIDER, accounts[1], {testingMode: true});
        const system2 = new ShareCenter(HTTP_PROVIDER, accounts[2], {testingMode: true});
        await system1.createUser(accounts[3]);
        await system2.createUser(accounts[4]);
    })
})