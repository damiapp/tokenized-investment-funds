import { apiClient } from "./auth";

export interface Transaction {
  id: string;
  fundId: string;
  fundName: string;
  fundSymbol: string;
  gpId: string;
  gpEmail: string;
  lpId: string;
  lpEmail: string;
  amount: string;
  tokensIssued: string;
  status: "pending" | "confirmed" | "cancelled";
  transactionHash?: string;
  investedAt: string;
  confirmedAt?: string;
  createdAt: string;
}

export interface TransactionDetail extends Transaction {
  fundDescription?: string;
  fundContractAddress?: string;
  gpWallet?: string;
  lpWallet?: string;
  updatedAt: string;
}

export interface TransactionFilters {
  status?: string | string[];
  fundId?: string;
  gpId?: string;
  lpId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalInvested: string;
  totalTokensIssued: string;
  confirmedCount: number;
  pendingCount: number;
  cancelledCount: number;
}

export interface TransactionsResponse {
  data: {
    transactions: Transaction[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    summary: TransactionSummary;
  };
}

export interface TransactionDetailResponse {
  data: TransactionDetail;
}

export const transactionsApi = {
  getAll: (filters: TransactionFilters): Promise<TransactionsResponse> => {
    return apiClient.get("/transactions", { params: filters });
  },

  getById: (id: string): Promise<TransactionDetailResponse> => {
    return apiClient.get(`/transactions/${id}`);
  },

  exportCSV: async (filters: TransactionFilters): Promise<Blob> => {
    return apiClient.get<Blob>("/transactions/export/csv", {
      params: filters,
      responseType: "blob",
    });
  },
};
