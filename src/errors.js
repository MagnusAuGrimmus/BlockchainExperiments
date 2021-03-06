// Ethereum Errors passed through from ShareCenter.sol contract
const ethErrors = require('../build/contracts/Throwable')
	.ast.nodes[1].nodes[0].members
	.map(({ name }) => name)
	.reduce((obj, code, index) => {
		obj[code] = index;
		return obj;
	}, {});

const errorCode = Object.assign(ethErrors, {
	// ShareCenter.js module specific errors
	INVALID_URI: 100,
	CIRCULAR_DEPENDENCY: 101,
	NEGATIVE_TIME: 102,
	INVALID_EVENT_NAME: 103,

	// Node errors passed through from web3/truffle packages
	INVALID_JSON_RESPONSE: 200,
	CONNECTION_ERROR: 201,
	PROVIDER_NOT_SET: 202,
	CONNECTION_TIMEOUT: 203
});

/** @namespace errorCode.IS_NOT_OWNER */
/** @namespace errorCode.USER_ALREADY_EXISTS */
/** @namespace errorCode.IS_NOT_A_USER */
/** @namespace errorCode.IS_NOT_A_REGISTERED_SYSTEM */
/** @namespace errorCode.DOES_NOT_OWN_SHARE */
/** @namespace errorCode.DOES_NOT_HAVE_SHARE */
/** @namespace errorCode.SHARE_DOES_NOT_EXIST */
/** @namespace errorCode.GROUP_NOT_ACTIVE */
/** @namespace errorCode.NOT_IN_GROUP */
/** @namespace errorCode.NOT_OWNER_OF_GROUP */
/** @namespace errorCode.IN_GROUP */
/** @namespace errorCode.BLACKLISTED */
/** @namespace errorCode.IS_NOT_WRITER */
/** @namespace errorCode.INVALID_SHARE_REQUEST */
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
  [errorCode.BLACKLISTED]: 'Sender is blacklisted',
  [errorCode.IS_NOT_WRITER]: 'Sender does not have write privileges with the group',
  [errorCode.INVALID_SHARE_REQUEST]: 'The Share Request is invalid',

  // ShareCenter.js module specific errors
  [errorCode.INVALID_URI]: 'Invalid length URI',
  [errorCode.CIRCULAR_DEPENDENCY]: 'Circular Dependency: Cannot add Group',
  [errorCode.NEGATIVE_TIME]: 'Time must be nonnegative',
  [errorCode.INVALID_EVENT_NAME]: 'Event does not exist',

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
	constructor (id, logs) {
		super();
		this.message = IDError.getMessage(id);
		this.id = id;
		this.logs = logs;
		Error.captureStackTrace(this, IDError)
	}

	static getMessage (id) {
		return errorMessages[id]
			|| Object.keys(errorCode).find(name => errorCode[name] === id)  // Get the name of the errorCode from the abi if no hardcoded error has been found
			|| 'Error';
	}
}

class EthError extends IDError {}

class InputError extends IDError {}

class EthNodeError extends Error {
	constructor (message) {
		super();
		this.id = EthNodeError.getID(message);
		this.message = EthNodeError.getMessage(this.id) || message;
		Error.captureStackTrace(this, EthNodeError)
	}

	static getID (err) {
		return Object.keys(nodeErrorKeywords).find(phrase => err.message.includes(phrase))
	}

	static getMessage (id) {
		return errorMessages[id]
	}
}

function handleEthErrors (result) {
	const errorLog = Array.from(result.logs).find(log => log.event === 'Error');

	if (errorLog) {
		const id = errorLog.args.id.toNumber();
		throw new EthError(id, result.logs)
	}
}

function handleTimeError (time) {
	if (time < 0)
		throw new InputError(errorCode.NEGATIVE_TIME)
}

function handleURIError (host, path) {
	if (!isValidURI(host, path))
		throw new InputError(errorCode.INVALID_URI)
}

function isValidURI (host, path) {
	return host.length <= 32 && path.length <= 32
}

module.exports = {
	EthError,
	EthNodeError,
	InputError,
	handleEthErrors,
	handleTimeError,
	handleURIError,
	errorCode
};
