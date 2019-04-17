pragma solidity ^0.5.0;

import "./utils/Group.sol";
import "./UserManager.sol";

contract GroupManager is UserManager
{
    using Group for Group.Data;
    using IterableSet_Integer for IterableSet_Integer.Data;
    using IterableSet_Address for IterableSet_Address.Data;

    struct JoinRequest {
        address sender;
        uint groupID;
        uint shareGroupID;
    }

    mapping(uint => JoinRequest) joinRequests;
    mapping(uint => Group.Data) groups;

    uint joinRequestCounter = 0;
    uint groupCounter = 0;

    event ShareGroupAdded(uint groupID, uint shareGroupID, address sender);
    event ShareGroupRemoved(uint groupID, uint shareGroupID, address sender);
    event GroupCreated(uint id, address sender);
    event JoinGroupRequest(uint id, uint groupID, uint shareGroupID, address sender);

    modifier isActiveGroup(uint id)
    {
        if (groups[id].id == 0)
            emit Error(uint(ErrorCode.GROUP_NOT_ACTIVE));
        else
            _;
    }

    modifier areActiveGroups(uint[] memory ids)
    {
        bool found = false;
        for (uint i = 0; i < ids.length; i++)
        {
            if (groups[ids[i]].id == 0)
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

    function getShareGroups(uint groupID) public view
    returns (bool, uint[] memory)
    {
        return (groups[groupID].id != 0, groups[groupID].shareGroups.iterator());
    }

    function getGroupIDs(uint groupID) public view
    returns (bool, uint[] memory)
    {
        (bool found, uint[] memory groups) = getShareGroups(groupID);
        if (!found)
            return (found, groups);
        uint[] memory result = new uint[](groups.length + 1);
        for (uint i = 0; i < result.length - 1; i++)
            result[i] = groups[i];
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
        addShareGroup(joinRequests[id].groupID, joinRequests[id].shareGroupID);
        delete joinRequests[id];
    }

    function addShareGroup(uint groupID, uint shareGroupID) public
    ownsGroup(msg.sender, groupID)
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
        Group.Data storage group = groups[groupCounter + 1];
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
