pragma solidity ^0.4.18;
import "./ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";

contract ShareCenterTestAuthorizeRead is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testAuthorizeRead() public
    {
        (, uint senderGroupID) = getPersonalGroupID(msg.sender);
        uint id = addShare(host, path, senderGroupID);
        (, uint groupID) = getPersonalGroupID(accounts[0]);
        authorizeRead(id, groupID, 0);
        Assert.isTrue(canRead(accounts[0], id), "User cannot write in share");
        Assert.isTrue(canRead(groupID, id), "Group cannot write in share");
        Assert.isTrue(shares[id].groups.map[groupID].canRead(), "Share was not updated");
    }
}
