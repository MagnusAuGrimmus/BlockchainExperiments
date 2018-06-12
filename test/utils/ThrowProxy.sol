pragma solidity ^0.4.18;

contract ThrowProxy
{
    address public target;
    bytes data;

    constructor(address _target) public
    {
        target = _target;
    }

    //prime the data using the fallback function.
    function() public
    {
        data = msg.data;
    }

    function execute() public returns (bool)
    {
        return target.call(data);
    }
}
