const { KycStatus, User } = require("../models");
const path = require("path");
const fs = require("fs");
const contractService = require("../services/contractService");

const kycController = {
  async submit(req, res) {
    try {
      const userId = req.user.id;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "At least one document file is required",
          },
        });
      }

      // Find existing KYC status
      let kycStatus = await KycStatus.findOne({ where: { userId } });

      if (!kycStatus) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "KYC status not found",
          },
        });
      }

      const rawDocumentTypes = req.body.documentTypes;
      const documentTypes = Array.isArray(rawDocumentTypes)
        ? rawDocumentTypes
        : rawDocumentTypes
          ? [rawDocumentTypes]
          : [];

      if (documentTypes.length !== req.files.length) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "documentTypes must be provided once per uploaded document",
          },
        });
      }

      const allowedTypes = new Set([
        "passport",
        "idCard",
        "proofOfAddress",
        "bankStatement",
      ]);

      for (const t of documentTypes) {
        if (!allowedTypes.has(t)) {
          return res.status(400).json({
            error: {
              code: "VALIDATION_ERROR",
              message: `Invalid document type: ${t}`,
            },
          });
        }
      }

      // Process uploaded files into a stable, persisted schema
      const uploadedAt = new Date().toISOString();
      const documents = req.files.map((file, idx) => ({
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: documentTypes[idx],
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt,
      }));

      // Update KYC with submitted documents
      const providerRef = `KYC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await kycStatus.update({
        documents,
        providerRef,
        status: "submitted",
        submittedAt: new Date(),
      });

      // Simulate sending to KYC provider (in production, this would be an actual API call)
      setTimeout(() => {
        // Mock approval after 30 seconds for demo
        kycController.mockProviderUpdate(userId, providerRef, "approved");
      }, 30000);

      res.status(200).json({
        data: {
          message: "KYC documents submitted successfully",
          providerRef,
          status: "submitted",
          documentsCount: documents.length,
        },
      });
    } catch (error) {
      console.error("KYC submission error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to submit KYC documents",
        },
      });
    }
  },

  async getStatus(req, res) {
    try {
      const userId = req.user.id;
      const kycStatus = await KycStatus.findOne({ where: { userId } });

      if (!kycStatus) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "KYC status not found",
          },
        });
      }

      const documents = Array.isArray(kycStatus.documents)
        ? kycStatus.documents
        : [];

      const normalizedDocuments = documents
        .filter((doc) => doc && typeof doc === "object")
        .map((doc) => {
          const storedName =
            typeof doc.storedName === "string"
              ? doc.storedName
              : (typeof doc.filename === "string" ? doc.filename : undefined);

          const legacyStableId = storedName
            ? `doc_${storedName.replace(/[^a-zA-Z0-9_-]/g, "_")}`
            : undefined;

          const finalId =
            typeof doc.id === "string" ? doc.id : (legacyStableId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

          return {
            id: finalId,
            type: typeof doc.type === "string" ? doc.type : "passport",
            originalName:
              typeof doc.originalName === "string"
                ? doc.originalName
                : (typeof doc.name === "string" ? doc.name : "document"),
            storedName,
            mimeType:
              typeof doc.mimeType === "string"
                ? doc.mimeType
                : (typeof doc.mimetype === "string" ? doc.mimetype : "application/octet-stream"),
            size: typeof doc.size === "number" ? doc.size : 0,
            uploadedAt:
              typeof doc.uploadedAt === "string" ? doc.uploadedAt : new Date().toISOString(),
            downloadUrl: storedName ? `/kyc/documents/${finalId}/download` : undefined,
          };
        });

      // Get user's wallet address for on-chain status check
      const user = await User.findByPk(userId);
      let onChainStatus = null;
      
      if (user?.walletAddress && kycStatus.status === "approved") {
        onChainStatus = await kycController.getOnChainKycStatus(user.walletAddress);
      }

      res.status(200).json({
        data: {
          status: kycStatus.status,
          providerRef: kycStatus.providerRef,
          documents: normalizedDocuments,
          submittedAt: kycStatus.submittedAt,
          reviewedAt: kycStatus.reviewedAt,
          rejectionReason: kycStatus.rejectionReason,
          updatedAt: kycStatus.updatedAt,
          onChain: {
            txHash: kycStatus.onChainTxHash,
            syncedAt: kycStatus.onChainSyncedAt,
            verified: onChainStatus?.verified || false,
            error: onChainStatus?.error || null,
          },
        },
      });
    } catch (error) {
      console.error("Get KYC status error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to get KYC status",
        },
      });
    }
  },

  async downloadDocument(req, res) {
    try {
      const userId = req.user.id;
      const { documentId } = req.params;

      const kycStatus = await KycStatus.findOne({ where: { userId } });
      if (!kycStatus) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "KYC status not found",
          },
        });
      }

      const documents = Array.isArray(kycStatus.documents)
        ? kycStatus.documents
        : [];

      const doc = documents.find((d) => {
        if (!d || typeof d !== "object") return false;
        if (d.id === documentId) return true;
        const storedNameCandidate =
          typeof d.storedName === "string"
            ? d.storedName
            : (typeof d.filename === "string" ? d.filename : undefined);
        if (!storedNameCandidate) return false;
        const legacyStableId = `doc_${storedNameCandidate.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
        return legacyStableId === documentId;
      });
      if (!doc) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Document not found",
          },
        });
      }

      const storedName =
        typeof doc.storedName === "string"
          ? doc.storedName
          : (typeof doc.filename === "string" ? doc.filename : undefined);
      if (!storedName || typeof storedName !== "string") {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Document file not found",
          },
        });
      }

      const uploadDir = path.join(__dirname, "../../uploads/kyc");
      const filePath = path.join(uploadDir, storedName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Document file missing on server",
          },
        });
      }

      const downloadName =
        typeof doc.originalName === "string"
          ? doc.originalName
          : (typeof doc.name === "string" ? doc.name : storedName);

      return res.download(filePath, downloadName);
    } catch (error) {
      console.error("KYC document download error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to download document",
        },
      });
    }
  },

  async webhook(req, res) {
    try {
      const { providerRef, status, rejectionReason } = req.body;

      if (!providerRef || !status) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "providerRef and status are required",
          },
        });
      }

      // Find KYC record by provider reference
      const kycStatus = await KycStatus.findOne({ where: { providerRef } });

      if (!kycStatus) {
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "KYC record not found for this provider reference",
          },
        });
      }

      // Update KYC status
      const updateData = {
        status,
        reviewedAt: new Date(),
      };

      if (status === "rejected" && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      await kycStatus.update(updateData);

      // Sync to blockchain if approved
      let blockchainSync = null;
      if (status === "approved") {
        blockchainSync = await kycController.syncKycToBlockchain(kycStatus.userId);
      }

      res.status(200).json({
        data: {
          message: "KYC status updated successfully",
          status,
          providerRef,
          blockchainSync,
        },
      });
    } catch (error) {
      console.error("KYC webhook error:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL",
          message: "Failed to process KYC webhook",
        },
      });
    }
  },

  // Mock provider update for demo purposes
  async mockProviderUpdate(userId, providerRef, status) {
    try {
      const kycStatus = await KycStatus.findOne({ where: { userId } });
      
      if (kycStatus) {
        const updateData = {
          status,
          reviewedAt: new Date(),
        };

        if (status === "rejected") {
          updateData.rejectionReason = "Mock rejection for demo purposes";
        }

        await kycStatus.update(updateData);
        console.log(`Mock KYC update: User ${userId}, Status: ${status}`);

        // Sync to blockchain if approved
        if (status === "approved") {
          await kycController.syncKycToBlockchain(userId);
        }
      }
    } catch (error) {
      console.error("Mock provider update error:", error);
    }
  },

  // Sync KYC approval status to blockchain
  async syncKycToBlockchain(userId) {
    try {
      // Get user's wallet address
      const user = await User.findByPk(userId);
      
      if (!user) {
        console.warn(`Cannot sync KYC to blockchain: User ${userId} not found`);
        return { success: false, reason: "user_not_found" };
      }

      if (!user.walletAddress) {
        console.warn(`Cannot sync KYC to blockchain: User ${userId} has no wallet address`);
        return { success: false, reason: "no_wallet_address" };
      }

      // Check if contract service is initialized
      if (!contractService.isInitialized()) {
        await contractService.initialize();
      }

      if (!contractService.isInitialized()) {
        console.warn("Cannot sync KYC to blockchain: Contract service not initialized (Hardhat node may not be running)");
        return { success: false, reason: "contract_service_not_initialized" };
      }

      // Set KYC verified on-chain
      const txHash = await contractService.setKycVerified(user.walletAddress, true);
      console.log(`KYC synced to blockchain for ${user.walletAddress}: tx ${txHash}`);

      // Update KYC status with on-chain transaction hash
      const kycStatus = await KycStatus.findOne({ where: { userId } });
      if (kycStatus) {
        await kycStatus.update({
          onChainTxHash: txHash,
          onChainSyncedAt: new Date(),
        });
      }

      return { success: true, txHash };
    } catch (error) {
      console.error("Failed to sync KYC to blockchain:", error.message);
      return { success: false, reason: "blockchain_error", error: error.message };
    }
  },

  // Manually trigger blockchain sync for approved KYC
  async manualBlockchainSync(req, res) {
    try {
      const userId = req.user.id;
      
      // Check if KYC is approved
      const kycStatus = await KycStatus.findOne({ where: { userId } });
      
      if (!kycStatus) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "KYC status not found" },
        });
      }

      if (kycStatus.status !== "approved") {
        return res.status(400).json({
          error: { code: "INVALID_STATUS", message: "KYC must be approved before syncing to blockchain" },
        });
      }

      // Check if user has wallet address
      const user = await User.findByPk(userId);
      if (!user?.walletAddress) {
        return res.status(400).json({
          error: { code: "NO_WALLET", message: "Please connect your wallet first" },
        });
      }

      // Trigger sync
      const result = await kycController.syncKycToBlockchain(userId);

      if (result.success) {
        res.status(200).json({
          data: {
            message: "KYC synced to blockchain successfully",
            txHash: result.txHash,
          },
        });
      } else {
        res.status(500).json({
          error: { 
            code: "SYNC_FAILED", 
            message: `Blockchain sync failed: ${result.reason}`,
            reason: result.reason,
          },
        });
      }
    } catch (error) {
      console.error("Manual blockchain sync error:", error);
      res.status(500).json({
        error: { code: "INTERNAL", message: "Failed to sync KYC to blockchain" },
      });
    }
  },

  // Get on-chain KYC status for a wallet address
  async getOnChainKycStatus(walletAddress) {
    try {
      if (!contractService.isInitialized()) {
        await contractService.initialize();
      }

      if (!contractService.isInitialized()) {
        return { verified: false, error: "Contract service not initialized" };
      }

      const verified = await contractService.isKycVerified(walletAddress);
      return { verified, error: null };
    } catch (error) {
      console.error("Failed to get on-chain KYC status:", error.message);
      return { verified: false, error: error.message };
    }
  },
};

module.exports = kycController;
