pragma solidity ^0.5.0;

import "./Throwable.sol";

contract UserManager is Throwable {

    struct User {
        bool active;
        address system;
        uint personalGroupID;
    }

    mapping(address => User) users;

    event UserCreated(address addr, address sender);

    modifier isUser(address addr)
    {
        if (!users[addr].active)
            emit Error(uint(ErrorCode.IS_NOT_A_USER));
        else
            _;
    }

    modifier isNotUser(address addr)
    {
        if (users[addr].active)
            emit Error(uint(ErrorCode.USER_ALREADY_EXISTS));
        else
            _;
    }
}
