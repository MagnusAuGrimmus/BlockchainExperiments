pragma solidity ^0.4.19;

import "../../contracts/utils/ArrayUtils.sol";
import "truffle/Assert.sol";

contract ArrayUtilsTest
{
    using ArrayUtils for uint[];
    uint[] arr;
    uint[] arr1;
    uint[] arr2;
    function beforeAll() public
    {
        for(uint i = 1; i <= 10; i++)
            arr.push(i);
    }

    function testIndexOf() public
    {
        uint index;
        for(uint i = 1; i <= 10; i++)
        {
            index = arr.indexOf(i);
            Assert.equal(index, i - 1, "Incorrect index");
        }
        index = arr.indexOf(i);
        Assert.equal(index, uint(-1), "Found fake item");
    }

    function testEqual() public
    {
        arr1.push(1); arr1.push(2); arr1.push(3);
        arr2.push(1); arr2.push(2);
        Assert.isFalse(arr1.equal(arr2), "Should not be equal");
        arr2.push(3);
        Assert.isTrue(arr1.equal(arr2), "Should be equal");
    }
}
