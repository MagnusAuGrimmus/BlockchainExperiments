var Set = artifacts.require("Set");
var IterableSet_Integer = artifacts.require("IterableSet_Integer");
var IterableSet_Address = artifacts.require("IterableSet_Address");
var IterableMapping_Integer_Claim = artifacts.require("IterableMapping_Integer_Claim");
var IterableMapping_Address_Claim = artifacts.require("IterableMapping_Address_Claim");
var ArrayUtils = artifacts.require("ArrayUtils");
var Claim = artifacts.require("Claim");
var Group = artifacts.require("Group");
var ShareCenter = artifacts.require("ShareCenter");

module.exports = async function(deployer)
{
  // deployer.deploy([Claim, ArrayUtils, Set, IterableSet_Address,
  //   IterableSet_Integer, Group, IterableMapping_Address_Claim,
  //   IterableMapping_Integer_Claim]);
  // deployer.link(Set, ShareCenter);
  // deployer.link(IterableSet_Integer, ShareCenter);
  // deployer.link(IterableSet_Address, ShareCenter);
  // deployer.link(IterableMapping_Address_Claim, ShareCenter);
  // deployer.link(IterableMapping_Integer_Claim, ShareCenter);
  // deployer.link(Group, ShareCenter);
  // deployer.link(Claim, ShareCenter);
  // deployer.link(ArrayUtils, ShareCenter);
  deployer.deploy(ShareCenter);
};


