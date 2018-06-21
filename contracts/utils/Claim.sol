pragma solidity ^0.4.19;
library Claim
{
    enum Type {INACTIVE, READ, WRITE}
    struct Data
    {
        uint id;
        uint time;
        Type access;
    }

    function isActive(Data self) internal pure returns (bool)
    {
        return self.id != 0;
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
