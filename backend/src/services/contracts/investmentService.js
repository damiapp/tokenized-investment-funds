const { ethers } = require("ethers");

class InvestmentService {
  constructor(investmentContract, signer) {
    this.investmentContract = investmentContract;
    this.signer = signer;
  }

  async registerFund(fundToken, gp, targetAmount, minimumInvestment) {
    const tx = await this.investmentContract.registerFund(
      fundToken,
      gp,
      ethers.utils.parseEther(targetAmount.toString()),
      ethers.utils.parseEther(minimumInvestment.toString())
    );
    const receipt = await tx.wait();
    
    const event = receipt.events.find(e => e.event === "FundRegistered");
    const fundId = event ? event.args.fundId.toNumber() : null;

    return {
      txHash: receipt.transactionHash,
      fundId,
    };
  }

  async recordInvestment(fundId, investor, amount, tokenAmount, txHash) {
    const tx = await this.investmentContract.recordInvestment(
      fundId,
      investor,
      ethers.utils.parseEther(amount.toString()),
      ethers.utils.parseEther(tokenAmount.toString()),
      txHash || ""
    );
    const receipt = await tx.wait();
    
    const event = receipt.events.find(e => e.event === "InvestmentRecorded");
    const investmentId = event ? event.args.investmentId.toNumber() : null;

    return {
      txHash: receipt.transactionHash,
      investmentId,
    };
  }

  async confirmInvestment(fundId, investmentId) {
    const tx = await this.investmentContract.confirmInvestment(fundId, investmentId);
    const receipt = await tx.wait();

    return {
      txHash: receipt.transactionHash,
    };
  }

  async cancelInvestment(fundId, investmentId) {
    const tx = await this.investmentContract.cancelInvestment(fundId, investmentId);
    const receipt = await tx.wait();

    return {
      txHash: receipt.transactionHash,
    };
  }

  async closeFund(fundId) {
    const tx = await this.investmentContract.closeFund(fundId);
    const receipt = await tx.wait();

    return {
      txHash: receipt.transactionHash,
    };
  }

  async getFund(fundId) {
    const fund = await this.investmentContract.getFund(fundId);
    return {
      fundToken: fund.fundToken,
      gp: fund.gp,
      targetAmount: ethers.utils.formatEther(fund.targetAmount),
      raisedAmount: ethers.utils.formatEther(fund.raisedAmount),
      minimumInvestment: ethers.utils.formatEther(fund.minimumInvestment),
      active: fund.active,
      investorCount: fund.investorCount.toNumber(),
    };
  }

  async getInvestment(fundId, investmentId) {
    const investment = await this.investmentContract.getInvestment(fundId, investmentId);
    return {
      investor: investment.investor,
      fundToken: investment.fundToken,
      amount: ethers.utils.formatEther(investment.amount),
      tokenAmount: ethers.utils.formatEther(investment.tokenAmount),
      timestamp: investment.timestamp.toNumber(),
      status: investment.status,
      txHash: investment.txHash,
    };
  }

  async getFundInvestmentCount(fundId) {
    const count = await this.investmentContract.getFundInvestmentCount(fundId);
    return count.toNumber();
  }

  async getInvestorTotal(fundId, investor) {
    const total = await this.investmentContract.getInvestorTotal(fundId, investor);
    return ethers.utils.formatEther(total);
  }

  async getInvestorFunds(investor) {
    const fundIds = await this.investmentContract.getInvestorFunds(investor);
    return fundIds.map(id => id.toNumber());
  }

  async getTotalInvestmentVolume() {
    const volume = await this.investmentContract.totalInvestmentVolume();
    return ethers.utils.formatEther(volume);
  }

  async getFundCount() {
    const count = await this.investmentContract.fundCount();
    return count.toNumber();
  }
}

module.exports = InvestmentService;
