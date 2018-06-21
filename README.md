# ShareCenter

API to interact with the ShareCenter contract on Ethereum

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.


### Installing

A step by step series of examples that tell you how to get a development env running

In npm

```
npm install --save sharecenter
```

Using Node.js

```
//Load the API
const ShareCenter = require('sharecenter');
```


## Running the tests

To run the tests, you must initialize truffle's testrpc, compile and deploy the contracts, and run the tests

```
rm -r build
truffle develop
deploy
test
```


## Deployment

To deploy this on a live system, pass in the HTTP location of your running node

## Built With

* [Web3](https://github.com/ethereum/web3.js/) - The web framework used
* [Truffle](https://truffleframework.com/) - Dependency Management


## Authors

* **Grant Cermak**
* **Avi Verma**
