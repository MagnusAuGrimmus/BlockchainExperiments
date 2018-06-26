pragma solidity ^0.4.18;
import "./ShareCenterTester.sol";
import "truffle/Assert.sol";


contract ShareCenterTestSystem is ShareCenterTester
{
    constructor() ShareCenterTester() public {}

    function testCreateUser() public
    {
        address addr = 0x100;
        addSystem(addr);
        Assert.isTrue(isAddedSystem(addr), "System not added");
    }
}