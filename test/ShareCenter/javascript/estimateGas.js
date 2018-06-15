var ShareCenter = artifacts.require("ShareCenter");


contract('Estimate Gas Prices', function(accounts) {
    var instance, groupID, web3, shareID;

    async function estimateGas(func, params) {
        const gas = await func.estimateGas(...params);
        const gasPrice = await web3.eth.gasPrice.toNumber();
        return await web3.fromWei(gas * gasPrice) + " eth";
    }

    async function createShare(host, path, groupID) {
        const data = await instance.createShare(host, path, groupID);
        return data.logs[0].args.id.toNumber();
    }

    async function getPersonalGroupID(addr) {
        const [_, groupID] = await instance.getPersonalGroupID(addr);
        return groupID;
    }

    before('setup', async function() {
        instance = await ShareCenter.new();
        web3 = ShareCenter.web3;
        await instance.addSystem(accounts[0]);
        for(let i = 0; i < 5; i++)
            await instance.createUser(accounts[i]);
        groupID = await getPersonalGroupID(accounts[0]);
        shareID = await createShare('a', 'b', groupID);
        await instance.authorizeWrite(shareID, await getPersonalGroupID(accounts[1]), 0);
        await instance.authorizeRead(shareID, await getPersonalGroupID(accounts[2]), 0);
    })

    it("should log the ether costs of all mutator methods", async function() {
        console.log("Create User: ", await estimateGas(instance.createUser, [accounts[9]]));
        console.log("Create Group", await estimateGas(instance.createGroup, [accounts[0]]));
        console.log("Create Share: ", await estimateGas(instance.createShare, ['hub2.nucleus.io', '/statShare/r7oPSzh8bwbWTAa9P', groupID]));
        console.log("Delete Share: ", await estimateGas(instance.deleteShare, [shareID]));
        console.log("Authorize Write: ", await estimateGas(instance.authorizeWrite, [shareID, await getPersonalGroupID(accounts[3]), 0]));
        console.log("Authorize Read: ", await estimateGas(instance.authorizeRead, [shareID, await getPersonalGroupID(accounts[4]), 0]));
        console.log("Revoke Write", await estimateGas(instance.revokeWrite, [shareID, await getPersonalGroupID(accounts[1])]));
        console.log("Revoke Read", await estimateGas(instance.revokeRead, [shareID, await getPersonalGroupID(accounts[2])]));
    })
})