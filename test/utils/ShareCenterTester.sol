pragma solidity ^0.4.18;
import "../../contracts/ShareCenter.sol";
import "./ThrowProxy.sol";

contract ShareCenterTester is ShareCenter
{
    ThrowProxy public proxy;
    address[] public accounts;
    bytes32[] public names;
    bytes32 public uri = "www.share1.com";
    uint public GAS_LIMIT = 10000;
    uint public id;
    address public acc;

    event TestShareMade(uint id);
    event TestShareRemoved(uint id);
    event ReadAccountAdded(address addr);
    event OwnAccountAdded(address addr);

    modifier initNewShare()
    {
        createShare(uri);
        TestShareMade(id);
        _;
    }

    modifier removeShare()
    {
        deleteShare(id);
        TestShareRemoved(id);
        _;
        id++;
    }

    modifier setReadAddress()
    {
        acc = accounts[0];
        _;
    }

    modifier addAccountToRead()
    {
        acc = accounts[0];
        authorizeRead(id, acc);
        ReadAccountAdded(acc);
        _;
    }

    modifier setOwnAddress()
    {
        acc = accounts[1];
        _;
    }

    modifier addAccountToOwn()
    {
        acc = accounts[1];
        if(authorizeOwn(id, acc))
            OwnAccountAdded(acc);
        _;
    }

    function addUsers() public
    {
        for(uint i = 0; i < names.length - 1; i++)
            addUser(accounts[i], names[i]);
    }


    function ShareCenterTester() ShareCenter() public
    {
        id = 0;
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
}
