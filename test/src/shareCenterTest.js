const ShareCenter = require('../../src/shareCenter');
const Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
var center = new ShareCenter(web3);
var accounts = web3.eth.accounts;

center.addSystem(accounts[0]);