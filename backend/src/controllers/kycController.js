const { KycStatus } = require("../models");
const path = require("path");
const fs = require("fs");

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

      res.status(200).json({
        data: {
          status: kycStatus.status,
          providerRef: kycStatus.providerRef,
          documents: normalizedDocuments,
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
