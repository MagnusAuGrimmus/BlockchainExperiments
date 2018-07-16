pragma solidity ^0.4.19;
import "./utils/IterableSet_Integer.sol";
import "./utils/IterableSet_Address.sol";
import "./utils/IterableSet_Pair.sol";
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
        IS_NOT_PENDING_USER, // 11
        IS_NOT_PENDING_GROUP, // 12
        IS_NOT_PENDING_SUBGROUP, // 13
        IS_NOT_PENDING_SHARE //14
    }

    using IterableSet_Integer for IterableSet_Integer.Data;
    using IterableSet_Address for IterableSet_Address.Data;
    using IterableSet_Pair for IterableSet_Pair.Data;
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
        uint personalGroupID;
        IterableSet_Integer.Data groups;
        IterableSet_Integer.Data pendingUsers;
        IterableSet_Pair.Data pendingGroups;
        IterableSet_Pair.Data pendingSubgroups;
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
    event ShareAdded(uint shareID, uint groupID, bytes32 host, bytes32 path, uint time, uint access, address sender);
    event ShareDeleted(uint id, address sender);
    event UserPending(uint groupID, address addr, address sender);
    event GroupPending(uint groupID, uint subgroupID, address sender);
    event SubgroupPending(uint groupID, uint parentGroupID, address sender);
    event SharePending(uint groupID, uint shareID, address sender);
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

    modifier isPendingUser(uint groupID)
    {
        if(users[msg.sender].pendingUsers.contains(groupID))
            _;
        else
            emit Error(uint(ErrorCode.IS_NOT_PENDING_USER));
    }

    modifier isPendingShare(uint groupID, uint shareID)
    {
        if (groups[groupID].pendingShares.contains(shareID))
            _;
        else
            emit Error(uint(ErrorCode.IS_NOT_PENDING_SHARE));
    }

    modifier isPendingGroup(uint groupID, uint otherGroupID)
    {
        if(users[msg.sender].pendingGroups.contains(groupID, otherGroupID))
            _;
        else
            emit Error(uint(ErrorCode.IS_NOT_PENDING_GROUP));
    }

    modifier isPendingSubgroup(uint groupID, uint otherGroupID)
    {
        if(users[msg.sender].pendingSubgroups.contains(groupID, otherGroupID))
            _;
        else
            emit Error(uint(ErrorCode.IS_NOT_PENDING_SUBGROUP));
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

    function getPersonalGroupID(address addr) public
    isUser(addr)
    returns (bool, uint)
    {
        return (true, users[addr].personalGroupID);
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
        users[addr].personalGroupID = _initGroup(addr);
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

    function getUserInvites() public view
    isUser(msg.sender)
    returns (bool, uint[])
    {
        return (true, users[msg.sender].pendingUsers.list);
    }

    function getShareInvites(uint groupID) public view
    isActiveGroup(groupID)
    returns (bool, uint[])
    {
        return (true, groups[groupID].pendingShares.list);
    }

    function getGroupInvites() public view
    isUser(msg.sender)
    returns (bool found, uint[] groupIDs, uint[] parentGroupIDs)
    {
        (groupIDs, parentGroupIDs) = users[msg.sender].pendingGroups.iterator();
        found = true;
    }

    function getSubgroupInvites() public view
    isUser(msg.sender)
    returns (bool found, uint[] groupIDs, uint[] subgroupIDs)
    {
        (groupIDs, subgroupIDs) = users[msg.sender].pendingSubgroups.iterator();
        found = true;
    }

    function getGroupIDs(address addr) public view
    isUser(addr)
    returns (bool, uint[])
    {
        return (true, users[msg.sender].groups.iterator());
    }

    function getParentGroups(uint groupID) public
    isActiveGroup(groupID)
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
        _initGroup(msg.sender);
    }

    function addSubGroup(uint groupID, uint parentGroupID) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    isActiveGroup(parentGroupID)
    ownsGroup(msg.sender, groupID)
    {
        address addr = groups[parentGroupID].owner;
        if(users[addr].whitelist.contains(msg.sender))
            _addGroupToGroup(parentGroupID, groupID);
        else if(!users[addr].blacklist.contains(msg.sender))
        {
            users[addr].pendingSubgroups.add(parentGroupID, groupID);
            emit SubgroupPending(groupID, parentGroupID, msg.sender);
        }
    }

    function addGroupToGroup(uint groupID, uint subgroupID) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    isActiveGroup(subgroupID)
    ownsGroup(msg.sender, groupID)
    {
        address addr = groups[subgroupID].owner;
        if(users[addr].whitelist.contains(msg.sender))
            _addGroupToGroup(groupID, subgroupID);
        else if(!users[addr].blacklist.contains(msg.sender))
        {
            users[addr].pendingGroups.add(groupID, subgroupID);
            emit GroupPending(groupID, subgroupID, msg.sender);
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

    function acceptParentGroupAsUser(uint parentGroupID) public
    isPendingUser(parentGroupID)
    {
        _addUserToGroup(parentGroupID, msg.sender);
        users[msg.sender].pendingUsers.remove(parentGroupID);
    }

    function acceptParentGroupAsGroup(uint parentGroupID, uint groupID) public
    isPendingGroup(parentGroupID, groupID)
    {
        _addGroupToGroup(parentGroupID, groupID);
        users[msg.sender].pendingGroups.remove(parentGroupID, groupID);
    }

    function acceptSubgroup(uint subgroupID, uint groupID) public
    isPendingSubgroup(groupID, subgroupID)
    {
        _addGroupToGroup(groupID, subgroupID);
        users[msg.sender].pendingSubgroups.remove(groupID, subgroupID);
    }

    function addUserToGroup(uint groupID, address addr) public
    isActiveGroup(groupID)
    isUser(addr)
    ownsGroup(msg.sender, groupID)
    {
        if(users[addr].whitelist.contains(msg.sender))
            _addUserToGroup(groupID, addr);
        else if(!users[addr].blacklist.contains(msg.sender))
        {
            users[addr].pendingUsers.add(groupID);
            emit UserPending(groupID, addr, msg.sender);
        }
    }

    function removeUserFromGroup(uint groupID, address addr) public
    isActiveGroup(groupID)
    ownsGroup(msg.sender, groupID)
    isInGroup(addr, groupID)
    {
        groups[groupID].users.remove(addr);
    }

    function getShare(uint shareID) public view
    shareExists(shareID)
    returns (bool found, address owner, uint groupID, bytes32 host, bytes32 path, uint time, uint access)
    {
        RecordShare share = shares[shareID];
        owner = share.owner;
        groupID = share.groupID;
        host = share.host;
        path = share.path;
        time = share.claim.time;
        access = uint(share.claim.access);
        found = true;
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

    function acceptShare(uint groupID, uint shareID) public
    ownsGroup(msg.sender, groupID)
    isPendingShare(groupID, shareID)
    {
        groups[groupID].pendingShares.remove(shareID);
        groups[groupID].shares.add(shareID);

        (, address owner,, bytes32 host, bytes32 path, uint time, uint access) = getShare(shareID);

        emit ShareAdded(shareID, groupID, host, path, time, access, msg.sender);
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

        if (groups[groupID].isInGroup(msg.sender))
        {
            groups[groupID].shares.add(shareID);
            emit ShareAdded(shareID, groupID, host, path, time, access, msg.sender);
        }
        else
        {
            groups[groupID].pendingShares.add(shareID);
            emit SharePending(groupID, shareID, msg.sender);
        }
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

    function _initGroup(address addr) internal
    returns (uint)
    {
        Group.Data storage group = groups[groupCounter + 1];
        group.id = ++groupCounter;
        groups[group.id] = group;
        group.owner = addr;
        users[addr].groups.add(group.id);
        emit GroupCreated(group.id, addr);
        return group.id;
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