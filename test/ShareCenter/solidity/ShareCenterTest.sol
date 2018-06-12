pragma solidity ^0.4.18;
import "../../utils/ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";


contract ShareCenterTest is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testCreateUser() public
    {
        address addr = 0x100;
        bytes32 name = "Avi";
        uint targetUserID = 4;
        uint targetGroupID = 4;
        createUser(addr, name);
        Assert.equal(users[addr].name, name, "Name not set correctly");
        Assert.equal(users[addr].id, targetUserID, "ID not set correctly");
        (, uint personalGroupID) = getPersonalGroupID(addr);
        Assert.equal(personalGroupID, targetGroupID, "Group ID not set correctly");
        Assert.equal(groups[targetGroupID].owner, addr, "Owner not added to group");
        Assert.equal(groups[targetGroupID].id, targetGroupID, "Group map not set correctly");
    }
}
