const contract = require("truffle-contract")
const ShareCenterArtifact = require("../build/contracts/ShareCenter");

var errorMessages = [
  'Owner does not exit',
  'User already exists',
  'Caller is not a User',
  'Caller is not a Registered System',
  'Caller does not own share',
  'Caller does not have share',
  'Share does not exist',
  'Group is not active'
]

class ShareCenter
{
  constructor(web3, contractAddress, userAddress, options)
  {
    if(typeof options === "undefined") {
      options = {
        from: userAddress,
        gas: 4712388,
        gasPrice: 100000000000
      }
    }
    this.web3 = web3;
    this.contractAddress = contractAddress;
    this.contract = contract(ShareCenterArtifact);
    this.contract.setProvider(web3.currentProvider);
    this.contract.defaults(options);
  }

  isAddress(value) {
    return typeof value === "string";
  }

  async getInstance()
  {
    return await this.contract.at(this.contractAddress);
  }

  async getGroup(key)
  {
    if(this.isAddress(key))
      key = this.getGroupID(key);
    try {
      return await this.getInstance().groups.call(key);
    }
    catch(err) {
      throw "Ethereum Error";
    }
  }

  async getGroupID(addr) {
    return await this.getInstance().getGroupID.call(addr).toNumber();
  }

  async addSystem(addr) {
    try {
      var result = await this.getInstance().addSystem(addr);
    }
    catch(err) {
      throw err;
    }
    this.handleErrors(result);
  }

  async getUser(addr) {
    try {
      var result = await this.getInstance().getUser.call(addr);
    }
    catch(err) {
      throw "Ethereum Error";
    }
    return result;
  }

  async addUser(addr, name) {
    try {
      var result = await this.getInstance().addUser(addr, name);
    }
    catch(err) {
      throw "Ethereum Error";
    }
    this.handleErrors(result);
  }

  async createShare(uri) {
    try {
      var result = await this.getInstance().createShare(uri);
    }
    catch(err) {
      throw "Ethereum Error";
    }
    this.handleErrors(result);
  }

  async deleteShare(id) {
    try {
      var result = await this.getInstance().deleteShare(id);
    }
    catch(err) {
      throw "Ethereum Error";
    }
    this.handleErrors(result);
  }

  async authorizeWrite(shareId, groupId, time)
  {
    if(typeof time === "undefined")
      time = 0
    if(this.isAddress(groupId))
      groupId = this.getGroupID(groupId);
    try {
      var result = await this.getInstance().authorizeWrite(shareId, groupId, time);
    }
    catch(err) {
      throw "Ethereum Error";
    }
    this.handleErrors(result);
  }

  async authorizeWrite(shareId, groupId, time)
  {
    if(typeof time === "undefined")
      time = 0
    if(this.isAddress(groupId))
      groupId = this.getGroupID(groupId);
    try {
      var result = await this.getInstance().authorizeRead(shareId, groupId, time);
    }
    catch(err) {
      throw "Ethereum Error";
    }
    this.handleErrors(result);
  }

  async revokeWrite(shareId, groupId) {
    if(this.isAddress(groupId))
      groupId = this.getGroupID(groupId);
    try {
      var result = await this.getInstance().revokeWrite(shareId, groupId);
    }
    catch(err) {
      throw "Ethereum Error";
    }
    this.handleErrors(result);
  }

  async revokeRead(shareId, groupId) {
    if(this.isAddress(groupId))
      groupId = this.getGroupID(groupId);
    try {
      var result = await this.getInstance().revokeRead(shareId, groupId);
    }
    catch(err) {
      throw "Ethereum Error";
    }
    this.handleErrors(result);
  }

  handleErrors(result) {
    Array.from(result.logs).forEach((log) => {
      if(log.event === 'Error') {
        throw errorMessages[log.args.id.toNumber()];
      }
    });
  }
}

module.exports = ShareCenter;
