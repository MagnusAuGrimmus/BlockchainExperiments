pragma solidity ^0.4.0;

contract Tester
{
    function equal(uint[] a, uint[] b) public pure returns (bool)
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

    function equal(uint[] a, uint[] b, uint length) public pure returns (bool)
    {
        for(uint i = 0; i < length; i++)
        {
            if(a[i] != b[i])
                return false;
        }
        return true;
    }

    function equal(address[] a, address[] b) public pure returns (bool)
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

    function equal(bytes32[] a, bytes32[] b) public pure returns (bool)
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

    function equal(bytes32[] a, bytes32[] b, uint length) public pure returns (bool)
    {
        for(uint i = 0; i < length; i++)
        {
            if(a[i] != b[i])
                return false;
        }
        return true;
    }

    function equal(bool[] a, bool[] b) public pure returns (bool)
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
