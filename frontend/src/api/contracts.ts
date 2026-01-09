import { apiClient } from "./auth";

export interface ContractInfo {
  network: string;
  chainId: number;
  kycRegistry: string;
  fundToken: string;
  initialized: boolean;
}

export interface KycVerificationStatus {
  walletAddress: string;
  isVerified: boolean;
}

export interface TokenBalance {
  walletAddress: string;
  balance: string;
  symbol: string;
}

export const contractsApi = {
  async getInfo(): Promise<{ data: ContractInfo }> {
    return apiClient.makeRequest("/contracts/info", {
      method: "GET",
    });
  },

  async checkKycVerification(walletAddress: string): Promise<{ data: KycVerificationStatus }> {
    return apiClient.makeRequest(`/contracts/kyc/${walletAddress}`, {
      method: "GET",
    });
  },

  async setKycVerification(
    walletAddress: string,
    verified: boolean
  ): Promise<{ data: { walletAddress: string; verified: boolean; transactionHash: string } }> {
    return apiClient.makeRequest("/contracts/kyc/verify", {
      method: "POST",
      body: JSON.stringify({ walletAddress, verified }),
    });
  },

  async getTokenBalance(walletAddress: string): Promise<{ data: TokenBalance }> {
    return apiClient.makeRequest(`/contracts/tokens/${walletAddress}/balance`, {
      method: "GET",
    });
  },
};
