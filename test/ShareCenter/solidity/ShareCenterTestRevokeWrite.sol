pragma solidity ^0.4.18;
import "./ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";

contract ShareCenterTestRevokeWrite is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testRevokeWrite() public
    {
        (, uint senderGroupID) = getPersonalGroupID(msg.sender);
        uint id = addShare(host, path, senderGroupID);
        (, uint groupID) = getPersonalGroupID(accounts[0]);
        authorizeWrite(id, groupID, 0);
        revokeWrite(id, groupID);
        Assert.isFalse(canWrite(accounts[0], id), "Group can still write in share");
        Assert.isFalse(canWrite(groupID, id), "Group can still write in share");
        Assert.isFalse(shares[id].groups.map[groupID].canWrite(), "Share was not updated");
        Assert.isTrue(canWrite(msg.sender, id), "Other users affected by revoke");
    }
}
