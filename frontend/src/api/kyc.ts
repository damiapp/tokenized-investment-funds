import { apiClient } from "./auth";

export interface KYCDocument {
  id: string;
  type: "passport" | "idCard" | "proofOfAddress" | "bankStatement";
  name: string;
  url: string;
  file?: File;
  uploadedAt: string;
}

export interface KYCSubmission {
  documents: KYCDocument[];
}

export interface KYCStatus {
  status: "pending" | "submitted" | "approved" | "rejected";
  providerRef?: string;
  documents?: KYCDocument[];
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  updatedAt: string;
}

export interface KYCSubmissionResponse {
  data: {
    message: string;
    providerRef: string;
    status: string;
    documentsCount?: number;
  };
}

export interface KYCStatusResponse {
  data: KYCStatus;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

export const kycApi = {
  async submitDocuments(documents: KYCDocument[]): Promise<KYCSubmissionResponse> {
    const formData = new FormData();
    
    documents.forEach((doc) => {
      if (doc.file) {
        formData.append("documents", doc.file);
        formData.append(`type_documents`, doc.type);
      }
    });

    const token = apiClient.getToken();
    const response = await fetch(`${API_BASE_URL}/kyc/submit`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "Failed to submit KYC documents");
    }

    return response.json();
  },

  async getStatus(): Promise<KYCStatusResponse> {
    return apiClient.makeRequest<KYCStatusResponse>("/kyc/status", {
      method: "GET",
    });
  },
};
