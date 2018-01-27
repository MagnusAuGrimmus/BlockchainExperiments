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

    event ShareCreated(uint _id, bytes32 _uri);
    event ShareDeleted(uint id);
    event OwnerAdded(uint _id, address user);
    event ReaderAdded(uint id, address user);
    event OwnerRevoked(uint id, address user);
    event ReaderRevoked(uint id, address user);

    modifier isOwner()
    {
        require(msg.sender == owner);
        _;
    }

    modifier isUser(address addr)
    {
        require(users[addr].name != 0x0);
        _;
    }

    modifier isRegisteredSystem()
    {
        require(authorizedSystems.contains(msg.sender));
        _;
    }

    modifier ownShare(uint id)
    {
        require(users[msg.sender].authorizedOwn.contains(id));
        _;
    }

    modifier shareExists(uint id)
    {
        require(shares[id].uri != 0x0);
        _;
    }

    function ShareCenter() public
    {
        owner = msg.sender;
        idCounter = 0;
    }

    function addSystem(address system) public isOwner returns (bool)
    {
        return authorizedSystems.add(system);
    }

    function addUser(address addr, bytes32 name) public isRegisteredSystem returns (bool)
    {
        if(users[addr].name != 0x0)
            return false;
        users[addr].name = name;
        return true;
    }

    function createShare(bytes32 uri) public isUser(msg.sender)
    {
        ImageShare storage share;
        share.uri = uri;
        share.id = idCounter;
        share.authorizedOwn.add(msg.sender);
        shares[idCounter] = share;
        users[msg.sender].authorizedOwn.add(idCounter);
        ShareCreated(idCounter, uri);
        idCounter++;
    }

    function deleteShare(uint id) public isUser(msg.sender) shareExists(id) ownShare(id)
    {
        ImageShare memory share = shares[id];
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
        if(!users[addr].authorizedOwn.contains(id))
            return false;
        ImageShare storage share = shares[id];
        share.authorizedOwn.remove(addr);
        users[addr].authorizedOwn.remove(share.id);
        OwnerRevoked(id, addr);
        return true;
    }

    function revokeRead(uint id, address addr) public isUser(msg.sender) isUser(addr) shareExists(id) ownShare(id) returns (bool)
    {
        if(!users[addr].authorizedRead.contains(id))
            return false;
        ImageShare storage share = shares[id];
        share.authorizedRead.remove(addr);
        users[addr].authorizedRead.remove(share.id);
        ReaderRevoked(id, addr);
        return true;
    }
}
