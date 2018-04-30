pragma solidity ^0.4.13;

import "./IterableSet_Address.sol";
import "./IterableSet_Group.sol";
import "./IterableMapping_Integer_Claim.sol";
import "./IterableSet_Address.sol";
import "./Claim.sol";

library Group
{
    using IterableSet_Address for IterableSet_Address.Data;
    using IterableMapping_Integer_Claim for IterableMapping_Integer_Claim.Data;
    using IterableSet_Group for IterableSet_Group.Data;
    using Claim for Claim.Data;

    struct Data
    {
        uint id;
        uint authorizedWrite;
        uint authorizedRead;
        IterableSet_Address.Data owners;
        IterableSet_Address.Data users;
        IterableSet_Group.Data membership; //parents
        IterableSet_Group.Data manifest; //children
        IterableMapping_Integer_Claim.Data shares;
    }


    modifier isUser(Data storage self)
    {
        require(hasUser(self));
        _;
    }

    function isActive(Data storage self) internal view returns (bool)
    {
        return self.id != 0;
    }

    function hasOwner(Data storage self) internal view returns (bool)
    {
        return self.owners.contains(msg.sender);
    }

    function hasUser(Data storage self) internal view returns (bool)
    {
        return self.users.contains(msg.sender);
    }

    function addUser(Data storage self, address addr) internal returns (bool)
    {
        return self.users.add(addr);
    }

    function addOwner(Data storage self, address addr) internal returns (bool)
    {
        self.users.remove(addr);
        return self.owners.add(addr);
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
        removeOwner(self, addr);
        return self.users.remove(addr);
    }

    function removeOwner(Data storage self, address addr) internal returns (bool)
    {
        return self.owners.remove(addr);
    }
}
