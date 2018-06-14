const ShareCenter = require('../../../src/shareCenter');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:9545'));
const { checkIfShareExists, getAllShares, createGroup, createShare, checkError } = require('./TestingUtils');

contract('Test Doctor Patient Get All Shares', function (accounts) {
    var center, doctor, patient;
    before('setup', async function () {
        center = new ShareCenter(web3, accounts[0]);
        doctor = new ShareCenter(web3, accounts[4]);
        patient = new ShareCenter(web3, accounts[5]);
        await center.addSystem(accounts[0]);
        await center.createUser(accounts[4]);
        await center.createUser(accounts[5]);
    });

    it('should share a record', async function () {
        const groupID = await createGroup(patient);
        const shareID = await createShare(patient, "PatientURI", groupID);
        await patient.addUserToGroup(groupID, accounts[4]);
        const shares = await getAllShares(doctor);

        checkIfShareExists(shares, groupID, shareID);
    })
});

contract('Test Banner Verdad Case', function (accounts) {
    var center, bannerDoctor, verdadDoctor,
        bannerGroupID, verdadGroupID, shareID;

    before('setup', async function () {
        center = new ShareCenter(web3, accounts[0]);
        bannerDoctor = new ShareCenter(web3, accounts[1]);
        verdadDoctor = new ShareCenter(web3, accounts[2]);
        await center.addSystem(accounts[0]);
        await center.createUser(accounts[1]);
        await center.createUser(accounts[2]);
    });

    it('should create a share and groups', async function () {
        bannerGroupID = await createGroup(bannerDoctor);
        verdadGroupID = await createGroup(verdadDoctor);
        shareID = await createShare(bannerDoctor, "BannerURI", bannerGroupID);
    });

    it('should give Verdad group access to share', async function () {
        await bannerDoctor.addGroupToGroup(bannerGroupID, verdadGroupID);
        const shares = await getAllShares(verdadDoctor);

        checkIfShareExists(shares, bannerGroupID, shareID);
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
        center = new ShareCenter(web3, accounts[0]);
        user = new ShareCenter(web3, accounts[1]);

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
        await checkError(call, 12);
    });

    it('should throw an error when user tries to add a group that would create a circular dependency', async function() {
        var call = () => user.addGroupToGroup(groupGrandChildID, groupMasterID);
        await checkError(call, 12);
    })
});