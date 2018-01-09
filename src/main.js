const fs = require('fs');
const solc = require('solc');
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const input = fs.readFileSync('../contracts/Voting.sol');
const output = solc.compile(input.toString(), 1);
const contract = output.contracts[':Voting'];
const abi = JSON.parse(output.contracts[':Voting'].interface);

const candidates = ['Pedro', 'Nick', 'Jose'];

var votingContract = web3.eth.contract(abi);

var deployedContract = votingContract.new(candidates, {from: web3.eth.accounts[0], gas: 1000000, data: contract.bytecode},
    function(e, contract){
        if(!e) {
            if(!contract.address) {
                console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");

            } else {
                console.log("Contract mined! Address: " + contract.address);

                var votingContractInstance = votingContract.at(contract.address);

                var voteOccurrenceEvent = votingContractInstance.VoteOccurrence({}, {fromBlock: 0, toBlock: 'latest'});
                var electionWinnerEvent = votingContractInstance.ElectionWinner({}, {fromBlock: 0, toBlock: 'latest'});

                voteOccurrenceEvent.watch(function(err, result) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    var candidateName = web3.toUtf8(result.args._candidate);

                    console.log("The blockchain confirmed that address " + result.args._from + " voted for candidate " + candidateName);
                });

                electionWinnerEvent.watch(function(err, result) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    var candidateName = web3.toUtf8(result.args._candidate);
                    var totalVotesForCandidate = result.args._totalVotes.toString();

                    console.log("The blockchain confirmed that " + candidateName + " won the election with " + totalVotesForCandidate + " votes!");

                    voteOccurrenceEvent.stopWatching();
                    electionWinnerEvent.stopWatching();
                });

                // vote for Nick
                voteForCandidate(votingContractInstance, web3.eth.accounts[1], candidates[1]);

                // vote for Pedro
                voteForCandidate(votingContractInstance, web3.eth.accounts[0], candidates[0]);

                // vote for Jose
                voteForCandidate(votingContractInstance, web3.eth.accounts[2], candidates[2]);

                // cast the winning vote for Pedro
                voteForCandidate(votingContractInstance, web3.eth.accounts[0], candidates[0]);
            }
        }
    }
);

function voteForCandidate(contract, ethAddress, candidateToVoteFor) {
    console.log(ethAddress + " cast a vote for " + candidateToVoteFor);

    contract.voteForCandidate(candidateToVoteFor, {from: ethAddress});
    var totalVotesForCandidate = contract.totalVotesFor.call(candidateToVoteFor);

    console.log("The total number of votes for " + candidateToVoteFor + " is now " + totalVotesForCandidate.toString());
}