const { KycStatus } = require("../models");
const path = require("path");

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

      // Process uploaded files
      const documents = req.files.map(file => ({
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: req.body[`type_${file.fieldname}`] || file.fieldname,
        name: file.originalname,
        path: file.path,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString(),
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

      res.status(200).json({
        data: {
          status: kycStatus.status,
          providerRef: kycStatus.providerRef,
          documents: kycStatus.documents,
          submittedAt: kycStatus.submittedAt,
          reviewedAt: kycStatus.reviewedAt,
          rejectionReason: kycStatus.rejectionReason,
          updatedAt: kycStatus.updatedAt,
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

      res.status(200).json({
        data: {
          message: "KYC status updated successfully",
          status,
          providerRef,
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
      }
    } catch (error) {
      console.error("Mock provider update error:", error);
    }
  },
};

module.exports = kycController;
