pragma solidity ^0.4.13;

import "./IterableSet_Address.sol";
import "./IterableMapping_Integer_Claim.sol";
import "./IterableSet_Address.sol";
import "./Claim.sol";

library Group
{
    using IterableSet_Address for IterableSet_Address.Data;
    using IterableMapping_Integer_Claim for IterableMapping_Integer_Claim.Data;
    using Claim for Claim.Data;

    struct Data
    {
        uint id;
        uint authorizedWrite;
        uint authorizedRead;
        IterableSet_Address.Data owners;
        IterableSet_Address.Data users;
        IterableMapping_Integer_Claim.Data shares;
    }

//    modifier isOwner(Data storage self) //Had to remove due to internal compiler error
//    {
//        require(hasOwner(self));
//        _;
//    }

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
