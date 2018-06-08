pragma solidity ^0.4.18;
import "../../utils/ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";


contract ShareCenterTestCreateAndDelete is ShareCenterTester
{
    function ShareCenterTestCreateAndDelete() ShareCenterTester() public {}

    function testCreateShare() public
    {
        uint groupId = getPersonalGroupID(msg.sender);
        uint shareId = createShare(host, path, groupId);
        Group.Data group = groups[groupId];
        RecordShare share = shares[share.id];
        Assert.isTrue(canWrite(msg.sender, share.id), "User does not have share");
        Assert.isTrue(canWrite(group.id, share.id), "Group does not have share");
        Assert.isTrue(shares[shareId].groups.map[group.id].canWrite(), "Share did not add group correctly");
        Assert.equal(shares[shareId].id, 1, "Share id not set correctly");
        Assert.equal(shares[shareId].host, host, "Share host not set correctly");
        Assert.equal(shares[shareId].path, path, "Share path not set correctly");
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
