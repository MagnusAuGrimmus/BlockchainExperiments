pragma solidity ^0.4.18;
import "./utils/ShareCenterTester.sol";
import "truffle/Assert.sol";
contract ShareCenterAuthorize is ShareCenterTester
{
    function ShareCenterAuthorize() ShareCenterTester() public
    {
        addUsers();
    }

    function testAuthorizeRead() public initNewShare setReadAddress
    {
        Assert.isTrue(authorizeRead(id, acc), "Authorization incomplete");
        Assert.isFalse(authorizeRead(id, acc), "Authorization occurred twice");
        Assert.isTrue(shares[id].authorizedRead.contains(acc), "ImageShare did not add user");
        Assert.isTrue(users[acc].authorizedRead.contains(id), "User did not add ImageShare");
    }

    function testAuthorizeReadWithNonRegisteredUser() public
    {
        ShareCenter(address(proxy)).authorizeRead(id, acc);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Authorize own shouldn't have processed for unregistered user");
    }

    function testAuthorizeReadWithNonExistentShare() public
    {
        ShareCenter(address(proxy)).authorizeRead(0, acc);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Authorize own shouldn't have processed on nonexistent share");
    }

    function testAuthorizeReadWithoutShareOwnership() public removeShare
    {
        ShareCenter(address(proxy)).authorizeRead(id, acc);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Authorize own shouldn't run without ownership rights");
    }

    function testAuthorizeOwn() public initNewShare setOwnAddress
    {
        Assert.isTrue(authorizeOwn(id, acc), "Authorization incomplete");
        Assert.isFalse(authorizeOwn(id, acc), "Authorization occurred twice");
        Assert.isTrue(shares[id].authorizedOwn.contains(acc), "ImageShare did not add user");
        Assert.isTrue(users[acc].authorizedOwn.contains(id), "User did not add ImageShare");
    }

    function testAuthorizeOwnWithNonRegisteredUser() public
    {
        ShareCenter(address(proxy)).authorizeOwn(id, accounts[2]);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Authorize own shouldn't have processed for unregistered user");
    }

    function testAuthorizeOwnWithNonExistentShare() public
    {
        ShareCenter(address(proxy)).authorizeOwn(0, acc);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Authorize own shouldn't have processed on nonexistent share");
    }

    function testAuthorizeOwnWithoutShareOwnership() public removeShare
    {
        ShareCenter(address(proxy)).authorizeOwn(id, acc);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Authorize own shouldn't run without ownership rights");
    }
}
