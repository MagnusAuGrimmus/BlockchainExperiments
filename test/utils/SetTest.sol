pragma solidity ^0.4.18;
import "../../contracts/utils/Set.sol";
import "truffle/Assert.sol";
contract SetTest
{
    using Set for Set.Data;
    address[] accounts;
    Set.Data set;

    function beforeAll() public
    {
        accounts.push(0x1);
        accounts.push(0x2);
        accounts.push(0x3);
    }

    function testAdd() public
    {
        Assert.isTrue(set.add(accounts[0]), "Could not add an account");
        Assert.isFalse(set.add(accounts[0]), "Could not recognize that account was already added");
        Assert.isTrue(set.add(accounts[1]), "Could not add multiple accounts");
    }

    function testSize() public
    {
        Assert.equal(set.size, 2, "Set size not working properly");
    }

    function testContains() public
    {
        Assert.isTrue(set.contains(accounts[0]), "Could not detect account");
        Assert.isTrue(set.contains(accounts[1]), "Could not detect account");
        Assert.isFalse(set.contains(accounts[2]), "Detected account that wasn't in set");
    }

    function testRemove() public
    {
        Assert.isTrue(set.remove(accounts[0]), "Could not remove account");
        Assert.isFalse(set.remove(accounts[0]), "Removed account twice");
        Assert.isFalse(set.remove(accounts[2]), "Removed a nonexistent account");
    }
}
