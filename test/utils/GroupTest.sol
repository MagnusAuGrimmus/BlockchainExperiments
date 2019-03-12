pragma solidity ^0.5.0;
import "../../contracts/utils/Group.sol";
import "truffle/Assert.sol";

contract GroupTest
{
    using Group for Group.Data;
    using IterableSet_Integer for IterableSet_Integer.Data;
    using IterableSet_Address for IterableSet_Address.Data;
    Group.Data group;
    Group.Data group1;

    function beforeEach() public
    {
        delete group;
        delete group1;
    }

    function testAddGroup() public
    {
        group1.id = 10;
        group.addGroup(group1);
        uint[] memory subGroups = group.subGroups.iterator();
        Assert.equal(subGroups[0], group1.id, "SubGroup ID not added");
        uint[] memory parentGroups = group1.parentGroups.iterator();
        Assert.equal(parentGroups[0], group.id, "Parent Group ID not added");
    }
}
