pragma solidity ^0.4.19;

library Set
{
    struct Data {
        uint size;
        mapping(address => bool) flags;
    }

    function contains(Data storage self, address value) internal view returns (bool)
    {
        return self.flags[value];
    }

    function add(Data storage self, address value) internal returns (bool)
    {
        if(contains(self, value))
            return false;
        self.flags[value] = true;
        self.size++;
        return true;
    }

    function remove(Data storage self, address value) internal returns (bool)
    {
        if(!contains(self, value))
            return false;
        self.flags[value] = false;
        self.size--;
        return true;
    }
}