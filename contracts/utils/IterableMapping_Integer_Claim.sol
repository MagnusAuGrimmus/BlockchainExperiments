pragma solidity ^0.4.19;

import "./Claim.sol";
import "./ArrayUtils.sol";

library IterableMapping_Integer_Claim
{
    using ArrayUtils for *;
    struct Data
    {
        mapping(uint => Claim.Data) map;
        uint[] list;
    }

    function size(Data storage self) internal view returns (uint)
    {
        return self.list.length;
    }

    function containsKey(Data storage self, uint val) internal view returns (bool)
    {
        return self.map[val].id != 0;
    }

    function put(Data storage self, uint val, Claim.Data claim) internal
    {
        if(!containsKey(self, val))
            self.list.push(val);
        self.map[val] = claim;
    }

    function remove(Data storage self, uint val) internal returns (bool)
    {
        if(!containsKey(self, val))
            return false;
        var (_, toRemove) = ArrayUtils.indexOf(self.list, val);
        uint temp = self.list[self.list.length - 1];
        self.map[val].id = 0;
        self.list[toRemove] = temp;
        self.list.length--;
        return true;
    }
}

