var Set = artifacts.require("Set");
var IterableSet_Integer = artifacts.require("IterableSet_Integer");
var IterableSet_Address = artifacts.require("IterableSet_Address");
var ShareCenter = artifacts.require("ShareCenter");
var addr = '0x627306090abab3a6e1400e9345bc60c78a8bef57';
var uri = "sdf";
module.exports = function(deployer) {
  deployer.deploy([Set, IterableSet_Address, IterableSet_Integer]).then(function()  {
    deployer.link(Set, ShareCenter);
    deployer.link(IterableSet_Integer, ShareCenter);
    deployer.link(IterableSet_Address, ShareCenter);

    deployer.deploy(ShareCenter);
  });
};
