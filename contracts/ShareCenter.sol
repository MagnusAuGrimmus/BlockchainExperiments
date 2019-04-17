pragma solidity ^0.5.0;
import "./utils/IterableSet_Integer.sol";
import "./utils/IterableSet_Address.sol";
import "./utils/Claim.sol";
import "./GroupManager.sol";

//TODO: Give gas back on blacklist
//TODO: Add blacklist error code

contract ShareCenter is GroupManager
{
    using Claim for Claim.Data;

    struct RecordShare {
        address owner;
        uint id;
        uint[] groupIDs;
        bytes32 host;
        bytes32 path;
        Claim.Data claim;
    }

    struct ShareRequest {
        address sender;
        address receiver;
        uint newGroups;
        uint[] parentGroups;
        uint[] subGroups;
        bool[] isNewParentGroup;
        bool[] isNewSubGroup;
        uint shareGroupID;
        bool isNewShareGroup;
        bytes32 host;
        bytes32 path;
        uint time;
        uint access;
        // Add gas to the thing
    }

    address owner;
    mapping(address => bool) authorizedSystems;
    mapping(uint => RecordShare) shares;
    mapping(uint => ShareRequest) shareRequests;

    uint shareCounter = 0;
    uint shareRequestCounter = 0;

    event SystemAdded(address addr, address sender);
    event ShareAdded(uint shareID, uint[] groupIDs, bytes32 host, bytes32 path, uint time, uint access, address sender);
    event ShareDeleted(uint id, address sender);
    //    event ShareRequest(uint id,
    //                        address receiver,
    //                        uint newGroups,
    //                        uint[] parentGroups,
    //                        uint[] subGroups,
    //                        bool[] isNewParentGroup,
    //                        bool[] isNewSubGroup,
    //                        uint shareGroupID,
    //                        bool isNewShareGroup,
    //                        bytes32 host,
    //                        bytes32 path,
    //                        uint time,
    //                        uint access,
    //                        address sender);

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
        Group.Data memory user = groups[users[addr].personalGroupID];
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
    returns (bool found, address owner, uint[] memory groupIDs, bytes32 host, bytes32 path, uint time, uint access)
    {
        RecordShare memory share = shares[shareID];
        owner = share.owner;
        groupIDs = share.groupIDs;
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
        users[addr].personalGroupID = _initGroup(addr);
    }

    //    function createShareRequest(uint[] groupIDs, // 0 means make a new group
    //                                uint[] memory shareGroups,
    //                                bytes32 host,
    //                                bytes32 path,
    //                                uint time,
    //                                uint access) public
    //    {
    //        for(uint i = 0; i < shareGroups.length; i++)
    //        {
    //            if(groups[shareGroups[i]].id == 0) // Check is group is active
    //                emit Error(ErrorCode.INVALID_SHARE_REQUEST);
    //        }
    //        if(groupID == 0)
    //            groupID = createGroup();
    //        if(groups[groupID].owner == msg.sender)
    //            _addShare(host, path, groupIDs, time, access, sender);
    //        shareRequests[++shareRequestCounter] = ShareRequest(msg.sender, groupIDs, shareGroups, isNewGroup, host, path, time, access);
    //        emit ShareRequest(shareRequestCounter, groupIDs, shareGroups, isNewGroup, host, path, time, access, msg.sender);
    //    }

    //    function acceptShareRequest(uint requestID) public // For the current sender, accepts the share into all the groups they own
    //    {
    //        // CODE REVIEW: Add modifier to check if receiver has a group in the shareGroups list
    //        ShareRequest memory request = shareRequests[requestID];
    //        address sender = request.sender;
    //        uint groupID = request.groupID; // CODE REVIEW: Change naming convention
    //
    //        for(uint i = 0; i < request.shareGroups.length; i++)
    //        {
    //            uint shareGroupID = request.shareGroups[i];
    //            if(groups[shareGroupID].owner == msg.sender)
    //                _addShareGroup(groupID, shareGroupID, sender);
    //        }
    //        if(groups[request.groupID].owner == msg.sender)
    //            _addShare(host, path, request.groupID, time, access, sender);
    //        // CODE REVIEW: How to deal with the garbage cleanup? When to delete struct
    //    }


    function addShare(bytes32 host, bytes32 path, uint[] memory groupIDs, uint time, uint access) public
    isUser(msg.sender)
    {
        _addShare(host, path, groupIDs, time, access, msg.sender);
    }

    function deleteShare(uint shareID) public
    isUser(msg.sender)
    shareExists(shareID)
    ownShare(shareID)
    {
        for (uint i = 0; i < shares[shareID].groupIDs.length; i++)
            groups[shares[shareID].groupIDs[i]].shares.remove(shareID);
        delete shares[shareID];
        emit ShareDeleted(shareID, msg.sender);
    }

    function _addShare(bytes32 host, bytes32 path, uint[] memory groupIDs, uint time, uint access, address sender) internal
    areActiveGroups(groupIDs)
        //    isNotBlacklistedUser(groupID, msg.sender)
        // CODE REVIEW: Revise security
        // CODE REVIEW: Undo private part
    {
        uint shareID = ++shareCounter;
        shares[shareID].owner = msg.sender;
        shares[shareID].id = shareID;
        shares[shareID].groupIDs = groupIDs;
        shares[shareID].host = host;
        shares[shareID].path = path;
        if (time > 0)
            shares[shareID].claim.time = now + time;
        shares[shareID].claim.access = Claim.getType(access);
        for (uint i = 0; i < groupIDs.length; i++)
            groups[groupIDs[i]].shares.add(shareID);
        emit ShareAdded(shareID, groupIDs, host, path, time, access, sender);
    }
}