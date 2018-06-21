pragma solidity ^0.4.19;

import "../../contracts/utils/Claim.sol";
import "truffle/Assert.sol";

contract ClaimTest
{
    using Claim for Claim.Data;
    Claim.Data claim;
    function testPermissions() public
    {
        claim.id = 4;
        claim.access = Claim.Type.INACTIVE;
        Assert.isFalse(claim.canRead(), "Inactive claim should not be able to read");
        Assert.isFalse(claim.canWrite(), "Inactive claim should not be able to write");

        claim.access = Claim.Type.READ;
        Assert.isTrue(claim.canRead(), "Read claim should be able to read");
        Assert.isFalse(claim.canWrite(), "Read claim should not be able to write");

        claim.access = Claim.Type.WRITE;
        Assert.isTrue(claim.canRead(), "Write claim should be able to read");
        Assert.isTrue(claim.canWrite(), "Write claim should be able to write");
    }

    function testIsActive() public
    {
        claim.id = 0;
        claim.time = 0;
        Assert.isFalse(claim.isValid(), "Should not be valid when id is 0");

    }

    function testIsValid() public
    {
        claim.id = 1;
        Assert.isTrue(claim.isValid(), "Should be valid");

        claim.time = now - 10;
        Assert.isFalse(claim.isValid(), "Should not be valid for expired time");
    }
}
