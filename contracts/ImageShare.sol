pragma solidity ^0.4.18;

contract ImageShare {
  bytes32 shareBaseUri;

  address systemPublicKey;
  address shareCreator;

  address[] authorizedRead;
  address[] authorizedOwn;

  event OwnerAdded(address indexed _user);
  event OwnerRevoked(address indexed _user);
  event ReaderAdded(address indexed _user);
  event ReaderRevoked(address indexed _user);

  function addAuthorizedOwner(address user)
    onlyOwners
    public
  {
    authorizedOwn.push(user);
    OwnerAdded(user);
  }

  function addAuthorizedReader(address user)
    onlyOwners
    public
  {
    authorizedRead.push(user);
    ReaderAdded(user);
  }

  function revokeAuthorizedOwner(address user)
    onlyOwners
    public
  {
    if(removeUserFromList(user, authorizedOwn)) {
      OwnerRevoked(user);
    }
  }

  function getState()
    constant
    public
    returns (bytes32 _shareBaseUri, uint256 _ownCount, uint256 _readCount)
  {
    return(shareBaseUri, countElementsInArray(authorizedOwn), countElementsInArray(authorizedRead));
  }

  function ImageShare(bytes32 _shareBaseUri, address _shareCreator) public {
    systemPublicKey = msg.sender;

    authorizedOwn.push(_shareCreator);
    OwnerAdded(_shareCreator);

    shareBaseUri = _shareBaseUri;
    shareCreator = _shareCreator;
  }

  modifier onlyOwners() {
    require(isOwner(msg.sender));
    _;
  }

  function isReader(address user)
    internal
    view
    returns (bool)
  {
    return inUserList(user, authorizedRead);
  }

  function isOwner(address user)
    internal
    view
    returns (bool)
  {
    return inUserList(user, authorizedOwn);
  }

  function inUserList(address user, address[] userList)
    internal
    pure
    returns (bool)
  {
    for (uint i = 0; i < userList.length; i++) {
      if(userList[i] == user) {
        return true;
      }
    }

    return false;
  }

  function countElementsInArray(address[] userList)
    pure
    internal
    returns (uint256)
  {
     uint256 userCount = 0;

     for (uint i = 0; i < userList.length; i++) {
        if(userList[i] != 0) {
          userCount++;
        }
     }

     return userCount;
  }

  function removeUserFromList(address user, address[] userList)
    internal
    returns (bool)
  {
     uint userIndex = 0;

     // find the index of the indicated user
     for (uint i = 0; i < userList.length; i++) {
        if(userList[i] == user) {
          userIndex = i;
        }
     }

     if(userIndex == 0) {
       return false;
     }

     // move everything left, overwriting the user we want out
     for (uint j = userIndex; j < userList.length-1; j++){
         userList[j] = userList[j+1];
     }

     // remove the last element of the array and update the length
     delete userList[userList.length-1];

     return true;
  }
}
