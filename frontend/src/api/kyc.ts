import { apiClient } from "./auth";

export interface KYCDocument {
  id: string;
  type: "passport" | "idCard" | "proofOfAddress" | "bankStatement";
  name: string;
  url: string;
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
  };
}

export interface KYCStatusResponse {
  data: KYCStatus;
}

export const kycApi = {
  async submitDocuments(documents: KYCDocument[]): Promise<KYCSubmissionResponse> {
    return apiClient.makeRequest<KYCSubmissionResponse>("/kyc/submit", {
      method: "POST",
      body: JSON.stringify({ documents }),
    });
  },

  async getStatus(): Promise<KYCStatusResponse> {
    return apiClient.makeRequest<KYCStatusResponse>("/kyc/status", {
      method: "GET",
    });
  },
};
