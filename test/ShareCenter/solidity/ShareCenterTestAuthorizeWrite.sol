pragma solidity ^0.4.18;
import "./ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";

contract ShareCenterTestAuthorizeWrite is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testAuthorizeWrite() public
    {
        (, uint senderGroupID) = getPersonalGroupID(msg.sender);
        uint id = addShare(host, path, senderGroupID);
        (, uint groupID) = getPersonalGroupID(accounts[0]);
        authorizeWrite(id, groupID, 1000);
        Assert.isTrue(canWrite(accounts[0], id), "Group cannot write in share");
        Assert.isTrue(canWrite(groupID, id), "Group cannot write in share");
        Assert.isTrue(shares[id].groups.map[groupID].canWrite(), "Share was not updated");
    }
}
