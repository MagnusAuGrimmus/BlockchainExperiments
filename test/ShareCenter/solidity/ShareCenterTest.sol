pragma solidity ^0.4.18;
import "./ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";


contract ShareCenterTest is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testCreateUser() public
    {
        address addr = 0x100;
        uint targetGroupID = 4;
        createUser(addr);
        Assert.isTrue(users[addr].active, "User was not set active");
        (, uint personalGroupID) = getPersonalGroupID(addr);
        Assert.equal(personalGroupID, targetGroupID, "Group ID not set correctly");
        Assert.equal(groups[targetGroupID].owner, addr, "Owner not added to group");
        Assert.equal(groups[targetGroupID].id, targetGroupID, "Group map not set correctly");
    }
}
