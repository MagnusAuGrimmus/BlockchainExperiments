const contract = require('truffle-contract');
const Web3 = require('web3');
const ShareCenterArtifact = require('../build/contracts/ShareCenter');
const { errorCode, EthError, EthNodeError, InputError, handleEthErrors, handleTimeError, handleURIError } = require('./errors');
const { parseURI, makeURIs, zip, parseEvent, convertBigNumbers, getDuration } = require('./methods');

const CONTRACT_ADDRESS = undefined; // Waiting for deployment of contract to ethnet
const GAS_DEFAULT = 4712388; // Default cap on the amount of gas that can be spent on an ethereum call

// List of events triggered by the contract
const EVENTS = ShareCenterArtifact.abi.filter(({ type }) => type === 'event').map(({ name }) => name);

/**
 * ShareCenter API
 * @class For a given web session,
 * construct a ShareCenter object for each user bound to the web session.
 */
class ShareCenter {
  /**
   * @constructor
   * @param {Object} httpProvider Location of web3 instance
   * @param {String} userAddress Blockchain address of the user
   * @param {Object} [options] Options for configuring the ShareCenter contract
   * @param {number} [options.gas=4712388] Maximum amount of gas a contract method can use
   * @param {number} [options.gasPrice] Maximum amount of wei that can be spent on gas
   * @param {boolean} [options.testingMode=false] Deploys new contract if testingMode is true.
   * Do not use testingMode = true in production!
   * @param {String} [options.contractAddress] optional address to load contract from.
   * Should not be used for production, only for specific test scenarios.
   */
  constructor (httpProvider, userAddress, options = {}) {
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
    this._initListeners();
  }

  /**
   * Enum of typical duration values
   * @constructor
   * @static
   */
  static get DURATION () {
    return {
      INDEFINITE: 0
    };
  }

  /**
   * Enum of access privileges
   * @constructor
   * @static
   */
  static get ACCESS () {
    return {
      READ: 1,
      WRITE: 2,
    };
  }

  get DURATION () {
    return this.constructor.DURATION;
  }

  //Binding the enums to the instance as well so that they can be called with the "this" keyword
  get ACCESS () {
    return this.constructor.ACCESS;
  }

  /**
   * Preprocess an event and call the event callback
   * @param err
   * @param response
   * @param call
   * @private
   */
  static _listen (err, response, call) {
    parseEvent(response);
    call(err, response);
  }

  /**
   * Activate callback functions to blockchain events.
   * @async
   * @param {{string: function, ...}} listeners an object of callbacks with the event name as the key
   * @param {Number} [fromBlock=0] The block from which to start listening to
   */
  async watchEvents (listeners, fromBlock = 0) {
    for (let event in listeners)
      this._setEventListener(event, listeners[event]);
    const instance = await this.getInstance();
    for (let event in this.eventListeners)
      instance[event]({}, {
        fromBlock,
        toBlock: 'latest'
      }).watch((err, response) => ShareCenter._listen(err, response, this.eventListeners[event]));
  }

  /**
   * Instantiate a web3 instance of the contract.
   * This object has full access to the contract methods and event listeners
   * @returns {Object} A web3 instance of the contract
   *
   * @throws the ethereum node must be running
   * @throws the contract must be deployed
   */
  getInstance () {
    const { contract, options } = this;
    if (!this.instance) {
      try {
        if (options.testingMode) {
          this.instance = contract.deployed();
        } else {
          this.instance = contract.at(this.options.contractAddress || CONTRACT_ADDRESS);
        }
      } catch (err) {
        throw new EthNodeError(err);
      }
    }
    return this.instance;
  }

  /**
   * Check to see if system is added.
   * @param {string} addr Blockchain Address of the system
   * @returns {boolean}
   */
  async isAddedSystem (addr) {
    const instance = await this.getInstance();
    return instance.isAddedSystem.call(addr);
  }

