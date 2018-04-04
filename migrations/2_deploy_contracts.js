var Set = artifacts.require("Set");
var IterableSet_Integer = artifacts.require("IterableSet_Integer");
var IterableSet_Address = artifacts.require("IterableSet_Address");
var IterableMapping_Integer_Claim = artifacts.require("IterableMapping_Integer_Claim");
var IterableMapping_Address_Claim = artifacts.require("IterableMapping_Address_Claim");
var ArrayUtils = artifacts.require("ArrayUtils");
var Claim = artifacts.require("Claim");
var Group = artifacts.require("Group");
var ShareCenter = artifacts.require("ShareCenter");
var addr = '0x627306090abab3a6e1400e9345bc60c78a8bef57';
var uri = "sdf";
module.exports = async function(deployer)
{
  await loadUtils(deployer);
  await loadShareCenter(deployer);
};

async function loadShareCenter(deployer)
{
  await deployer.link(Set, ShareCenter);
  await deployer.link(IterableSet_Integer, ShareCenter);
  await deployer.link(IterableSet_Address, ShareCenter);
  await deployer.link(IterableMapping_Address_Claim, ShareCenter);
  await deployer.link(IterableMapping_Integer_Claim, ShareCenter);
  await deployer.link(Group, ShareCenter);
  await deployer.link(Claim, ShareCenter);
  await deployer.deploy(ShareCenter);
}

async function loadUtils(deployer)
{
  await deployer.deploy([Claim, ArrayUtils, Set, IterableSet_Address, IterableSet_Integer]);
  await deployer.deploy([IterableMapping_Integer_Claim, IterableMapping_Address_Claim]);
  await deployer.deploy(Group);
}


