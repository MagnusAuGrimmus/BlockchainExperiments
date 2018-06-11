pragma solidity ^0.4.18;
import "../../utils/ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";
import "../../utils/TestingUtils.sol";

contract ShareCenterTestGet is ShareCenterTester
{
    function ShareCenterTestGet() ShareCenterTester() public {}

    function testGetShares() public
    {
        var (temp, senderGroupID) = getPersonalGroupID(msg.sender);
        var (temp2, userGroupID) = getPersonalGroupID(accounts[0]);
        uint id1 = createShare(host, path, senderGroupID);
        uint id2 = createShare(host, path, senderGroupID);
        uint id3 = createShare(host, path, senderGroupID);
        authorizeWrite(id1, userGroupID, 0);
        authorizeWrite(id2, userGroupID, 0);
        authorizeRead(id3, userGroupID, 0);
        var (found, idWrite, hostWrite, pathWrite, idRead, hostRead, pathRead) = getShares(userGroupID);
//        Assert.isTrue(found, "Found variable not set");
//        Assert.equal(idWrite[0], id1, "Write Incorrect at index 0");
//        Assert.equal(idWrite[1], id2, "Write Incorrect at index 1");
//        Assert.equal(idRead[0], id3, "Read Incorrect at index 0");
    }
}