  /**
   * Get the personal groupID of a user.
   * @param {string} [addr=caller.userAddress] The blockchain Address of a user.
   * @returns {number} the personal groupID of the caller.
   *
   * @throws User must exist
   */
  async getPersonalGroupID (addr = this.sender) {
    const instance = await this.getInstance();
    const [found, personalGroupID] = await instance.getPersonalGroupID.call(addr);
    if (found) {
      return personalGroupID.toNumber();
    }
    throw new EthError(errorCode.IS_NOT_A_USER);
  }

  /**
   * Retrieve the groupIDs of a user.
   * @returns {{value: Array}} Array of groupIDs
   *
   * @param {String} [addr=caller.userAddress] Blockchain address of a user
   * @throws User must exist
   */
  async getGroupIDs (addr = this.sender) {
    const instance = await this.getInstance();
    const [found, result] = await instance.getGroupIDs.call(addr);
    if (found) {
      return convertBigNumbers(result);
    }
    throw new EthError(errorCode.IS_NOT_A_USER);
  }

  /**
   * Retrieve the groups that have given the current group access to their shares.
   * @param {number} groupID
   * @returns {{value: Array}} Array of parent groups
   *
   * @throws groupID must be registered
   */
  async getShareGroups (groupID) {
    const instance = await this.getInstance();
    const [found, result] = await instance.getShareGroups.call(groupID);
    if (found) {
      return convertBigNumbers(result);
    }
    throw new EthError(errorCode.GROUP_NOT_ACTIVE);
  }

  /**
   * Retrieve the shares for a group.
   * @param {number} groupID
   *
   * @returns {[{id: {number}, uri: {string}, ...]} Arrays of shares
   *
   * @throws groupID must be registered
   */
  async getShares (groupID) {
    const toUtf8 = uri => this.web3.toUtf8(uri);
    const instance = await this.getInstance();
    let [found, length, shareIDs, hosts, paths] = await instance.getShares.call(groupID);
    if (found) {
      shareIDs = convertBigNumbers(shareIDs.slice(0, length));
      hosts = hosts.slice(0, length).map(toUtf8);
      paths = paths.slice(0, length).map(toUtf8);
      return zip('id', shareIDs, 'uri', makeURIs(hosts, paths));
    }
    throw new EthError(errorCode.GROUP_NOT_ACTIVE);
  }

  /**
   * Retrieve all the shares assigned to a user.
   *
   * @returns {{value: {groupID1: Array, groupID2: Array, ...}} A dictionary with the groupID as key and shares as value
   *
   */
  async getAllShares () {
    const groupIDs = await this.getGroupIDs();
    const shares = {};
    await Promise.all(groupIDs.map(groupID => this._getAllShares(groupID, shares)));
    return shares;
  }

  /**
   * A system that's going to operate ShareCenter on behalf of the users must be registered beforehand.
   * This must be called before users can be added to the contract.
   * In production, this function cannot be called by anyone besides NucleusHealth.
   * May be used for testing purposes.
   * @param {String} addr Blockchain Address of the system to add
   * @returns {{logs: Array}}
   *
   * @throws Caller must be the owner of the contract
   */
  addSystem (addr) {
    const call = instance => instance.addSystem(addr);
    return this._transact(call);
  }

  /**
   * Creates a user in the context of the system that's calling the method.
   * @async
   * @param {String} addr Blockchain Address of the user
   * @returns {{logs: Array}}
   *
   * @throws Caller must be a registered system
   * @throws User must not exist
   */
  async createUser (addr) {
    const instance = await this.getInstance();
    const result = await instance.createUser(addr);
    handleEthErrors(result);
    const personalGroupID = result.logs.find(log => log.event === 'GroupCreated').args.id.toNumber();
    return { value: { personalGroupID }, logs: result.logs };
  }

  /**
   * Adds a blockchain group to the caller's blacklist.
   * This prevents the user from sharing with the caller.
   * @async
   * @param groupID
   * @param blockedGroupID
   * @returns {{logs: Array}}
   *
   * @throws User must exist
   */
  blacklistGroup (groupID, blockedGroupID) {
    const call = instance => instance.blacklistGroup(groupID, blockedGroupID);
    return this._transact(call);
  }

