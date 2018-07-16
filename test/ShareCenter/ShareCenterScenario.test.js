const ShareCenter = require('../../src/shareCenter')
const {HTTP_PROVIDER} = require('../config.json')
const {initCenter, checkIfShareIsOwned, sleep, createGroup, addShare, checkError} = require('./TestingUtils')

contract('Test Doctor Patient Get All Shares', function (accounts) {
  var centerAddress, doctorAddress, patientAddress,
    center, doctor, patient
  before('setup', async function () {
    centerAddress = accounts[0]
    doctorAddress = accounts[4]
    patientAddress = accounts[5]

    center = initCenter(centerAddress)
    doctor = initCenter(doctorAddress)
    patient = initCenter(patientAddress)
    await center.addSystem(centerAddress)
    await center.createUser(doctorAddress)
    await center.createUser(patientAddress)
  })

  it('should share a record', async function () {
    // Sharing method: create a group, add the user to the group, add the share to the group
    const groupID = await createGroup(patient)
    const shareID = await addShare(patient, 'PatientURI', groupID)
    await patient.addUserToGroup(groupID, doctorAddress)
    await doctor.acceptParentGroup(groupID)
    const shares = await doctor.getAllShares();

    checkIfShareIsOwned(shares, groupID, shareID)
  })
})

contract('Test Banner Verdad Case', function (accounts) {
  var center, bannerDoctor, verdadDoctor,
    bannerGroupID, verdadGroupID, shareID

  before('setup', async function () {
    center = initCenter(accounts[0])
    bannerDoctor = initCenter(accounts[1])
    verdadDoctor = initCenter(accounts[2])
    await center.addSystem(accounts[0])
    await center.createUser(accounts[1])
    await center.createUser(accounts[2])

    bannerGroupID = await createGroup(bannerDoctor)
    verdadGroupID = await createGroup(verdadDoctor)
    shareID = await addShare(bannerDoctor, 'BannerURI', bannerGroupID)
  })

  it('should give Verdad group access to share', async function () {
    await bannerDoctor.addGroupToGroup(bannerGroupID, verdadGroupID);
    await verdadDoctor.acceptParentGroup(bannerGroupID, verdadGroupID);
    const shares = await verdadDoctor.getAllShares();

    checkIfShareIsOwned(shares, bannerGroupID, shareID)
  })

  it('should remove Verdad group access to share', async function () {
    await bannerDoctor.removeGroupFromGroup(bannerGroupID, verdadGroupID)
    const shares = await verdadDoctor.getAllShares()

    assert(!shares[bannerGroupID], 'Verdad still has access to the share after they were removed')
  })
})

contract('Test multiple ShareCenter Instances', function (accounts) {
  var center1, center2

  async function getContractAddress (center) {
    const instance = await center.getInstance()
    return instance.address
  }

  it('should instantiate both centers', async function () {
    center1 = initCenter(accounts[0])
    const contractAddress = await getContractAddress(center1)
    center2 = new ShareCenter(HTTP_PROVIDER, accounts[0], {contractAddress})
    await center1.addSystem(accounts[0])
    await center1.createUser(accounts[0])
  })

  it('should test the second center', async function () {
    // Testing to see if center2 throws up any errors
    await createGroup(center2)
  })
})

contract('Test Get Shares with multiple shares', function (accounts) {
  var center, user, accountIndex,
    groupID, centerGroupID
  const URI = 'URI'
  before('setup', async function () {
    accountIndex = 0
    center = initCenter(accounts[0])
    await center.addSystem(accounts[0])
    await center.createUser(accounts[0])
    centerGroupID = await createGroup(center)
  })

  beforeEach('setup test case', async function () {
    // Instantiate a new user every test case
    user = new ShareCenter(HTTP_PROVIDER, accounts[++accountIndex], {testingMode: true})
    await center.createUser(accounts[accountIndex])
    groupID = await createGroup(user)
  })

  /**
   * Adds a number of shares
   * @param {number} numShares the number of shares to add
   * @returns {Array} the shareIDs of all the shares added
   */
  async function addShares (numShares) {
    let shares = [...Array(numShares)].map(() => addShare(user, URI, groupID))
    return await Promise.all(shares)
  }

  function checkIfSharesAreOwned (shares, shareIDs) {
    return shareIDs.every(shareID => checkIfShareIsOwned(shares, groupID, shareID))
  }

  it('should add a bunch of shares', async function () {
    let shareIDs = await addShares(5)
    let shares = await user.getAllShares()
    checkIfSharesAreOwned(shares, shareIDs)
  })

  /**
   * Remove a some shares and check that the user can't access them
   * but can still access the other shares
   */
  it('should remove deleted shares', async function () {
    let shareIDs = await addShares(5)
    await Promise.all(shareIDs.slice(0, 2).map(shareID => user.deleteShare(shareID)))

    let shares = await user.getAllShares()
    checkIfSharesAreOwned(shares, shareIDs.slice(2))
    shareIDs.slice(0, 2).forEach(async (shareID) => {
      return await checkError(() => {
        return checkIfShareIsOwned(shares, groupID, shareID)
      })
    })
  })
})

contract('It should test the time limit of authorize claims', function (accounts) {
  var centerAddress, userAddress,
    center, user,
    groupID

  before('setup', async function () {
    centerAddress = accounts[0]
    userAddress = accounts[1]
    center = initCenter(centerAddress)
    user = initCenter(userAddress)
    await center.addSystem(centerAddress)
    await center.createUser(centerAddress)
    await center.createUser(userAddress)
    groupID = await createGroup(center)
    await center.addUserToGroup(groupID, userAddress)
    await user.acceptParentGroup(groupID)
  })

  it('should give write privileges for only 1 second', async function () {
    const shareID = await addShare(center, 'uri', groupID, 1) //Set the claim to one second

    let shares = await user.getAllShares()
    checkIfShareIsOwned(shares, groupID, shareID)
    await sleep(2000) // Waiting for more than 1 second just to be absolutely sure
    shares = await user.getAllShares()
    await checkError(() => checkIfShareIsOwned(shares, groupID, shareID)) //Check if the user no longer has shares
  })
})

contract('It should test interactions with 2 systems', function (accounts) {
  it('should add users from both systems', async function () {
    const center = initCenter(accounts[0])
    await center.addSystem(accounts[1])
    await center.addSystem(accounts[2])
    const system1 = initCenter(accounts[1])
    const system2 = initCenter(accounts[2])
    await system1.createUser(accounts[3])
    await system2.createUser(accounts[4])
  })
})