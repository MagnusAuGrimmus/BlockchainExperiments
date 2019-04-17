pragma solidity ^0.5.0;

import "./UserManager.sol";
import "./utils/IterableSet_Address.sol";
import "./utils/IterableSet_Integer.sol";

contract GroupManager is UserManager
{
    using IterableSet_Integer for IterableSet_Integer.Data;
    using IterableSet_Address for IterableSet_Address.Data;

    struct Group
    {
        uint id;
        address owner;
        IterableSet_Address.Data writers;
        IterableSet_Integer.Data blacklistedGroups;
        IterableSet_Address.Data blacklistedUsers;
        IterableSet_Integer.Data shareGroups; // groups that have given you access to their shares
        IterableSet_Integer.Data shares;
    }

    struct JoinRequest {
        address sender;
        uint groupID;
        uint shareGroupID;
    }

    mapping(uint => JoinRequest) joinRequests;
    mapping(uint => Group) groups;

    uint joinRequestCounter = 0;
    uint groupCounter = 0;

    event ShareGroupAdded(uint groupID, uint shareGroupID, address sender);
    event ShareGroupRemoved(uint groupID, uint shareGroupID, address sender);
    event GroupCreated(uint id, address sender);
    event JoinGroupRequest(uint id, uint groupID, uint shareGroupID, address sender);
    event InviteRequest(uint id, uint groupID, uint shareGroupID, address sender);

    modifier isActiveGroup(uint id)
    {
        if (!_isActiveGroup(id))
            emit Error(uint(ErrorCode.GROUP_NOT_ACTIVE));
        else
            _;
    }

    modifier areActiveGroups(uint[] memory ids)
    {
        bool found = false;
        for (uint i = 0; i < ids.length; i++)
        {
            if (!_isActiveGroup(ids[i]))
                emit Error(uint(ErrorCode.GROUP_NOT_ACTIVE));
            found = true;
            break;
        }
        if (!found)
            _;
    }

    modifier ownsGroup(address addr, uint id)
    {
        if (groups[id].owner != addr)
            emit Error(uint(ErrorCode.NOT_OWNER_OF_GROUP));
        else
            _;
    }

    modifier isInGroup(address addr, uint id)
    {
        if (!groups[users[addr].personalGroupID].shareGroups.contains(id))
            emit Error(uint(ErrorCode.NOT_IN_GROUP));
        else
            _;
    }

    modifier notInGroup(address addr, uint id)
    {
        if (groups[users[addr].personalGroupID].shareGroups.contains(id))
            emit Error(uint(ErrorCode.IN_GROUP));
        else
            _;
    }

    modifier isNotBlacklisted(uint groupID, uint senderGroupID, address senderAddr)
    {
        if (groups[groupID].blacklistedGroups.contains(senderGroupID) ||
            groups[groupID].blacklistedUsers.contains(senderAddr))
            emit Error(uint(ErrorCode.BLACKLISTED));
        else
            _;
    }

    function _isActiveGroup(uint groupID) internal view
    returns (bool)
    {
        return groups[groupID].id != 0;
    }

    function getShareGroups(uint groupID) public view
    returns (bool, uint[] memory)
    {
        return (_isActiveGroup(groupID), groups[groupID].shareGroups.iterator());
    }

    function getGroupIDs(uint groupID) public view
    returns (bool, uint[] memory)
    {
        (bool found, uint[] memory shareGroups) = getShareGroups(groupID);
        if (!found)
            return (found, shareGroups);
        uint[] memory result = new uint[](shareGroups.length + 1);
        for (uint i = 0; i < result.length - 1; i++)
            result[i] = shareGroups[i];
        result[result.length - 1] = groupID;
        return (true, result);
    }

    function blacklistUser(uint groupID, address blockedAddr) public
    isUser(msg.sender)
    isUser(blockedAddr)
    isActiveGroup(groupID)
    ownsGroup(msg.sender, groupID)
    {
        groups[groupID].blacklistedUsers.add(blockedAddr);
    }

    function blacklistGroup(uint groupID, uint blockedGroupID) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    isActiveGroup(blockedGroupID)
    ownsGroup(msg.sender, groupID)
    {
        groups[groupID].blacklistedGroups.add(blockedGroupID);
    }

    function createGroup() public
    isUser(msg.sender)
    returns (uint)
    {
        return _initGroup(msg.sender);
    }

    function createJoinRequest(uint groupID, uint shareGroupID) public
    {
        // CODE REVIEW: Add modifier for blacklist here
        // CODE REVIEW: Is the naming convention bad? Join Request vs Join Group Request?
        joinRequests[++joinRequestCounter] = JoinRequest(msg.sender, groupID, shareGroupID);
        emit JoinGroupRequest(joinRequestCounter, groupID, shareGroupID, msg.sender);
    }

    function acceptJoinRequest(uint id) public
    {
        // CODE REVIEW: Add permissions
        _addShareGroup(joinRequests[id].groupID, joinRequests[id].shareGroupID, msg.sender);
        delete joinRequests[id];
    }

    function createInviteRequest(uint groupID, uint shareGroupID) public
    {
        // CODE REVIEW: Add modifier for blacklist here
        // CODE REVIEW: Is the naming convention bad? Join Request vs Join Group Request?
        joinRequests[++joinRequestCounter] = JoinRequest(msg.sender, groupID, shareGroupID);
        emit JoinGroupRequest(joinRequestCounter, groupID, shareGroupID, msg.sender);
    }

    function acceptInviteRequest(uint id) public
    {
        // CODE REVIEW: Add permissions
        _addShareGroup(joinRequests[id].shareGroupID, joinRequests[id].groupID, msg.sender);
        delete joinRequests[id];
    }

    function addWriter(uint groupID, address addr) public
    ownsGroup(msg.sender, groupID)
    isInGroup(addr, groupID)
    {
        groups[groupID].writers.add(addr);
    }

    function addShareGroup(uint groupID, uint shareGroupID) public
    ownsGroup(msg.sender, groupID)
    ownsGroup(msg.sender, shareGroupID)
    isNotBlacklisted(shareGroupID, groupID, msg.sender)
    {
        _addShareGroup(groupID, shareGroupID, msg.sender);
    }

    function removeShareGroup(uint groupID, uint shareGroupID) public
    isActiveGroup(groupID)
    isActiveGroup(shareGroupID)
    ownsGroup(msg.sender, groupID)
    {
        groups[shareGroupID].shareGroups.remove(groupID);
        emit ShareGroupRemoved(groupID, shareGroupID, msg.sender);
    }

    function addUserToGroup(uint groupID, address addr) public
    {
        addShareGroup(groupID, users[addr].personalGroupID);
    }

    function removeUserFromGroup(uint groupID, address addr) public // CODE REVIEW: Ask about error codes? Should I ask isUser if ownsGroup will take care of it
    {
        removeShareGroup(groupID, users[addr].personalGroupID);
    }

    function _initGroup(address addr) internal
    returns (uint)
    {
        Group storage group = groups[groupCounter + 1];
        group.id = ++groupCounter;
        groups[group.id] = group;
        group.owner = addr;
        groups[users[addr].personalGroupID].shareGroups.add(group.id);
        emit GroupCreated(group.id, addr);
        return group.id;
    }

    function _addShareGroup(uint groupID, uint shareGroupID, address sender) internal
    isActiveGroup(groupID)
    isActiveGroup(shareGroupID)
    {
        groups[shareGroupID].shareGroups.add(groupID);
        emit ShareGroupAdded(groupID, shareGroupID, sender);
    }
}
