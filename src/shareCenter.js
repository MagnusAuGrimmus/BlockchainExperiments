const contract = require('truffle-contract');
const Web3 = require('web3');
const ShareCenterArtifact = require('../build/contracts/ShareCenter');
const { errorCode, EthError, EthNodeError, InputError, handleEthErrors, handleTimeError, handleURIError } = require('./errors');
const {  parseURI, makeURIs, zip } = require('./methods');

const CONTRACT_ADDRESS = undefined; // Waiting for deployment of contract to ethnet
const GAS_DEFAULT = 4712388;

const EVENTS = [
  'SystemAdded',
  'UserCreated',
  'UserAdded',
  'GroupAdded',
  'GroupRemoved',
  'GroupCreated',
  'ShareAdded',
  'ShareDeleted',
]

/**
 * ShareCenter API
 * @class For a given web session,
 * construct a ShareCenter object for each user bound to the web session.
 */
class ShareCenter {
  static get DURATION() {
    return {
      INDEFINITE: 0
    }
  }
  static get ACCESS() {
    return {
      READ: 1,
      WRITE: 2,
    }
  }

  get ACCESS() {
    return this.constructor.ACCESS;
  }

  get DURATION() {
    return this.constructor.DURATION;
  }
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
    return instance.isAddedSystem.call(addr);
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
   * Get the users of a current group
   * @param {number} groupID
   * @returns {Array} array of user blockchain addresses
   */
  async getUsers(groupID) {
    const instance = await this.getInstance();
    const [found, users] = await instance.getUsers.call(groupID);
    if (found) {
      return users
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

  async whitelist(addr) {
    const instance = await this.getInstance();
    const result = await instance.whitelist(addr);
    handleEthErrors(result);
    return { logs: result.logs };
  }

  async blacklist(addr) {
    const instance = await this.getInstance();
    const result = await instance.blacklist(addr);
    handleEthErrors(result);
    return { logs: result.logs };
  }

  /**
   * Retrieve the pending groupIDs of a user.
   * @param {String} addr Blockchain Address of the user
   *
   * @returns {{value: Array}} Array of groupIDs
   *
   * @throws User must exist
   */
  async getPendingUserGroupIDs() {
    const instance = await this.getInstance();
    const [found, result] = await instance.getPendingUserGroupIDs.call();
    if (found) {
      const groupIDs = result.map(id => id.toNumber());
      return groupIDs;
    } throw new EthError(errorCode.IS_NOT_A_USER);
  }

  async getPendingGroupGroupIDs() {
    const instance = await this.getInstance();
    const [found, groupIDs, subgroupIDs] = await instance.getPendingGroupGroupIDs.call();
    if (found) {
      return groupIDs.map((groupID,index) => ({
        groupID: groupID.toNumber(),
        subgroupID: subgroupIDs[index].toNumber()
      }));
    } throw new EthError(errorCode.IS_NOT_A_USER);
  }

  /**
   * Retrieve the groupIDs of a user.
   * @param {String} addr Blockchain Address of the user
   *
   * @returns {{value: Array}} Array of groupIDs
   *
   * @throws User must exist
   */
  async getGroupIDs() {
    const instance = await this.getInstance();
    const [found, result] = await instance.getGroupIDs.call(this.sender);
    if (found) {
      const groupIDs = result.map(id => id.toNumber());
      return groupIDs;
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
    const result = await instance.createGroup();
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
      return parents;
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
      return subGroups;
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

  async acceptGroup(groupID) {
	  const instance = await this.getInstance();
	  const result = await instance.acceptGroup(groupID);
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

  async removeUserFromGroup(groupID, addr) {
    const instance = await this.getInstance();
    const result = await instance.removeUserFromGroup(groupID, addr);
    handleEthErrors(result);
    return {logs: result.logs};
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
    let [found, length, shareIDs, hosts, paths] = await instance.getShares.call(groupID);
    if (found) {
      shareIDs = shareIDs.slice(0, length).map(id => id.toNumber());
      hosts = hosts.slice(0, length).map(toUtf8);
      paths = paths.slice(0, length).map(toUtf8);
      return zip(shareIDs, makeURIs(hosts, paths));
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
    const groupIDs = await this.getGroupIDs();
    const shares = {};
    await Promise.all(groupIDs.map(groupID => this._getAllShares(groupID, shares)));
    return shares;
  }

  /**
   * Create a share for a group.
   * @param {String} uri Pointer to the share
   * @param {number} groupID groupID to which the share will be assigned
   * @param {number} time duration of share
   * @param {number} access Access level
   * @returns {{value: {id: number, host: string, path: string}}} Share properties
   *
   * @throws uri must be <64 characters in length
   * @throws groupID must be registered
   * @throws caller must be a registered user
   */
  async addShare(uri, groupID, time, access = 2) {
    const { host, path } = parseURI(uri);
    handleURIError(host, path);
    handleTimeError(time);

    const instance = await this.getInstance();
    const result = await instance.addShare(host, path, groupID, time, access);
    handleEthErrors(result);

    const log = result.logs.find(log => log.event === 'ShareAdded');
    const shareID = log.args.id.toNumber();
    return { value: { shareID }, logs: result.logs };
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
   * Check to see if adding the group will cause any circular dependencies.
   * @param {number} groupID
   * @param {number} subgroupID
   *
   * @returns {boolean}
   * @private
   */
  async _canAddGroupToGroup(groupID, subgroupID) {
    if (groupID === subgroupID) { return false; }
    const parentGroups = await this.getParentGroups(groupID);
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
    await Promise.all(parents.map(parentGroupID => getParentShares(parentGroupID)));
    return shares;
  }
}

module.exports = ShareCenter;
