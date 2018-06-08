pragma solidity ^0.4.18;
import "../../utils/ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";

contract ShareCenterTestWrite is ShareCenterTester
{
    function ShareCenterTestWrite() ShareCenterTester() public {}

    function testAuthorizeWrite() public
    {
        uint id = createShare(host, path, getPersonalGroupID(msg.sender));
        uint groupId = getPersonalGroupID(accounts[0]);
        authorizeWrite(id, groupId, 0);
        Assert.isTrue(canWrite(accounts[0], id), "Group cannot write in share");
        Assert.isTrue(canWrite(groupId, id), "Group cannot write in share");
        Assert.isTrue(shares[id].groups.map[groupId].canWrite(), "Share was not updated");
    }

    function testRevokeWrite() public
    {
        uint id = createShare(host, path, getPersonalGroupID(msg.sender));
        uint groupId = getPersonalGroupID(accounts[0]);
        authorizeWrite(id, groupId, 0);
        revokeWrite(id, groupId);
        Assert.isFalse(canWrite(accounts[0], id), "Group can still write in share");
        Assert.isFalse(canWrite(groupId, id), "Group can still write in share");
        Assert.isFalse(shares[id].groups.map[groupId].canWrite(), "Share was not updated");
        Assert.isTrue(canWrite(msg.sender, id), "Other users affected by revoke");
    }
}
