pragma solidity ^0.4.13;

import "./IterableSet_Address.sol";
import "./IterableSet_Integer.sol";

library Group
{
    using IterableSet_Address for IterableSet_Address.Data;
    using IterableSet_Integer for IterableSet_Integer.Data;

    struct Data
    {
        uint id;
        address owner;
        IterableSet_Address.Data users;
        IterableSet_Integer.Data parentGroups;
        IterableSet_Integer.Data subGroups;
        IterableSet_Integer.Data pendingShares;
        IterableSet_Integer.Data shares;
    }

    function isActive(Data storage self) internal view returns (bool)
    {
        return self.id != 0;
    }

    function isInGroup(Data storage self, address addr) internal view returns (bool)
    {
        return self.owner == addr || self.users.contains(addr);
    }

    function getUsers(Data storage self) internal view returns (address[] users)
    {
        users = new address[](self.users.list.length + 1);
        for(uint i = 0; i < users.length - 1; i++)
            users[i] = self.users.list[i];
        users[users.length - 1] = self.owner;
        return users;
    }

    function addGroup(Data storage self, Data storage subGroup) internal
    {
        self.subGroups.add(subGroup.id);
        subGroup.parentGroups.add(self.id);
    }

    function removeGroup(Data storage self, Data storage group) internal
    {
        self.subGroups.remove(group.id);
        group.parentGroups.remove(self.id);
    }
}
