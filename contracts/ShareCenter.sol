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
    mapping(address => Group.Data) usersToGroups;
    mapping(uint => RecordShare) shares;
    uint shareCounter;
    uint claimCounter;
    uint groupCounter;
    uint userCounter;

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
        Group.Data group = usersToGroups[addr];
        return group.shares.map[shareId].canRead();
    }

    function canRead(uint groupId, uint shareId) public view returns (bool)
    {
        Group.Data group = groups[groupId];
        return group.shares.map[shareId].canRead();
    }

    function canWrite(address addr, uint shareId) public view returns (bool)
    {
        Group.Data group = usersToGroups[addr];
        return group.shares.map[shareId].canWrite();
    }

    function canWrite(uint groupId, uint shareId) public view returns (bool)
    {
        Group.Data group = groups[groupId];
        return group.shares.map[shareId].canWrite();
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
    }

    function addGroup(address addr) public
    {
        Group.Data storage group = usersToGroups[msg.sender];
        group.id = ++groupCounter;
        group.owners.add(msg.sender);
        groups[group.id] = group;
    }

    function createShare(bytes32 uri) public isUser(msg.sender) returns(uint)
    {
        RecordShare storage share;
        Claim.Data storage claim;
        Group.Data storage group = usersToGroups[msg.sender];
        share.uri = uri;
        share.id = ++shareCounter;
        claim.time = 0;
        claim.id = ++claimCounter;
        claim.access = Claim.Type.WRITE;

        if(!group.isActive())
            addGroup(msg.sender);

        share.groups.put(group.id, claim);
        shares[share.id] = share;
        group.addClaim(share.id, claim);

        ShareCreated(shareCounter, uri);
        return shareCounter;
    }

    function deleteShare(uint id) public isUser(msg.sender) shareExists(id) ownShare(id)
    {
        RecordShare storage share = shares[id];
        uint i;
        Group.Data group;
        uint size = share.groups.list.length;
        for(i = 0; i < size; i++)
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
        if(!groups[groupId].shares.map[shareId].isValid())
            return;
        RecordShare storage share = shares[shareId];
        Claim.Data claim;
        claim.time = time;
        claim.id = ++claimCounter;
        claim.access = Claim.Type.WRITE;
        share.groups.put(groupId, claim);
        groups[groupId].shares.put(share.id, claim);
        WriterAdded(shareId, groupId);
    }

    function authorizeWrite(uint shareId, uint groupId) public
    isUser(msg.sender)
    isActiveGroup(groupId)
    shareExists(shareId)
    ownShare(shareId)
    {
        authorizeWrite(shareId, groupId, 0);
    }

    function authorizeRead(uint shareId, uint groupId, uint time) public
    isUser(msg.sender)
    isActiveGroup(groupId)
    shareExists(shareId)
    ownShare(shareId)
    {
        if(groups[groupId].shares.map[shareId].isValid())
            return;
        RecordShare storage share = shares[shareId];
        Claim.Data claim;
        claim.time = time;
        claim.id = ++claimCounter;
        claim.access = Claim.Type.READ;
        share.groups.put(groupId, claim);
        groups[groupId].shares.put(share.id, claim);
        ReaderAdded(shareId, groupId);
    }

    function authorizeRead(uint shareId, uint groupId) public
    isUser(msg.sender)
    isActiveGroup(groupId)
    shareExists(shareId)
    ownShare(shareId)
    {
        authorizeRead(shareId, groupId, 0);
    }

    function revokeWrite(uint shareId, uint groupId) public
    isUser(msg.sender)
    isActiveGroup(groupId)
    shareExists(shareId)
    ownShare(shareId)
    {
        if(!canWrite(shareId, groupId))
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
        if(!canRead(shareId, groupId))
            return;
        RecordShare storage share = shares[shareId];
        shares[shareId].groups.remove(groupId);
        groups[groupId].removeClaim(share.id);
        ReaderRevoked(shareId, groupId);
    }
}
