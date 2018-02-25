pragma solidity ^0.4.0;
import "./utils/ShareCenterTester.sol";
import "truffle/Assert.sol";

contract ShareCenterTestRevoke is ShareCenterTester
{
    function ShareCenterTestRevoke() ShareCenterTester() public
    {
        addUsers();
    }

    function testRevokeRead() public initNewShare addAccountToRead
    {

        Assert.isTrue(revokeRead(id, acc), "Revoke did not find user in share");
        Assert.isFalse(revokeRead(id, acc), "Revoke removed user twice");
        Assert.isFalse(shares[id].authorizedRead.contains(acc), "Share did not remove user");
        Assert.isFalse(users[acc].authorizedRead.contains(id), "User did not remove share");
    }

    function testRevokeReadWithNonRegisteredUser() public
    {
        ShareCenter(address(proxy)).revokeRead(id, accounts[2]);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Revoke read shouldn't have processed for unregistered user");
    }

    function testRevokeReadWihNonExistentShare() public
    {
        ShareCenter(address(proxy)).revokeRead(0, acc);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Revoke read shouldn't have processed on nonexistent share");
    }

    function testRevokeReadWithoutShareOwnership() public removeShare
    {
        ShareCenter(address(proxy)).revokeRead(id, acc);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Revoke read shouldn't run without ownership rights");
    }

    function testRevokeOwn() public initNewShare addAccountToOwn
    {
        Assert.isTrue(revokeOwn(id, acc), "Revoke did not find user in share");
        Assert.isFalse(revokeOwn(id, acc), "Revoke removed user twice");
        Assert.isFalse(shares[id].authorizedOwn.contains(acc), "Share did not remove user");
        Assert.isFalse(users[acc].authorizedOwn.contains(id), "User did not remove share");
    }

    function testRevokeOwnWithNonRegisteredUser() public
    {
        ShareCenter(address(proxy)).revokeOwn(id, accounts[2]);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Revoke own shouldn't have processed for unregistered user");
    }

    function testRevokeOwnWihNonExistentShare() public
    {
        ShareCenter(address(proxy)).revokeOwn(0, acc);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Revoke own shouldn't have processed on nonexistent share");
    }

    function testRevokeOwnWithoutShareOwnership() public removeShare
    {
        ShareCenter(address(proxy)).revokeOwn(id, acc);
        bool result = proxy.execute.gas(GAS_LIMIT)();
        Assert.isFalse(result, "Revoke own shouldn't run without ownership rights");
    }
}
