pragma solidity ^0.4.0;
import "truffle/Assert.sol";
import "../contracts/Voting.sol";

contract TestVoting
{
    Voting vote;
    bytes32[] candidates = [bytes32('Jose'), 'Nick', "Pedro"];
    function beforeAll() public
    {
        vote = new Voting(candidates);
    }

    function testInit() public
    {
        uint[] memory expected = new uint[](3);
        checkMapping(expected);
    }

    function testVote() public
    {
        vote.voteForCandidate(candidates[0]);
        vote.voteForCandidate(candidates[1]);
        vote.voteForCandidate(candidates[2]);

        uint[] memory expected = new uint[](3);
        expected[0] = expected[1] = expected[2] = 1;
        checkMapping(expected);

        vote.voteForCandidate(candidates[0]);
        expected[0] = 2;
        checkMapping(expected);
    }

    function testVoteWithInvalidCandidate() public
    {
        ThrowProxy proxy = new ThrowProxy(address(vote));
        Voting(address(proxy)).voteForCandidate(bytes32("President Avi"));
        bool result = proxy.execute.gas(20000000)();

        Assert.isFalse(result, "Vote should not have been processed");
    }

    function testTotalVotesFor() public
    {
        Assert.equal(vote.totalVotesFor(candidates[0]), uint(2), "function not working");
    }

    function testElectionEnd() public
    {
        ThrowProxy proxy = new ThrowProxy(address(vote));
        Voting(address(proxy)).voteForCandidate(candidates[0]);
        bool result = proxy.execute.gas(20000000)();

        Assert.isFalse(result, "Should have thrown an exception");
    }


    function checkMapping(uint[] expected) internal
    {
        Assert.equal(uint(1), uint(1), "Error");
        for(uint i = 0; i < candidates.length; i++)
        {
            uint count = vote.votesReceived(candidates[i]);
            Assert.equal(expected[i], count, "Wrong");
        }
    }
}

contract ThrowProxy
{
    address public target;
    bytes data;

    function ThrowProxy(address _target) public
    {
        target = _target;
    }

    //prime the data using the fallback function.
    function() public
    {
        data = msg.data;
    }

    function execute() public returns (bool)
    {
        return target.call(data);
    }
}
