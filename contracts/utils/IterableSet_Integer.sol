pragma solidity ^0.5.0;

library IterableSet_Integer
{
    struct Data {
        bool active;
        mapping(uint => uint) indices;
        uint[] list;
    }

    function size(Data storage self) internal view returns (uint)
    {
        return self.list.length;
    }

    function contains(Data storage self, uint value) internal view returns (bool)
    {
        return self.list.length != 0 && self.list[self.indices[value]] == value;
    }

    function add(Data storage self, uint value) internal returns (bool)
    {
        if(contains(self, value))
            return false;
        self.indices[value] = self.list.push(value) - 1;
        return true;
    }

    function remove(Data storage self, uint value) internal returns (bool)
    {
        if(!contains(self, value))
            return false;
        uint toRemove = self.indices[value];
        uint temp = self.list[self.list.length - 1];
        self.indices[temp] = toRemove;
        delete self.indices[value];
        self.list[toRemove] = temp;
        self.list.length--;
        return true;
    }

    function iterator(Data storage self) internal view returns (uint[] memory list)
    {
        list = new uint[](self.list.length);
        for(uint i = 0; i < list.length; i++)
            list[i] = self.list[i];
    }
}