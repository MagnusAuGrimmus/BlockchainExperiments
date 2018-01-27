var Set = artifacts.require("Set");
var IterableSet_Integer = artifacts.require("IterableSet_Integer");
var IterableSet_Address = artifacts.require("IterableSet_Address");
var ShareCenter = artifacts.require("ShareCenter");
module.exports = function(deployer) {
    deployer.deploy([Set, IterableSet_Address, IterableSet_Integer])
      .then(function () {
      deployer.deploy(ShareCenter);
    });
    deployer.link(Set, ShareCenter);
    deployer.link(IterableSet_Integer, ShareCenter);
    deployer.link(IterableSet_Address, ShareCenter);
};
