pragma solidity ^0.4.18;
import './Set.sol';

contract ImageShare
{
  using Set for Set.Data;
  bytes32 private shareBaseUri;

  address private systemPublicKey;
  address private shareCreator;

  Set.Data private authorizedRead;
  Set.Data private authorizedOwn;

  event OwnerAdded(address indexed _user);
  event OwnerRevoked(address indexed _user);
  event ReaderAdded(address indexed _user);
  event ReaderRevoked(address indexed _user);

  modifier onlyOwners() {
    require(systemPublicKey == msg.sender);
    _;
  }

  function ImageShare(bytes32 _shareBaseUri, address _shareCreator) public {
    systemPublicKey = msg.sender;

    authorizedOwn.add(_shareCreator);
    OwnerAdded(_shareCreator);

    shareBaseUri = _shareBaseUri;
    shareCreator = _shareCreator;
  }

  function addAuthorizedOwner(address user)
    onlyOwners
    public
    returns (bool success)
  {
    if(authorizedOwn.add(user))
    {
      OwnerAdded(user);
      return true;
    }
    return false;
  }

  function addAuthorizedReader(address user)
    onlyOwners
    public
    returns (bool success)
  {
    if(authorizedRead.add(user))
    {
      ReaderAdded(user);
      return true;
    }
    return false;
  }

  function revokeAuthorizedOwner(address user)
    onlyOwners
    public
    returns (bool success)
  {
    if(authorizedOwn.remove(user))
    {
      OwnerRevoked(user);
      return true;
    }
    return false;
  }

  function revokeAuthorizedReader(address user)
    onlyOwners
    public
    returns (bool success)
  {
    if(authorizedRead.remove(user))
    {
      ReaderRevoked(user);
      return true;
    }
    return false;
  }


  function getState()
    constant
    public
    returns (bytes32 _shareBaseUri, uint256 _ownCount, uint256 _readCount)
  {
    return(shareBaseUri, authorizedOwn.size, authorizedRead.size);
  }

  function isReader(address user)
    internal
    view
    returns (bool success)
  {
    return authorizedRead.contains(user);
  }

  function isOwner(address user)
    internal
    view
    returns (bool success)
  {
    return authorizedOwn.contains(user);
  }

  function canView(address user)
    public
    view
    returns (bool success)
  {
    return isOwner(user) || isReader(user);
  }

}
