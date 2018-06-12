const contract = require("truffle-contract")
const url = require('url');
const ShareCenterArtifact = require("../build/contracts/ShareCenter");

var errorMessages = [
    'Owner does not exist', //0
    'User already exists', //1
    'Caller is not a User', //2
    'Caller is not a Registered System', //3
    'Caller does not own share', //4
    'Caller does not have share', //5
    'Share does not exist', //6
    'Group is not active', //7
    'User is not in group', //8
    'User is not owner of group', //9
    'Invalid URI', //10
    'Cannot add Group' //11 //Need better Error Code
]

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

function isValidURI(host, path) {
    return host.length < 32 && path.length < 32;
}

function parseURI(uri) {
    var {host, path} = url.parse(uri);
    host = host || "";
    path = path || "";
    return {host, path}
}

function makeURI(host, path) {
    if (host)
        return `${host}/${path}`;
    return path;
}

function makeURIs(hosts, paths) {
    return hosts.map((host, index) => makeURI(host, paths[index]));
}

function zip(ids, uris) {
    var shares = [];
    for (let i = 0; i < ids.length; i++) {
        shares.push({id: ids[i], uri: uris[i]});
    }
    return shares;
}

function isAddress(value) {
    return typeof value === "string";
}

function handleErrors(result) {
    var errorMessage = null;
    Array.from(result.logs).forEach((log) => {
        if (log.event === 'Error') {
            const id = log.args.id.toNumber();
            errorMessage = error(id);
            return false;
        }
    });
    return errorMessage;
}

function error(id) {
    return {id, message: errorMessages[id]}
}

class ShareCenter {
    /**
     * @constructor
     * @param {Object} web3 Web3 instance where the contract will run
     * @param {string} userAddress Address of the user
     * @param {Object} options
     */
    constructor(web3, userAddress, options) {
        if (typeof options === "undefined") {
            options = {
                from: userAddress,
                gas: 4712388,
                gasPrice: 100000000000
            }
        }
        this.sender = userAddress;
        this.web3 = web3;
        this.contract = contract(ShareCenterArtifact);
        this.contract.setProvider(web3.currentProvider);
        this.contract.defaults(options);
    }

