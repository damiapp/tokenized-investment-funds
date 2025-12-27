const { expect } = require("chai");

describe("FundToken (permissioned demo)", function () {
  it("allows transfers only between verified addresses", async function () {
    const [owner, lp1, lp2] = await ethers.getSigners();

    const KYCRegistry = await ethers.getContractFactory("KYCRegistry");
    const registry = await KYCRegistry.deploy();
    await registry.deployed();

    const FundToken = await ethers.getContractFactory("FundToken");
    const token = await FundToken.deploy("Demo Fund Token", "DFT", registry.address);
    await token.deployed();

    await registry.setVerified(lp1.address, true);

    await expect(token.mint(lp1.address, 100)).to.not.be.reverted;

    await expect(token.connect(lp1).transfer(lp2.address, 1)).to.be.reverted;

    await registry.setVerified(lp2.address, true);

    await expect(token.connect(lp1).transfer(lp2.address, 1)).to.not.be.reverted;
    expect(await token.balanceOf(lp2.address)).to.equal(1);
  });
});
