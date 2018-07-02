pragma solidity ^0.4.18;
import "./ShareCenterTester.sol";
import "truffle/Assert.sol";


contract ShareCenterTestGroup is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testCreateGroup() public
    {
        uint groupID = createGroup(msg.sender);
        (, address[] memory users) = getUsers(groupID);
        Assert.equal(users[0], msg.sender, "User not added to group");
    }
}