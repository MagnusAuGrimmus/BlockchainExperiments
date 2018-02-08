var Set = artifacts.require("Set");
var ImageShare = artifacts.require("ImageShare");

contract('ImageShare', function(accounts) {
    it("should test the basic interactions", function() {
        return ImageShare.deployed().then(function(instance) {
            console.log("Contract mined! Address: " + instance.address);

            printContractState(instance, accounts[0]);

            var ownerAddedEvent = instance.OwnerAdded({}, {fromBlock: 0, toBlock: 'latest'});
            var ownerRevokedEvent = instance.OwnerRevoked({}, {fromBlock: 0, toBlock: 'latest'});
            var readerAddedEvent = instance.ReaderAdded({}, {fromBlock: 0, toBlock: 'latest'});
            var readerRevokedEvent = instance.ReaderRevoked({}, {fromBlock: 0, toBlock: 'latest'});

            ownerAddedEvent.watch(function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }

                var userAddress = result.args._user;

                console.log("The blockchain confirmed that address " + userAddress + " was added as an owner");
            });

            readerAddedEvent.watch(function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }

                var userAddress = result.args._user;

                console.log("The blockchain confirmed that address " + userAddress + " was added as a reader");
            });

            ownerRevokedEvent.watch(function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }

                var userAddress = result.args._user;

                console.log("The blockchain confirmed that owner access was revoked from address " + userAddress);
            });

            // authorize account 1 as an owner
            authorizeAccountOwnership(instance, accounts[0], accounts[1]);
            printContractState(instance, accounts[0]);

            // authorize account 2 as an reader
            authorizeAccountRead(instance, accounts[0], accounts[2]);
            printContractState(instance, accounts[0]);

            // revoke account 1 access
            revokeAuthorizedOwner(instance, accounts[0], accounts[1]);
            printContractState(instance, accounts[0]);
        }).then(function(balance) {
            //
        });
    })
});

function printContractState(contract, ethAddress) {
    contract.getState.call().then(function(result) {
      console.log("");
      console.log("The contract baseURI is " + web3.toUtf8(result[0]));
      console.log("There are " + result[1].toString() + " authorized owners.");
      console.log("There are " + result[2].toString() + " authorized readers.");
      console.log("");
    });
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