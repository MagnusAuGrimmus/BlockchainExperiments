const ShareCenter = require('../../../src/shareCenter');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:9545'));
const {createShare, createGroup, checkError} = require('./TestingUtils');

contract('ShareCenter Error Testing', function (accounts) {
    var center, user1, user2, fakeUser,
        centerAddress, user1Address, user2Address, fakeUserAddress,
        shareID, groupID, fakeID, emptyGroupID;
    before('setup', async function () {
        centerAddress = accounts[0];
        user1Address = accounts[1];
        user2Address = accounts[2];
        fakeUserAddress = accounts[9];
        center = new ShareCenter(web3, centerAddress);
        user1 = new ShareCenter(web3, user1Address);
        user2 = new ShareCenter(web3, user2Address);
        fakeUser = new ShareCenter(web3, fakeUserAddress);
        await center.addSystem(centerAddress);
        await center.createUser(centerAddress);
        await center.createUser(user1Address);
        await center.createUser(user2Address);
        groupID = await createGroup(center);
        emptyGroupID = await createGroup(user2);
        fakeID = 123456789;
        await center.addUserToGroup(groupID, user1Address);
        shareID = await createShare(center, "uri", groupID);
    })

    it("should throw error code 0 when addSystem is called from user that isn't the owner", async function () {
        var call = () => user1.addSystem(user1Address)
        await checkError(call, 0);
    })

    it("should throw error code 3 when createUser is called from unregistered system", async function () {
        var call = () => user1.createUser(centerAddress);
        await checkError(call, 3);
    })

    it("should throw error code 1 when createUser is called with existing user", async function () {
        var call = () => center.createUser(centerAddress);
        await checkError(call, 1);
    })

    it("should throw error code 2 when createGroup is called from fake user", async function() {
        var call = () => fakeUser.createGroup();
        await checkError(call, 2);
    })

    it("should throw error code 2 when getGroupIDs is called on fake user", async function() {
        var call = () => fakeUser.getGroupIDs(fakeUserAddress);
        await checkError(call, 2);
    })

    it("should throw error code 7 when getParentGroups is called from fake group", async function() {
        var call = () => center.getParentGroups(fakeID);
        await checkError(call, 7)
    })

    it("should throw error code 7 when getSubGroups is called from fake group", async function() {
        var call = () => center.getSubGroups(fakeID);
        await checkError(call, 7)
    })

    it("should throw error code 9 when addGroupToGroup is called from nonowner", async function() {
        var call = () => user1.addGroupToGroup(groupID, emptyGroupID);
        await checkError(call, 9);
    })

    it("should throw error code 2 when getPersonalGroupID is called on fake user", async function () {
        var call = () => center.getPersonalGroupID(fakeUserAddress);
        await checkError(call, 2);
    })

    it("should throw error code 2 when createShare is called from fake user", async function () {
        var call = () => fakeUser.createShare("uri", groupID);
        await checkError(call, 2);
    })

    it("should throw error code 7 when createShare is called with fake group", async function () {
        var call = () => center.createShare("uri", fakeID);
        await checkError(call, 7);
    })

    it("should throw error code 11 when createShare is called with really long URL", async function() {
        var call = () => center.createShare("www.nucleusHealthReallyLongDeploymentUrl/reallyLongPathToRecordShare", groupID);
        await checkError(call, 11);
    })

    it("should throw error code 2 when deleteShare is called from fake user", async function () {
        var call = () => fakeUser.deleteShare(shareID);
        await checkError(call, 2);
    })

    it("should throw error code 6 when deleteShare is called on nonexistant share", async function () {
        var call = () => center.deleteShare(fakeID);
        await checkError(call, 6);
    })

    it("should throw error code 4 when deleteShare is called from user who doesn't own share", async function () {
        var call = () => user2.deleteShare(1);
        await checkError(call, 4);
    })

    it("should throw error code 2 when authorizeWrite is called from fake user", async function () {
        var call = () => fakeUser.authorizeWrite(shareID, emptyGroupID, 0);
        await checkError(call, 2);
    })

    it("should throw error code 4 when authorizeWrite is called from user who doesn't own share", async function () {
        var call = () => user2.authorizeWrite(shareID, emptyGroupID, 0);
        await checkError(call, 4);
    })

    it("should throw error code 7 when authorizeWrite is called from fake group", async function () {
        var call = () => center.authorizeWrite(shareID, fakeID, 0);
        await checkError(call, 7);
    })

    it("should throw error code 6 when authorizeWrite is called on nonexistant share", async function () {
        var call = () => center.authorizeWrite(fakeID, emptyGroupID, 0);
        await checkError(call, 6);
    })

    it("should throw error code 2 when authorizeRead is called from fake user", async function () {
        var call = () => fakeUser.authorizeRead(shareID, emptyGroupID, 0);
        await checkError(call, 2);
    })

    it("should throw error code 4 when authorizeRead is called from user who doesn't own share", async function () {
        var call = () => user2.authorizeRead(shareID, emptyGroupID, 0);
        await checkError(call, 4);
    })

    it("should throw error code 7 when authorizeRead is called from fake group", async function () {
        var call = () => center.authorizeRead(shareID, fakeID, 0);
        await checkError(call, 7);
    })

    it("should throw error code 6 when authorizeRead is called on nonexistant share", async function () {
        var call = () => center.authorizeRead(fakeID, emptyGroupID, 0);
        await checkError(call, 6);
    })

    it("should throw error code 2 when revokeWrite is called from fake user", async function () {
        var call = () => fakeUser.revokeWrite(shareID, groupID);
        await checkError(call, 2);
    })

    it("should throw error code 4 when revokeWrite is called from user who doesn't own share", async function () {
        var call = () => user2.revokeWrite(shareID, groupID);
        await checkError(call, 4);
    })

    it("should throw error code 6 when revokeRead is called on nonexistant share", async function () {
        var call = () => center.revokeRead(fakeID, groupID);
        await checkError(call, 6);
    })

    it("should throw error code 2 when revokeRead is called from fake user", async function () {
        var call = () => fakeUser.revokeRead(shareID, groupID);
        await checkError(call, 2);
    })

    it("should throw error code 4 when revokeRead is called from user who doesn't own share", async function () {
        var call = () => user2.revokeRead(shareID, groupID);
        await checkError(call, 4);
    })

    it("should throw error code 6 when revokeRead is called on nonexistant share", async function () {
        var call = () => center.revokeRead(fakeID, groupID);
        await checkError(call, 6);
    })
})