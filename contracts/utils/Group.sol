pragma solidity ^0.5.0;

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
        IterableSet_Address.Data writers;
        IterableSet_Integer.Data blacklistedGroups;
        IterableSet_Address.Data blacklistedUsers;
        IterableSet_Integer.Data shareGroups; // groups that have given you access to their shares
        IterableSet_Integer.Data shares;
    }

    function isActive(Data storage self) internal view returns (bool)
    {
        return self.id != 0;
    }
}
