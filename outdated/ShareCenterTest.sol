pragma solidity ^0.4.18;
import "./utils/ShareCenterTester.sol";
import "truffle/Assert.sol";

contract ShareCenterTest is ShareCenterTester
{
    function ShareCenterTest() ShareCenterTester() public {}

    function beforeAll() public
    {
        addSystem(accounts[0]);
        for(uint i = 0; i < names.length - 1; i++)
            addUser(accounts[i], names[i]);
    }

    function testCreateShare() public
    {
        createShare(uri);
        Assert.isTrue(users[msg.sender].authorizedOwn.contains(0), "User does not have share");
        Assert.isTrue(shares[0].authorizedOwn.contains(msg.sender), "Share did not add user");
        Assert.equal(shares[0].id, 0, "Share id not set correctly");
        Assert.equal(shares[0].uri, uri, "Share uri not set correctly");
    }

    function testDeleteShare() public
    {
        deleteShare(0);
        Assert.isFalse(users[msg.sender].authorizedOwn.contains(0), "User share not removed");
        Assert.equal(shares[0].uri, 0x0, "ImageShare was not set to null");
    }

    function testDeleteShareWithNonExistentShare() public
    {
        ShareCenter(address(proxy)).deleteShare(0);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Delete occurred on fake share");
    }
}
