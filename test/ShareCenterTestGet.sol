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
        uint senderGroupId = getPersonalGroupID(msg.sender);
        uint userGroupId = getPersonalGroupID(accounts[0]);
        uint id1 = createShare(uri, senderGroupId);
        uint id2 = createShare(uri, senderGroupId);
        uint id3 = createShare(uri, senderGroupId);
        authorizeWrite(id1, userGroupId, 0);
        authorizeWrite(id2, userGroupId, 0);
        authorizeRead(id3, userGroupId, 0);
        var (found, idWrite, uriWrite, idRead, uriRead) = getShares(userGroupId);
        Assert.isTrue(found, "Found variable not set");
        Assert.equal(idWrite[0], id1, "Write Incorrect at index 0");
        Assert.equal(idWrite[1], id2, "Write Incorrect at index 1");
        Assert.equal(idRead[0], id3, "Read Incorrect at index 0");
    }
}
