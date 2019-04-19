pragma solidity ^0.5.0;

import "../../contracts/ShareCenter.sol";
import "truffle/Assert.sol";

contract ShareCenterInternalTest is ShareCenter
{
    uint groupID1;
    uint groupID2;
    address user1;
    address user2;

    function beforeAll() public
    {
        user1 = address(1);
        user2 = address(2);

        addSystem(msg.sender);
        createUser(user1);
        createUser(user2);

        groupID1 = createGroup();
        groupID2 = createGroup();
    }


    function testPersonalGroupIDFlag() public
    {
        createUser(user1);
        uint groupID = users[user1].personalGroupID;
        Assert.isTrue(groups[groupID].isPersonal, "Personal Group is marked as extra");
    }

    function testGroupIDFlag() public
    {
        uint groupID = createGroup();
        Assert.isFalse(groups[groupID].isPersonal, "extra group is marked as personal");
    }

    function testJoinRequestCleanup() public
    {
        createJoinRequest(groupID1, groupID2);
        uint requestID = requestCounter;
        acceptRequest(requestID);
        Assert.isFalse(requests[requestID].active, "Request is still active");
    }

    function testShareRequestCleanup() public
    {
        uint[] memory groupIDs = new uint[](2);
        groupIDs[0] = groupID1;
        groupIDs[1] = groupID2;
        createShareRequest(groupIDs, "name", "name", 0, 2);
        uint requestID = requestCounter;

        acceptShareRequest(requestID);
        Assert.isFalse(requests[requestID].active, "Request is still active");
    }
}
