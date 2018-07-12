pragma solidity ^0.4.18;

import "./../Tester.sol";
import "../../contracts/utils/IterableSet_Pair.sol";
import "truffle/Assert.sol";

contract IterableSet_PairTest is Tester
{
    using IterableSet_Pair for IterableSet_Pair.Data;
    uint[] data1; uint[] data2;
    uint[] testList1; uint[] testList2;
    IterableSet_Pair.Data set;


    function beforeAll() public
    {
        data1.push(1);
        data1.push(2);
        data1.push(3);
        data2.push(4);
        data2.push(5);
        data2.push(6);
    }

    function testInit() public
    {
        Assert.equal(0, set.size(), "Set size not initialized correctly");
        for(uint i = 0; i < data1.length; i++)
            Assert.isFalse(set.contains(data1[i], data2[i]), "Set not initially empty");
    }

    function testAdd() public
    {
        for(uint i = 0; i < data1.length - 1; i++) //Not adding the last value for contains and remove testing
        {
            Assert.isTrue(set.add(data1[i], data2[i]), "Set did not add value correctly");
            testList1.push(data1[i]);
            testList2.push(data2[i]);
            Assert.isTrue(equal(testList1, set.list1), "Internal list1 not correct");
            Assert.isTrue(equal(testList2, set.list2), "Internal list2 not correct");
            Assert.equal(set.indices[data1[i]][data2[i]], i, "Index not set correctly");
            Assert.isFalse(set.add(data1[i], data2[i]), "Set added value twice");
            Assert.isTrue(equal(testList1, set.list1), "Internal list was modified incorrectly");
            Assert.isTrue(equal(testList2, set.list2), "Internal list was modified incorrectly");
        }
    }

    function testContains() public
    {
        for(uint i = 0; i < data1.length - 1; i++)
            Assert.isTrue(set.contains(data1[i], data2[i]), "Set could not recognize item in set");
        Assert.isFalse(set.contains(data1[data1.length - 1], data2[data2.length - 1]), "Set detect number not in it");
    }

    function testRemove() public
    {
        for(uint i = 0; i < data1.length - 1; i++)
        {
            Assert.isTrue(set.remove(data1[i], data2[i]), "Could not remove an item in set");
            if(i == 0)
            {
                testList1[i] = testList1[testList1.length - 1];
                testList2[i] = testList2[testList2.length - 1];
            }
            testList1.length--;
            testList2.length--;
            Assert.isTrue(equal(testList1, set.list1), "Internal list not correct");
            Assert.isTrue(equal(testList2, set.list2), "Internal list not correct");
            Assert.isFalse(set.remove(data1[i], data2[i]), "Set removed item twice");
            Assert.isTrue(equal(testList1, set.list1), "Internal list was modified after fake remove");
            Assert.isTrue(equal(testList2, set.list2), "Internal list was modified after fake remove");
        }
        Assert.isFalse(set.remove(data1[data1.length - 1], data2[data2.length - 1]), "Set removed nonexistent element");
    }

    function testContainsAfterRemove() public
    {
        for(uint i = 0; i < data1.length; i++)
        {
            Assert.isFalse(set.contains(data1[i], data2[i]), "Set contains does not work after remove");
        }
    }
}
