var ImageShare = artifacts.require("ImageShare");
var Set = artifacts.require("Set");
var ImageShareSet = artifacts.require("ImageShareSet");
module.exports = function(deployer) {
    deployer.deploy(Set);
    deployer.deploy(ImageShareSet);
    deployer.link(Set, ImageShare);
    deployer.link(ImageShareSet, ImageShare);
    deployer.deploy(ImageShare, "Test", 0x4);
};