  /**
   * Adds a blockchain user to the caller's blacklist.
   * This prevents the user from sharing with the caller.
   * @async
   * @param groupID
   * @param blockedAddr
   * @returns {{logs: Array}}
   *
   * @throws User must exist
   */
  blacklistUser (groupID, blockedAddr) {
    const call = instance => instance.blacklistUser(groupID, blockedAddr);
    return this._transact(call);
  }

  /**
   * Create a new group in the context of the user indicated in the constructor.
   * @returns {{value: { groupID: number }, logs: Array}} the groupID of the new group.
   *
   * @throws Caller must be a registered system.
   */
  async createGroup () {
    const instance = await this.getInstance();
    const result = await instance.createGroup();
    handleEthErrors(result);
    const groupID = result.logs.find(log => log.event === 'GroupCreated').args.id.toNumber();
    return { value: { groupID }, logs: result.logs };
  }

  createJoinRequest (groupID, parentGroupID) {
    const call = instance => instance.createJoinRequest(groupID, parentGroupID);
    return this._transact(call);
  }

  createInviteRequest (groupID, shareGroupID) {
    const call = instance => instance.createInviteRequest(groupID, shareGroupID);
    return this._transact(call);
  }

  acceptRequest (requestID) {
    const call = instance => instance.acceptRequest(requestID);
    return this._transact(call);
  }

  addWriter (groupID, addr) {
    const call = instance => instance.addWriter(groupID, addr);
    return this._transact(call);
  }

  /**
   * Give a group access to the current group's shares. groupID and shareGroupID must be created beforehand via createGroup.
   * Used to grant a share access to the group's shares. Meant for peer to peer sharing.
   * @param {number} groupID
   * @param {number} shareGroupID
   * @returns {{logs: Array}}
   *
   * @throws both groupIDs must be registered
   * @throws caller must be the owner of the group
   * @throws Addition of subgroup must not cause a circular dependency
   */
  async addShareGroup (groupID, shareGroupID) {
    const canAdd = await this._canAddGroup(groupID, shareGroupID);
    if (canAdd) {
      const instance = await this.getInstance();
      const result = await instance.addShareGroup(groupID, shareGroupID);
      handleEthErrors(result);
      return { logs: result.logs };
    }
    throw new InputError(errorCode.CIRCULAR_DEPENDENCY);
  }

