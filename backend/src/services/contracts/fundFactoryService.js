const { ethers } = require("ethers");

class FundFactoryService {
  constructor(fundFactory, signer) {
    this.fundFactory = fundFactory;
    this.signer = signer;
  }

  async deployFundViaFactory(name, symbol, targetAmount, minimumInvestment) {
    const tx = await this.fundFactory.createFund(
      name,
      symbol,
      ethers.utils.parseEther(targetAmount.toString()),
      ethers.utils.parseEther(minimumInvestment.toString())
    );
    const receipt = await tx.wait();

    const event = receipt.events.find((e) => e.event === "FundCreated");
    if (!event) {
      throw new Error("FundCreated event not found in transaction receipt");
    }

    return {
      fundId: event.args.fundId.toNumber(),
      tokenAddress: event.args.tokenAddress,
      txHash: receipt.transactionHash,
    };
  }

  async approveGP(gpAddress) {
    const tx = await this.fundFactory.approveGP(gpAddress);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async revokeGP(gpAddress) {
    const tx = await this.fundFactory.revokeGP(gpAddress);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async isApprovedGP(gpAddress) {
    return this.fundFactory.isApprovedGP(gpAddress);
  }

  async getOnChainFund(fundId) {
    const fund = await this.fundFactory.getFund(fundId);
    return {
      id: fundId,
      tokenAddress: fund.tokenAddress,
      gp: fund.gp,
      name: fund.name,
      symbol: fund.symbol,
      targetAmount: ethers.utils.formatEther(fund.targetAmount),
      minimumInvestment: ethers.utils.formatEther(fund.minimumInvestment),
      createdAt: fund.createdAt.toNumber(),
      active: fund.active,
    };
  }

  async getActiveFunds(offset = 0, limit = 10) {
    const funds = await this.fundFactory.getActiveFunds(offset, limit);
    return funds.map(fund => ({
      id: fund.id.toNumber(),
      tokenAddress: fund.tokenAddress,
      gp: fund.gp,
      name: fund.name,
      symbol: fund.symbol,
      targetAmount: ethers.utils.formatEther(fund.targetAmount),
      minimumInvestment: ethers.utils.formatEther(fund.minimumInvestment),
      createdAt: fund.createdAt.toNumber(),
      active: fund.active,
    }));
  }

  async getFundsByGP(gpAddress) {
    const fundIds = await this.fundFactory.getFundsByGP(gpAddress);
    return fundIds.map(id => id.toNumber());
  }

  async getFundCount() {
    const count = await this.fundFactory.getFundCount();
    return count.toNumber();
  }
}

module.exports = FundFactoryService;
