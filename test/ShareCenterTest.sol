pragma solidity ^0.4.18;
import "../contracts/ShareCenter.sol";
import "./utils/ThrowProxy.sol";
import "truffle/Assert.sol";

contract ShareCenterTest is ShareCenter
{
    ThrowProxy proxy;
    address[] accounts;
    bytes32[] names;
    bytes32 uri = "www.share1.com";

    function ShareCenterTest() ShareCenter() public
    {
        proxy = new ThrowProxy(address(this));
        accounts.push(0x1);
        accounts.push(0x2);
        accounts.push(0x3);
        names.push("A");
        names.push("B");
        names.push("C");
        addSystem(msg.sender);
        addUser(msg.sender, "owner");
    }

    function testAddSystem() public
    {
        Assert.isTrue(addSystem(accounts[0]), "Could not add system");
        Assert.isFalse(addSystem(accounts[0]), "Added system twice");
    }

    function testAddUser() public
    {
        uint i;
        for(i = 0; i < names.length; i++)
            Assert.isTrue(addUser(accounts[i], names[i]), "Could not add user");
        for(i = 0; i < names.length; i++)
            Assert.isFalse(addUser(accounts[i], names[i]), "Added user twice");
    }

    function testCreateShare() public
    {
        createShare(uri);
        Assert.isTrue(users[msg.sender].authorizedOwn.contains(0), "User does not have share");
        Assert.isTrue(shares[0].authorizedOwn.contains(msg.sender), "Share did not add user");
        Assert.equal(shares[0].id, 0, "Share id not set correctly");
        Assert.equal(shares[0].uri, uri, "Share uri not set correctly");
    }

    function testDeleteShare() public //incomplete
    {
        deleteShare(0);
        Assert.isFalse(users[msg.sender].authorizedOwn.contains(0), "User share not removed");
        ShareCenter(address(proxy)).deleteShare(0);
        bool result = proxy.execute.gas(2000000)();
        Assert.isFalse(result, "Should have thrown an exception");
    }

    function initializeForAuthorizeAndRevokeTests()
    {
        createShare(uri);
    }
}
