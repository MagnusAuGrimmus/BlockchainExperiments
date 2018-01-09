import "../contracts/Voting.sol";
import "truffle/Assert.sol";
contract ElectionTest
{
    Voting voting;
    bytes32[] candidates;
    function initialize() public
    {
        candidates.push(bytes32("Pedro"));
        candidates.push(bytes32("Nick"));
        candidates.push(bytes32("Jose"));
        voting = new Voting(candidates);
    }

    function testVote() public
    {
        initialize();
        var candidate = candidates[0];
        voting.voteForCandidate(candidate);
        uint8 votesReceived = voting.votesReceived(candidate);

        Assert.equal(votesReceived, 1, "Vote function not working correctly");
    }

    //function testWinner()
    //{
    //    var (name, votes) = election.winner();
    //    Assert.equal(name, bytes32("A"), "Winner function not working correctly");
    //    Assert.equal(votes, 1, "Winner function not working correctly");
    //}
}
