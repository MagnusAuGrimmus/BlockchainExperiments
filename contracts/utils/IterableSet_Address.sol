pragma solidity ^0.4.18;

library IterableSet_Address
{
    struct Data {
        mapping(address => uint) indices;
        address[] list;
    }

    function size(Data storage self) public view returns (uint)
    {
        return self.list.length;
    }

    function contains(Data storage self, address value) public view returns (bool)
    {
        return self.list.length != 0 && self.list[self.indices[value]] == value;
    }

    function add(Data storage self, address value) public returns (bool)
    {
        if(contains(self, value))
            return false;
        self.indices[value] = self.list.push(value) - 1;
        return true;
    }

    function remove(Data storage self, address value) public returns (bool)
    {
        if(!contains(self, value))
            return false;
        uint toRemove = self.indices[value];
        address temp = self.list[self.list.length - 1];
        self.indices[temp] = toRemove;
        self.indices[value] = 0;
        self.list[toRemove] = temp;
        self.list.length--;
        return true;
    }
}