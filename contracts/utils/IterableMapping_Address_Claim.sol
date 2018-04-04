pragma solidity ^0.4.19;
import "./Claim.sol";
import "./ArrayUtils.sol";

library IterableMapping_Address_Claim
{
    using ArrayUtils for *;
    struct Data
    {
        mapping(address => Claim.Data) map;
        address[] list;
    }

    function size(Data storage self) internal view returns (uint)
    {
        return self.list.length;
    }

    function containsKey(Data storage self, address addr) internal view returns (bool)
    {
        return self.map[addr].id != 0;
    }

    function put(Data storage self, address addr, Claim.Data claim) internal returns (bool)
    {
        if(!containsKey(self, addr))
            self.list.push(addr);
        self.map[addr] = claim;
    }

    function remove(Data storage self, address addr) internal returns (bool)
    {
        if(!containsKey(self, addr))
            return false;
        var (_, toRemove) = ArrayUtils.indexOf(self.list, addr);
        address temp = self.list[self.list.length - 1];
        self.map[addr].id = 0;
        self.list[toRemove] = temp;
        self.list.length--;
        return true;
    }
}
