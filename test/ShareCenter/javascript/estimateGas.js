var ShareCenter = artifacts.require("ShareCenter");
const { initCenter, addShare, createGroup } = require('./TestingUtils');

contract('Estimate Gas Prices', function(accounts) {
    var instance, groupID, web3, shareID;

    async function estimateGas(func, params) {
        const gas = await func.estimateGas(...params);
        const gasPrice = await web3.eth.gasPrice.toNumber();
        const eth = await web3.fromWei(gas * gasPrice);
        return `${gas} gas, ${eth} eth`;
    }

    before('setup', async function() {
        const center = initCenter(accounts[0]);
        instance = await center.getInstance();
        web3 = center.web3;
        await instance.addSystem(accounts[0]);
        for(let i = 0; i < 5; i++)
            await instance.createUser(accounts[i]);
        groupID = await createGroup(center);
        shareID = await addShare(center, "uri", groupID);
    })

    it("should log the ether costs of all mutator methods", async function() {
        console.log("Create User: ", await estimateGas(instance.createUser, [accounts[9]]));
        console.log("Create Group", await estimateGas(instance.createGroup, []));
        console.log("Create Share: ", await estimateGas(instance.addShare, ['hub2.nucleus.io', '/statShare/r7oPSzh8bwbWTAa9P', groupID, 0, 2]));
        console.log("Delete Share: ", await estimateGas(instance.deleteShare, [shareID]));
    })
})