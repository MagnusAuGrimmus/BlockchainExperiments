pragma solidity ^0.4.19;
library Claim
{
    enum Type {INACTIVE, READ, WRITE}
    struct Data
    {
        uint time;
        Type access;
    }

    function getType(uint access) internal pure returns (Type)
    {
        require(access <= 2);
        if(access == 1)
            return Type.READ;
        if(access == 2)
            return Type.WRITE;
        return Type.INACTIVE;
    }

    function isActive(Data self) internal pure returns (bool)
    {
        return self.access != Type.INACTIVE;
    }

    function canRead(Data self) internal view returns (bool)
    {
        return isValid(self) && uint(self.access) >= uint(Type.READ);
    }

    function canWrite(Data self) internal view returns (bool)
    {
        return isValid(self) && uint(self.access) >= uint(Type.WRITE);
    }

    function isValid(Data self) internal view returns (bool)
    {
        return isActive(self) && (self.time == 0 || now <= self.time);
    }
}
