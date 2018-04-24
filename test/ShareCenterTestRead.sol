pragma solidity ^0.4.18;
import "./utils/ShareCenterTester.sol";
import "../contracts/utils/Claim.sol";
import "truffle/Assert.sol";

contract ShareCenterTestRead is ShareCenterTester
{
    function ShareCenterTestRead() ShareCenterTester() public {}

    function testAuthorizeRead() public
    {
        uint id = createShare(uri);
        uint groupId = userToGroupID[accounts[0]];
        authorizeRead(id, groupId, 0);
        Assert.isTrue(canRead(accounts[0], id), "User cannot write in share");
        Assert.isTrue(canRead(groupId, id), "Group cannot write in share");
        Assert.isTrue(shares[id].groups.map[groupId].canRead(), "Share was not updated");
    }

    function testAuthorizeReadNotWrite() public
    {
        uint id = createShare(uri);
        uint groupId = userToGroupID[accounts[0]];
        authorizeRead(id, groupId, 0);
        Assert.isFalse(canWrite(accounts[0], id), "User cannot write in share");
        Assert.isFalse(canWrite(groupId, id), "Group cannot write in share");
        Assert.isFalse(shares[id].groups.map[groupId].canWrite(), "Share was updated wrong");
    }

    function testRevokeRead() public
    {
        uint id = createShare(uri);
        uint groupId = userToGroupID[accounts[0]];
        authorizeRead(id, groupId, 0);
        revokeRead(id, groupId);
        Assert.isFalse(canRead(accounts[0], id), "User can still write in share");
        Assert.isFalse(canRead(groupId, id), "Group can still write in share");
        Assert.isFalse(shares[id].groups.map[groupId].canRead(), "Share was not updated");
        Assert.isTrue(canWrite(msg.sender, id), "Other users affected by revoke");
    }
}