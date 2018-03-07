pragma solidity ^0.4.18;
import "./utils/ShareCenterTester.sol";
import "truffle/Assert.sol";

contract ShareCenterRevokeTest is ShareCenterTester
{
    function ShareCenterRevokeTest() ShareCenterTester() public
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

    function testRevokeOwn() public initNewShare addAccountToOwn
    {
        Assert.isTrue(revokeOwn(id, acc), "Revoke did not find user in share");
        Assert.isFalse(revokeOwn(id, acc), "Revoke removed user twice");
        Assert.isFalse(shares[id].authorizedOwn.contains(acc), "Share did not remove user");
        Assert.isFalse(users[acc].authorizedOwn.contains(id), "User did not remove share");
    }
}
