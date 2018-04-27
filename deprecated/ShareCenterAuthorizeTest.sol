pragma solidity ^0.4.18;
import "./utils/ShareCenterTester.sol";
import "truffle/Assert.sol";
contract ShareCenterAuthorizeTest is ShareCenterTester
{
    function ShareCenterAuthorizeTest() ShareCenterTester() public
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

    function testAuthorizeOwn() public initNewShare setOwnAddress
    {
        Assert.isTrue(authorizeOwn(id, acc), "Authorization incomplete");
        Assert.isFalse(authorizeOwn(id, acc), "Authorization occurred twice");
        Assert.isTrue(shares[id].authorizedOwn.contains(acc), "ImageShare did not add user");
        Assert.isTrue(users[acc].authorizedOwn.contains(id), "User did not add ImageShare");
    }
}
