const errorCode = {
  // Ethereum Errors passed through from ShareCenter.sol contract
  IS_NOT_OWNER: 0,
  USER_ALREADY_EXISTS: 1,
  IS_NOT_A_USER: 2,
  IS_NOT_A_REGISTERED_SYSTEM: 3,
  DOES_NOT_OWN_SHARE: 4,
  DOES_NOT_HAVE_SHARE: 5,
  SHARE_DOES_NOT_EXIST: 6,
  GROUP_NOT_ACTIVE: 7,
  NOT_IN_GROUP: 8,
  NOT_OWNER_OF_GROUP: 9,
  IN_GROUP: 10,

  // ShareCenter.js module specific errors
  INVALID_URI: 100,
  CIRCULAR_DEPENDENCY: 101,
  NONNEGATIVE_TIME: 102,

  // Node errors passed through from web3/truffle packages
  INVALID_JSON_RESPONSE: 200,
  CONNECTION_ERROR: 201,
  PROVIDER_NOT_SET: 202,
  CONNECTION_TIMEOUT: 203
};


const errorMessages = {
  // Ethereum Errors passed through from ShareCenter.sol contract
  [errorCode.IS_NOT_OWNER]: 'Owner does not exist',
  [errorCode.USER_ALREADY_EXISTS]: 'User already exists',
  [errorCode.IS_NOT_A_USER]: 'User does not exist',
  [errorCode.IS_NOT_A_REGISTERED_SYSTEM]: 'Caller is not a Registered System',
  [errorCode.DOES_NOT_OWN_SHARE]: 'Caller does not own share',
  [errorCode.DOES_NOT_HAVE_SHARE]: 'Caller does not have share',
  [errorCode.SHARE_DOES_NOT_EXIST]: 'Share does not exist',
  [errorCode.GROUP_NOT_ACTIVE]: 'Group is not active',
  [errorCode.NOT_IN_GROUP]: 'User is not in group',
  [errorCode.NOT_OWNER_OF_GROUP]: 'User is not owner of group',
  [errorCode.IN_GROUP]: 'User or Group is already in group',

  // ShareCenter.js module specific errors
  [errorCode.INVALID_URI]: 'Invalid length URI',
  [errorCode.CIRCULAR_DEPENDENCY]: 'Circular Dependency: Cannot add Group',
  [errorCode.NONNEGATIVE_TIME]: 'Time must be nonnegative',

  // Node errors passed through from web3/truffle packages
  [errorCode.INVALID_JSON_RESPONSE]:
    'Node threw an invalid JSON Response. Check to see if your node is running',
  [errorCode.CONNECTION_ERROR]:
    'Cannot connect to node. Check to see if your node is running',
  [errorCode.PROVIDER_NOT_SET]:
    'Invalid Provider. Check the http provider used to initialize object',
  [errorCode.CONNECTION_TIMEOUT]:
    'Connection timeout. Check to see if your node is running'

};

const nodeErrorKeywords = {
  'Invalid JSON RPC response': errorCode.INVALID_JSON_RESPONSE,
  'CONNECTION ERROR': errorCode.CONNECTION_ERROR,
  'Provider not set': errorCode.PROVIDER_NOT_SET,
  'CONNECTION TIMEOUT': errorCode.CONNECTION_ERROR,
};

class IDError extends Error {
  constructor(id, logs) {
    super();
    this.message = IDError.getMessage(id);
    this.id = id;
    this.logs = logs;
    Error.captureStackTrace(this, IDError);
  }
  static getMessage(id) {
    return errorMessages[id] || 'Error';
  }
}

class EthError extends IDError {}

class InputError extends IDError {}

class EthNodeError extends Error {
  constructor(message) {
    super();
    this.id = EthNodeError.getID(message);
    this.message =  EthNodeError.getMessage(this.id) || message;
    Error.captureStackTrace(this, EthNodeError);
  }
  static getID(err) {
    return Object.keys(nodeErrorKeywords).find(phrase => err.message.includes(phrase));
  }
  static getMessage(id) {
    return errorMessages[id] || 'Ethereum Node Error';
  }
}

function handleEthErrors(result) {
  const errorLog = Array.from(result.logs).find(log => log.event === 'Error');

  if (errorLog) {
    const id = errorLog.args.id.toNumber();
    throw new EthError(id, result.logs);
  }
}

module.exports = { EthError, InputError, EthNodeError, handleEthErrors, errorCode };
