var ShareCenter = artifacts.require("ShareCenter");
var Set = artifacts.require("Set");
contract('ShareCenter', function(accounts) {
    var center;
    var set;
    beforeEach('setup', async function() {
        center = await ShareCenter.new();
        set = await Set.new();
        await center.addSystem(accounts[0]);
        await center.addUser(accounts[0], "user");
        await center.addUser(accounts[1], "user");
    })

    // this doesn't work correctly
    // maybe we could try something along these lines:
    //   https://ethereum.stackexchange.com/questions/9103/how-can-you-handle-an-expected-throw-in-a-contract-test-using-truffle-and-ethere
    //it('should not add a user twice', async function() {
    //    assert.equal(false, await center.addUser.call(accounts[0], "Avi"), "Added account twice");
    //})

    it('should throw an exception when adding a user from a unregistered system', async function() {
        try {
            await center.addUser(accounts[0], "Avi", {from : accounts[1]});
        }
        catch (e) {
            return;
        }

        assert(false, "Should have thrown an exception")
    })

    it('should create a share', async function() {
        var data = await center.createShare("uri", {from: accounts[0]});
        var result = await center.getShares.call({from: accounts[0]});
        var idOwn = result[0];
        var uriOwn = result[1];
        var idRead = result[2];
        var uriRead = result[3];
        assert.equal(data.logs[0].event, "ShareCreated");
        assert.equal(idOwn[0].toNumber(), 0);
        assert.equal(web3.toUtf8(uriOwn[0]), "uri");
        assert.equal(idRead.length, 0);
        assert.equal(uriRead.length, 0);
    })

    it('should throw an exception when creating a share from an unregistered system', async function() {
        try {
            await center.createShare("uri", {from: accounts[9]});
        }
        catch(e) {
            return;
        }

        assert(false, "Should have thrown an exception");
    })

    it('should delete a share', async function() {
        await center.createShare("uri", {from: accounts[0]});
        var data = await center.deleteShare(0);
        var result = await center.getShares.call({from: accounts[0]});
        var idOwn = result[0];
        var uriOwn = result[1];
        var idRead = result[2];
        var uriRead = result[3];
        assert.equal(data.logs[0].event, "ShareDeleted");
        assert.equal(idOwn.length, 0);
        assert.equal(uriOwn.length, 0);
        assert.equal(idRead.length, 0);
        assert.equal(uriRead.length, 0);
    })

    it('should throw an exception when deleteShare is called on a non-existent share', async function() {
        await center.createShare("uri", {from: accounts[0]});
        try {
            await center.deleteShare(1, {from: accounts[0]});
        }
        catch (e) {
            return;
        }

        assert(false, "Allowed user to delete nonexistent share");
    })

    it('should throw an exception when deleteShare is called from an unregistered user account', async function() {
        try {
            await center.deleteShare(1, {from: accounts[9]});
        }
        catch (e) {
            return;
        }

        assert(false, "Allowed unregistered user to delete share");
    })

    it("should throw an exception when deleteShare is attempted by a user that doesn't own the share", async function() {
        try {
            await center.deleteShare(1, {from: accounts[1]});
        }
        catch(e) {
            return;
        }

        assert(false, "Allowed user to delete share it doesn't own");
    })

    it('should authorize ownership of a share', async function() {
        await center.createShare("uri", {from: accounts[0]});
        var data = await center.authorizeOwn(0, accounts[1], {from: accounts[0]});
        var result = await center.getShares.call({from: accounts[1]});
        var idOwn = result[0];
        var uriOwn = result[1];
        var idRead = result[2];
        var uriRead = result[3];
        assert.equal(data.logs[0].event, "OwnerAdded");
        assert.equal(idOwn[0].toNumber(), 0);
        assert.equal(web3.toUtf8(uriOwn[0]), "uri");
        assert.equal(idRead.length, 0);
        assert.equal(uriRead.length, 0);
    })

    it('should throw an exception when authorizeOwn is called by an unregistered user', async function() {
        await
        center.createShare("uri", {from: accounts[0]});
        try {
            await center.authorizeOwn(0, accounts[9], {from: accounts[0]});
        }
        catch (e) {
            return;
        }

        assert(false, "authorized unregistered user");
    })

    it('should throw an exception when authorizeOwn is allowed for an unregistered user', async function() {
        try {
            await center.authorizeOwn(0, accounts[1], {from: accounts[9]});
        }
        catch (e) {
            return;
        }

        assert(false, "allowed unregistered user to authorize ownership");
    })

    it('should throw an exception when authorizeOwn is called on a nonexistent share', async function() {
        try {
            await center.authorizeOwn(1, accounts[1], {from: accounts[0]});
        }
        catch (e) {
            return;
        }

        assert(false, "authorized ownership of nonexistent share");
    })

    it("should throw an exception when authorizeOwn is allowed for a share that the user doesn't control", async function() {
        try{
            await center.createShare("uri", {from: accounts[1]});
            await center.authorizeOwn(1, accounts[2], {from: accounts[1]});

        }
        catch(e) {
            return;
        }

        assert(false, "Allowed user to authorize ownership of share it didn't own");
    })

    it('should authorize reading of a share', async function() {
        await center.createShare("uri", {from: accounts[0]});
        var data = await center.authorizeRead(0, accounts[1], {from: accounts[0]});
        var result = await center.getShares.call({from: accounts[1]});
        var idOwn = result[0];
        var uriOwn = result[1];
        var idRead = result[2];
        var uriRead = result[3];
        assert.equal(data.logs[0].event, "ReaderAdded");
        assert.equal(idRead[0].toNumber(), 0);
        assert.equal(web3.toUtf8(uriRead[0]), "uri");
        assert.equal(idOwn.length, 0);
        assert.equal(uriOwn.length, 0);
    })

    it('should throw an exception when authorizeRead is called by an unregistered user', async function() {
        await center.createShare("uri", {from: accounts[0]});
        try {
            await center.authorizeRead(0, accounts[9], {from: accounts[0]});

        }
        catch (e) {
            return;
        }

        assert(false, "authorized unregistered user");
    })

    it('should throw an exception when authorizeRead is allowed by an unregistered user', async function() {
        try {
            await center.authorizeRead(0, accounts[1], {from: accounts[9]});
        }
        catch (e) {
            return;
        }

        assert(false, "allowed unregistered user to authorize ownership");
    })

    it('should throw an exception when authorizeRead is allowed by a user with read access', async function() {
        try {
            var id = await center.createShare("uri", {from: accounts[0]});
            var data = await center.authorizeRead(0, accounts[1], {from: accounts[0]});

            await center.authorizeRead(0, accounts[2], {from: accounts[1]});
        }
        catch (e) {
            return;
        }

        assert(false, "allowed read access user to authorize read to another user");
    })

    it('should throw an exceptions when authorizeRead is called on a nonexistent share', async function() {
        try {
            await center.authorizeRead(1, accounts[1], {from: accounts[0]});
        }
        catch (e) {
            return;
        }

        assert(false, "authorized ownership of nonexistent share");
    })

    it("should throw an exception when authorizeRead allows a user to authorize ownership of share it didn't own", async function() {
        try{
            await center.createShare("uri", {from: accounts[1]});
            await center.authorizeRead(1, accounts[2], {from: accounts[1]});
        }
        catch(e) {
            return;
        }

        assert(false, "Allowed user to authorize ownership of share it didn't own");
    })

    it('should revoke ownership of a share', async function() {
        await center.createShare("uri", {from: accounts[0]});
        await center.authorizeOwn(0, accounts[1], {from: accounts[0]});
        var data = await center.revokeOwn(0, accounts[1], {from: accounts[0]});
        var result = await center.getShares.call({from: accounts[1]});
        var idOwn = result[0];
        var uriOwn = result[1];
        var idRead = result[2];
        var uriRead = result[3];
        assert.equal(data.logs[0].event, "OwnerRevoked");
        assert.equal(idOwn.length, 0);
        assert.equal(uriOwn.length, 0);
        assert.equal(idRead.length, 0);
        assert.equal(uriRead.length, 0);
    })

    it('should throw an exception when revokeOwn is called with an unregistered user', async function() {
        await center.createShare("uri", {from: accounts[0]});
        await center.authorizeOwn(0, accounts[1], {from: accounts[0]});
        try {
            await center.revokeRead(0, accounts[9], {from: accounts[0]});
        }
        catch (e) {
            return;
        }

        assert(false, "Revoked unregistered user");
    })


    it('should throw an exception when revokeOwn is called by an unregistered user', async function() {
        try {
            await center.revokeRead(0, accounts[1], {from: accounts[9]});
        }
        catch (e) {
            return;
        }

        assert(false, "allowed unregistered user to revoke ownership");
    })

    it('should throw an exception when revokeOwn is called on a nonexistent share', async function() {
        try {
            await center.revokeRead(1, accounts[1], {from: accounts[0]});
        }
        catch (e) {
            return;
        }

        assert(false, "Revoked ownership of nonexistent share");
    })

    it('should throw an exception when revokeOwn is called for a share that is not owned by user', async function() {
        try{
            await center.createShare("uri", {from: accounts[1]});
            await center.revokeRead(1, accounts[2], {from: accounts[1]});
        }
        catch(e) {
            return;
        }

        assert(false, "Allowed user to revoke ownership of share it didn't own");
    })

    it('should revoke reading of a share', async function() {
        await center.createShare("uri", {from: accounts[0]});
        await center.authorizeRead(0, accounts[1], {from: accounts[0]});
        var data = await center.revokeRead(0, accounts[1], {from: accounts[0]});
        var result = await center.getShares.call({from: accounts[1]});
        var idOwn = result[0];
        var uriOwn = result[1];
        var idRead = result[2];
        var uriRead = result[3];
        assert.equal(data.logs[0].event, "ReaderRevoked");
        assert.equal(idOwn.length, 0);
        assert.equal(uriOwn.length, 0);
        assert.equal(idRead.length, 0);
        assert.equal(uriRead.length, 0);
    })

    it('should throw an exception when revokeRead is called for an unregistered user', async function() {
        await center.createShare("uri", {from: accounts[0]});
        await center.authorizeRead(0, accounts[1], {from: accounts[0]});
        try {
            await center.revokeRead(0, accounts[9], {from: accounts[0]});
        }
        catch (e) {
            return;
        }

        assert(false, "Revoked unregistered user");
    })

    it('should throw an exception when revokeRead is called for an unregistered user', async function() {
        try {
            await center.revokeRead(0, accounts[1], {from: accounts[9]});
        }
        catch (e) {
            return;
        }

        assert(false, "allowed unregistered user to revoke reading");
    })

    it('should throw an exception when revokeRead is called for a nonexistent share', async function() {
        try {
            await center.revokeRead(1, accounts[1], {from: accounts[0]});
        }
        catch (e) {
            return;
        }

        assert(false, "Revoked reading of nonexistent share");
    })

    it('should throw an exception when revokeRead is called for a share that user does not own', async function() {
        try{
            await center.createShare("uri", {from: accounts[1]});
            await center.revokeRead(1, accounts[2], {from: accounts[1]});
        }
        catch(e) {
            return;
        }

        assert(false, "Allowed user to revoke reading of share it didn't own");
    })

});