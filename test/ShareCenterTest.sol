pragma solidity ^0.4.18;
import "./utils/ShareCenterTester.sol";
import "../contracts/utils/Claim.sol";
import "truffle/Assert.sol";


contract ShareCenterTest is ShareCenterTester
{
    function ShareCenterTest() ShareCenterTester() public {}

    function testCreateUser() public
    {
        address addr = 0x100;
        bytes32 name = "Avi";
        uint targetUserId = 4;
        uint targetGroupId = 4;
        createUser(addr, name);
        Assert.equal(users[addr].name, name, "Name not set correctly");
        Assert.equal(users[addr].id, targetUserId, "Id not set correctly");
        Assert.equal(getPersonalGroupID(addr), targetGroupId, "Group Id not set correctly");
        Assert.isTrue(groups[targetGroupId].owners.contains(addr), "Owner not added to group");
        Assert.equal(groups[targetGroupId].id, targetGroupId, "Group map not set correctly");
    }

    function testCreateShare() public
    {
        uint groupId = getPersonalGroupID(msg.sender);
        uint shareId = createShare(uri, groupId);
        Group.Data group = groups[groupId];
        RecordShare share = shares[share.id];
        Assert.isTrue(canWrite(msg.sender, share.id), "User does not have share");
        Assert.isTrue(canWrite(group.id, share.id), "Group does not have share");
        Assert.isTrue(shares[shareId].groups.map[group.id].canWrite(), "Share did not add group correctly");
        Assert.equal(shares[shareId].id, 1, "Share id not set correctly");
        Assert.equal(shares[shareId].uri, uri, "Share uri not set correctly");
    }

    function testDeleteShare() public
    {
        uint shareId = 1;
        Group.Data group = groups[getPersonalGroupID(msg.sender)];
        deleteShare(shareId);
        Assert.isFalse(canWrite(msg.sender, shareId), "User share not removed");
        Assert.equal(shares[shareId].id, 0, "ImageShare was not set to null");
    }
}
