pragma solidity ^0.4.19;
import "./utils/IterableSet_Integer.sol";
import "./utils/IterableSet_Address.sol";
import "./utils/Group.sol";
import "./utils/Claim.sol";

//TODO: Give gas back on blacklist
//TODO: Add blacklist error code

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
        GROUP_NOT_ACTIVE, // 7
        NOT_IN_GROUP, // 8
        NOT_OWNER_OF_GROUP, // 9
        IN_GROUP, // 10
        IS_PENDING_GROUP // 11
    }

    using IterableSet_Integer for IterableSet_Integer.Data;
    using IterableSet_Address for IterableSet_Address.Data;
    using Group for Group.Data;
    using Claim for Claim.Data;

    struct RecordShare {
        address owner;
        uint id;
        uint groupID;
        bytes32 host;
        bytes32 path;
        Claim.Data claim;
    }

    struct User {
        bool active;
        address system;
        IterableSet_Integer.Data groups;
        IterableSet_Integer.Data pending;
        IterableSet_Integer.Data pendingGroupIDs;
        mapping(uint => uint) pendingSubGroupIDs;
        IterableSet_Address.Data whitelist;
        IterableSet_Address.Data blacklist;
    }

    address owner;
    mapping(address => IterableSet_Address.Data) authorizedSystems;
    mapping(address => User) users;
    mapping(uint => Group.Data) groups;
    mapping(uint => RecordShare) shares;
    uint shareCounter = 0;
    uint groupCounter = 0;

    event SystemAdded(address addr, address sender);
    event UserCreated(address addr, address sender);
    event UserAdded(address addr, uint groupID, address sender);
    event GroupAdded(uint groupID, uint subgroupID, address sender);
    event GroupRemoved(uint groupID, uint subgroupID, address sender);
    event GroupCreated(uint id, address sender);
    event ShareAdded(uint id, uint groupID, bytes32 host, bytes32 path, uint time, uint access, address sender);
    event ShareDeleted(uint id, address sender);
    event Error(uint id);

    modifier isOwner()
    {
        if(msg.sender != owner)
            emit Error(uint(ErrorCode.IS_NOT_OWNER));
        else
            _;
    }

    modifier isUser(address addr)
    {
        if(!users[addr].active)
            emit Error(uint(ErrorCode.IS_NOT_A_USER));
        else
            _;
    }

    modifier isActiveGroup(uint id)
    {
        if(groups[id].id == 0)
            emit Error(uint(ErrorCode.GROUP_NOT_ACTIVE));
        else
            _;
    }

    modifier ownsGroup(address addr, uint id)
    {
        if(groups[id].owner != addr)
            emit Error(uint(ErrorCode.NOT_OWNER_OF_GROUP));
        else
            _;
    }

    modifier isInGroup(address addr, uint id)
    {
        if(!groups[id].isInGroup(addr))
            emit Error(uint(ErrorCode.NOT_IN_GROUP));
        else
            _;
    }

    modifier notInGroup(address addr, uint id)
    {
        if(groups[id].isInGroup(addr))
            emit Error(uint(ErrorCode.IN_GROUP));
        else
            _;
    }

    modifier isNotUser(address addr)
    {
        if(users[addr].active)
            emit Error(uint(ErrorCode.USER_ALREADY_EXISTS));
        else
            _;
    }

    modifier isRegisteredSystem()
    {
        if(!authorizedSystems[msg.sender].active)
            emit Error(uint(ErrorCode.IS_NOT_A_REGISTERED_SYSTEM));
        else
            _;
    }

    modifier ownShare(uint id)
    {
        if(!canWrite(msg.sender, id))
            emit Error(uint(ErrorCode.DOES_NOT_OWN_SHARE));
        else
            _;
    }

    modifier hasShare(uint id)
    {
        if(!canWrite(msg.sender, id) && !canRead(msg.sender, id))
            emit Error(uint(ErrorCode.DOES_NOT_HAVE_SHARE));
        else
            _;
    }

    modifier shareExists(uint id)
    {
        if(shares[id].id == 0)
            emit Error(uint(ErrorCode.SHARE_DOES_NOT_EXIST));
        else
            _;
    }

    modifier isPendingGroup(uint groupID)
    {
        if(users[msg.sender].pending.contains(groupID) || users[msg.sender].pendingGroupIDs.contains(groupID))
            _;
        else
            emit Error(uint(ErrorCode.IS_PENDING_GROUP));
    }

    constructor() public
    {
        owner = msg.sender;
    }

    function canRead(address addr, uint shareID) public view
    returns (bool)
    {
        (, uint[] memory groupIDs) = getGroupIDs(addr);
        for(uint i = 0; i < groupIDs.length; i++)
            if(canRead(groupIDs[i], shareID))
                return true;
        return false;
    }

    function canRead(uint groupID, uint shareID) internal view
    returns (bool)
    {
        return groups[groupID].shares.contains(shareID) && shares[shareID].claim.canRead();
    }

    function canWrite(address addr, uint shareID) public view
    returns (bool)
    {
        User memory user = users[addr];
        for(uint i = 0; i < user.groups.list.length; i++)
            if(canWrite(user.groups.list[i], shareID))
                return true;
        return false;
    }

    function canWrite(uint groupID, uint shareID) internal view
    returns (bool)
    {
        return groups[groupID].shares.contains(shareID) && shares[shareID].claim.canWrite();
    }

    function isAddedSystem(address system) public view
    returns (bool)
    {
        return authorizedSystems[system].active;
    }

    function addSystem(address system) public
    isOwner
    {
        if(!authorizedSystems[system].active)
        {
            authorizedSystems[system].active = true;
            emit SystemAdded(system, msg.sender);
        }
    }

    function getUsers(uint groupID) public
    isActiveGroup(groupID)
    returns (bool, address[])
    {
        return (true, groups[groupID].getUsers());
    }

    function createUser(address addr) public
    isRegisteredSystem
    isNotUser(addr)
    {
        users[addr].active = true;
        users[addr].system = msg.sender;
        users[addr].whitelist.add(addr);
        emit UserCreated(addr, msg.sender);
    }

    function whitelist(address addr) public
    isUser(msg.sender)
    isUser(addr)
    {
        users[msg.sender].whitelist.add(addr);
    }

    function blacklist(address addr) public
    isUser(msg.sender)
    isUser(addr)
    {
        users[msg.sender].blacklist.add(addr);
    }

    function getPendingUserGroupIDs() public view
    isUser(msg.sender)
    returns (bool, uint[])
    {
        return (true, users[msg.sender].pending.iterator());
    }

    function getPendingGroupGroupIDs() public view
    isUser(msg.sender)
    returns (bool found, uint[] groupIDs, uint[] subgroupIDs)
    {
        User storage user = users[msg.sender];
        groupIDs = user.pendingGroupIDs.iterator();
        subgroupIDs = new uint[](groupIDs.length);
        for(uint i = 0; i < groupIDs.length; i++)
            subgroupIDs[i] = user.pendingSubGroupIDs[groupIDs[i]];
        found = true;
    }

    function getGroupIDs(address addr) public view
    isUser(addr)
    returns (bool, uint[])
    {
        return (true, users[msg.sender].groups.iterator());
    }

    function getParentGroups(uint groupID) isActiveGroup(groupID) public
    returns (bool, uint[])
    {
        return (true, groups[groupID].parentGroups.iterator());
    }

    function getSubGroups(uint groupID) public
    isActiveGroup(groupID)
    returns (bool, uint[])
    {
        return (true, groups[groupID].subGroups.iterator());
    }

    function createGroup() public
    isUser(msg.sender)
    returns (uint)
    {
        Group.Data storage group = groups[groupCounter + 1];
        group.id = ++groupCounter;
        groups[group.id] = group;
        group.owner = msg.sender;
        users[msg.sender].groups.add(group.id);
        emit GroupCreated(group.id, msg.sender);
        return group.id;
    }

    function addGroupToGroup(uint groupID, uint subgroupID) public
    isActiveGroup(groupID)
    isActiveGroup(subgroupID)
    ownsGroup(msg.sender, groupID)
    {
        address addr = groups[subgroupID].owner;
        if(users[addr].whitelist.contains(msg.sender))
            _addGroupToGroup(groupID, subgroupID);
        else if(!users[addr].blacklist.contains(msg.sender))
        {
            users[addr].pendingGroupIDs.add(groupID);
            users[addr].pendingSubGroupIDs[groupID] = subgroupID;
        }
    }

    function removeGroupFromGroup(uint groupID, uint subgroupID) public
    isActiveGroup(groupID)
    isActiveGroup(subgroupID)
    ownsGroup(msg.sender, groupID)
    {
        groups[groupID].removeGroup(groups[subgroupID]);
        emit GroupRemoved(groupID, subgroupID, msg.sender);
    }

    function acceptGroup(uint groupID) public
    isPendingGroup(groupID)
    {
        User storage user = users[msg.sender];
        if(user.pending.contains(groupID))
        {
            _addUserToGroup(groupID, msg.sender);
            users[msg.sender].pending.remove(groupID);
        }
        else if(user.pendingGroupIDs.contains(groupID))
        {
            uint subgroupID = user.pendingSubGroupIDs[groupID];
            _addGroupToGroup(groupID, subgroupID);
            users[msg.sender].pendingGroupIDs.remove(groupID);
        }
    }

    function addUserToGroup(uint groupID, address addr) public
    isActiveGroup(groupID)
    ownsGroup(msg.sender, groupID)
    isUser(addr)
    {
        if(users[addr].whitelist.contains(msg.sender))
            _addUserToGroup(groupID, addr);
        else if(!users[addr].blacklist.contains(msg.sender))
            users[addr].pending.add(groupID);
    }

    function removeUserFromGroup(uint groupID, address addr) public
    isActiveGroup(groupID)
    ownsGroup(msg.sender, groupID)
    isInGroup(addr, groupID)
    isUser(addr)
    {
        groups[groupID].users.remove(addr);
    }

    function getShares(uint groupID) public view
    isActiveGroup(groupID)
    returns (bool found, uint index, uint[] shareIDs, bytes32[] hosts, bytes32[] paths)
    {
        uint[] memory tempShares = groups[groupID].shares.list;
        shareIDs = new uint[](tempShares.length);
        hosts = new bytes32[](tempShares.length);
        paths = new bytes32[](tempShares.length);
        index = 0;
        for(uint i = 0; i < tempShares.length; i++)
        {
            uint shareID = tempShares[i];
            if(shares[shareID].claim.isValid())
            {
                shareIDs[index] = shareID;
                hosts[index] = shares[shareID].host;
                paths[index] = shares[shareID].path;
                index++;
            }
        }
        found = true;
    }


    function addShare(bytes32 host, bytes32 path, uint groupID, uint time, uint access) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    {
        uint shareID = ++shareCounter;
        shares[shareID].owner = msg.sender;
        shares[shareID].id = shareID;
        shares[shareID].groupID = groupID;
        shares[shareID].host = host;
        shares[shareID].path = path;
        if(time > 0)
            shares[shareID].claim.time = now + time;
        shares[shareID].claim.access = Claim.getType(access);

        groups[groupID].shares.add(shareID);

        emit ShareAdded(shareID, groupID, host, path, time, access, msg.sender);
    }

    function deleteShare(uint shareID) public
    isUser(msg.sender)
    shareExists(shareID)
    ownShare(shareID)
    {
        groups[shares[shareID].groupID].shares.remove(shareID);
        delete shares[shareID];
        emit ShareDeleted(shareID, msg.sender);
    }

    function _addUserToGroup(uint groupID, address addr) internal
    {
        users[addr].groups.add(groupID);
        groups[groupID].users.add(addr);
        emit UserAdded(addr, groupID, msg.sender);
    }

    function _addGroupToGroup(uint groupID, uint subgroupID) internal
    {
        groups[groupID].addGroup(groups[subgroupID]);
        emit GroupAdded(groupID, subgroupID, msg.sender);
    }
}