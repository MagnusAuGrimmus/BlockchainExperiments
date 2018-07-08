pragma solidity ^0.4.19;
import "../../contracts/utils/Group.sol";
import "truffle/Assert.sol";

contract GroupTest
{
    using Group for Group.Data;
    using IterableSet_Integer for IterableSet_Integer.Data;
    using IterableSet_Address for IterableSet_Address.Data;
    Group.Data group;

    function beforeEach() public
    {
        delete group;
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
