pragma experimental ABIEncoderV2;

library ArrayUtils
{
    function indexOf(address[] arr, address val) public pure returns (bool found, uint index)
    {
        for(uint i = 0; i < arr.length; i++)
            if(arr[i] == val)
                return (true, i);
        return (false, 0);
    }

    function indexOf(uint[] arr, uint val) public pure returns (bool found, uint index)
    {
        for(uint i = 0; i < arr.length; i++)
            if(arr[i] == val)
                return (true, i);
        return (false, 0);
    }
}
