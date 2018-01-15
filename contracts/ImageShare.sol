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

  function addAuthorized(address user)
    onlyOwners
    public
  {
    authorizedOwn.push(user);
  }

  function revokeAuthorized(address user)
    onlyOwners
    public
  {
    if(removeUserFromList(user, authorizedOwn)) {
      OwnerRevoked(user);
    }
  }

  function deleteShare();

  function ImageShare(bytes32 _shareBaseUri, address _shareCreator) public {
    systemPublicKey = msg.sender;

    shareBaseUri = _shareBaseUri;
    shareCreator = _shareCreator;
  }

  modifier onlyOwners() {
    require(isOwner(msg.sender));
    _;
  }

  function isReader(address user)
    internal
  {
    return inUserList(user, authorizedRead);
  }

  function isOwner(address user)
    internal
  {
    return inUserList(user, authorizedOwn);
  }

  function inUserList(address user, address[] userList)
    internal
  {
    for (uint i = 0; i < userList.length; i++) {
      if(userList[i] == user) {
        return true;
      }
    }

    return false;
  }

  function removeUserFromList(address user, address[] userList)
    internal
  {
     uint userIndex = 0;

     // find the index of the indicated user
     for (uint i = 0; i < userList.length; i++) {
        if(userList[i] == user) {
          index = i;
        }
     }

     if(userIndex == 0) {
       return;
     }

     // move everything left, overwriting the user we want out
     for (uint i = userIndex; i < userList.length-1; i++){
         userList[i] = userList[i+1];
     }

     // remove the last element of the array and update the length
     delete userList[array.length-1];
     userList.length--;
  }

  // This function returns the total votes a candidate has received so far
  function totalVotesFor(bytes32 candidate) view public returns (uint8) {
    require(validCandidate(candidate));
    return votesReceived[candidate];
  }

  // This function increments the vote count for the specified candidate. This
  // is equivalent to casting a vote
  function voteForCandidate(bytes32 candidate) public {
    require(validCandidate(candidate));
    require(electionInProgress());

    votesReceived[candidate] += 1;
    VoteOccurrence(msg.sender, candidate);

    // if someone gets more than 1 vote they win!
    if(votesReceived[candidate] >= 2) {
      ElectionWinner(candidate, votesReceived[candidate]);
    }
  }



  function validCandidate(bytes32 candidate) view internal returns (bool) {
    for(uint i = 0; i < candidateList.length; i++) {
      if (candidateList[i] == candidate) {
        return true;
      }
    }
    return false;
  }

  function electionInProgress() view internal returns (bool) {
    for(uint i = 0; i < candidateList.length; i++) {
      if (votesReceived[candidateList[i]] >= 2) {
        return false;
      }
    }
    return true;
  }
}

//  modifier condition(bool _condition) {
//    require(_condition);
//    _;
//  }

//  modifier inState(State _state) {
//    require(state == _state);
//    _;
//  }