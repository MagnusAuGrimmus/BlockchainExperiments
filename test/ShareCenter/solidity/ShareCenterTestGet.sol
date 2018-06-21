pragma solidity ^0.4.18;
import "./ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";
import "../../utils/TestingUtils.sol";

contract ShareCenterTestGet is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testGetShares() public
    {
        (, uint senderGroupID) = getPersonalGroupID(msg.sender);
        (, uint userGroupID) = getPersonalGroupID(accounts[0]);
        uint id1 = addShare(host, path, senderGroupID);
        uint id2 = addShare(host, path, senderGroupID);
        uint id3 = addShare(host, path, senderGroupID);
        authorizeWrite(id1, userGroupID, 0);
        authorizeWrite(id2, userGroupID, 0);
        authorizeRead(id3, userGroupID, 0);
        (bool found, uint[] memory idWrite,,,uint[] memory idRead,,) = getShares(userGroupID);
        Assert.isTrue(found, "Found variable not set");
        Assert.equal(idWrite[0], id1, "Write Incorrect at index 0");
        Assert.equal(idWrite[1], id2, "Write Incorrect at index 1");
        Assert.equal(idRead[0], id3, "Read Incorrect at index 0");
    }
}
