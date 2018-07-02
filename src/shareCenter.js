const contract = require('truffle-contract');
const Web3 = require('web3');
const ShareCenterArtifact = require('../build/contracts/ShareCenter');
const { errorCode, EthError, EthNodeError, InputError, handleEthErrors } = require('./errors');
const { isValidURI, parseURI, makeURIs, zip } = require('./methods');

const CONTRACT_ADDRESS = undefined; // Waiting for deployment of contract to ethnet
const GAS_DEFAULT = 4712388;

const EVENTS = [
  'SystemAdded',
  'UserAdded',
  'GroupAdded',
  'SystemAdded',
  'UserAdded',
  'GroupAdded',
  'GroupRemoved',
  'GroupCreated',
  'ShareAdded',
  'ShareDeleted',
  'WriterAdded',
  'ReaderAdded',
  'WriterRevoked',
  'ReaderRevoked',
]

/**
 * ShareCenter API
 * @class For a given web session,
 * construct a ShareCenter object for each user bound to the web session.
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
   * @param {boolean} [options.testingMode=false] Deploys new contract if testingMode is true.
   * Do not use testingMode = true in production!
   * @param {String} [options.contractAddress] optional address to load contract from.
   * Should not be used for production, only for specific test scenarios.
   */
  constructor(httpProvider, userAddress, options = {}) {
    this.sender = userAddress;
    this.web3 = new Web3(new Web3.providers.HttpProvider(httpProvider));
    const contractOptions = {
      from: userAddress,
      gas: options.gas || GAS_DEFAULT,
      gasPrice: options.gasPrice
    };
    this.contract = contract(ShareCenterArtifact);
    this.contract.setProvider(this.web3.currentProvider);
    this.contract.defaults(contractOptions);
    this.options = options;
    this.instance = null;
    this.initListeners();
  }
  
  initListeners() {
    this.eventListeners = {}
    EVENTS.forEach(event => {
      this.eventListeners[event] = () => {}
    });
  }

  setEventListener(event, listener) {
    if(EVENTS.includes(event))
      this.eventListeners[event] = listener;
    else
      throw new InputError(errorCode.INVALID_EVENT_NAME);
  }

  async watchEvents(listeners) {
    for(let event in listeners)
      this.setEventListener(event, listeners[event]);
    const instance = await this.getInstance();
    for(let event in this.eventListeners)
      instance[event]().watch(this.eventListeners[event]);
  }

  getInstance() {
    if(!this.instance) {
      try {
        if (this.options.testingMode) {
          this.instance = this.contract.deployed();
        }
        else {
          this.instance = this.contract.at(this.options.contractAddress || CONTRACT_ADDRESS);
        }
      } catch (err) {
        throw new EthNodeError(err);
      }
    }
    return this.instance;
  }

  /**
   * Check to see if system is added
   * @param {string} addr Blockchain Address of the system
   * @returns {boolean}
   */
  async isAddedSystem(addr) {
    const instance = await this.getInstance();
    const result = await instance.isAddedSystem.call(addr);
    return { value: result };
  }

  /**
   * A system that's going to operate ShareCenter on behalf of the users must be registered beforehand.
   * This must be called before users can be added to the contract.
   * In production, this function cannot be called by anyone besides NucleusHealth.
   * May be used for testing purposes.
   * @param {String} addr Blockchain Address of the system to add
   * @returns {{logs: Array}}
   * @throws Caller must be the owner of the contract
   */
  async addSystem(addr) {
    const instance = await this.getInstance();
    const result = await instance.addSystem(addr);
    handleEthErrors(result);
    return { logs: result.logs };
  }

  /**
   * Retrieves the groupID of a user's personal group.
   * @param {String} [addr=userAddress] Blockchain Address of the user
   * @returns {{value: number}} the personal groupID
   * @throws User must exist
   */
  async getPersonalGroupID(addr = this.sender) {
    const instance = await this.getInstance();
    const [found, groupID] = await instance.getPersonalGroupID.call(addr);
    if (found) { return { value: groupID.toNumber() }; }
    throw new EthError(errorCode.IS_NOT_A_USER);
  }

  /**
   * Get the users of a current group
   * @param {number} groupID
   * @returns {Array} array of user blockchain Address
   */
  async getUsers(groupID) {
    const instance = await this.getInstance();
    const [found, users] = await instance.getUsers.call(groupID);
    if (found) {
      return { value: users }
    }
    throw new EthError(errorCode.GROUP_NOT_ACTIVE);
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
  async createUser(addr) {
    const instance = await this.getInstance();
    const result = await instance.createUser(addr);
    handleEthErrors(result);
    return { logs: result.logs };
  }

  /**
   * Retrieve the groupIDs of a user.
   * @param {String} addr Blockchain Address of the user
   *
   * @returns {{value: Array}} Array of groupIDs
   *
   * @throws User must exist
   */
  async getGroupIDs(addr) {
    const instance = await this.getInstance();
    const [found, result] = await instance.getGroupIDs.call(addr);
    if (found) {
      const groupIDs = result.map(id => id.toNumber());
      return { value: groupIDs };
    } throw new EthError(errorCode.IS_NOT_A_USER);
  }

  /**
   * Create a new group in the context of the user indicated in the constructor.
   *
   * @returns {{value: number, logs: Array}} the groupID of the new group
   *
   * @throws Caller must be a registered system
   */
  async createGroup() {
    const instance = await this.getInstance();
    const result = await instance.createGroup(this.sender);
    handleEthErrors(result);
    const groupID = result.logs.find(log => log.event === 'GroupCreated').args.id.toNumber();
    return { value: { groupID }, logs: result.logs };
  }

  /**
   * Retrieve the parent groups of a group.
   * @param {number} groupID
   * @returns {{value: Array}} Array of parent groups
   *
   * @throws groupID must be registered
   */
  async getParentGroups(groupID) {
    const instance = await this.getInstance();
    const [found, result] = await instance.getParentGroups.call(groupID);
    if (found) {
      const parents = result.map(id => id.toNumber());
      return { value: parents };
    } throw new EthError(errorCode.GROUP_NOT_ACTIVE);
  }

  /**
   * Retrieve the subgroups of a group
   * @param {number} groupID
   * @returns {{value: Array}} Array of subgroups
   *
   * @throws groupID must be registered
   */
  async getSubGroups(groupID) {
    const instance = await this.getInstance();
    const [found, result] = await instance.getSubGroups.call(groupID);
    if (found) {
      const subGroups = result.map(id => id.toNumber());
      return { value: subGroups };
    }
    throw new EthError(errorCode.GROUP_NOT_ACTIVE);
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
  async addGroupToGroup(groupID, subgroupID) {
    const canAdd = await this._canAddGroupToGroup(groupID, subgroupID);
    if (canAdd) {
      const instance = await this.getInstance();
      const result = await instance.addGroupToGroup(groupID, subgroupID);
      handleEthErrors(result);
      return { logs: result.logs };
    }
    throw new InputError(errorCode.CIRCULAR_DEPENDENCY);
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
  async removeGroupFromGroup(groupID, subgroupID) {
    const instance = await this.getInstance();
    const result = await instance.removeGroupFromGroup(groupID, subgroupID);
    handleEthErrors(result);
    return { logs: result.logs };
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
  async addUserToGroup(groupID, addr) {
    const instance = await this.getInstance();
    const result = await instance.addUserToGroup(groupID, addr);
    handleEthErrors(result);
    return { logs: result.logs };
  }

  /**
   * Retrieve the shares for a group.
   * @param {number} groupID
   *
   * @returns {{authorizedWrite: Array, authorizedRead: Array}} Arrays of shares, separated by access privileges
   *
   * @throws groupID must be registered
   */
  async getShares(groupID) {
    const toUtf8 = uri => this.web3.toUtf8(uri);
    const instance = await this.getInstance();
    let [found, idWrite, hostWrite, pathWrite, idRead, hostRead, pathRead] = await instance.getShares.call(groupID);
    if (found) {
      idWrite = idWrite.map(id => id.toNumber());
      hostWrite = hostWrite.map(toUtf8);
      pathWrite = pathWrite.map(toUtf8);
      const uriWrite = makeURIs(hostWrite, pathWrite);
      const authorizedWrite = zip(idWrite, uriWrite);

      idRead = idRead.map(id => id.toNumber());
      hostRead = hostRead.map(toUtf8);
      pathRead = pathRead.map(toUtf8);
      const uriRead = makeURIs(hostRead, pathRead);
      const authorizedRead = zip(idRead, uriRead);

      return { authorizedWrite, authorizedRead };
    }
    throw new EthError(errorCode.GROUP_NOT_ACTIVE);
  }

  /**
   * Retrieve all the shares assigned to a user.
   *
   * @returns {{value: {groupID1: Array, groupID2: Array, ...}} A dictionary with the groupID as key and shares as value
   *
   */
  async getAllShares() {
    const groupIDs = (await this.getGroupIDs(this.sender)).value;
    const shares = {};
    await Promise.all(groupIDs.map(groupID => this._getAllShares(groupID, shares)));
    return { value: shares };
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
  async addShare(uri, groupID) {
    const toUtf8 = str => this.web3.toUtf8(str);
    const instance = await this.getInstance();
    var { host, path } = parseURI(uri);
    if (isValidURI(host, path)) {
      const result = await instance.addShare(host, path, groupID);
      handleEthErrors(result);
      const log = result.logs.find(log => log.event === 'ShareAdded');
      const id = log.args.id.toNumber();
      const returnedHost = toUtf8(log.args.host);
      const returnedPath = toUtf8(log.args.path);
      return { value: { id, returnedHost, returnedPath }, logs: result.logs };
    }
    throw new InputError(errorCode.INVALID_URI);
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
  async deleteShare(shareID) {
    const instance = await this.getInstance();
    const result = await instance.deleteShare(shareID);
    handleEthErrors(result);
    return { logs: result.logs };
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
  async authorizeWrite(shareID, groupID, time = 0) {
    if (time >= 0) {
      const instance = await this.getInstance();
      const result = await instance.authorizeWrite(shareID, groupID, time);
      handleEthErrors(result);
      return { logs: result.logs };
    }
    throw new InputError(errorCode.NONNEGATIVE_TIME);
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
  async authorizeRead(shareID, groupID, time = 0) {
    if (time >= 0) {
      const instance = await this.getInstance();
      const result = await instance.authorizeRead(shareID, groupID, time);
      handleEthErrors(result);
      return { logs: result.logs };
    }
    throw new InputError(errorCode.NONNEGATIVE_TIME);
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
  async revokeWrite(shareID, groupID) {
    const instance = await this.getInstance();
    const result = await instance.revokeWrite(shareID, groupID);
    handleEthErrors(result);
    return { logs: result.logs };
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
  async revokeRead(shareID, groupID) {
    const instance = await this.getInstance();
    const result = await instance.revokeRead(shareID, groupID);
    handleEthErrors(result);
    return { logs: result.logs };
  }

  /**
   * Check to see if adding the group will cause any circular dependencies.
   * @param {number} groupID
   * @param {number} subgroupID
   *
   * @returns {boolean}
   * @private
   */
  async _canAddGroupToGroup(groupID, subgroupID) {
    if (groupID === subgroupID) { return false; }
    const parentGroups = (await this.getParentGroups(groupID)).value;
    const call = (parentID, subID) => this._canAddGroupToGroup(parentID, subID);
    const checkParents = parentGroups.map(parentGroupID => call(parentGroupID, subgroupID));
    const result = await Promise.all(checkParents);
    return result.every(noCircularDependency => noCircularDependency);
  }

  /**
   * Internal function to retrieve all the shares recursively.
   * @param {number} groupID
   * @param {Object} shares
   * @param {Set} groupsAdded
   * @returns {Object} A dictionary with the groupID as key and shares as value
   * @private
   */
  async _getAllShares(groupID, shares, groupsAdded = new Set()) {
    const result = await this.getShares(groupID);
    shares[groupID] = result;
    const parents = await this.getParentGroups(groupID);
    const getParentShares = async parentGroupID => {
      if (!groupsAdded.has(parentGroupID)) {
        groupsAdded.add(parentGroupID);
        await this._getAllShares(parentGroupID, shares, groupsAdded);
      }
    };
    await Promise.all(parents.value.map(parentGroupID => getParentShares(parentGroupID)));
    return shares;
  }
}

module.exports = ShareCenter;
