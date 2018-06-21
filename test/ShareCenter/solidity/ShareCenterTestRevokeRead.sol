pragma solidity ^0.4.18;
import "./ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";

contract ShareCenterTestRevokeRead is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testRevokeRead() public
    {
        (, uint senderGroupID) = getPersonalGroupID(msg.sender);
        uint id = addShare(host, path, senderGroupID);
        (, uint groupID) = getPersonalGroupID(accounts[0]);
        authorizeRead(id, groupID, 0);
        revokeRead(id, groupID);
        Assert.isFalse(canRead(accounts[0], id), "User can still write in share");
        Assert.isFalse(canRead(groupID, id), "Group can still write in share");
        Assert.isFalse(shares[id].groups.map[groupID].canRead(), "Share was not updated");
        Assert.isTrue(canWrite(msg.sender, id), "Other users affected by revoke");
    }
}
