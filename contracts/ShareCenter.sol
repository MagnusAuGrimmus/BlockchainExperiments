pragma solidity ^0.4.19;

import "./utils/Set.sol";
import "./utils/IterableSet_Integer.sol";
import "./utils/IterableSet_Address.sol";
import "./utils/IterableMapping_Address_Claim.sol";
import "./utils/Claim.sol";
import "./utils/Group.sol";

contract ShareCenter
{
    enum ErrorCode {
      IS_NOT_OWNER, // 0
      USER_ALREADY_EXISTS, // 1
      IS_NOT_A_USER, // 2
      IS_NOT_A_REGISTERED_SYSTEM, // 3
      DOES_NOT_OWN_SHARE, // 4
      DOES_NOT_HAVE_SHARE, // 5
      SHARE_DOES_NOT_EXIST, // 6
      GROUP_NOT_ACTIVE, //7
      NOT_IN_GROUP //8
    }

    using IterableSet_Integer for IterableSet_Integer.Data;
    using IterableSet_Address for IterableSet_Address.Data;
    using IterableMapping_Address_Claim for IterableMapping_Address_Claim.Data;
    using IterableMapping_Integer_Claim for IterableMapping_Integer_Claim.Data;
    using Set for Set.Data;
    using Claim for Claim.Data;
    using Group for Group.Data;

    struct RecordShare {
        uint id;
        bytes32 uri;
        IterableMapping_Integer_Claim.Data groups;
    }

    struct User {
        uint id;
        uint personalGroupID;
        bytes32 name;
        IterableSet_Integer.Data groups;
    }

    Set.Data authorizedSystems;
    address owner;
    mapping(address => User) users;
    mapping(uint => Group.Data) groups;
    mapping(uint => RecordShare) shares;
    uint shareCounter = 0;
    uint claimCounter = 0;
    uint groupCounter = 0;
    uint userCounter = 0;

    event SystemAdded(address addr);
    event UserAdded(address addr, bytes32 name);
    event GroupAdded(uint groupID, uint subgroupID);
    event GroupCreated(uint id);
    event ShareCreated(uint id, uint groupID, bytes32 uri);
    event ShareDeleted(uint id);
    event WriterAdded(uint shareId, uint groupID);
    event ReaderAdded(uint shareId, uint groupID);
    event WriterRevoked(uint shareId, uint groupID);
    event ReaderRevoked(uint shareId, uint groupID);
    event Error(uint id);

    modifier isOwner()
    {
        if(msg.sender != owner)
            Error(uint(ErrorCode.IS_NOT_OWNER));
        else
            _;
    }

    modifier isUser(address addr)
    {
        if(users[addr].id == 0)
            Error(uint(ErrorCode.IS_NOT_A_USER));
        else
            _;
    }

    modifier isActiveGroup(uint id)
    {
        if(groups[id].id == 0)
            Error(uint(ErrorCode.GROUP_NOT_ACTIVE));
        else
            _;
    }

    modifier isInGroup(address addr, uint id)
    {
        if(!groups[id].isInGroup(addr))
            Error(uint(ErrorCode.NOT_IN_GROUP));
        else
            _;
    }

    modifier isNotUser(address addr)
    {
        if(users[addr].id != 0)
            Error(uint(ErrorCode.USER_ALREADY_EXISTS));
        else
            _;
    }

    modifier isRegisteredSystem()
    {
        if(!authorizedSystems.contains(msg.sender))
            Error(uint(ErrorCode.IS_NOT_A_REGISTERED_SYSTEM));
        else
            _;
    }

    modifier ownShare(uint id)
    {
        if(!canWrite(msg.sender, id))
            Error(uint(ErrorCode.DOES_NOT_OWN_SHARE));
        else
            _;
    }

    modifier hasShare(uint id)
    {
        if(!canWrite(msg.sender, id) && !canRead(msg.sender, id))
            Error(uint(ErrorCode.DOES_NOT_HAVE_SHARE));
        else
            _;
    }

    modifier shareExists(uint id)
    {
        if(shares[id].id == 0)
            Error(uint(ErrorCode.SHARE_DOES_NOT_EXIST));
        else
            _;
    }

    function ShareCenter() public
    {
        owner = msg.sender;
        shareCounter = 0;
        claimCounter = 0;
        groupCounter = 0;
        userCounter = 0;
    }

    function canRead(address addr, uint shareId) public view returns (bool)
    {
        uint[] memory groups = getGroups(addr);
        for(uint i = 0; i < groups.length; i++)
            if(canRead(groups[i], shareId))
                return true;
        return false;
    }

    function canRead(uint groupID, uint shareId) public view returns (bool)
    {
        return groups[groupID].shares.map[shareId].canRead();
    }

    function canWrite(address addr, uint shareId) public view returns (bool)
    {
        User memory user = users[addr];
        if(canWrite(user.personalGroupID, shareId))
            return true;
        for(uint i = 0; i < user.groups.list.length; i++)
            if(canWrite(user.groups.list[i], shareId))
                return true;
        return false;
    }

    function canWrite(uint groupID, uint shareId) public view returns (bool)
    {
        return groups[groupID].shares.map[shareId].canWrite();
    }

    function addSystem(address system) public isOwner returns (bool)
    {
        if(authorizedSystems.add(system))
            SystemAdded(system);
    }

    function getUser(address addr) public isUser(addr) returns (uint, bytes32)
    {
        return (users[addr].id, users[addr].name);
    }

    function createUser(address addr, bytes32 name) public isRegisteredSystem isNotUser(addr)
    {
        users[addr].name = name;
        users[addr].id = ++userCounter;
        UserAdded(addr, name);
        users[addr].personalGroupID = initGroup(addr);
    }

    function getPersonalGroupID(address addr) public view isUser(addr) returns(uint id)
    {
        return users[addr].personalGroupID;
    }

    function getSubGroups(uint groupID) isActiveGroup(groupID) public returns (uint[])
    {
        return groups[groupID].subGroups.iterator();
    }

    function getGroups(address addr) isUser(addr) public returns (uint[] groupIDs)
    {
        uint[] memory extraGroupIDs = users[addr].groups.iterator();
        groupIDs = new uint[](extraGroupIDs.length + 1);
        for(uint i = 0; i < extraGroupIDs.length; i++)
            groupIDs[i] = extraGroupIDs[i];
        groupIDs[extraGroupIDs.length] = getPersonalGroupID(addr);
    }

    function getParentGroups(uint groupID) isActiveGroup(groupID) public returns (uint[])
    {
        return groups[groupID].parentGroups.iterator();
    }

    function initGroup(address addr) internal returns (uint groupID)
    {
        Group.Data storage group = groups[groupCounter + 1];
        group.id = ++groupCounter;
        groups[group.id] = group;
        group.owners.add(addr);
        GroupCreated(group.id);
        return group.id;
    }

    function createGroup(address addr) public returns (uint groupID)
    {
        User storage user = users[addr];
        groupID = initGroup(addr);
        user.groups.add(groupID);
    }

    function addGroup(uint groupID, uint subgroupID) public isActiveGroup(groupID) isActiveGroup(subgroupID)
    {
        groups[groupID].addGroup(groups[subgroupID]);
        GroupAdded(groupID, subgroupID);
    }

    function addUserToGroup(uint groupID, address addr) public isActiveGroup(groupID) isInGroup(msg.sender, groupID) isUser(addr)
    {
        groups[groupID].addUser(addr);
        users[addr].groups.add(groupID);
    }

    function addOwnerToGroup(uint groupID, address addr) public isActiveGroup(groupID) isInGroup(addr, groupID) isUser(addr)
    {
        groups[groupID].addOwner(addr);
    }

    function getShares(uint groupID) public isActiveGroup(groupID) returns (bool found, uint[] idWrite, bytes32[] uriWrite, uint[] idRead, bytes32[] uriRead)
    {
        Group.Data group = groups[groupID];
        return getShares(group);
    }

    function getShares(Group.Data group) internal view returns (bool found, uint[] idWrite, bytes32[] uriWrite, uint[] idRead, bytes32[] uriRead)
    {
        idWrite = new uint[](group.authorizedWrite);
        uriWrite = new bytes32[](group.authorizedWrite);
        idRead = new uint[](group.authorizedRead);
        uriRead = new bytes32[](group.authorizedRead);
        uint indexWrite = 0;
        uint indexRead = 0;
        for(uint i = 0; i < group.shares.list.length; i++)
        {
            uint id = group.shares.list[i];
            RecordShare memory share = shares[id];
            if(canWrite(group.id, id))
            {
                idWrite[indexWrite] = share.id;
                uriWrite[indexWrite] = share.uri;
                indexWrite++;
            }
            else if(canRead(group.id, id))
            {
                idRead[indexRead] = share.id;
                uriRead[indexRead] = share.uri;
                indexRead++;
            }
        }
        found = true;
    }


    function createShare(bytes32 uri, uint groupID) public isUser(msg.sender) returns (uint)
    {
        Claim.Data storage claim;
        Group.Data storage group = groups[groupID];
        uint shareId = ++shareCounter;
        shares[shareId].uri = uri;
        shares[shareId].id = shareId;
        claim.time = 0;
        claim.id = ++claimCounter;
        claim.access = Claim.Type.WRITE;

        shares[shareId].groups.put(group.id, claim);
        group.addClaim(shareId, claim);

        ShareCreated(shareCounter, groupID, uri);
        return shareCounter;
    }

    function deleteShare(uint id) public isUser(msg.sender) shareExists(id) ownShare(id)
    {
        RecordShare storage share = shares[id];
        Group.Data group;
        for(uint i = 0; i < share.groups.list.length; i++)
        {
            group = groups[share.groups.list[i]];
            group.removeClaim(id);
        }
        ShareDeleted(id);
        share.id = 0;
    }

    function authorizeWrite(uint shareId, uint groupID, uint time) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    shareExists(shareId)
    ownShare(shareId)
    {
        if(canWrite(groupID, shareId))
            return;
        Claim.Data claim;
        claim.time = time;
        claim.id = ++claimCounter;
        claim.access = Claim.Type.WRITE;
        shares[shareId].groups.put(groupID, claim);
        groups[groupID].addClaim(shareId, claim);
        require(groups[groupID].shares.map[shareId].canWrite());
        WriterAdded(shareId, groupID);
    }

    function authorizeRead(uint shareId, uint groupID, uint time) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    shareExists(shareId)
    ownShare(shareId)
    {
        if(canRead(groupID, shareId))
            return;
        RecordShare storage share = shares[shareId];
        Claim.Data claim;
        claim.time = time;
        claim.id = ++claimCounter;
        claim.access = Claim.Type.READ;
        share.groups.put(groupID, claim);
        groups[groupID].addClaim(share.id, claim);
        ReaderAdded(shareId, groupID);
    }

    function revokeWrite(uint shareId, uint groupID) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    shareExists(shareId)
    ownShare(shareId)
    {
        if(!canWrite(groupID, shareId))
            return;
        RecordShare storage share = shares[shareId];
        shares[shareId].groups.remove(groupID);
        groups[groupID].removeClaim(share.id);
        WriterRevoked(shareId, groupID);
    }

    function revokeRead(uint shareId, uint groupID) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    shareExists(shareId)
    ownShare(shareId)
    {
        if(!canRead(groupID, shareId))
            return;
        revokeWrite(shareId, groupID);
        RecordShare storage share = shares[shareId];
        shares[shareId].groups.remove(groupID);
        groups[groupID].removeClaim(share.id);
        ReaderRevoked(shareId, groupID);
    }
}