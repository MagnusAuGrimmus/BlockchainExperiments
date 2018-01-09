var Voting = artifacts.require("Voting");
var web3 = require("web3");

var candidates = ['Pedro', 'Nick', 'Jose'];

contract("Voting", function(accounts)
{
    it("should deploy correctly", function() {
        Voting.deployed();
    });

    it("Checking voting",
        function() {
            return Voting.deployed().then(
                function (instance)
                {
                    for(var i = 0; i < 2; i++)
                    {
                        var vote = Math.floor(Math.random() * 3);
                        console.log(candidates[vote]);
                        instance.voteForCandidate(candidates[vote], {from: accounts[i]});
                    }

                    console.log(instance.votesReceived[candidates[0]]);
                }
            )
        });
});


//         .then(function (result)
//     {
//     var index = votes.indexOf(Math.max(...votes));
//     var winner = web3.utils.toAscii(result[0].valueOf()).replace(/\u0000/g, '');
//     assert.equal(candidates[index], winner, "Voting Fraud");
//     assert.equal(votes[index], result[1].valueOf(), "Vote Count Fraud");
// });