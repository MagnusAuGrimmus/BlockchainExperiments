const ShareCenter = require('../../src/shareCenter');
// const Web3 = require('web3');
// const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:9545'));
const ShareCenterTruffle = artifacts.require('ShareCenter');
const contractAddress = '0x75c35c980c0d37ef46df04d31a140b65503c0eed';

contract('ShareCenter', function(accounts) {
  var center;
  beforeEach('setup', async function() {
    center = new ShareCenter(web3, contractAddress, accounts[0]);
  })

  it('should add a system', async function() {
    
  })

  it('should Add a User', async function() {
    var addr = accounts[0];
    var name = "Avi";
    var data = await center.addUser(addr, name);
    var result = await center.getUser(addr);
    assert.equal(result[0], 1);
    assert.equal(result[1], name);
  })

  it('sandbox', async function() {

  })
})