pragma experimental ABIEncoderV2;
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
      SHARE_ALREADY_EXISTS, // 6
      GROUP_NOT_ACTIVE //7
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
        bytes32 name;
    }

    Set.Data authorizedSystems;
    address owner;
    mapping(address => User) users;
    mapping(uint => Group.Data) groups;
    mapping(address => uint) userToGroupID;
    mapping(uint => RecordShare) shares;
    uint shareCounter = 0;
    uint claimCounter = 0;
    uint groupCounter = 0;
    uint userCounter = 0;

    event SystemAdded(address addr);
    event UserAdded(address addr, bytes32 name);
    event GroupAdded(uint id, bytes32 name);
    event ShareCreated(uint id, bytes32 uri);
    event ShareDeleted(uint id);
    event WriterAdded(uint shareId, uint groupId);
    event ReaderAdded(uint shareId, uint groupId);
    event WriterRevoked(uint shareId, uint groupId);
    event ReaderRevoked(uint shareId, uint groupId);
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
            Error(uint(ErrorCode.USER_ALREADY_EXISTS));
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

    modifier isNotUser(address addr)
    {
        if(users[addr].id != 0)
            Error(uint(ErrorCode.IS_NOT_A_USER));
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
            Error(uint(ErrorCode.SHARE_ALREADY_EXISTS));
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
        Group.Data group = groups[userToGroupID[addr]];
        return group.shares.map[shareId].canRead();
    }

    function canRead(uint groupId, uint shareId) public view returns (bool)
    {
        Group.Data group = groups[groupId];
        return group.shares.map[shareId].canRead();
    }

    function canWrite(address addr, uint shareId) public view returns (bool)
    {
        return canWrite(userToGroupID[addr], shareId);
    }

    function canWrite(uint groupId, uint shareId) public view returns (bool)
    {
        return groups[groupId].shares.map[shareId].canWrite();
    }

    function addSystem(address system) public isOwner returns (bool)
    {
        if(authorizedSystems.add(system))
            SystemAdded(system);
    }

    function addUser(address addr, bytes32 name) public isRegisteredSystem isNotUser(addr)
    {
        users[addr].name = name;
        users[addr].id = ++userCounter;
        UserAdded(addr, name);
        createGroup(addr);
    }

    function createGroup(address addr) public
    {
        Group.Data storage group = groups[groupCounter + 1];
        group.id = ++groupCounter;
        group.owners.add(addr);
        groups[group.id] = group;
        userToGroupID[addr] = group.id;
    }

    function addOwnerToGroup(address addr) public
    {
        Group.Data storage group = groups[userToGroupID[msg.sender]];
        group.owners.add(addr);
        userToGroupID[addr] = group.id;
    }

    function addUserToGroup(address addr) public
    {
        Group.Data storage group = groups[userToGroupID[msg.sender]];
        group.users.add(addr);
        userToGroupID[addr] = group.id;
    }

    function getShares() public isUser(msg.sender) returns (uint[], bytes32[], uint[], bytes32[])
    {
        Group.Data group = groups[userToGroupID[msg.sender]];
        uint size = group.shares.size();
        uint[] memory idWrite = new uint[](group.authorizedWrite);
        bytes32[] memory uriWrite = new bytes32[](group.authorizedWrite);
        uint[] memory idRead = new uint[](group.authorizedRead);
        bytes32[] memory uriRead = new bytes32[](group.authorizedRead);
        uint indexWrite = 0;
        uint indexRead = 0;
        for(uint i = 0; i < size; i++)
        {
            uint id = group.shares.list[i];
            RecordShare share = shares[id];
            if(canWrite(group.id, id))
            {

                idWrite[indexWrite] = share.id;
                uriWrite[indexWrite] = share.uri;
                indexWrite++;
            }
            else
            {
                idRead[indexRead] = share.id;
                uriRead[indexRead] = share.uri;
                indexRead++;
            }
        }
        return (idWrite, uriWrite, idRead, uriRead);
    }

    function createShare(bytes32 uri) public isUser(msg.sender) returns(uint)
    {
        Claim.Data storage claim;
        Group.Data storage group = groups[userToGroupID[msg.sender]];
        uint shareId = ++shareCounter;
        shares[shareId].uri = uri;
        shares[shareId].id = shareId;
        claim.time = 0;
        claim.id = ++claimCounter;
        claim.access = Claim.Type.WRITE;

        shares[shareId].groups.put(group.id, claim);
        group.addClaim(shareId, claim);

        ShareCreated(shareCounter, uri);
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

    function authorizeWrite(uint shareId, uint groupId, uint time) public
    isUser(msg.sender)
    isActiveGroup(groupId)
    shareExists(shareId)
    ownShare(shareId)
    {
        if(canWrite(groupId, shareId))
            return;
        Claim.Data claim;
        claim.time = time;
        claim.id = ++claimCounter;
        claim.access = Claim.Type.WRITE;
        shares[shareId].groups.put(groupId, claim);
        groups[groupId].addClaim(shareId, claim);
        require(groups[groupId].shares.map[shareId].canWrite());
        WriterAdded(shareId, groupId);
    }

    function authorizeRead(uint shareId, uint groupId, uint time) public
    isUser(msg.sender)
    isActiveGroup(groupId)
    shareExists(shareId)
    ownShare(shareId)
    {
        if(canRead(groupId, shareId))
            return;
        RecordShare storage share = shares[shareId];
        Claim.Data claim;
        claim.time = time;
        claim.id = ++claimCounter;
        claim.access = Claim.Type.READ;
        share.groups.put(groupId, claim);
        groups[groupId].addClaim(share.id, claim);
        ReaderAdded(shareId, groupId);
    }

    function revokeWrite(uint shareId, uint groupId) public
    isUser(msg.sender)
    isActiveGroup(groupId)
    shareExists(shareId)
    ownShare(shareId)
    {
        if(!canWrite(groupId, shareId))
            return;
        RecordShare storage share = shares[shareId];
        shares[shareId].groups.remove(groupId);
        groups[groupId].removeClaim(share.id);
        WriterRevoked(shareId, groupId);
    }

    function revokeRead(uint shareId, uint groupId) public
    isUser(msg.sender)
    isActiveGroup(groupId)
    shareExists(shareId)
    ownShare(shareId)
    {
        if(!canRead(groupId, shareId))
            return;
        revokeWrite(shareId, groupId);
        RecordShare storage share = shares[shareId];
        shares[shareId].groups.remove(groupId);
        groups[groupId].removeClaim(share.id);
        ReaderRevoked(shareId, groupId);
    }
}