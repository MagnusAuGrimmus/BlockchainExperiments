pragma solidity ^0.4.18;
import "../../contracts/ShareCenter.sol";
import "./ThrowProxy.sol";

contract ShareCenterTester is ShareCenter
{
    ThrowProxy public proxy;
    address[] public accounts;
    bytes32 public uri = "www.share1.com";
    bytes32 public host = "nucleus.com";
    bytes32 public path = "abc123";
    uint public GAS_LIMIT = 20000;
    uint public duration = 60 * 60 * 24 * 365;


    function createUsers() public
    {
        for(uint i = 0; i < accounts.length - 1; i++)
            createUser(accounts[i]);
    }


    constructor() ShareCenter() public
    {
        proxy = new ThrowProxy(address(this));
        accounts.push(0x1);
        accounts.push(0x2);
        accounts.push(0x3);
        addSystem(msg.sender);
        createUser(msg.sender);
        createUsers();
    }
}
