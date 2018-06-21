const contract = require('truffle-contract')
const Web3 = require('web3')
const url = require('url')
const ShareCenterArtifact = require('../build/contracts/ShareCenter')
const CONTRACT_ADDRESS = undefined // Waiting for deployment of contract to ethnet
const GAS_DEFAULT = 4712388

const errorCode = {
  // Ethereum Errors passed through from ShareCenter.sol contract
  IS_NOT_OWNER: 0,
  USER_ALREADY_EXISTS: 1,
  IS_NOT_A_USER: 2,
  IS_NOT_A_REGISTERED_SYSTEM: 3,
  DOES_NOT_OWN_SHARE: 4,
  DOES_NOT_HAVE_SHARE: 5,
  SHARE_DOES_NOT_EXIST: 6,
  GROUP_NOT_ACTIVE: 7,
  NOT_IN_GROUP: 8,
  NOT_OWNER_OF_GROUP: 9,
  IN_GROUP: 10,

  // ShareCenter.js module specific errors
  INVALID_URI: 100,
  CIRCULAR_DEPENDENCY: 101,
  NONNEGATIVE_TIME: 102,

  //Node errors passed through from web3/truffle packages
  INVALID_JSON_RESPONSE: 200,
  CONNECTION_ERROR: 201,
  PROVIDER_NOT_SET: 202,
  CONNECTION_TIMEOUT: 203
}