    /**
     * Adds a system to the contract.
     * @param {string} addr Address of the system to add
     * @returns {Promise<any>}
     */
    async addSystem(addr) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var result = await instance.addSystem(addr);
                    var err = handleErrors(result);
                    if (err !== null)
                        reject({value: err, logs: result.logs});
                    else
                        resolve({logs: result.logs});
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Retrieves the userID and username.
     * @param {string} addr Address of the user
     * @returns {Promise<any>}
     */
    async getUser(addr) {
        const toUtf8 = uri => this.web3.toUtf8(uri);
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var [found, userID, username] = await instance.getUser.call(addr);
                    if (found) {
                        userID = userID.toNumber();
                        username = toUtf8(username);
                        resolve({value: {userID, username}})
                    }
                    else {
                        reject({value: error(2)})
                    }
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Retrieves the groupID of a user's personal group.
     * @param {string} [addr=userAddress] Address of the user
     * @returns {Promise<any>}
     */
    async getPersonalGroupID(addr = this.sender) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var [found, groupID] = await instance.getPersonalGroupID.call(addr);
                    if (found) {
                        resolve({value: groupID.toNumber()});
                    }
                    else {
                        reject({value: error(2)});
                    }
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Creates a user.
     * @param {string} addr Address of the user
     * @param {string} name Name of the user
     * @returns {Promise<any>}
     */
    async createUser(addr, name) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var result = await instance.createUser(addr, name);
                    var err = handleErrors(result);
                    if (err !== null)
                        reject({value: err, logs: result.logs});
                    resolve({logs: result.logs});
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Retrieve the groupIDs of a user.
     * @param {string} addr Address of the user
     * @returns {Promise<any>}
     */
    async getGroupIDs(addr) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var [found, result] = await instance.getGroups.call(addr);
                    if (found) {
                        var groupIDs = result.map(id => id.toNumber());
                        resolve({ value: groupIDs });
                    }
                    else {
                        reject({ value: error(2) })
                    }
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Create a new group.
     * @returns {Promise<any>}
     */
    async createGroup() {
        const addr = this.sender;
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var result = await instance.createGroup(addr);
                    var err = handleErrors(result);
                    if (err === null) {
                        var groupID = result.logs.find(log => log.event === "GroupCreated").args.id.toNumber();
                        resolve({value: {groupID}, logs: result.logs});
                    }
                    else {
                        reject({value: err, logs: result.logs});
                    }
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Check to see if adding the group will cause any circular dependencies.
     * @param {number} groupID
     * @param {number} subgroupID
     * @returns {Promise<boolean>}
     */
    async canAddGroupToGroup(groupID, subgroupID) {
        if(groupID === subgroupID)
            return false;
        const parentGroups = (await this.getParentGroups(groupID)).value;
        for(let i = 0; i < parentGroups.length; i++) {
            let result = await this.canAddGroupToGroup(parentGroups[i], subgroupID);
            if(!result)
                return false;
        }
        return true;
    }

    /**
     * Retrieve the parent groups of a group.
     * @param {number} groupID
     * @returns {Promise<any>}
     */
    async getParentGroups(groupID) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    const [found, result] = await instance.getParentGroups.call(groupID);
                    if(found) {
                        const parents = result.map(id => id.toNumber());
                        resolve({value: parents})
                    }
                    else {
                        reject({value: error(7)})
                    }
                })
            }
            catch (err) {
                reject(err)
            }
        })
    }

    /**
     * Retrieve the subgroups of a group
     * @param {number} groupID
     * @returns {Promise<any>}
     */
    async getSubGroups(groupID) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    const [found, result] = await instance.getSubGroups.call(groupID);
                    if(found) {
                        const parents = result.map(id => id.toNumber());
                        resolve({value: parents})
                    }
                    else {
                        reject({value: error(7)})
                    }
                })
            }
            catch (err) {
                reject(err)
            }
        })
    }

    /**
     * Add a subgroup to a group.
     * @param {number} groupID
     * @param {number} subgroupID
     * @returns {Promise<any>}
     */
    async addGroupToGroup(groupID, subgroupID) {
        return new Promise(async (resolve, reject) => {
            try {
                let canAdd = await this.canAddGroupToGroup(groupID, subgroupID);
                if(canAdd) {
                    this.contract.deployed().then(async function (instance) {
                        var result = await instance.addGroupToGroup(groupID, subgroupID);
                        var err = handleErrors(result);
                        if (err !== null)
                            reject({value: err, logs: result.logs});
                        else
                            resolve({logs: result.logs});
                    })
                }
                else {
                    reject({value: error(11)})
                }
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Remove a subgroup from a group.
     * @param {number} groupID
     * @param {number} subgroupID
     * @returns {Promise<any>}
     */
    async removeGroupFromGroup(groupID, subgroupID) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var result = await instance.removeGroupFromGroup(groupID, subgroupID);
                    var err = handleErrors(result);
                    if (err !== null)
                        reject({value: err, logs: result.logs});
                    else
                        resolve({logs: result.logs});
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Add a user to a group.
     * @param {number} groupID
     * @param {string} addr Address of the user to add
     * @returns {Promise<any>}
     */
    async addUserToGroup(groupID, addr) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var result = await instance.addUserToGroup(groupID, addr);
                    var err = handleErrors(result);
                    if (err !== null)
                        reject({value: err, logs: result.logs});
                    else
                        resolve({logs: result.logs});
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Retrieve the shares for a group.
     * @param {number} groupID
     * @returns {Promise<any>}
     */
    async getShares(groupID) {
        var toUtf8 = uri => this.web3.toUtf8(uri);
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var [found, idWrite, hostWrite, pathWrite, idRead, hostRead, pathRead] = await instance.getShares.call(groupID);
                    if (found) {
                        idWrite = idWrite.map(id => id.toNumber())
                        hostWrite = hostWrite.map(toUtf8)
                        pathWrite = pathWrite.map(toUtf8)
                        var uriWrite = makeURIs(hostWrite, pathWrite)
                        var authorizedWrite = zip(idWrite, uriWrite)

                        idRead = idRead.map(id => id.toNumber())
                        hostRead = hostRead.map(toUtf8)
                        pathRead = pathRead.map(toUtf8)
                        var uriRead = makeURIs(hostRead, pathRead);
                        var authorizedRead = zip(idRead, uriRead)

                        resolve({authorizedWrite, authorizedRead})
                    }
                    else {
                        reject({value: error(7)})
                    }
                })
            }
            catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Retrieve all the shares assigned to a user.
     * @returns {Promise<any>}
     */
    async getAllShares() {
        return new Promise(async (resolve, reject) => {
            try {
                var groupIDs = (await this.getGroupIDs(this.sender)).value;
                var shares = {};
                await asyncForEach(groupIDs, async (groupID) => {
                    await this._getAllShares(groupID, shares);
                });
                resolve({value: shares})
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Internal function to retrieve all the shares recursively.
     * @param {number} groupID
     * @param {Object} shares
     * @param {Set} groupsAdded
     * @returns {Promise<*>}
     * @private
     */
    async _getAllShares(groupID, shares, groupsAdded = new Set()) {
        var result = await this.getShares(groupID);
        shares[groupID] = result;
        var parents = await this.getParentGroups(groupID);
        await asyncForEach(parents.value, async (groupID) => {
            if (!groupsAdded.has(groupID)) {
                groupsAdded.add(groupID);
                await this._getAllShares(groupID, shares, groupsAdded);
            }
        })
        return shares;
    }

    /**
     * Create a share for a group.
     * @param {string} uri Pointer to the share
     * @param {number} groupID groupID to which the share will be assigned
     * @returns {Promise<any>}
     */
    async createShare(uri, groupID) {
        var toUtf8 = uri => this.web3.toUtf8(uri);
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var {host, path} = parseURI(uri);
                    if (isValidURI(host, path)) {
                        var result = await instance.createShare(host, path, groupID);
                        var err = handleErrors(result);
                        if (err === null) {
                            var log = result.logs.find(log => log.event === 'ShareCreated')
                            var id = log.args.id.toNumber()
                            var host = toUtf8(log.args.host)
                            var path = toUtf8(log.args.path)
                            resolve({value: {id, host, path}, logs: result.logs})
                        }
                        else {
                            reject({value: err, logs: result.logs})
                        }
                    }
                    else {
                        reject({value: error(10)})
                    }
                })
            }
            catch (err) {
                reject(err);
            }
        });
    }

    async deleteShare(id) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var result = await instance.deleteShare(id);
                    var err = handleErrors(result);
                    if (err !== null)
                        reject({value: err, logs: result.logs});
                    else
                        resolve({value: id, logs: result.logs});
                })
            }
            catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Authorize write privileges to a group.
     * @param {number} shareID
     * @param {number} groupID
     * @param {number} [time=0] Duration of the permission (0 means indefinite)
     * @returns {Promise<any>}
     */
    async authorizeWrite(shareID, groupID, time = 0) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var result = await instance.authorizeWrite(shareID, groupID, time);
                    var err = handleErrors(result);
                    if (err !== null)
                        reject({value: err, logs: result.logs});
                    else
                        resolve({value: {shareID, groupID, time}, logs: result.logs});
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Authorize read privileges to a group.
     * @param {number} shareID
     * @param {number} groupID
     * @param {number} [time=0] Duration of the permission (0 means indefinite)
     * @returns {Promise<any>}
     */
    async authorizeRead(shareID, groupID, time = 0) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var result = await instance.authorizeRead(shareID, groupID, time);
                    var err = handleErrors(result);
                    if (err !== null)
                        reject({value: err, logs: result.logs});
                    else
                        resolve({value: {shareID, groupID, time}, logs: result.logs});
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Revoke write privileges of a group.
     * @param {number} shareID
     * @param {number} groupID
     * @returns {Promise<any>}
     */
    async revokeWrite(shareID, groupID) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var result = await instance.revokeWrite(shareID, groupID);
                    var err = handleErrors(result);
                    if (err !== null)
                        reject({value: err, logs: result.logs});
                    else
                        resolve({value: {shareID, groupID}, logs: result.logs});
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Revoke read privileges of a group.
     * @param {number} shareID
     * @param {number} groupID
     * @returns {Promise<any>}
     */
    async revokeRead(shareID, groupID) {
        return new Promise((resolve, reject) => {
            try {
                this.contract.deployed().then(async function (instance) {
                    var result = await instance.revokeRead(shareID, groupID);
                    var err = handleErrors(result);
                    if (err !== null)
                        reject({value: err, logs: result.logs});
                    else
                        resolve({value: {shareID, groupID}, logs: result.logs});
                })
            }
            catch (err) {
                reject(err);
            }
        })
    }
}

module.exports = ShareCenter;
