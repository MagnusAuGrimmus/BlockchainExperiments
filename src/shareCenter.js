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
  constructor(web3, userAddress, options)
  {
    if(typeof options === "undefined") {
      options = {
        from: userAddress,
        gas: 4712388,
        gasPrice: 100000000000
      }
    }
    this.web3 = web3;
    this.contract = contract(ShareCenterArtifact);
    this.contract.setProvider(web3.currentProvider);
    this.contract.defaults(options);
  }

  isAddress(value) {
    return typeof value === "string";
  }

  async getGroup(key)
  {
    if(this.isAddress(key))
      key = this.getGroupID(key);
    try {
      this.contract.deployed().then(async function (instance) {
        return await instance.groups.call(key);
      })
    }
    catch(err) {
      throw err;
    }
  }

  async getGroupID(addr) {
    try {
      this.contract.deployed().then(async function (instance) {
        return await instance.getGroupID.call(addr).toNumber();
      })
    }
    catch(err) {
      throw err;
    }
  }

  async addSystem(addr) {
    try {
      this.contract.deployed().then(async function (instance) {
        var result = await instance.addSystem(addr);
        handleErrors(result);
      })
    }
    catch(err) {
      throw err;
    }
  }

  async getUser(addr) {
    try {
      this.contract.deployed().then(async function (instance) {
        return await instance.getUser.call(addr);
      })
    }
    catch(err) {
      throw err;
    }
  }

  async addUser(addr, name) {
    try {
      this.contract.deployed().then(async function (instance) {
        var result = await instance.addUser(addr, name);
        handleErrors(result);
      })
    }
    catch(err) {
      throw err;
    }
  }

  async createShare(uri) {
    try {
      this.contract.deployed().then(async function (instance) {
        var result = await instance.createShare(uri);
        handleErrors(result);
      })

    }
    catch(err) {
      throw err;
    }
  }

  async deleteShare(id) {
    try {
      this.contract.deployed().then(async function (instance) {
        var result = await instance.deleteShare(uri);
        handleErrors(result);
      })

    }
    catch(err) {
      throw err;
    }
  }

  async authorizeWrite(shareId, groupId, time)
  {
    if(typeof time === "undefined")
      time = 0
    if(this.isAddress(groupId))
      groupId = this.getGroupID(groupId);
    try {
      this.contract.deployed().then(async function (instance) {
        var result = await instance.authorizeWrite(shareId, groupId, time);
        handleErrors(result);
      })
    }
    catch(err) {
      throw err;
    }
  }

  async authorizeWrite(shareId, groupId, time)
  {
    if(typeof time === "undefined")
      time = 0
    if(this.isAddress(groupId))
      groupId = this.getGroupID(groupId);
    try {
      this.contract.deployed().then(async function (instance) {
        var result = await instance.authorizeRead(shareId, groupId, time);
        handleErrors(result);
      })
    }
    catch(err) {
      throw err;
    }
  }

  async revokeWrite(shareId, groupId) {
    if(this.isAddress(groupId))
      groupId = this.getGroupID(groupId);
    try {
      this.contract.deployed().then(async function (instance) {
        var result = await instance.revokeWrite(shareId, groupId);
        handleErrors(result);
      })
    }
    catch(err) {
      throw err;
    }
  }

  async revokeRead(shareId, groupId) {
    if(this.isAddress(groupId))
      groupId = this.getGroupID(groupId);
    try {
      this.contract.deployed().then(async function (instance) {
        var result = await instance.revokeRead(shareId, groupId);
        handleErrors(result);
      })
    }
    catch(err) {
      throw err;
    }
  }
}

function handleErrors(result) {
  Array.from(result.logs).forEach((log) => {
    if(log.event === 'Error') {
      throw errorMessages[log.args.id.toNumber()];
    }
  });
}

module.exports = ShareCenter;
