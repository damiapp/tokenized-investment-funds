import { apiClient, API_BASE_URL } from "./auth";

export type KYCDocumentType = "passport" | "idCard" | "proofOfAddress" | "bankStatement";

export interface KYCUploadDocument {
  id: string;
  type: KYCDocumentType;
  name: string;
  previewUrl: string;
  file: File;
  uploadedAt: string;
}

export interface KYCPersistedDocument {
  id: string;
  type: KYCDocumentType;
  originalName: string;
  storedName?: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface KYCSubmission {
  documents: KYCUploadDocument[];
}

export interface KYCStatus {
  status: "pending" | "submitted" | "approved" | "rejected";
  providerRef?: string;
  documents?: KYCPersistedDocument[];
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

export const kycApi = {
  async submitDocuments(documents: KYCUploadDocument[]): Promise<KYCSubmissionResponse> {
    const formData = new FormData();
    
    documents.forEach((doc) => {
      formData.append("documents", doc.file);
      formData.append("documentTypes", doc.type);
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
