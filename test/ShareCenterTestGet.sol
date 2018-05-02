pragma solidity ^0.4.18;
import "./utils/ShareCenterTester.sol";
import "../contracts/utils/Claim.sol";
import "truffle/Assert.sol";
import "./utils/TestingUtils.sol";

contract ShareCenterTestGet is ShareCenterTester
{
    function ShareCenterTestGet() ShareCenterTester() public {}

    function testGetShares() public
    {
        uint id1 = createShare(uri);
        uint id2 = createShare(uri);
        uint id3 = createShare(uri);
        uint groupId = userToGroupID[accounts[0]];
        Group.Data group = groups[groupId];
        authorizeWrite(id1, groupId, 0);
        authorizeWrite(id2, groupId, 0);
        authorizeRead(id3, groupId, 0);
        var (found, idWrite, uriWrite, idRead, uriRead) = getShares(groupId);
        Assert.isTrue(found, "Found variable not set");
        Assert.equal(idWrite[0], 1, "Write Incorrect at index 0");
        Assert.equal(idWrite[1], 2, "Write Incorrect at index 1");
        Assert.equal(idRead[0], 3, "Read Incorrect at index 0");
    }
}
