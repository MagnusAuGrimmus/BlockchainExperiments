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

  async getGroupID(addr) {
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var groupId =  await instance.getGroupID.call(addr);
          resolve(groupId)
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
          resolve({value: {id: id, name: name}});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async addUser(addr, name) {
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.addUser(addr, name);
          handleErrors(result);
          resolve({logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async getShares(addr)
  {
    var toUtf8 = uri => this.web3.toUtf8(uri);
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.getShares.call(addr);
          if(!result[0])
            reject("User does not exist");
          else {
            var idWrite = result[1].map(id => id.toNumber());
            var uriWrite = result[2].map(toUtf8);
            var idRead = result[3].map(id => id.toNumber());
            var uriRead = result[4].map(toUtf8);
            resolve({value: {idWrite: idWrite, uriWrite: uriWrite, idRead: idRead, uriRead: uriRead}});
          }
        })
      }
      catch(err) {
        throw reject(err);
      }
    });
  }

  async createShare(uri) {
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.createShare(uri);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          else {
            var id = result.logs.find(log => log.event === "ShareCreated").args.id.toNumber();
            resolve({value: {id: id, uri: uri}, logs: result.logs});
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

  async authorizeWrite(shareId, groupId, time = 0)
  {
    if(isAddress(groupId))
      groupId = await this.getGroupID(groupId);
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.authorizeWrite(shareId, groupId, time);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          else
            resolve({value: {shareId: shareId, groupId: groupId, time: time}, logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async authorizeRead(shareId, groupId, time = 0)
  {
    if(isAddress(groupId))
      groupId = await this.getGroupID(groupId);
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.authorizeRead(shareId, groupId, time);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          else
            resolve({value: {shareId: shareId, groupId: groupId, time: time}, logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async revokeWrite(shareId, groupId) {
    if(isAddress(groupId))
      groupId = await this.getGroupID(groupId);
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.revokeWrite(shareId, groupId);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          else
            resolve({value: {shareId: shareId, groupId: groupId}, logs: result.logs});
        })
      }
      catch(err) {
        reject(err);
      }
    })
  }

  async revokeRead(shareId, groupId) {
    if(isAddress(groupId))
      groupId = await this.getGroupID(groupId);
    return new Promise((resolve, reject) => {
      try {
        this.contract.deployed().then(async function (instance) {
          var result = await instance.revokeRead(shareId, groupId);
          var err = handleErrors(result);
          if(err !== null)
            reject({value: err, logs: result.logs});
          else
            resolve({value: {shareId: shareId, groupId: groupId}, logs: result.logs});
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
  Array.from(result.logs).forEach((log) => {
    if(log.event === 'Error') {
      return errorMessages[log.args.id.toNumber()];
    }
  });
  return null;
}

module.exports = ShareCenter;
