pragma solidity ^0.4.0;
import "truffle/Assert.sol";
import "../contracts/Voting.sol";



contract TestVotingInternal is Voting
{
    bytes32[] candidates = [bytes32('Jose'), 'Nick', "Pedro"];
    function TestVotingInternal() Voting(candidates) public {}

    function testValidCandidate() public
    {
        Assert.isTrue(validCandidate(candidates[0]), "Contract does not recognize first valid name");
        Assert.isTrue(validCandidate(candidates[1]), "Contract does not recognize second valid name");
        Assert.isTrue(validCandidate(candidates[2]), "Contract does not recognize third valid name");
        bytes32 fakeCandidate = bytes32("President Avi");
        Assert.isFalse(validCandidate(fakeCandidate), "Contract does not recognize invalid names");

    }

    function testElectionInProgress() public
    {
        voteForCandidate(candidates[0]);
        Assert.isTrue(electionInProgress(), "Election stopped early");
        voteForCandidate(candidates[0]);
        Assert.isFalse(electionInProgress(), "Election not stopped correctly");
    }
}
