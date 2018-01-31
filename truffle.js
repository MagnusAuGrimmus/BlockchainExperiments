module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
      gas: 100000000
    },
    staging: {
      host: "localhost",
      port: 8546,
      network_id: 1337
    },
    ropsten:
        {
      host: "158.253.8.12",
      port: 8545,
      network_id: 3
    }
  }
};
