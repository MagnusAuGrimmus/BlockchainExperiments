pragma solidity ^0.4.18;
import "../../utils/ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";

contract ShareCenterTestReadNotWrite is ShareCenterTester
{
    function ShareCenterTestReadNotWrite() ShareCenterTester() public {}

    function testAuthorizeReadNotWrite() public
    {
        var (temp, senderGroupID) = getPersonalGroupID(msg.sender);
        uint id = createShare(host, path, senderGroupID);
        var (temp2, groupId) = getPersonalGroupID(accounts[0]);
        authorizeRead(id, groupId, 0);
        Assert.isFalse(canWrite(accounts[0], id), "User cannot write in share");
        Assert.isFalse(canWrite(groupId, id), "Group cannot write in share");
        Assert.isFalse(shares[id].groups.map[groupId].canWrite(), "Share was updated wrong");
    }

}
