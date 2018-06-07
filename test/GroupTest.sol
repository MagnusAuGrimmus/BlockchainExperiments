pragma solidity ^0.4.19;

import "../contracts/utils/Group.sol";
import "../contracts/utils/Claim.sol";
import "../contracts/utils/IterableMapping_Integer_Claim.sol";
import "truffle/Assert.sol";

contract GroupTest
{
    using Group for Group.Data;
    using Claim for Claim.Data;
    using IterableSet_Integer for IterableSet_Integer.Data;
    using IterableMapping_Integer_Claim for IterableMapping_Integer_Claim.Data;
    Group.Data group;

    function testUser() public
    {
        address addr = msg.sender;
        Assert.isFalse(group.hasUser(addr), "Should not allow a user to be in the system before add");
        group.addUser(addr);
        Assert.isTrue(group.hasUser(addr), "Add user failed");
        group.removeUser(addr);
        Assert.isFalse(group.hasUser(addr), "Remove user failed");
    }

    function testClaim() public
    {
        Claim.Data claim;
        claim.id = 1;
        claim.time = 0;
        claim.access = Claim.Type.WRITE;
        uint id = 1;
        Assert.isFalse(group.shares.containsKey(id), "Claim should not be added");
        group.addClaim(id, claim);
        Assert.isTrue(group.shares.containsKey(id), "Claim not added");
        group.removeClaim(id);
        Assert.isFalse(group.shares.containsKey(id), "Claim not removed");
    }

    function testAddGroup() public
    {
        Group.Data group1;
        group1.id = 10;
        group.addGroup(group1);
        uint[] memory subGroups = group.subGroups.iterator();
        Assert.equal(subGroups[0], group1.id, "SubGroup ID not added");
        uint[] memory parentGroups = group1.parentGroups.iterator();
        Assert.equal(parentGroups[0], group.id, "Parent Group ID not added");
    }
}
