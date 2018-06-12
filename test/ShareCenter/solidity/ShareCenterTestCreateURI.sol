pragma solidity ^0.4.18;
import "../../utils/ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";


contract ShareCenterTestCreateURI is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testCreateShare() public
    {
        (, uint groupID) = getPersonalGroupID(msg.sender);
        uint shareID = createShare(host, path, groupID);
        Group.Data memory group = groups[groupID];
        RecordShare memory share = shares[shareID];

        Assert.equal(shares[shareID].host, host, "Share host not set correctly");
        Assert.equal(shares[shareID].path, path, "Share path not set correctly");
    }
}
