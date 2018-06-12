pragma solidity ^0.4.18;
import "../../utils/ShareCenterTester.sol";
import "../../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";


contract ShareCenterTestDelete is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testDeleteShare() public
    {
        uint shareID = 1;
        deleteShare(shareID);
        Assert.isFalse(canWrite(msg.sender, shareID), "User share not removed");
        Assert.equal(shares[shareID].id, 0, "ImageShare was not set to null");
    }
}



