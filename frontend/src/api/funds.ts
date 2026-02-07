import { apiClient } from "./auth";

export interface Fund {
  id: string;
  name: string;
  description: string;
  gpId: string;
  targetAmount: string;
  raisedAmount: string;
  minimumInvestment: string;
  managementFee: string;
  performanceFee: string;
  investmentStrategy: string;
  riskLevel: "low" | "medium" | "high";
  status: "draft" | "active" | "closed" | "liquidated";
  fundingDeadline?: string;
  contractAddress?: string;
  onChainFundId?: number;
  investmentContractFundId?: number;
  tokenSymbol?: string;
  portfolioCompanyIds?: number[];
  terms?: any;
  createdAt: string;
  updatedAt: string;
  generalPartner?: {
    id: string;
    email: string;
    role: string;
  };
  investments?: Investment[];
}

export interface Investment {
  id: string;
  fundId: string;
  lpId: string;
  amount: string;
  tokensIssued?: string;
  status: "pending" | "confirmed" | "cancelled";
  transactionHash?: string;
  investedAt: string;
  createdAt: string;
  updatedAt: string;
  fund?: Fund;
  limitedPartner?: {
    id: string;
    email: string;
  };
}

export interface CreateFundData {
  name: string;
  description: string;
  targetAmount: number;
  minimumInvestment: number;
  managementFee: number;
  performanceFee: number;
  investmentStrategy: string;
  riskLevel: "low" | "medium" | "high";
  fundingDeadline?: string;
  tokenSymbol?: string;
  portfolioCompanyIds: number[];
  terms?: any;
}

export interface UpdateFundData extends Partial<CreateFundData> {
  status?: "draft" | "active" | "closed" | "liquidated";
}

export interface CreateInvestmentData {
  fundId: string;
  amount: number;
}

export const fundsApi = {
  async create(data: CreateFundData): Promise<{ data: { fund: Fund; message: string } }> {
    return apiClient.makeRequest("/funds", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getAll(params?: {
    status?: string;
    riskLevel?: string;
    gpId?: string;
  }): Promise<{ data: { funds: Fund[]; count: number } }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.riskLevel) queryParams.append("riskLevel", params.riskLevel);
    if (params?.gpId) queryParams.append("gpId", params.gpId);

    const query = queryParams.toString();
    return apiClient.makeRequest(`/funds${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  async getById(id: string): Promise<{ data: { fund: Fund } }> {
    return apiClient.makeRequest(`/funds/${id}`, {
      method: "GET",
    });
  },

  async getMyFunds(): Promise<{ data: { funds: Fund[]; count: number } }> {
    return apiClient.makeRequest("/funds/my-funds", {
      method: "GET",
    });
  },

  async update(id: string, data: UpdateFundData): Promise<{ data: { fund: Fund; message: string } }> {
    return apiClient.makeRequest(`/funds/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<{ data: { message: string } }> {
    return apiClient.makeRequest(`/funds/${id}`, {
      method: "DELETE",
    });
  },
};

export const investmentsApi = {
  async create(data: CreateInvestmentData): Promise<{ data: { investment: Investment; message: string } }> {
    return apiClient.makeRequest("/investments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getAll(params?: {
    fundId?: string;
    status?: string;
  }): Promise<{ data: { investments: Investment[]; count: number } }> {
    const queryParams = new URLSearchParams();
    if (params?.fundId) queryParams.append("fundId", params.fundId);
    if (params?.status) queryParams.append("status", params.status);

    const query = queryParams.toString();
    return apiClient.makeRequest(`/investments${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  async getById(id: string): Promise<{ data: { investment: Investment } }> {
    return apiClient.makeRequest(`/investments/${id}`, {
      method: "GET",
    });
  },

  async updateStatus(
    id: string,
    data: {
      status: "pending" | "confirmed" | "cancelled";
      transactionHash?: string;
      tokensIssued?: string;
    }
  ): Promise<{ data: { investment: Investment; message: string } }> {
    return apiClient.makeRequest(`/investments/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async getPortfolio(): Promise<{
    data: {
      investments: Investment[];
      summary: {
        totalInvested: number;
        totalTokensIssued: number;
        investmentCount: number;
      };
      onChain: {
        walletAddress: string | null;
        balances: Array<{
          address: string | null;
          symbol: string;
          fundName: string;
          fundId: string | null;
          balance: string | null;
          error?: string;
        }>;
        error: string | null;
      };
    };
  }> {
    return apiClient.makeRequest("/investments/portfolio", {
      method: "GET",
    });
  },
};
