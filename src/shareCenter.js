const contract = require("truffle-contract")
const ShareCenterArtifact = require("../build/contracts/ShareCenter");

var errorMessages = [
  'Owner does not exist',
  'User already exists',
  'Caller is not a User',
  'Caller is not a Registered System',
  'Caller does not own share',
  'Caller does not have share',
  'Share does not exist',
  'Group is not active'
]

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

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
    this.sender = userAddress;
    this.web3 = web3;
    this.contract = contract(ShareCenterArtifact);
    this.contract.setProvider(web3.currentProvider);
    this.contract.defaults(options);

  }

  async getPersonalGroupID(addr = this.sender) {
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var groupID = await instance.getPersonalGroupID.call(addr);
          resolve(groupID.toNumber());
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async addSystem(addr) {
   return new Promise((resolve, reject) => {
     try {
       this.contract.deployed().then(async function (instance) {
         var result = await instance.addSystem(addr);
         var err = handleErrors(result);
         if(err !== null)
           reject({value: err, logs: result.logs});
         else
           resolve({value: addr, logs: result.logs});
       })
     }
     catch(err) {
       reject(err);
     }
   })
  }

  async getUser(addr)
  {
    var toUtf8 = uri => this.web3.toUtf8(uri);
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result =  await instance.getUser.call(addr);
          var id = result[0].toNumber();
          var name = toUtf8(result[1]);
          resolve({value: { id, name }});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async createUser(addr, name) {
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.createUser(addr, name);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          resolve({logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async getGroupIDs(addr) {
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function(instance) {
          var result = await instance.getGroups.call(addr);
          var groupIDs = result.map(id => id.toNumber());
          resolve({ groupIDs });
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async createGroup() {
    const addr = this.sender;
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function(instance) {
          var result = await instance.createGroup(addr);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          var groupID = result.logs.find(log => log.event === "GroupCreated").args.id.toNumber();
          resolve({value: { groupID }, logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async addGroup(groupID, subgroupID) {
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function(instance) {
          var result = await instance.addGroup(groupID, subgroupID);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          resolve({logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async addUserToGroup(groupID, addr) {
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function(instance) {
          var result = await instance.addUserToGroup(groupID, addr);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          resolve({logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async addOwnerToGroup(groupID, addr) {
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function(instance) {
          var result = await instance.addOwnerToGroup(groupID, addr);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          resolve({logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async getShares(groupID)
  {
    if(isAddress(groupID))
      groupID = await this.getGroupID(groupID);
    var toUtf8 = uri => this.web3.toUtf8(uri);
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.getShares.call(groupID);
          if(!result[0])
            reject("User does not exist");
          else {
            var idWrite = result[1].map(id => id.toNumber());
            var uriWrite = result[2].map(toUtf8);
            var idRead = result[3].map(id => id.toNumber());
            var uriRead = result[4].map(toUtf8);
            resolve({ idWrite, uriWrite, idRead, uriRead });
          }
        })
      }
      catch(err) {
        reject(err);
      }
    });
  }

  async getAllShares()
  {
    var { groupIDs }  = await this.getGroupIDs(this.sender);
    var shares = {};
    await asyncForEach(groupIDs, async (groupID) =>  {
      await this._getAllShares(groupID, shares);
    });
    return shares;
  }

  async getParentGroups(groupID) {
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function(instance) {
          const result = await instance.getParentGroups.call(groupID);
          const parents = result.map(id => id.toNumber());
          resolve({ parents })
        })
      }
      catch (err) {
        reject(err)
      }
    })
  }

  async _getAllShares(groupID, shares, groupsAdded = new Set())
  {
    var result = await this.getShares(groupID);
    shares[groupID] = result;
    var { parents } = await this.getParentGroups(groupID);
    await asyncForEach(parents, async (groupID) => {
      if(!groupsAdded.has(groupID)) {
        groupsAdded.add(groupID);
        await this._getAllShares(groupID, shares, groupsAdded);
      }
    })
    return shares;
  }

  async createShare(uri, groupID) {
    if(groupID === undefined)
      groupID = await this.getPersonalGroupID();
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.createShare(uri, groupID);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          else {
            var id = result.logs.find(log => log.event === "ShareCreated").args.id.toNumber();
            resolve({value: { id, uri }, logs: result.logs});
          }
        })
      }
      catch(err) {
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
          if(err !== null)
            reject({value: err, logs: result.logs});
          else
            resolve({value: id, logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    });
  }

  async authorizeWrite(shareId, groupID, time = 0)
  {
    if(isAddress(groupID))
      groupID = await this.getPersonalGroupID(groupID);
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.authorizeWrite(shareId, groupID, time);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          else
            resolve({value: { shareId, groupID, time }, logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async authorizeRead(shareId, groupID, time = 0)
  {
    if(isAddress(groupID))
      groupID = await this.getPersonalGroupID(groupID);
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.authorizeRead(shareId, groupID, time);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          else
            resolve({value: { shareId, groupID, time }, logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async revokeWrite(shareId, groupID) {
    if(isAddress(groupID))
      groupID = await this.getPersonalGroupID(groupID);
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.revokeWrite(shareId, groupID);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          else
            resolve({value: { shareId, groupID }, logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async revokeRead(shareId, groupID) {
    if(isAddress(groupID))
      groupID = await this.getPersonalGroupID(groupID);
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.revokeRead(shareId, groupID);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          else
            resolve({value: { shareId, groupID }, logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }
}

function isAddress(value) {
  return typeof value === "string";
}

function handleErrors(result) {
  var errorMessage = null;
  Array.from(result.logs).forEach((log) => {
    if(log.event === 'Error') {
      errorMessage = errorMessages[log.args.id.toNumber()];
      return false;
    }
  });
  return errorMessage;
}

module.exports = ShareCenter;
