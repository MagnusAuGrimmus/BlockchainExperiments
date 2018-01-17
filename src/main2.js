const fs = require('fs');
const solc = require('solc');
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const input = fs.readFileSync('../contracts/ImageShare.sol');
const output = solc.compile(input.toString(), 1);

if(output.errors) {
    var errorCount = 0;
    output.errors.forEach(function(entry) {
        if(!entry.indexOf("Warning")) {
            errorCount++;
        }

        console.log(entry);
    });

    // there's something wrong with the contract, bail
    if(errorCount) {
        return;
    }
}

const contract = output.contracts[':ImageShare'];
const abi = JSON.parse(output.contracts[':ImageShare'].interface);

var imageShareContract = web3.eth.contract(abi);

var deployedContract = imageShareContract.new("localhost", web3.eth.accounts[0], {from: web3.eth.accounts[0], gas: 1000000, data: contract.bytecode},
    function(e, contract){
        if(!e) {
            if(!contract.address) {
                console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");

            } else {
                console.log("Contract mined! Address: " + contract.address);

                printContractState(contract, web3.eth.accounts[0]);

                var imageShareContractInstance = imageShareContract.at(contract.address);

                var ownerAddedEvent = imageShareContractInstance.OwnerAdded({}, {fromBlock: 0, toBlock: 'latest'});
                var ownerRevokedEvent = imageShareContractInstance.OwnerRevoked({}, {fromBlock: 0, toBlock: 'latest'});
                var readerAddedEvent = imageShareContractInstance.ReaderAdded({}, {fromBlock: 0, toBlock: 'latest'});
                var readerRevokedEvent = imageShareContractInstance.ReaderRevoked({}, {fromBlock: 0, toBlock: 'latest'});

                ownerAddedEvent.watch(function(err, result) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    var userAddress = result.args._user;

                    console.log("The blockchain confirmed that address " + userAddress + " was added as an owner");
                });

                readerAddedEvent.watch(function(err, result) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    var userAddress = result.args._user;

                    console.log("The blockchain confirmed that address " + userAddress + " was added as a reader");
                });

                ownerRevokedEvent.watch(function(err, result) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    var userAddress = result.args._user;

                    console.log("The blockchain confirmed that owner access was revoked from address " + userAddress);
                });

                // authorize account 1 as an owner
                authorizeAccountOwnership(imageShareContractInstance, web3.eth.accounts[0], web3.eth.accounts[1]);
                printContractState(contract, web3.eth.accounts[0]);

                // authorize account 2 as an reader
                authorizeAccountRead(imageShareContractInstance, web3.eth.accounts[0], web3.eth.accounts[2]);
                printContractState(contract, web3.eth.accounts[0]);

                // revoke account 1 access
                revokeAuthorizedOwner(imageShareContractInstance, web3.eth.accounts[0], web3.eth.accounts[1]);
                printContractState(contract, web3.eth.accounts[0]);
            }
        }
        else {
            console.log(e);
        }
    }
);

function printContractState(contract, ethAddress) {
    var returnTuple = contract.getState.call({from: ethAddress});

    console.log("");
    console.log("The contract baseURI is " + web3.toUtf8(returnTuple[0]));
    console.log("There are " + returnTuple[1].toString() + " authorized owners.");
    console.log("There are " + returnTuple[2].toString() + " authorized readers.");
    console.log("");
}

function authorizeAccountOwnership(contract, ethAddress, authorizedAddress) {
    console.log("Attempting to add " + authorizedAddress + " as owner.");

    contract.addAuthorizedOwner(authorizedAddress, {from: ethAddress});
}

function authorizeAccountRead(contract, ethAddress, authorizedAddress) {
    console.log("Attempting to add " + authorizedAddress + " as reader.");

    contract.addAuthorizedReader(authorizedAddress, {from: ethAddress});
}

function revokeAuthorizedOwner(contract, ethAddress, authorizedAddress) {
    console.log("Attempting to revoke ownership from " + authorizedAddress);

    contract.revokeAuthorizedOwner(authorizedAddress, {from: ethAddress});
}