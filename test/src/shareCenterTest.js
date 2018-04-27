const ShareCenter = require('../../src/shareCenter');
// const Web3 = require('web3');
// const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:9545'));
const ShareCenterTruffle = artifacts.require('ShareCenter');

contract('ShareCenter', function(accounts) {
  // var center;
  var control;
  beforeEach('setup', async function() {
    // center = new ShareCenter(web3, accounts[0]);
    control = await ShareCenterTruffle.new();
    await center.addSystem(accounts[0]);
  })

  it('should Add a User', async function() {
    var addr = accounts[0];
    var name = "Avi";
    var data = await control.addUser(addr, name);
    var result = await control.getUser(addr);
    assert.equal(result[0], 1);
    assert.equal(result[1], name);
  })

  it('sandbox', async function() {

  })
})