  /**
   * Remove a subgroup from a group.
   * @param {number} groupID
   * @param {number} shareGroupID
   * @returns {{logs: Array}}
   *
   * @throws both groupIDs must be registered
   * @throws caller must be the owner of the group
   */
  removeShareGroup (groupID, shareGroupID) {
    const call = instance => instance.removeShareGroup(groupID, shareGroupID);
    return this._transact(call);
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
  addUserToGroup (groupID, addr) {
    const call = instance => instance.addUserToGroup(groupID, addr);
    return this._transact(call);
  }

  /**
   * Remove a user from a group.
   * @param {number} groupID
   * @param {String} addr Blockchain Address of the user to add
   * @returns {{logs: Array}}
   *
   * @throws groupID must be registered
   * @throws user must be in group
   * @throws caller must be the owner of the group
   */
  removeUserFromGroup (groupID, addr) {
    const call = instance => instance.removeUserFromGroup(groupID, addr);
    return this._transact(call);
  }

  async createShareRequest (groupIDs, uri, time, access) {
    const { host, path } = parseURI(uri);
    handleURIError(host, path);
    if (time instanceof Date)
      time = getDuration(time);
    handleTimeError(time);

    const instance = await this.getInstance();
    const result = await instance.createShareRequest(groupIDs, host, path, time, access);
    handleEthErrors(result);

    let log = result.logs.find(log => log.event === 'ShareRequest'); // Check if the share was added
    const requestID = log.args.id.toNumber();
    return { value: { requestID }, logs: result.logs };
  }

  async acceptShareRequest (requestID) {
    const instance = await this.getInstance();
    const result = await instance.acceptShareRequest(requestID);
    handleEthErrors(result);

    let shareIDs = result.logs.filter(log => log.event === 'ShareAdded')
      .map(log => log.args.shareID.toNumber()); // Check if the share was added
    return { value: { shareIDs }, logs: result.logs };
  }

  /**
   * Create a share for a group.
   * @param {String} uri Pointer to the share
   * @param {[number]} groupIDs groupIDs to which the share will be assigned
   * @param {number} time duration of share
   * @param {number} access Access level
   * @returns {{value: {added: boolean, shareID: number}}} Share properties
   *
   * @throws uri must be <64 characters in length
   * @throws groupID must be registered
   * @throws caller must be a registered user
   */
  async createShare (uri, groupIDs, time, access = 2) {
    const { host, path } = parseURI(uri);
    handleURIError(host, path);
    if (time instanceof Date)
      time = getDuration(time);
    handleTimeError(time);

    const instance = await this.getInstance();
    const result = await instance.createShare(host, path, groupIDs, time, access);
    handleEthErrors(result);

    let log = result.logs.find(log => log.event === 'ShareAdded'); // Check if the share was added
    const shareID = log.args.shareID.toNumber();
    return { value: { shareID }, logs: result.logs };
  }

  async addShare (shareID, groupIDs) {
    const call = instance => instance.addShare(shareID, groupIDs);
    return this._transact(call);
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
  deleteShare (shareID) {
    const call = instance => instance.deleteShare(shareID);
    return this._transact(call);
  }

  /**
   * Check to see if adding the group will cause any circular dependencies.
   * @param {number} groupID
   * @param {number} subgroupID
   * @param {string} type. Can be SHARE or OWNER
   * @returns {boolean}
   * @private
   */
  async _canAddGroup (groupID, subgroupID) {
    if (groupID === subgroupID) { return false; }
    const parentGroups = await this.getShareGroups(groupID);
    const call = (parentID, subID) => this._canAddGroup(parentID, subID);
    const checkParents = parentGroups.map(parentGroupID => call(parentGroupID, subgroupID));
    const result = await Promise.all(checkParents);
    return result.every(noCircularDependency => noCircularDependency);
  }

  /**
   * Internal function to retrieve all the shares recursively.
   * @param {number} groupID
   * @param {Object} shares
   * @param {Set} groupsAdded
   * @private
   * @returns {Object} A dictionary with the groupID as key and shares as value
   */
  async _getAllShares (groupID, shares, groupsAdded = new Set()) {
    shares[groupID] = await this.getShares(groupID);
    const parents = await this.getShareGroups(groupID);
    const getParentShares = parentGroupID => {
      if (!groupsAdded.has(parentGroupID)) {
        groupsAdded.add(parentGroupID);
        return this._getAllShares(parentGroupID, shares, groupsAdded);
      }
    };
    await Promise.all(parents.map(parentGroupID => getParentShares(parentGroupID)));
    return shares;
  }

  /**
   * Initialize the this.eventListeners array with dummy functions.
   * @private
   */
  _initListeners () {
    this.eventListeners = {};
    EVENTS.forEach(event => {
      this.eventListeners[event] = () => {};
    });
  }

  /**
   * Attach a callback function to a specific blockchain events.
   * @param {string} event Event Title
   * @param {function} listener function to call when event is triggered
   * @private
   */
  _setEventListener (event, listener) {
    if (EVENTS.includes(event))
      this.eventListeners[event] = listener;
    else
      throw new InputError(errorCode.INVALID_EVENT_NAME);
  }

  async _transact (call) {
    const instance = await this.getInstance();
    const result = await call(instance);
    handleEthErrors(result);
    return { logs: result.logs };
  }
}

module.exports = ShareCenter;
