import { apiClient } from "./auth";

export interface ComplianceConfig {
  maxHolders?: number;
  minHoldingPeriod?: number;
  requireAccredited?: boolean;
  allowedCountries?: number[];
  blockedCountries?: number[];
}

export interface ConfigureComplianceRequest {
  fundId: string;
  config: ComplianceConfig;
}

export interface ConfigureComplianceResponse {
  message: string;
  fundId: string;
  config: ComplianceConfig;
  txHashes: string[];
}

export interface CheckComplianceRequest {
  token: string;
  from: string;
  to: string;
  amount: number;
}

export interface CheckComplianceResponse {
  canTransfer: boolean;
  reason: string;
  token: string;
  from: string;
  to: string;
  amount: number;
}

export interface FundComplianceResponse {
  fundId: string;
  contractAddress: string | null;
  complianceEnabled: boolean;
  complianceConfig: ComplianceConfig;
}

export const complianceApi = {
  async configure(data: ConfigureComplianceRequest): Promise<ConfigureComplianceResponse> {
    return apiClient.makeRequest<ConfigureComplianceResponse>("/compliance/configure", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async check(params: CheckComplianceRequest): Promise<CheckComplianceResponse> {
    return apiClient.get<CheckComplianceResponse>("/compliance/check", { params });
  },

  async getFundCompliance(fundId: string): Promise<FundComplianceResponse> {
    return apiClient.makeRequest<FundComplianceResponse>(`/compliance/${fundId}`);
  },

  async toggleCompliance(fundId: string, enabled: boolean): Promise<{ message: string }> {
    return apiClient.makeRequest<{ message: string }>(`/compliance/${fundId}/enable`, {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    });
  },
};
