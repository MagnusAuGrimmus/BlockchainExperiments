pragma solidity ^0.4.19;

import "./IterableSet_Address.sol";
import "./IterableMapping_Integer_Claim.sol";
import "./IterableSet_Address.sol";
import "./Claim.sol";

library Group
{
    using IterableSet_Address for IterableSet_Address.Data;
    using IterableMapping_Integer_Claim for IterableMapping_Integer_Claim.Data;
    struct Data
    {
        uint id;
        IterableSet_Address.Data owners;
        IterableSet_Address.Data users;
        IterableMapping_Integer_Claim.Data shares;
    }

    modifier isOwner(Data storage self)
    {
        require(hasOwner(self));
        _;
    }

    modifier isUser(Data storage self)
    {
        require(hasUser(self));
        _;
    }

//    function getUsers(Data storage self) isUser(self) public view returns (address[])
//    {
//        return self.users.iterator();
//    }

    function isActive(Data storage self) internal view returns (bool)
    {
        return self.id != 0;
    }

    function hasOwner(Data storage self) internal view returns (bool)
    {
        return self.owners.contains(msg.sender);
    }

    function hasUser(Data storage self)internal view returns (bool)
    {
        return self.users.contains(msg.sender);
    }

    function addUser(Data storage self, address addr) internal isOwner(self) returns (bool)
    {
        return self.users.add(addr);
    }

    function addOwner(Data storage self, address addr) internal isOwner(self) returns (bool)
    {
        self.users.remove(addr);
        return self.owners.add(addr);
    }

    function addClaim(Data storage self, uint id, Claim.Data claim) internal
    {
        self.shares.put(id, claim);
    }

    function removeClaim(Data storage self, uint id) internal
    {
        self.shares.map[id].access = Claim.Type.INACTIVE;
        self.shares.remove(id);
    }

    function removeUser(Data storage self, address addr) isOwner(self) internal returns (bool)
    {
        removeOwner(self, addr);
        return self.users.remove(addr);
    }

    function removeOwner(Data storage self, address addr) isOwner(self) internal returns (bool)
    {
        return self.owners.remove(addr);
    }
}
