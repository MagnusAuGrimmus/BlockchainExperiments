pragma solidity ^0.5.0;

library IterableSet_Pair
{
    struct Data {
        bool active;
        mapping(uint => mapping(uint => uint)) indices;
        uint[] list1;
        uint[] list2;
    }

    function size(Data storage self) internal view returns (uint)
    {
        return self.list1.length;
    }

    function contains(Data storage self, uint value1, uint value2) internal view returns (bool)
    {
        uint index = self.indices[value1][value2];
        return self.list1.length != 0 && self.list1[index] == value1 && self.list2[index] == value2;
    }

    function add(Data storage self, uint value1, uint value2) internal returns (bool)
    {
        if(contains(self, value1, value2))
            return false;
        self.indices[value1][value2] = self.list1.length;
        self.list1.push(value1);
        self.list2.push(value2);
        return true;
    }

    function remove(Data storage self, uint value1, uint value2) internal returns (bool)
    {
        if(!contains(self, value1, value2))
            return false;
        uint toRemove = self.indices[value1][value2];
        delete self.indices[value1][value2];
        uint temp1 = self.list1[self.list1.length - 1];
        uint temp2 = self.list2[self.list2.length - 1];
        self.indices[temp1][temp2] = toRemove;
        self.list1[toRemove] = temp1;
        self.list1.length--;
        self.list2[toRemove] = temp2;
        self.list2.length--;
        return true;
    }

    function iterator(Data storage self) internal view returns (uint[] memory list1, uint[] memory list2)
    {
        list1 = new uint[](self.list1.length);
        list2 = new uint[](self.list1.length);
        for(uint i = 0; i < self.list1.length; i++)
        {
            list1[i] = self.list1[i];
            list2[i] = self.list2[i];
        }
    }
}