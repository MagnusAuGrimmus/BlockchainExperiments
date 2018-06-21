pragma solidity ^0.4.18;
import "./ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";


contract ShareCenterTestCreate is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testAddShare() public
    {
        (, uint groupID) = getPersonalGroupID(msg.sender);
        uint shareID = addShare(host, path, groupID);
        Group.Data memory group = groups[groupID];
        RecordShare memory share = shares[shareID];

        Assert.isTrue(canWrite(group.id, share.id), "Group does not have share");
        Assert.isTrue(shares[shareID].groups.map[group.id].canWrite(), "Share did not add group correctly");
    }
}
