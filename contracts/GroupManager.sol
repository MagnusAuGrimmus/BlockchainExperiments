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
        bool isPersonal;
        IterableSet_Address.Data writers;
        IterableSet_Integer.Data blacklistedGroups;
        IterableSet_Address.Data blacklistedUsers;
        IterableSet_Integer.Data shareGroups; // groups that have given you access to their shares
        IterableSet_Integer.Data shares;
    }

    enum RequestType {
        JoinGroup,
        Invite
    }

    struct Request {
        bool active;
        address sender;
        uint groupID;
        uint shareGroupID;
        RequestType requestType;
    }

    mapping(uint => Request) requests;
    mapping(uint => Group) groups;

    uint requestCounter = 0;
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

    modifier isNotBlacklisted(uint groupID, uint shareGroupID)
    {
        if (isBlacklisted(groupID, shareGroupID))
            emit Error(uint(ErrorCode.BLACKLISTED));
        else
            _;
    }

    modifier areNotBlacklisted(uint[] memory shareGroupIDs)
    {
        bool error = false;
        for (uint i = 0; i < shareGroupIDs.length; i++)
            if (groups[shareGroupIDs[i]].blacklistedUsers.contains(msg.sender))
            {
                emit Error(uint(ErrorCode.BLACKLISTED));
                error = true;
            }
        if (!error)
            _;
    }

    modifier canAcceptRequest(uint requestID)
    {
        Request memory request = requests[requestID];
        uint groupID = request.requestType == RequestType.Invite ? request.shareGroupID : request.groupID;
        if (groups[groupID].owner != msg.sender)
            emit Error(uint(ErrorCode.NOT_OWNER_OF_GROUP));
        else
            _;
    }

    modifier isWriter(address addr, uint groupID)
    {
        Group storage group = groups[groupID];
        if (group.owner != addr && !group.writers.contains(addr))
            emit Error(uint(ErrorCode.IS_NOT_WRITER));
        else
            _;
    }

    modifier isActiveRequest(uint id)
    {
        if (!requests[id].active)
            emit Error(uint(ErrorCode.INACTIVE_REQUEST));
        else
            _;
    }

    function isBlacklisted(uint groupID, uint shareGroupID) public view
    returns (bool)
    {
        address groupOwner = groups[groupID].owner;
        Group storage shareGroup = groups[shareGroupID];
        return shareGroup.blacklistedGroups.contains(groupID)
        || shareGroup.blacklistedUsers.contains(groupOwner);
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
        return _initGroup(msg.sender, false);
    }

    function createJoinRequest(uint groupID, uint parentGroupID) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    isActiveGroup(parentGroupID)
    ownsGroup(msg.sender, groupID)
    isNotBlacklisted(parentGroupID, groupID)
    {
        requests[++requestCounter] = Request(true, msg.sender, parentGroupID, groupID, RequestType.JoinGroup);
        emit JoinGroupRequest(requestCounter, parentGroupID, groupID, msg.sender);
    }

    function createInviteRequest(uint groupID, uint shareGroupID) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    isActiveGroup(shareGroupID)
    ownsGroup(msg.sender, groupID)
    isNotBlacklisted(groupID, shareGroupID)
    {
        requests[++requestCounter] = Request(true, msg.sender, groupID, shareGroupID, RequestType.Invite);
        emit InviteRequest(requestCounter, groupID, shareGroupID, msg.sender);
    }


    function acceptRequest(uint requestID) public
    isUser(msg.sender)
    isActiveRequest(requestID)
    canAcceptRequest(requestID)
    {
        Request memory request = requests[requestID];
        uint groupID = request.groupID;
        uint shareGroupID = request.shareGroupID;
        _addShareGroup(groupID, shareGroupID, msg.sender);
        delete requests[requestID];
    }

    function addWriter(uint groupID, address addr) public
    isUser(msg.sender)
    ownsGroup(msg.sender, groupID)
    isInGroup(addr, groupID)
    {
        groups[groupID].writers.add(addr);
    }

    function addShareGroup(uint groupID, uint shareGroupID) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    isActiveGroup(shareGroupID)
    isWriter(msg.sender, groupID)
    isWriter(msg.sender, shareGroupID)
    {
        _addShareGroup(groupID, shareGroupID, msg.sender);
    }

    function removeShareGroup(uint groupID, uint shareGroupID) public
    isUser(msg.sender)
    isActiveGroup(groupID)
    isActiveGroup(shareGroupID)
    ownsGroup(msg.sender, groupID)
    {
        if (groups[shareGroupID].shareGroups.remove(groupID))
            emit ShareGroupRemoved(groupID, shareGroupID, msg.sender);
    }

    function _initGroup(address addr, bool isPersonal) internal
    returns (uint)
    {
        Group storage group = groups[groupCounter + 1];
        group.id = ++groupCounter;
        if (isPersonal)
            group.isPersonal = true;
        else
            groups[users[addr].personalGroupID].shareGroups.add(group.id);
        group.owner = addr;
        groups[group.id] = group;
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

    function _isActiveGroup(uint groupID) internal view
    returns (bool)
    {
        return groups[groupID].id != 0;
    }
}
