const contract = require("truffle-contract")
const ShareCenterArtifact = require("../build/contracts/ShareCenter");

var errorMessages = [
  'Owner does not exit',
  'User already exists',
  'Caller is not a User',
  'Caller is not a Registered System',
  'Caller does not own share',
  'Caller does not have share',
  'Share already exists',
  'Group is not active'
]

class ShareCenter
{
  constructor(web3, userAddress)
  {
    this.web3 = web3;
    this.contract = contract(ShareCenterArtifact);
    this.contract.setProvider(web3.currentProvider);
    this.contract.defaults({
      from: userAddress,
      gas: 4712388,
      gasPrice: 100000000000
    })
  }

  async addSystem(addr) {
    var instance = await this.contract.new();
    try {
      var result = await instance.addSystem(addr);
      this.handleErrors(result);
    }
    catch(err) {
      throw "Ethereum Error";
    }
  }

  async addUser(addr, name) {
    var instance = await this.contract.new();
    try {
      var result = await instance.adduUer(addr, name);
      this.handleErrors(result);
    }
    catch(err) {
      throw "Ethereum Error";
    }
  }

  async createShare(uri) {
    var instance = await this.contract.new();
    try {
      var result = await instance.createShare(uri);
      this.handleErrors(result);
    }
    catch(err) {
      throw "Ethereum Error";
    }
  }

  async deleteShare(id) {
    var instance = await this.contract.new();
    try {
      var result = await instance.deleteShare(id);
      this.handleErrors(result);
    }
    catch(err) {
      throw "Ethereum Error";
    }
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
