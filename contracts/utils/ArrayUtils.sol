pragma solidity ^0.4.19;

library ArrayUtils
{
    function indexOf(address[] self, address val) internal pure returns (uint index)
    {
        for(uint i = 0; i < self.length; i++)
            if(self[i] == val)
                return i;
        return uint(-1);
    }

    function indexOf(uint[] self, uint val) internal pure returns (uint index)
    {
        for(uint i = 0; i < self.length; i++)
            if(self[i] == val)
                return i;
        return uint(-1);
    }

    function equal(uint[] a, uint[] b) internal pure returns (bool)
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

    function equal(address[] a, address[] b) internal pure returns (bool)
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

    function equal(bytes32[] a, bytes32[] b) internal pure returns (bool)
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

    function equal(bool[] a, bool[] b) internal pure returns (bool)
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
