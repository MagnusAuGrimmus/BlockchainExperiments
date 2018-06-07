pragma solidity ^0.4.13;

import "./IterableSet_Address.sol";
import "./IterableSet_Integer.sol";
import "./IterableMapping_Integer_Claim.sol";
import "./IterableSet_Address.sol";
import "./Claim.sol";

library Group
{
    using IterableSet_Address for IterableSet_Address.Data;
    using IterableSet_Integer for IterableSet_Integer.Data;
    using IterableMapping_Integer_Claim for IterableMapping_Integer_Claim.Data;
    using Claim for Claim.Data;

    struct Data
    {
        uint id;
        uint authorizedWrite;
        uint authorizedRead;
        address owner;
        IterableSet_Address.Data users;
        IterableSet_Integer.Data parentGroups;
        IterableSet_Integer.Data subGroups;
        IterableMapping_Integer_Claim.Data shares;
    }


    modifier isUser(Data storage self)
    {
        require(hasUser(self, msg.sender));
        _;
    }

    function isActive(Data storage self) internal view returns (bool)
    {
        return self.id != 0;
    }

    function isInGroup(Data storage self, address addr) internal view returns (bool)
    {
        return self.owner == addr || hasUser(self, addr);
    }

    function hasUser(Data storage self, address addr) internal view returns (bool)
    {
        return self.users.contains(addr);
    }

    function addUser(Data storage self, address addr) internal returns (bool)
    {
        return self.users.add(addr);
    }

    function addGroup(Data storage self, Data storage subGroup) internal
    {
        self.subGroups.add(subGroup.id);
        subGroup.parentGroups.add(self.id);
    }

    function addClaim(Data storage self, uint id, Claim.Data storage claim) internal
    {
        if(claim.canWrite())
            self.authorizedWrite++;
        else if(claim.canRead())
            self.authorizedRead++;
        self.shares.put(id, claim);
    }

    function removeClaim(Data storage self, uint id) internal
    {
        Claim.Data claim = self.shares.map[id];
        if(claim.canWrite())
            self.authorizedWrite--;
        else if(claim.canRead())
            self.authorizedRead--;
        self.shares.remove(id);
    }

    function removeUser(Data storage self, address addr) internal returns (bool)
    {
        return self.users.remove(addr);
    }

    function removeGroup(Data storage self, Data storage group) internal
    {
        self.subGroups.remove(group.id);
        group.parentGroups.remove(self.id);
    }
}
