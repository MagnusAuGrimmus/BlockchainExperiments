pragma solidity ^0.4.18;
import "./ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";

contract ShareCenterTestReadNotWrite is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testAuthorizeReadNotWrite() public
    {
        (, uint senderGroupID) = getPersonalGroupID(msg.sender);
        uint id = addShare(host, path, senderGroupID);
        (, uint groupID) = getPersonalGroupID(accounts[0]);
        authorizeRead(id, groupID, 0);
        Assert.isFalse(canWrite(accounts[0], id), "User cannot write in share");
        Assert.isFalse(canWrite(groupID, id), "Group cannot write in share");
        Assert.isFalse(shares[id].groups.map[groupID].canWrite(), "Share was updated wrong");
    }

}
