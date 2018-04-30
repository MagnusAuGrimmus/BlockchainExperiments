pragma solidity ^0.4.19;

import "./Group.sol";

library IterableSet_Group {
    struct Data {
        mapping(uint => uint) indices;
        Group.Data[] list;
    }

    function size(Data storage self) internal view returns (uint)
    {
        return self.list.length;
    }

    function contains(Data storage self, Group.Data group) internal view returns (bool)
    {
        return self.list.length != 0 && self.list[self.indices[group.id]].id == group.id;
    }

    function add(Data storage self, Group.Data group) internal returns (bool)
    {
        if(contains(self, group))
            return false;
        self.indices[group.id] = self.list.push(group) - 1;
        return true;
    }

    function remove(Data storage self, Group.Data group) internal returns (bool)
    {
        if(!contains(self, group))
            return false;
        uint toRemove = self.indices[group.id];
        Group.Data temp = self.list[self.list.length - 1];
        self.indices[temp.id] = toRemove;
        delete self.indices[group.id];
        self.list[toRemove] = temp;
        self.list.length--;
        return true;
    }
}
