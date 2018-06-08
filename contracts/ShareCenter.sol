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
        bytes32 host;
        bytes32 path;
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
    event GroupRemoved(uint groupID, uint subgroupID);
    event GroupCreated(uint id);
    event ShareCreated(uint id, uint groupID, bytes32 host, bytes32 path);
    event ShareDeleted(uint id);
    event WriterAdded(uint shareID, uint groupID);
    event ReaderAdded(uint shareID, uint groupID);
    event WriterRevoked(uint shareID, uint groupID);
    event ReaderRevoked(uint shareID, uint groupID);
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

    function canRead(address addr, uint shareID) public view returns (bool)
    {
        uint[] memory groups = getGroups(addr);
        for(uint i = 0; i < groups.length; i++)
            if(canRead(groups[i], shareID))
                return true;
        return false;
    }

    function canRead(uint groupID, uint shareID) public view returns (bool)
    {
        return groups[groupID].shares.map[shareID].canRead();
    }

    function canWrite(address addr, uint shareID) public view returns (bool)
    {
        User memory user = users[addr];
        if(canWrite(user.personalGroupID, shareID))
            return true;
        for(uint i = 0; i < user.groups.list.length; i++)
            if(canWrite(user.groups.list[i], shareID))
                return true;
        return false;
    }

    function canWrite(uint groupID, uint shareID) public view returns (bool)
    {
        return groups[groupID].shares.map[shareID].canWrite();
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
        group.owner = addr;
        GroupCreated(group.id);
        return group.id;
    }

    function createGroup(address addr) public isUser(addr) returns (uint groupID)
    {
        User storage user = users[addr];
        groupID = initGroup(addr);
        user.groups.add(groupID);
    }

    function addGroupToGroup(uint groupID, uint subgroupID) public isActiveGroup(groupID) isActiveGroup(subgroupID)
    {
        groups[groupID].addGroup(groups[subgroupID]);
        GroupAdded(groupID, subgroupID);
    }

    function removeGroupFromGroup(uint groupID, uint subgroupID) public isActiveGroup(groupID) isActiveGroup(subgroupID)
    {
        groups[groupID].removeGroup(groups[subgroupID]);
        GroupRemoved(groupID, subgroupID);
    }

    function addUserToGroup(uint groupID, address addr) public isActiveGroup(groupID) isInGroup(msg.sender, groupID) isUser(addr)
    {
        groups[groupID].addUser(addr);
        users[addr].groups.add(groupID);
    }

    function getShares(uint groupID) public view isActiveGroup(groupID) returns (bool found, uint[] idWrite, bytes32[] hostWrite, bytes32[] pathWrite, uint[] idRead, bytes32[] hostRead, bytes32[] pathRead)
    {
        Group.Data group = groups[groupID];
        return getShares(group);
    }

    function getShares(Group.Data group) internal view returns (bool found, uint[] idWrite, bytes32[] hostWrite, bytes32[] pathWrite, uint[] idRead, bytes32[] hostRead, bytes32[] pathRead)
    {
        ( idWrite, hostWrite, pathWrite ) = getAuthorizedWrite(group);
        ( idRead, hostRead, pathRead ) = getAuthorizedRead(group);
        found = true;
    }

    function getAuthorizedWrite(Group.Data group) internal view returns (uint[] idWrite, bytes32[] hostWrite, bytes32[] pathWrite)
    {
        idWrite = new uint[](group.authorizedWrite);
        hostWrite = new bytes32[](group.authorizedWrite);
        pathWrite = new bytes32[](group.authorizedWrite);
        uint index = 0;
        uint shareID = 0;
        RecordShare memory share;
        for(uint i = 0; i < group.shares.list.length && index < group.authorizedWrite; i++)
        {
            shareID = group.shares.list[i];
            if(canWrite(group.id, shareID))
            {
                share = shares[shareID];
                idWrite[index] = share.id;
                hostWrite[index] = share.host;
                pathWrite[index] = share.path;
                index++;
            }
        }
    }

    function getAuthorizedRead(Group.Data group) internal view returns (uint[] idRead, bytes32[] hostRead, bytes32[] pathRead)
    {
        idRead = new uint[](group.authorizedRead);
        hostRead = new bytes32[](group.authorizedRead);
        pathRead = new bytes32[](group.authorizedRead);
        uint index = 0;
        uint shareID = 0;
        RecordShare memory share;
        for(uint i = 0; i < group.shares.list.length && index < group.authorizedRead; i++)
        {
            shareID = group.shares.list[i];
            if(canRead(group.id, shareID))
            {
                share = shares[shareID];
                idRead[index] = share.id;
                hostRead[index] = share.host;
                pathRead[index] = share.path;
                index++;
            }
        }
    }


    function createShare(bytes32 host, bytes32 path, uint groupID) public isUser(msg.sender) returns (uint)
    {
        Claim.Data storage claim;
        Group.Data storage group = groups[groupID];
        uint shareID = ++shareCounter;
        shares[shareID].host = host;
        shares[shareID].path = path;
        shares[shareID].id = shareID;
        claim.time = 0;
        claim.id = ++claimCounter;
        claim.access = Claim.Type.WRITE;

        shares[shareID].groups.put(group.id, claim);
        group.addClaim(shareID, claim);

        ShareCreated(shareCounter, groupID, host, path);
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

    function authorizeWrite(uint shareID, uint groupID, uint time) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    shareExists(shareID)
    ownShare(shareID)
    {
        if(canWrite(groupID, shareID))
            return;
        Claim.Data claim;
        claim.time = time;
        claim.id = ++claimCounter;
        claim.access = Claim.Type.WRITE;
        shares[shareID].groups.put(groupID, claim);
        groups[groupID].addClaim(shareID, claim);
        require(groups[groupID].shares.map[shareID].canWrite());
        WriterAdded(shareID, groupID);
    }

    function authorizeRead(uint shareID, uint groupID, uint time) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    shareExists(shareID)
    ownShare(shareID)
    {
        if(canRead(groupID, shareID))
            return;
        RecordShare storage share = shares[shareID];
        Claim.Data claim;
        claim.time = time;
        claim.id = ++claimCounter;
        claim.access = Claim.Type.READ;
        share.groups.put(groupID, claim);
        groups[groupID].addClaim(share.id, claim);
        ReaderAdded(shareID, groupID);
    }

    function revokeWrite(uint shareID, uint groupID) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    shareExists(shareID)
    ownShare(shareID)
    {
        if(!canWrite(groupID, shareID))
            return;
        RecordShare storage share = shares[shareID];
        shares[shareID].groups.remove(groupID);
        groups[groupID].removeClaim(share.id);
        WriterRevoked(shareID, groupID);
    }

    function revokeRead(uint shareID, uint groupID) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    shareExists(shareID)
    ownShare(shareID)
    {
        if(!canRead(groupID, shareID))
            return;
        revokeWrite(shareID, groupID);
        RecordShare storage share = shares[shareID];
        shares[shareID].groups.remove(groupID);
        groups[groupID].removeClaim(share.id);
        ReaderRevoked(shareID, groupID);
    }
}