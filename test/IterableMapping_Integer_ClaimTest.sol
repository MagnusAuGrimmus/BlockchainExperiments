pragma solidity ^0.4.19;

import "./utils/Tester.sol";
import "../contracts/utils/Claim.sol";
import "../contracts/utils/IterableMapping_Integer_Claim.sol";
import "truffle/Assert.sol";

contract IterableMapping_Integer_ClaimTest is Tester
{
    using Claim for Claim.Data;
    using IterableMapping_Integer_Claim for IterableMapping_Integer_Claim.Data;
    IterableMapping_Integer_Claim.Data map;
    Claim.Data claim;
    uint[] target;

    modifier fill(uint size)
    {
        for(uint i = 1; i <= size; i++)
        {
            map.put(i, claim);
            target.push(i);
        }
        _;
    }

    function beforeAll() public
    {
        claim.time = 0;
        claim.id = 100;
        claim.access = Claim.Type.WRITE;
    }

    function beforeEach() public //clears the Claim
    {
        for(uint i = 0; i < map.list.length; i++)
        {
            delete map.map[map.list[i]];
        }
        map.list.length = 0;
        target.length = 0;
    }

    function testContainsKeyOnFakeKey() public
    {
        Assert.isFalse(map.containsKey(0), "Map contains False key");
    }

    function testPut() public
    {
        uint256[3] memory ids = [uint(1), 4, 7];
        for(uint i = 0; i < ids.length; i++)
        {
            map.put(ids[i], claim);
            target.push(ids[i]);
            Assert.isTrue(equal(target, map.list), "Internal lists not equal");
        }
    }

    function testContainsKeyOnRealKey() public
    {
        uint id = 2;
        map.put(id, claim);
        Assert.isTrue(map.containsKey(id), "Could not find key");
    }

    function testRemove() fill(4) public
    {
        map.remove(2);
        target[1] = target[target.length - 1];
        target.length--;
        Assert.isFalse(map.containsKey(2), "Did not remove key");
        Assert.isTrue(equal(target, map.list), "Internal lists not equal");
    }

    function testSize() public
    {
        map.put(0, claim);
        Assert.equal(map.size(), 1, "Size incorrect");
    }
}
