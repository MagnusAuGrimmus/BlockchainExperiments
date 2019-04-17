pragma solidity ^0.5.0;

contract Throwable {
    enum ErrorCode {
        IS_NOT_OWNER, // 0
        USER_ALREADY_EXISTS, // 1
        IS_NOT_A_USER, // 2
        IS_NOT_A_REGISTERED_SYSTEM, // 3
        DOES_NOT_OWN_SHARE, // 4
        DOES_NOT_HAVE_SHARE, // 5
        SHARE_DOES_NOT_EXIST, // 6
        GROUP_NOT_ACTIVE, // 7
        NOT_IN_GROUP, // 8
        NOT_OWNER_OF_GROUP, // 9
        IN_GROUP, // 10
        BLACKLISTED, // 11
        INVALID_SHARE_REQUEST // 12
    }

    event Error(uint id);
}
