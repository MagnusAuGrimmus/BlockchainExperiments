const ShareCenter = require('../../../src/shareCenter')
const {initCenter, addShare, checkIfShareIsOwned, createGroup} = require('./TestingUtils')

contract('Test System Added', function (accounts) {
	var center
	it('should add a system', async function () {
		center = initCenter(accounts[0])
		await center.addSystem(accounts[0])
		assert(await center.isAddedSystem(accounts[0]))
		assert(!(await center.isAddedSystem(accounts[1])))
	})
})

contract('Test Get Users', function (accounts) {
	var center, user;
	it('should get the users', async function () {
		center = initCenter(accounts[0])
		user = initCenter(accounts[1]);
		await center.addSystem(accounts[0])
		await center.createUser(accounts[0])
		await center.createUser(accounts[1])
		await user.whitelist(accounts[0]);
		const groupID = await createGroup(center)
		await center.addUserToGroup(groupID, accounts[1])
		const users = await center.getUsers(groupID)
		assert(users.includes(accounts[0]), "user1 not in group");
		assert(users.includes(accounts[1]), "user2 not in group");
	})
})

contract('Test Create Share', function (accounts) {
	var center
	before('setup', async function () {
		center = initCenter(accounts[0])
		await center.addSystem(accounts[0])
		await center.createUser(accounts[0])
		await center.createUser(accounts[1])
	})

	it('should add a share', async function () {
		var groupID = await createGroup(center)
		var data = await center.addShare('nucleushealth.com/abc123', groupID, 0, center.ACCESS.WRITE)
		var shares = (await center.getAllShares())[groupID]
		assert.equal(data.logs[0].event, 'ShareAdded', 'Incorrect event triggered');
		assert.equal(shares[0].id, data.value.shareID, "Share ID not correct");
		assert.equal(shares[0].uri, 'nucleushealth.com/abc123', "Share URI not correct");
	})
})

contract('Test Delete Share', function (accounts) {
	var center
	before('setup', async function () {
		center = initCenter(accounts[0])
		await center.addSystem(accounts[0])
		await center.createUser(accounts[0])
		await center.createUser(accounts[1])
	})

	it('should delete a share', async function () {
		var groupID = await createGroup(center)
		var shareID = await addShare(center, 'nucleushealth.com/abc123', groupID);
		var data = await center.deleteShare(shareID)
		var shares = (await center.getAllShares())[groupID];
		assert.equal(data.logs[0].event, 'ShareDeleted', "Incorrect event triggered");
		assert(!shares.includes(shareID), "Share still active")
	})
})

contract('Test Family Get All Shares', function (accounts) {
	var center,
		grandfather, mother, son,
		grandfatherID, motherID, sonID,
		share1ID, share2ID, share3ID
	it('setup', async function () {
		center = initCenter(accounts[0])
		grandfather = initCenter(accounts[1])
		mother = initCenter(accounts[2])
		son = initCenter(accounts[3])
		await center.addSystem(accounts[0])
		await center.createUser(accounts[1])
		await center.createUser(accounts[2])
		await center.createUser(accounts[3])
		grandfatherID = await createGroup(grandfather)
		motherID = await createGroup(mother)
		sonID = await createGroup(son)
		await createScenario()
	})

	async function createScenario () {
		share1ID = await addShare(grandfather, 'grandfatherURI', grandfatherID)
		share2ID = await addShare(mother, 'motherURI', motherID)
		share3ID = await addShare(son, 'sonURI', sonID)
		await grandfather.addGroupToGroup(grandfatherID, motherID)
		await grandfather.addGroupToGroup(grandfatherID, sonID)
		await mother.addGroupToGroup(motherID, sonID)
	}

	it('should get all shares for grandfather', async function () {
		var shares = await grandfather.getAllShares();
		checkIfShareIsOwned(shares, grandfatherID, share1ID)
	})

	it('should get all shares for mother', async function () {
		var shares = await mother.getAllShares();
		checkIfShareIsOwned(shares, grandfatherID, share1ID)
		checkIfShareIsOwned(shares, motherID, share2ID)
	})

	it('should get all shares for son', async function () {
		var shares = await son.getAllShares();
		checkIfShareIsOwned(shares, grandfatherID, share1ID)
		checkIfShareIsOwned(shares, motherID, share2ID)
		checkIfShareIsOwned(shares, sonID, share3ID)
	})
})