const errorMessages = {
  // Ethereum Errors passed through from ShareCenter.sol contract
  [errorCode.IS_NOT_OWNER]: 'Owner does not exist',
  [errorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [errorCode.IS_NOT_A_USER]: 'User does not exist',
  [errorCode.IS_NOT_A_REGISTERED_SYSTEM]: 'Caller is not a Registered System',
  [errorCode.DOES_NOT_OWN_SHARE]: 'Caller does not own share',
  [errorCode.DOES_NOT_HAVE_SHARE]: 'Caller does not have share',
  [errorCode.SHARE_DOES_NOT_EXIST]: 'Share does not exist',
  [errorCode.GROUP_NOT_ACTIVE]: 'Group is not active',
  [errorCode.NOT_IN_GROUP]: 'User is not in group',
  [errorCode.NOT_OWNER_OF_GROUP]: 'User is not owner of group',
  [errorCode.IN_GROUP]: 'User or Group is already in group',

  // ShareCenter.js module specific errors
  [errorCode.INVALID_URI]: 'Invalid length URI',
  [errorCode.CIRCULAR_DEPENDENCY]: 'Circular Dependency: Cannot add Group',
  [errorCode.NONNEGATIVE_TIME]: 'Time must be nonnegative',

  //Node errors passed through from web3/truffle packages
  [errorCode.INVALID_JSON_RESPONSE]: "Node threw an invalid JSON Response. Check to see if your node is running",
  [errorCode.CONNECTION_ERROR]: "Cannot connect to node. Check to see if your node is running",
  [errorCode.PROVIDER_NOT_SET]: "Invalid Provider. Check the http provider used to initialze object",
  [errorCode.CONNECTION_TIMEOUT]: "Connection timeout. Check to see if your node is running"

}

const nodeErrorKeywords = {
  "Invalid JSON RPC response": errorCode.INVALID_JSON_RESPONSE,
  "CONNECTION ERROR": errorCode.CONNECTION_ERROR,
  "Provider not set": errorCode.PROVIDER_NOT_SET,
  "CONNECTION TIMEOUT": errorCode.CONNECTION_ERROR,
}

/**
 * ShareCenter API
 * @class For a given web session, construct a ShareCenter object for each user bound to the web session.
 */
class ShareCenter {
  /**
   * @constructor
   *
   * @param {Object} httpProvider Location of web3 instance
   * @param {String} userAddress Blockchain Address of the user
   * @param {Object} [options] Options for configuring the ShareCenter contract
   * @param {number} [options.gas=4712388] Maximum amount of gas a contract method can use
   * @param {number} [options.gasPrice] Maximum amount of wei that can be spent on gas
   * @param {boolean} [options.testingMode=false] Deploys new contract if testingMode is true. Do not use testingMode = true in production!
   * @param {String} [options.contractAddress] optional address to load contract from. Should not be used for production, only for specific test scenarios.
   */
  constructor (httpProvider, userAddress, options = {}) {
    this.sender = userAddress
    this.web3 = new Web3(new Web3.providers.HttpProvider(httpProvider))
    const contractOptions = {
      from: userAddress,
      gas: options.gas || GAS_DEFAULT,
      gasPrice: options.gasPrice
    }
    this.contract = contract(ShareCenterArtifact)
    this.contract.setProvider(this.web3.currentProvider)
    this.contract.defaults(contractOptions)
    if (options.testingMode)
      this.getInstance = () => this.contract.deployed()
    else
      this.getInstance = () => {
        return new Promise((resolve, reject) => {
          this.contract.at(options.contractAddress || CONTRACT_ADDRESS)
            .then(instance => resolve(instance))
            .catch(err => reject(handleNodeErrors(err)));
        });
      }
  }

  /**
   * A system that's going to operate ShareCenter on behalf of the users must be registered beforehand. This must be called before users can be added to the contract.
   * In production, this function cannot be called by anyone besides NucleusHealth. May be used for testing purposes.
   * @param {String} addr Blockchain Address of the system to add
   * @returns {{logs: Array}}
   * @throws Caller must be the owner of the contract
   */
  async addSystem (addr) {
    const instance = await this.getInstance()
    var result = await instance.addSystem(addr)
    handleErrors(result)
    return {logs: result.logs}
  }

  /**
   * Retrieves the groupID of a user's personal group.
   * @param {String} [addr=userAddress] Blockchain Address of the user
   * @returns {{value: number}} the personal groupID
   * @throws User must exist
   */
  async getPersonalGroupID (addr = this.sender) {
    const instance = await this.getInstance()
    var [found, groupID] = await instance.getPersonalGroupID.call(addr)
    if (found)
      return {value: groupID.toNumber()}
    else
      throw {value: formatError(errorCode.IS_NOT_A_USER)}
  }

  /**
   * Creates a user in the context of the system that's calling the method.
   * @param {String} addr Blockchain Address of the user
   *
   * @returns {{logs: Array}}
   *
   * @throws Caller must be a registered system
   * @throws User must not exist
   */
  async createUser (addr) {
    const instance = await this.getInstance()
    const result = await instance.createUser(addr)
    handleErrors(result)
    return {logs: result.logs}
  }

  /**
   * Retrieve the groupIDs of a user.
   * @param {String} addr Blockchain Address of the user
   *
   * @returns {{value: Array}} Array of groupIDs
   *
   * @throws User must exist
   */
  async getGroupIDs (addr) {
    const instance = await this.getInstance()
    const [found, result] = await instance.getGroupIDs.call(addr)
    if (found) {
      var groupIDs = result.map(id => id.toNumber())
      return {value: groupIDs}
    }
    else
      throw {value: formatError(errorCode.IS_NOT_A_USER)}
  }

  /**
   * Create a new group in the context of the user indicated in the constructor.
   *
   * @returns {{value: number, logs: Array}} the groupID of the new group
   *
   * @throws Caller must be a registered system
   */
  async createGroup () {
    const addr = this.sender
    const instance = await this.getInstance()
    var result = await instance.createGroup(addr)
    handleErrors(result)
    var groupID = result.logs.find(log => log.event === 'GroupCreated').args.id.toNumber()
    return {value: {groupID}, logs: result.logs}
  }

  /**
   * Retrieve the parent groups of a group.
   * @param {number} groupID
   * @returns {{value: Array}} Array of parent groups
   *
   * @throws groupID must be registered
   */
  async getParentGroups (groupID) {
    const instance = await this.getInstance()
    const [found, result] = await instance.getParentGroups.call(groupID)
    if (found) {
      const parents = result.map(id => id.toNumber())
      return {value: parents}
    }
    else
      throw {value: formatError(errorCode.GROUP_NOT_ACTIVE)}
  }

  /**
   * Retrieve the subgroups of a group
   * @param {number} groupID
   * @returns {{value: Array}} Array of subgroups
   *
   * @throws groupID must be registered
   */
  async getSubGroups (groupID) {
    const instance = await this.getInstance()
    const [found, result] = await instance.getSubGroups.call(groupID)
    if (found) {
      const subGroups = result.map(id => id.toNumber())
      return {value: subGroups}
    }
    else {
      throw {value: formatError(errorCode.GROUP_NOT_ACTIVE)}
    }
  }

  /**
   * Add a subgroup to a group. groupID and subgroupID must be created beforehand via createGroup
   * @param {number} groupID
   * @param {number} subgroupID
   *
   * @returns {{logs: Array}} Logs in the logs key
   *
   * @throws both groupIDs must be registered
   * @throws caller must be the owner of the group
   * @throws Addition of subgroup must not cause a circular dependency
   */
  async addGroupToGroup (groupID, subgroupID) {
    let canAdd = await this._canAddGroupToGroup(groupID, subgroupID)
    if (canAdd) {
      const instance = await this.getInstance()
      var result = await instance.addGroupToGroup(groupID, subgroupID)
      handleErrors(result)
      return {logs: result.logs}
    }
    else {
      throw {value: formatError(errorCode.CIRCULAR_DEPENDENCY)}
    }
  }

  /**
   * Remove a subgroup from a group.
   * @param {number} groupID
   * @param {number} subgroupID
   *
   * @returns {{logs: Array}} Logs in the logs key
   *
   * @throws both groupIDs must be registered
   * @throws caller must be the owner of the group
   */
  async removeGroupFromGroup (groupID, subgroupID) {
    const instance = await this.getInstance()
    var result = await instance.removeGroupFromGroup(groupID, subgroupID)
    handleErrors(result)
    return {logs: result.logs}
  }

  /**
   * Add a user to a group.
   * @param {number} groupID
   * @param {String} addr Blockchain Address of the user to add
   * @returns {{logs: Array}}
   *
   * @throws groupID must be registered
   * @throws user address must be registered
   * @throws caller must be the owner of the group
   */
  async addUserToGroup (groupID, addr) {
    const instance = await this.getInstance()
    var result = await instance.addUserToGroup(groupID, addr)
    handleErrors(result)
    return {logs: result.logs}
  }

  /**
   * Retrieve the shares for a group.
   * @param {number} groupID
   *
   * @returns {{authorizedWrite: Array, authorizedRead: Array}} Arrays of shares, separated by access privileges
   *
   * @throws groupID must be registered
   */
  async getShares (groupID) {
    var toUtf8 = uri => this.web3.toUtf8(uri)
    const instance = await this.getInstance()
    var [found, idWrite, hostWrite, pathWrite, idRead, hostRead, pathRead] = await instance.getShares.call(groupID)
    if (found) {
      idWrite = idWrite.map(id => id.toNumber())
      hostWrite = hostWrite.map(toUtf8)
      pathWrite = pathWrite.map(toUtf8)
      var uriWrite = makeURIs(hostWrite, pathWrite)
      var authorizedWrite = zip(idWrite, uriWrite)

      idRead = idRead.map(id => id.toNumber())
      hostRead = hostRead.map(toUtf8)
      pathRead = pathRead.map(toUtf8)
      var uriRead = makeURIs(hostRead, pathRead)
      var authorizedRead = zip(idRead, uriRead)

      return {authorizedWrite, authorizedRead}
    }
    else {
      throw {value: formatError(errorCode.GROUP_NOT_ACTIVE)}
    }
  }

  /**
   * Retrieve all the shares assigned to a user.
   *
   * @returns {{value: {groupID1: Array, groupID2: Array, ...}} A dictionary with the groupID as key and shares as value
   *
   */
  async getAllShares () {
    var groupIDs = (await this.getGroupIDs(this.sender)).value
    var shares = {}
    await Promise.all(groupIDs.map(groupID => this._getAllShares(groupID, shares)))
    return {value: shares}
  }

  /**
   * Create a share for a group.
   * @param {String} uri Pointer to the share
   * @param {number} groupID groupID to which the share will be assigned
   * @returns {{value: {id: number, host: string, path: string}}} Share properties
   *
   * @throws uri must be <64 characters in length
   * @throws groupID must be registered
   * @throws caller must be a registered user
   */
  async addShare (uri, groupID) {
    var toUtf8 = uri => this.web3.toUtf8(uri)
    const instance = await this.getInstance()
    var {host, path} = parseURI(uri)
    if (isValidURI(host, path)) {
      var result = await instance.addShare(host, path, groupID)
      handleErrors(result)
      var log = result.logs.find(log => log.event === 'ShareCreated')
      var id = log.args.id.toNumber()
      var host = toUtf8(log.args.host)
      var path = toUtf8(log.args.path)
      return {value: {id, host, path}, logs: result.logs}
    }
    else {
      throw {value: formatError(errorCode.INVALID_URI)}
    }
  }

  /**
   * Deletes a share
   * @param shareID
   *
   * @returns {{logs: Array}}
   *
   * @throws caller must be a registered user
   * @throws caller must own share
   * @throws shareID must exist
   */
  async deleteShare (shareID) {
    const instance = await this.getInstance()
    var result = await instance.deleteShare(shareID)
    handleErrors(result)
    return {logs: result.logs}
  }

  /**
   * Grant write privileges to a group.
   * @param {number} shareID
   * @param {number} groupID
   * @param {number} [time=0] Duration in seconds of the permission (0 means indefinite)
   *
   * @returns {{logs: Array}}
   *
   * @throws Caller must be a registered user
   * @throws groupID must be registered
   * @throws shareID must be registered
   * @throws caller must have write access to share
   * @throws time must be nonnegative
   *
   */
  async authorizeWrite (shareID, groupID, time = 0) {
    if (time < 0)
      throw {value: formatError(errorCode.NONNEGATIVE_TIME)}
    const instance = await this.getInstance()
    var result = await instance.authorizeWrite(shareID, groupID, time)
    handleErrors(result)
    return {logs: result.logs}
  }

  /**
   * Authorize read privileges to a group.
   * @param {number} shareID
   * @param {number} groupID
   * @param {number} [time=0] Duration of the permission (0 means indefinite)
   *
   * @returns {{logs: Array}}
   *
   * @throws Caller must be a registered user
   * @throws groupID must be registered
   * @throws shareID must be registered
   * @throws caller must have write access to share
   * @throws time must be nonnegative
   */
  async authorizeRead (shareID, groupID, time = 0) {
    if (time < 0)
      throw {value: formatError(errorCode.NONNEGATIVE_TIME)}
    const instance = await this.getInstance()
    var result = await instance.authorizeRead(shareID, groupID, time)
    handleErrors(result)
    return {logs: result.logs}
  }

  /**
   * Revoke write privileges of a group.
   * @param {number} shareID
   * @param {number} groupID
   *
   * @returns {{logs: Array}}
   *
   * @throws Caller must be a registered user
   * @throws groupID must be registered
   * @throws shareID must be registered
   * @throws caller must have write access to share
   * @throws time must be nonnegative
   */
  async revokeWrite (shareID, groupID) {
    const instance = await this.getInstance()
    var result = await instance.revokeWrite(shareID, groupID)
    handleErrors(result)
    return {logs: result.logs}
  }

  /**
   * Revoke read privileges of a group.
   * @param {number} shareID
   * @param {number} groupID
   *
   * @returns {{logs: Array}}
   *
   * @throws Caller must be a registered user
   * @throws groupID must be registered
   * @throws shareID must be registered
   * @throws caller must have write access to share
   * @throws time must be nonegative
   */
  async revokeRead (shareID, groupID) {
    const instance = await this.getInstance()
    var result = await instance.revokeRead(shareID, groupID)
    handleErrors(result)
    return {logs: result.logs}
  }

  /**
   * Check to see if adding the group will cause any circular dependencies.
   * @param {number} groupID
   * @param {number} subgroupID
   *
   * @returns {boolean}
   * @private
   */
  async _canAddGroupToGroup (groupID, subgroupID) {
    if (groupID === subgroupID)
      return false
    const parentGroups = (await this.getParentGroups(groupID)).value
    for (let i = 0; i < parentGroups.length; i++) {
      let result = await this._canAddGroupToGroup(parentGroups[i], subgroupID)
      if (!result)
        return false
    }
    return true
  }

  /**
   * Internal function to retrieve all the shares recursively.
   * @param {number} groupID
   * @param {Object} shares
   * @param {Set} groupsAdded
   * @returns {Object} A dictionary with the groupID as key and shares as value
   * @private
   */
  async _getAllShares (groupID, shares, groupsAdded = new Set()) {
    var result = await this.getShares(groupID)
    shares[groupID] = result
    var parents = await this.getParentGroups(groupID)
    var getParentShares = async (groupID) => {
      if (!groupsAdded.has(groupID)) {
        groupsAdded.add(groupID)
        await this._getAllShares(groupID, shares, groupsAdded)
      }
    }
    await Promise.all(parents.value.map(groupID => getParentShares(groupID)))
    return shares
  }
}

function isValidURI (host, path) {
  return host.length <= 32 && path.length <= 32;
}

function parseURI (uri) {
  var {host, path} = url.parse(uri)
  host = host || ''
  path = path || ''
  return {host, path}
}

function makeURI (host, path) {
  if (host)
    return `${host}/${path}`
  return path
}

function makeURIs (hosts, paths) {
  return hosts.map((host, index) => makeURI(host, paths[index]))
}

/**
 * Python standard zip function
 * @param ids
 * @param uris
 * @returns {Array} Array with the elements of ids and uris intertwined like a zipper
 */
function zip (ids, uris) {
  return ids.map((id, index) => {
    return {id, uri: uris[index]}
  })
}

function handleNodeErrors (err) {
  let errMessage = undefined;
  Object.keys(nodeErrorKeywords).forEach(phrase => {
    if(err.message.includes(phrase)) {
      errMessage = formatError(nodeErrorKeywords[phrase]);
    }
  })
  return errMessage || err;
}

function handleErrors (result) {
  var errorMessage = undefined
  Array.from(result.logs).forEach((log) => {
    if (log.event === 'Error') {
      const id = log.args.id.toNumber()
      errorMessage = formatError(id)
      return false
    }
  })
  if (errorMessage !== undefined)
    throw {value: errorMessage, logs: result.logs}
}

function formatError (id) {
  return {id, message: errorMessages[id]}
}

module.exports = ShareCenter
