const ShareCenter = require('../../src/shareCenter');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:9545'));

contract('ShareCenter', function(accounts) {
  var center;
  it('test', async function() {
    center = new ShareCenter(web3, accounts[0]);
    await center.addSystem(accounts[0]);
  })
})