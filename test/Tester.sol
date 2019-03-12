pragma solidity ^0.5.0;

contract Tester
{
    function equal(uint[] memory a, uint[] memory b) public pure returns (bool)
    {
        if(a.length != b.length)
            return false;
        for(uint i = 0; i < a.length; i++)
        {
            if(a[i] != b[i])
                return false;
        }
        return true;
    }

    function equal(uint[] memory a, uint[] memory b, uint length) public pure returns (bool)
    {
        for(uint i = 0; i < length; i++)
        {
            if(a[i] != b[i])
                return false;
        }
        return true;
    }

    function equal(address[] memory a, address[] memory b) public pure returns (bool)
    {
        if(a.length != b.length)
            return false;
        for(uint i = 0; i < a.length; i++)
        {
            if(a[i] != b[i])
                return false;
        }
        return true;
    }

    function equal(bytes32[] memory a, bytes32[] memory b) public pure returns (bool)
    {
        if(a.length != b.length)
            return false;
        for(uint i = 0; i < a.length; i++)
        {
            if(a[i] != b[i])
                return false;
        }
        return true;
    }

    function equal(bytes32[] memory a, bytes32[] memory b, uint length) public pure returns (bool)
    {
        for(uint i = 0; i < length; i++)
        {
            if(a[i] != b[i])
                return false;
        }
        return true;
    }

    function equal(bool[] memory a, bool[] memory b) public pure returns (bool)
    {
        if(a.length != b.length)
            return false;
        for(uint i = 0; i < a.length; i++)
        {
            if(a[i] != b[i])
                return false;
        }
        return true;
    }
}
