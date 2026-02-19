const { Investment, Fund, User, KycStatus } = require("../models");
const contractService = require("../services/contractService");

const investmentController = {
  async create(req, res) {
    try {
      const lpId = req.user.id;
      const { fundId, amount } = req.body;

      if (!fundId || !amount) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "fundId and amount are required",
          },
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Investment amount must be greater than 0",
          },
        });
      }

      const kycStatus = await KycStatus.findOne({ where: { userId: lpId } });
      if (!kycStatus || kycStatus.status !== "approved") {
        return res.status(403).json({
          error: {
            code: "KYC_NOT_APPROVED",
            message: "KYC verification must be approved before investing",
          },
        });
      }

      const fund = await Fund.findByPk(fundId);
      if (!fund) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Fund not found",
          },
        });
      }

      if (fund.status !== "active") {
        return res.status(400).json({
          error: {
            code: "INVALID_STATE",
            message: "Fund is not accepting investments",
          },
        });
      }

      if (!fund.contractAddress || fund.onChainFundId === null) {
        return res.status(400).json({
          error: {
            code: "FUND_NOT_DEPLOYED",
            message: "Fund must be deployed to blockchain before accepting investments",
          },
        });
      }

      if (parseFloat(amount) < parseFloat(fund.minimumInvestment)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Minimum investment is ${fund.minimumInvestment}`,
          },
        });
      }

      const newRaisedAmount = parseFloat(fund.raisedAmount) + parseFloat(amount);
      if (newRaisedAmount > parseFloat(fund.targetAmount)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Investment would exceed fund target amount",
          },
        });
      }

      const investment = await Investment.create({
        fundId,
        lpId,
        amount,
        status: "pending",
      });

      if (fund.onChainFundId !== null && fund.onChainFundId !== undefined) {
        try {
          const lp = await User.findByPk(lpId);
          if (lp?.walletAddress && contractService.isInitialized()) {
            const tokenAmount = amount; // 1:1 ratio for now
            const result = await contractService.recordInvestment(
              fund.onChainFundId,
              lp.walletAddress,
              amount,
              tokenAmount,
              `db-${investment.id}`
            );
            
            await investment.update({
              onChainInvestmentId: result.investmentId,
              onChainTxHash: result.txHash,
            });
            
            console.log(`Investment recorded on-chain: fundId=${fund.onChainFundId}, investmentId=${result.investmentId}`);
          }
        } catch (error) {
          console.warn("Failed to record investment on-chain:", error.message);
        }
      }

      await fund.update({
        raisedAmount: newRaisedAmount,
      });

      res.status(201).json({
        data: {
          investment,
          message: "Investment created successfully",
        },
      });
    } catch (error) {
      console.error("Investment creation error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to create investment",
        },
      });
    }
  },

  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { fundId, status } = req.query;

      const where = {};
      if (fundId) {
        where.fundId = fundId;
      }
      if (status) {
        where.status = status;
      }

      if (userRole === "LP") {
        where.lpId = userId;
      }

      const investments = await Investment.findAll({
        where,
        include: [
          {
            model: Fund,
            as: "fund",
            include: [
              {
                model: User,
                as: "generalPartner",
                attributes: ["id", "email"],
              },
            ],
          },
          {
            model: User,
            as: "limitedPartner",
            attributes: ["id", "email"],
          },
        ],
        order: [["investedAt", "DESC"]],
      });

      res.status(200).json({
        data: {
          investments,
          count: investments.length,
        },
      });
    } catch (error) {
      console.error("Get investments error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to retrieve investments",
        },
      });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const investment = await Investment.findByPk(id, {
        include: [
          {
            model: Fund,
            as: "fund",
            include: [
              {
                model: User,
                as: "generalPartner",
                attributes: ["id", "email"],
              },
            ],
          },
          {
            model: User,
            as: "limitedPartner",
            attributes: ["id", "email"],
          },
        ],
      });

      if (!investment) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Investment not found",
          },
        });
      }

      if (investment.lpId !== userId && investment.fund.gpId !== userId) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Access denied",
          },
        });
      }

      res.status(200).json({
        data: { investment },
      });
    } catch (error) {
      console.error("Get investment error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to retrieve investment",
        },
      });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Status is required",
          },
        });
      }

      const investment = await Investment.findByPk(id, {
        include: [
          { model: Fund, as: "fund" },
          { model: User, as: "limitedPartner" },
        ],
      });

      if (!investment) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Investment not found",
          },
        });
      }

      if (investment.fund.gpId !== req.user.id) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Only the fund GP can update investment status",
          },
        });
      }

      const updates = { status };
      let tokenMintResult = null;

      if (status === "confirmed" && investment.status !== "confirmed") {
        tokenMintResult = await investmentController.mintTokensForInvestment(investment);
        
        if (tokenMintResult.success) {
          updates.transactionHash = tokenMintResult.txHash;
          updates.tokensIssued = tokenMintResult.tokensIssued;
        }
      }

      await investment.update(updates);

      res.status(200).json({
        data: {
          investment,
          tokenMint: tokenMintResult,
          message: "Investment status updated successfully",
        },
      });
    } catch (error) {
      console.error("Investment update error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to update investment",
        },
      });
    }
  },

  async getPortfolio(req, res) {
    try {
      const userId = req.user.id;
      const user = req.user;

      const investments = await Investment.findAll({
        where: { lpId: userId, status: "confirmed" },
        include: [
          {
            model: Fund,
            as: "fund",
            include: [
              {
                model: User,
                as: "generalPartner",
                attributes: ["id", "email"],
              },
            ],
          },
        ],
        order: [["investedAt", "DESC"]],
      });

      let onChainBalances = [];
      let onChainError = null;

      if (user.walletAddress) {
        try {
          if (!contractService.isInitialized()) {
            await contractService.initialize();
          }

          if (contractService.isInitialized()) {
            const fundContracts = new Map();
            const fundsWithoutContracts = [];
            
            for (const inv of investments) {
              if (inv.fund?.contractAddress && !fundContracts.has(inv.fund.contractAddress)) {
                fundContracts.set(inv.fund.contractAddress, {
                  address: inv.fund.contractAddress,
                  symbol: inv.fund.tokenSymbol,
                  fundName: inv.fund.name,
                  fundId: inv.fund.id,
                });
              } else if (inv.fund && !inv.fund.contractAddress && inv.status === 'confirmed') {
                if (!fundsWithoutContracts.find(f => f.fundId === inv.fund.id)) {
                  fundsWithoutContracts.push({
                    address: null,
                    symbol: inv.fund.tokenSymbol || 'N/A',
                    fundName: inv.fund.name,
                    fundId: inv.fund.id,
                    balance: null,
                    error: 'Fund not deployed to blockchain',
                  });
                }
              }
            }

            for (const [address, info] of fundContracts) {
              try {
                const balance = await contractService.getFundTokenBalance(user.walletAddress, address);
                onChainBalances.push({
                  ...info,
                  balance,
                });
              } catch (err) {
                console.error(`Failed to get balance for ${info.symbol}:`, err.message);
                onChainBalances.push({
                  ...info,
                  balance: null,
                  error: err.message,
                });
              }
            }
            
            onChainBalances.push(...fundsWithoutContracts);

            try {
              const defaultBalance = await contractService.getFundTokenBalance(user.walletAddress);
              onChainBalances.unshift({
                address: null,
                symbol: "DFT",
                fundName: "Default Fund Token",
                fundId: null,
                balance: defaultBalance,
              });
            } catch (err) {
              console.error("Failed to get default token balance:", err.message);
            }
          } else {
            onChainError = "Contract service not initialized";
          }
        } catch (error) {
          console.error("Failed to get on-chain balances:", error.message);
          onChainError = error.message;
        }
      }

      const totalInvested = investments.reduce(
        (sum, inv) => sum + parseFloat(inv.amount),
        0
      );
      const totalTokensIssued = investments.reduce(
        (sum, inv) => sum + (parseFloat(inv.tokensIssued) || 0),
        0
      );

      res.status(200).json({
        data: {
          investments,
          summary: {
            totalInvested,
            totalTokensIssued,
            investmentCount: investments.length,
          },
          onChain: {
            walletAddress: user.walletAddress,
            balances: onChainBalances,
            error: onChainError,
          },
        },
      });
    } catch (error) {
      console.error("Get portfolio error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to retrieve portfolio",
        },
      });
    }
  },

  async mint(req, res) {
    try {
      const { id } = req.params;

      const investment = await Investment.findByPk(id, {
        include: [
          { model: Fund, as: "fund" },
          { model: User, as: "limitedPartner" },
        ],
      });

      if (!investment) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Investment not found",
          },
        });
      }

      if (investment.fund.gpId !== req.user.id) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "Only the fund GP can mint tokens",
          },
        });
      }

      if (investment.status !== "confirmed") {
        return res.status(400).json({
          error: {
            code: "INVALID_STATE",
            message: "Investment must be confirmed before minting tokens",
          },
        });
      }

      if (investment.tokensIssued && investment.transactionHash) {
        return res.status(200).json({
          data: {
            message: "Tokens already minted",
            investment,
            alreadyMinted: true,
          },
        });
      }

      const tokenMintResult = await investmentController.mintTokensForInvestment(investment);

      if (tokenMintResult.success) {
        await investment.update({
          transactionHash: tokenMintResult.txHash,
          tokensIssued: tokenMintResult.tokensIssued,
        });
      }

      res.status(200).json({
        data: {
          investment,
          tokenMint: tokenMintResult,
          message: tokenMintResult.success ? "Tokens minted successfully" : "Token minting failed",
        },
      });
    } catch (error) {
      console.error("Token mint error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to mint tokens",
        },
      });
    }
  },

  async mintTokensForInvestment(investment) {
    try {
      const lp = investment.limitedPartner;
      const fund = investment.fund;
      
      if (!lp?.walletAddress) {
        console.warn(`Cannot mint tokens: LP ${investment.lpId} has no wallet address`);
        return { success: false, reason: "no_wallet_address" };
      }

      if (!contractService.isInitialized()) {
        await contractService.initialize();
      }

      if (!contractService.isInitialized()) {
        console.warn("Cannot mint tokens: Contract service not initialized");
        return { success: false, reason: "contract_service_not_initialized" };
      }

      const isVerified = await contractService.isKycVerified(lp.walletAddress);
      if (!isVerified) {
        console.warn(`Cannot mint tokens: LP ${lp.walletAddress} identity not verified on-chain`);
        return { success: false, reason: "identity_not_verified" };
      }

      const tokensToMint = parseFloat(investment.amount);

      // Note: Compliance check is skipped for minting (from zero address)
      // because the zero address has no balance and will always fail the
      // "Insufficient unfrozen balance" check. Minting is an owner-only
      // operation and compliance is enforced on subsequent transfers.

      let txHash;
      
      if (fund?.contractAddress) {
        txHash = await contractService.mintFundTokensForFund(
          fund.contractAddress,
          lp.walletAddress,
          tokensToMint
        );
        console.log(`Minted ${tokensToMint} ${fund.tokenSymbol || 'tokens'} to ${lp.walletAddress} (fund: ${fund.name}): tx ${txHash}`);
      } else {
        txHash = await contractService.mintFundTokens(lp.walletAddress, tokensToMint);
        console.log(`Minted ${tokensToMint} DFT tokens to ${lp.walletAddress}: tx ${txHash}`);
      }

      return {
        success: true,
        txHash,
        tokensIssued: tokensToMint,
        walletAddress: lp.walletAddress,
        tokenContract: fund?.contractAddress || null,
        tokenSymbol: fund?.tokenSymbol || "DFT",
      };
    } catch (error) {
      console.error("Token minting error:", error.message);
      return { success: false, reason: "mint_failed", error: error.message };
    }
  },
};

module.exports = investmentController;
