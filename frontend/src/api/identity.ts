import { apiClient } from "./auth";

export interface IdentityStatus {
  registered: boolean;
  walletAddress: string | null;
  onChain?: {
    verified: boolean;
    walletAddress: string;
  };
}

export interface RegisterIdentityRequest {
  walletAddress: string;
  countryCode?: number;
}

export interface RegisterIdentityResponse {
  message: string;
  walletAddress: string;
  countryCode: number;
  txHash: string;
  claimTxHash: string;
}

export interface AddClaimRequest {
  walletAddress: string;
  claimTopic: number;
}

export interface AddClaimResponse {
  message: string;
  walletAddress: string;
  claimTopic: number;
  txHash: string;
}

export interface IdentityInfo {
  address: string;
  verified: boolean;
}

export const identityApi = {
  async getStatus(): Promise<IdentityStatus> {
    return apiClient.makeRequest<IdentityStatus>("/identity/status");
  },

  async register(data: RegisterIdentityRequest): Promise<RegisterIdentityResponse> {
    return apiClient.makeRequest<RegisterIdentityResponse>("/identity/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async addClaim(data: AddClaimRequest): Promise<AddClaimResponse> {
    return apiClient.makeRequest<AddClaimResponse>("/identity/claim", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getIdentityInfo(address: string): Promise<IdentityInfo> {
    return apiClient.makeRequest<IdentityInfo>(`/identity/${address}`);
  },
};
