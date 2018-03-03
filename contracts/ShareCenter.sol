pragma solidity ^0.4.18;
import "./utils/Set.sol";
import "./utils/IterableSet_Integer.sol";
import "./utils/IterableSet_Address.sol";

contract ShareCenter
{
    using IterableSet_Integer for IterableSet_Integer.Data;
    using IterableSet_Address for IterableSet_Address.Data;
    using Set for Set.Data;

    struct ImageShare {
        uint id;
        bytes32 uri;
        IterableSet_Address.Data authorizedOwn;
        IterableSet_Address.Data authorizedRead;
    }

    struct User {
        bytes32 name;
        IterableSet_Integer.Data authorizedOwn;
        IterableSet_Integer.Data authorizedRead;
    }

    Set.Data authorizedSystems;
    address owner;
    mapping(address => User) users;
    mapping(uint => ImageShare) shares;
    uint idCounter;

    event SystemAdded(address addr);
    event UserAdded(address addr, bytes32 name);
    event ShareCreated(uint id, bytes32 uri);
    event ShareDeleted(uint id);
    event OwnerAdded(uint id, address user);
    event ReaderAdded(uint id, address user);
    event OwnerRevoked(uint id, address user);
    event ReaderRevoked(uint id, address user);
    event Error(uint id);

    modifier isOwner()
    {
        if(msg.sender != owner)
            Error(0);
        else
            _;
    }

    modifier isUser(address addr)
    {
        if(users[addr].name == 0x0)
            Error(1);
        else
            _;
    }

    modifier isNotUser(address addr)
    {
        if(users[addr].name != 0x0)
            Error(2);
        else
            _;
    }

    modifier isRegisteredSystem()
    {
        if(!authorizedSystems.contains(msg.sender))
            Error(3);
        else
            _;
    }

    modifier ownShare(uint id)
    {
        if(!canOwn(msg.sender, id))
            Error(4);
        else
            _;
    }

    modifier hasShare(uint id)
    {
        if(!canOwn(msg.sender, id) && !canRead(msg.sender, id))
            Error(5);
        else
            _;
    }

    modifier shareExists(uint id)
    {
        if(shares[id].uri == 0x0)
            Error(6);
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

    function canOwn(address addr, uint id) public view returns (bool)
    {
        return users[addr].authorizedOwn.contains(id);
    }

    function getShares() public isUser(msg.sender) returns (uint[], bytes32[], uint[], bytes32[])
    {
        User storage user = users[msg.sender];
        uint[] memory idOwn = new uint[](user.authorizedOwn.size());
        bytes32[] memory uriOwn = new bytes32[](user.authorizedOwn.size());
        uint[] memory idRead = new uint[](user.authorizedRead.size());
        bytes32[] memory uriRead = new bytes32[](user.authorizedRead.size());
        uint i;
        for(i = 0; i < idOwn.length; i++)
        {
            idOwn[i] = user.authorizedOwn.list[i];
            uriOwn[i] = shares[idOwn[i]].uri;
        }
        for(i = 0; i < idRead.length; i++)
        {
            idRead[i] = user.authorizedRead.list[i];
            uriRead[i] = shares[idRead[i]].uri;
        }
        return (idOwn, uriOwn, idRead, uriRead);
    }

    function getUsers(uint id) public isUser(msg.sender) ownShare(id) returns (address[], address[])
    {
        ImageShare storage share = shares[id];
        address[] memory usersOwn = new address[](share.authorizedOwn.size());
        address[] memory usersRead = new address[](share.authorizedRead.size());
        uint i;
        for(i = 0; i < usersOwn.length; i++)
            usersOwn[i] = share.authorizedOwn.list[i];
        for(i = 0; i < usersRead.length; i++)
            usersRead[i] = share.authorizedRead.list[i];

        return (usersOwn, usersRead);
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
        ImageShare storage share;
        share.uri = uri;
        share.id = idCounter;
        share.authorizedOwn.add(msg.sender);
        shares[idCounter] = share;
        users[msg.sender].authorizedOwn.add(idCounter);
        ShareCreated(idCounter, uri);
        idCounter++;
        return idCounter - 1;
    }

    function deleteShare(uint id) public isUser(msg.sender) shareExists(id) ownShare(id)
    {
        ImageShare storage share = shares[id];
        uint i;
        address addr;
        uint size = share.authorizedOwn.list.length;
        for(i = 0; i < size; i++)
        {
            addr = share.authorizedOwn.list[i];
            users[addr].authorizedOwn.remove(id);
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

    function authorizeOwn(uint id, address addr) public isUser(msg.sender) isUser(addr) shareExists(id) ownShare(id) returns (bool)
    {
        if(users[addr].authorizedOwn.contains(id))
            return false;
        ImageShare storage share = shares[id];
        share.authorizedOwn.add(addr);
        users[addr].authorizedOwn.add(share.id);
        OwnerAdded(id, addr);
        return true;
    }

    function authorizeRead(uint id, address addr) public isUser(msg.sender) isUser(addr) shareExists(id) ownShare(id) returns (bool)
    {
        if(users[addr].authorizedRead.contains(id))
            return false;
        ImageShare storage share = shares[id];
        share.authorizedRead.add(addr);
        users[addr].authorizedRead.add(share.id);
        ReaderAdded(id, addr);
        return true;
    }

    function revokeOwn(uint id, address addr) public isUser(msg.sender) isUser(addr) shareExists(id) ownShare(id) returns (bool)
    {
        if(!canOwn(addr, id))
            return false;
        ImageShare storage share = shares[id];
        shares[id].authorizedOwn.remove(addr);
        users[addr].authorizedOwn.remove(share.id);
        OwnerRevoked(id, addr);
        return true;
    }

    function revokeRead(uint id, address addr) public isUser(msg.sender) isUser(addr) shareExists(id) ownShare(id) returns (bool)
    {
        if(!canRead(addr, id))
            return false;
        ImageShare storage share = shares[id];
        share.authorizedRead.remove(addr);
        users[addr].authorizedRead.remove(share.id);
        ReaderRevoked(id, addr);
        return true;
    }
}
