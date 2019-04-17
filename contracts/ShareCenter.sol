pragma solidity ^0.5.0;
import "./utils/IterableSet_Integer.sol";
import "./utils/IterableSet_Address.sol";
import "./utils/Claim.sol";
import "./GroupManager.sol";

contract ShareCenter is GroupManager
{
    using Claim for Claim.Data;

    struct RecordShare {
        address owner;
        uint id;
        IterableSet_Integer.Data groupIDs;
        bytes32 host;
        bytes32 path;
        Claim.Data claim;
    }

    struct ShareRequestData {
        address sender;
        uint[] shareGroupIDs;
        bool[] accepted;
        uint shareID;
    }

    address owner;
    mapping(address => bool) authorizedSystems;
    mapping(uint => RecordShare) shares;
    mapping(uint => ShareRequestData) shareRequests;

    uint shareCounter = 0;
    uint shareRequestCounter = 0;

    event SystemAdded(address addr, address sender);
    event ShareAdded(uint shareID, uint groupID, bytes32 host, bytes32 path, uint time, uint access, address sender);
    event ShareDeleted(uint id, address sender);
    event ShareRequest(uint id, uint[] shareGroupIDs, bytes32 host, bytes32 path, uint time, uint access, address sender);

    modifier isOwner()
    {
        if(msg.sender != owner)
            emit Error(uint(ErrorCode.IS_NOT_OWNER));
        else
            _;
    }

    modifier isRegisteredSystem()
    {
        if (!authorizedSystems[msg.sender])
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

    modifier canWriteToGroups(uint[] memory groupIDs)
    {
        bool found = false;
        for (uint i = 0; i < groupIDs.length; i++)
        {
            Group storage group = groups[groupIDs[i]];
            if (group.owner != msg.sender && !group.writers.contains(msg.sender))
            {
                emit Error(uint(ErrorCode.NOT_OWNER_OF_GROUP));
                found = true;
                break;
            }
        }
        if (!found)
            _;
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
        Group memory user = groups[users[addr].personalGroupID];
        for (uint i = 0; i < user.shareGroups.list.length; i++)
            if (canWrite(user.shareGroups.list[i], shareID))
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
        return authorizedSystems[system];
    }

    function getPersonalGroupID(address addr) public view
    returns (bool, uint)
    {
        return (users[addr].active, users[addr].personalGroupID);
    }

    function getGroupIDs(address addr) public view
    returns (bool, uint[] memory)
    {
        return getGroupIDs(users[addr].personalGroupID);
    }

    function getShare(uint shareID) public view
    returns (bool found, address shareOwner, uint[] memory groupIDs, bytes32 host, bytes32 path, uint time, uint access)
    {
        RecordShare memory share = shares[shareID];
        shareOwner = share.owner;
        groupIDs = share.groupIDs.list;
        host = share.host;
        path = share.path;
        time = share.claim.time;
        access = uint(share.claim.access);
        found = share.id != 0;
    }

    function getShares(uint groupID) public view
    returns (bool found, uint index, uint[] memory shareIDs, bytes32[] memory hosts, bytes32[] memory paths)
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
        found = groups[groupID].id != 0;
    }

    function addSystem(address system) public
    isOwner
    {
        if (!authorizedSystems[system])
        {
            authorizedSystems[system] = true;
            emit SystemAdded(system, msg.sender);
        }
    }

    function createUser(address addr) public
    isRegisteredSystem
    isNotUser(addr)
    {
        users[addr].active = true;
        users[addr].system = msg.sender;
        emit UserCreated(addr, msg.sender);
        users[addr].personalGroupID = _initGroup(addr, true);
    }

    function createShareRequest(uint[] memory groupIDs, bytes32 host, bytes32 path, uint time, uint access) public
    {
        for (uint i = 0; i < groupIDs.length; i++)
        {
            if (!_isActiveGroup(groupIDs[i]))
                emit Error(uint(ErrorCode.INVALID_SHARE_REQUEST));
        }
        uint shareID = _createShare(host, path, time, access, msg.sender);
        bool[] memory accepted = new bool[](groupIDs.length);
        shareRequests[++shareRequestCounter] = ShareRequestData(msg.sender, groupIDs, accepted, shareID);
        emit ShareRequest(shareRequestCounter, groupIDs, host, path, time, access, msg.sender);
    }

    function acceptShareRequest(uint requestID) public // For the current sender, accepts the share into all the groups they own
    {
        ShareRequestData memory request = shareRequests[requestID];

        for (uint i = 0; i < request.shareGroupIDs.length; i++)
        {
            uint shareGroupID = request.shareGroupIDs[i];
            if (groups[shareGroupID].owner == msg.sender)
            {
                groups[shareGroupID].shares.add(request.shareID);
                shareRequests[requestID].accepted[i] = true;
            }
        }
        _cleanupShareRequest(requestID);
    }


    function createShare(bytes32 host, bytes32 path, uint[] memory groupIDs, uint time, uint access) public
    isUser(msg.sender)
    canWriteToGroups(groupIDs)
    {
        uint shareID = _createShare(host, path, time, access, msg.sender);
        addShare(shareID, groupIDs);
    }

    function addShare(uint shareID, uint[] memory groupIDs) public
    ownShare(shareID)
    canWriteToGroups(groupIDs)
    {
        RecordShare memory share = shares[shareID];
        for (uint i = 0; i < groupIDs.length; i++)
        {
            groups[groupIDs[i]].shares.add(shareID);
            emit ShareAdded(shareID, groupIDs[i], share.host, share.path, share.claim.time, uint(share.claim.access), msg.sender);
        }
    }

    function deleteShare(uint shareID) public
    isUser(msg.sender)
    shareExists(shareID)
    ownShare(shareID)
    {
        uint[] memory groupIDs = shares[shareID].groupIDs.list;
        for (uint i = 0; i < groupIDs.length; i++)
            groups[groupIDs[i]].shares.remove(shareID);
        delete shares[shareID];
        emit ShareDeleted(shareID, msg.sender);
    }

    function _createShare(bytes32 host, bytes32 path, uint time, uint access, address sender) internal
    returns (uint shareID)
    {
        shareID = ++shareCounter;
        shares[shareID].owner = sender;
        shares[shareID].id = shareID;
        shares[shareID].host = host;
        shares[shareID].path = path;
        if (time > 0)
            shares[shareID].claim.time = now + time;
        shares[shareID].claim.access = Claim.getType(access);
    }

    function _cleanupShareRequest(uint requestID) internal
    returns (bool)
    {
        bool[] memory accepted = shareRequests[requestID].accepted;
        for (uint i = 0; i < accepted.length; i++)
            if (!accepted[i])
                return false;
        delete shareRequests[requestID];
        return true;
    }
}