pragma solidity ^0.4.18;
import "../../utils/ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
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
        var (temp, personalGroupID) = getPersonalGroupID(addr);
        Assert.equal(personalGroupID, targetGroupId, "Group Id not set correctly");
        Assert.equal(groups[targetGroupId].owner, addr, "Owner not added to group");
        Assert.equal(groups[targetGroupId].id, targetGroupId, "Group map not set correctly");
    }
}
