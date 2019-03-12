pragma solidity ^0.5.0;

import "./../Tester.sol";
import "../../contracts/utils/IterableSet_Address.sol";
import "truffle/Assert.sol";

contract IterableSet_AddressTest is Tester
{
    using IterableSet_Address for IterableSet_Address.Data;
    address[] data;
    address[] testList;
    IterableSet_Address.Data set;


    function beforeAll() public
    {
        data.push(address(0x1));
        data.push(address(0x2));
        data.push(address(0x3));
    }

    function testInit() public
    {
        Assert.equal(0, set.size(), "Set size not initialized correctly");
        for(uint i = 0; i < data.length; i++)
            Assert.isFalse(set.contains(data[i]), "Set not initially empty");
    }

    function testAdd() public
    {
        for(uint i = 0; i < data.length - 1; i++) //Not adding the last value for contains and remove testing
        {
            Assert.isTrue(set.add(data[i]), "Set did not add value correctly");
            testList.push(data[i]);
            Assert.isTrue(equal(testList, set.list), "Internal list not correct");
            Assert.equal(set.indices[data[i]], i, "Index not set correctly");
            Assert.isFalse(set.add(data[i]), "Set added value twice");
            Assert.isTrue(equal(testList, set.list), "Internal list was modified incorrectly");
        }
    }

    function testContains() public
    {
        for(uint i = 0; i < data.length - 1; i++)
            Assert.isTrue(set.contains(data[i]), "Set could not recognize item in set");
        Assert.isFalse(set.contains(data[data.length - 1]), "Set detect number not in it");
    }

    function testRemove() public
    {
        for(uint i = 0; i < data.length - 1; i++)
        {
            Assert.isTrue(set.remove(data[i]), "Could not remove an item in set");
            if(i == 0)
            {
                testList[i] = testList[testList.length - 1];
                testList.length--;
            }
            else
                testList.length--;
            Assert.isTrue(equal(testList, set.list), "Internal list not correct");
            Assert.isFalse(set.remove(data[i]), "Set removed item twice");
            Assert.isTrue(equal(testList, set.list), "Internal list was modified after fake remove");
        }
        Assert.isFalse(set.remove(data[data.length - 1]), "Set removed nonexistent element");
    }

    function testContainsAfterRemove() public
    {
        for(uint i = 0; i < data.length; i++)
        {
            Assert.isFalse(set.contains(data[i]), "Set contains does not work after remove");
        }
    }
}