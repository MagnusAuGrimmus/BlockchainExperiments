pragma solidity ^0.4.18;
import "./utils/ShareCenterTester.sol";
import "../contracts/utils/Claim.sol";
import "truffle/Assert.sol";


contract ShareCenterTest is ShareCenterTester
{
    function ShareCenterTest() ShareCenterTester() public {}

    function testAddUser() public
    {
        address addr = 0x100;
        bytes32 name = "Avi";
        addUser(addr, name);
        Assert.equal(users[addr].name, name, "Name not set correctly");
        Assert.equal(users[addr].id, 4, "Id not set correctly");
        Assert.equal(userToGroupID[addr], 4, "Group Id not set correctly");
        Assert.isTrue(groups[4].owners.contains(addr), "Owner not added to group");
        Assert.equal(groups[4].id, 4, "Group map not set correctly");
    }

    function testCreateShare() public
    {
        uint id = createShare(uri);
        Group.Data group = groups[userToGroupID[msg.sender]];
        RecordShare share = shares[share.id];
        Assert.isTrue(canWrite(msg.sender, share.id), "User does not have share");
        Assert.isTrue(canWrite(group.id, share.id), "Group does not have share");
        Assert.isTrue(shares[id].groups.map[group.id].canWrite(), "Share did not add group correctly");
        Assert.equal(shares[id].id, 1, "Share id not set correctly");
        Assert.equal(shares[id].uri, uri, "Share uri not set correctly");
    }

    function testDeleteShare() public
    {
        Group.Data group = groups[userToGroupID[msg.sender]];
        deleteShare(1);
        Assert.isFalse(canWrite(msg.sender, 1), "User share not removed");
        Assert.equal(shares[1].id, 0, "ImageShare was not set to null");
    }
}
