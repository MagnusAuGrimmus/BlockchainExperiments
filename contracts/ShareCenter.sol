pragma solidity ^0.4.18;
import "./utils/Set.sol";
import "./utils/IterableSet_Integer.sol";
import "./utils/IterableSet_Address.sol";

contract ShareCenter
{
    enum ErrorCode {
      IS_NOT_WRITER, // 0
      USER_ALREADY_EXISTS, // 1
      IS_NOT_A_USER, // 2
      IS_NOT_A_REGISTERED_SYSTEM, // 3
      DOES_NOT_OWN_SHARE, // 4
      DOES_NOT_HAVE_SHARE, // 5
      SHARE_ALREADY_EXISTS // 6
    }

    using IterableSet_Integer for IterableSet_Integer.Data;
    using IterableSet_Address for IterableSet_Address.Data;
    using Set for Set.Data;

    struct RecordShare {
        uint id;
        bytes32 uri;
        IterableSet_Address.Data authorizedWrite;
        IterableSet_Address.Data authorizedRead;
    }

    struct User {
        bytes32 name;
        IterableSet_Integer.Data authorizedWrite;
        IterableSet_Integer.Data authorizedRead;
    }

    Set.Data authorizedSystems;
    address owner;
    mapping(address => User) users;
    mapping(uint => RecordShare) shares;
    uint idCounter;

    event SystemAdded(address addr);
    event UserAdded(address addr, bytes32 name);
    event ShareCreated(uint id, bytes32 uri);
    event ShareDeleted(uint id);
    event WriterAdded(uint id, address user);
    event ReaderAdded(uint id, address user);
    event WriterRevoked(uint id, address user);
    event ReaderRevoked(uint id, address user);
    event Error(uint id);

    modifier isOwner()
    {
        if(msg.sender != owner)
            Error(uint(ErrorCode.IS_NOT_WRITER));
        else
            _;
    }

    modifier isUser(address addr)
    {
        if(users[addr].name == 0x0)
            Error(uint(ErrorCode.USER_ALREADY_EXISTS));
        else
            _;
    }

    modifier isNotUser(address addr)
    {
        if(users[addr].name != 0x0)
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
        if(shares[id].uri == 0x0)
            Error(uint(ErrorCode.SHARE_ALREADY_EXISTS));
        else
            _;
    }

    function ShareCenter() public
    {
        owner = msg.sender;
        idCounter = 0;
    }

    function canRead(address addr, uint id) public view returns (bool)
    {
        return users[addr].authorizedRead.contains(id);
    }

    function canWrite(address addr, uint id) public view returns (bool)
    {
        return users[addr].authorizedWrite.contains(id);
    }

    function getShares() public isUser(msg.sender) returns (uint[], bytes32[], uint[], bytes32[])
    {
        User storage user = users[msg.sender];
        uint[] memory idWrite= new uint[](user.authorizedWrite.size());
        bytes32[] memory uriWrite = new bytes32[](user.authorizedWrite.size());
        uint[] memory idRead = new uint[](user.authorizedRead.size());
        bytes32[] memory uriRead = new bytes32[](user.authorizedRead.size());
        uint i;
        for(i = 0; i < idWrite.length; i++)
        {
            idWrite[i] = user.authorizedWrite.list[i];
            uriWrite[i] = shares[idWrite[i]].uri;
        }
        for(i = 0; i < idRead.length; i++)
        {
            idRead[i] = user.authorizedRead.list[i];
            uriRead[i] = shares[idRead[i]].uri;
        }
        return (idWrite, uriWrite, idRead, uriRead);
    }

    function getUsers(uint id) public isUser(msg.sender) ownShare(id) returns (address[], address[])
    {
        RecordShare storage share = shares[id];
        address[] memory usersWrite = new address[](share.authorizedWrite.size());
        address[] memory usersRead = new address[](share.authorizedRead.size());
        uint i;
        for(i = 0; i < usersWrite.length; i++)
            usersWrite[i] = share.authorizedWrite.list[i];
        for(i = 0; i < usersRead.length; i++)
            usersRead[i] = share.authorizedRead.list[i];

        return (usersWrite, usersRead);
    }

    function addSystem(address system) public isOwner returns (bool)
    {
        if(authorizedSystems.add(system))
            SystemAdded(system);
    }

    function addUser(address addr, bytes32 name) public isRegisteredSystem isNotUser(addr)
    {
        users[addr].name = name;
        UserAdded(addr, name);
    }

    function createShare(bytes32 uri) public isUser(msg.sender) returns(uint)
    {
        RecordShare storage share;
        share.uri = uri;
        share.id = idCounter;
        share.authorizedWrite.add(msg.sender);
        shares[idCounter] = share;
        users[msg.sender].authorizedWrite.add(idCounter);
        ShareCreated(idCounter, uri);
        idCounter++;
        return idCounter - 1;
    }

    function deleteShare(uint id) public isUser(msg.sender) shareExists(id) ownShare(id)
    {
        RecordShare storage share = shares[id];
        uint i;
        address addr;
        uint size = share.authorizedWrite.list.length;
        for(i = 0; i < size; i++)
        {
            addr = share.authorizedWrite.list[i];
            users[addr].authorizedWrite.remove(id);
        }
        size = share.authorizedRead.list.length;
        for(i = 0; i < size; i++)
        {
            addr = share.authorizedRead.list[i];
            users[addr].authorizedRead.remove(id);
        }
        ShareDeleted(id);
        share.uri = 0x0;
    }

    function authorizeWrite(uint id, address addr) public isUser(msg.sender) isUser(addr) shareExists(id) ownShare(id)
    {
        if(users[addr].authorizedWrite.contains(id))
            return;
        RecordShare storage share = shares[id];
        share.authorizedWrite.add(addr);
        users[addr].authorizedWrite.add(share.id);
        WriterAdded(id, addr);
    }

    function authorizeRead(uint id, address addr) public isUser(msg.sender) isUser(addr) shareExists(id) ownShare(id)
    {
        if(users[addr].authorizedRead.contains(id))
            return;
        RecordShare storage share = shares[id];
        share.authorizedRead.add(addr);
        users[addr].authorizedRead.add(share.id);
        ReaderAdded(id, addr);
    }

    function revokeWrite(uint id, address addr) public isUser(msg.sender) isUser(addr) shareExists(id) ownShare(id)
    {
        if(!canWrite(addr, id))
            return;
        RecordShare storage share = shares[id];
        shares[id].authorizedWrite.remove(addr);
        users[addr].authorizedWrite.remove(share.id);
        WriterRevoked(id, addr);
    }

    function revokeRead(uint id, address addr) public isUser(msg.sender) isUser(addr) shareExists(id) ownShare(id)
    {
        if(!canRead(addr, id))
            return;
        RecordShare storage share = shares[id];
        share.authorizedRead.remove(addr);
        users[addr].authorizedRead.remove(share.id);
        ReaderRevoked(id, addr);
    }
}
