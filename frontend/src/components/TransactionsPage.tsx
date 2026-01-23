import React, { useState, useEffect } from "react";
import { transactionsApi, Transaction, TransactionFilters } from "../api/transactions";
import { TransactionsTable } from "./TransactionsTable";
import { TransactionFilters as FiltersComponent } from "./TransactionFilters";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { TransactionSummary } from "./TransactionSummary";

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
    sortBy: "investedAt",
    sortOrder: "desc",
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalInvested: "0",
    totalTokensIssued: "0",
    confirmedCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await transactionsApi.getAll(filters);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
      setSummary(response.data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<TransactionFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleExport = async () => {
    try {
      const blob = await transactionsApi.exportCSV(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export transactions");
    }
  };

  return (
    <div style={{ maxWidth: 1600, margin: "0 auto", padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ color: "#ffffff", fontSize: 32, fontWeight: 700, margin: 0 }}>
            Transaction History
          </h1>
          <p style={{ color: "#9d9d9d", fontSize: 14, marginTop: 8 }}>
            View all investment transactions on the platform
          </p>
        </div>
        <button
          onClick={handleExport}
          style={{
            backgroundColor: "#0078d4",
            border: "none",
            borderRadius: 4,
            color: "#ffffff",
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#106ebe")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0078d4")}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <TransactionSummary summary={summary} />

      {/* Error Message */}
      {error && (
        <div
          style={{
            backgroundColor: "#e8112320",
            border: "1px solid #e81123",
            borderRadius: 4,
            padding: 16,
            marginBottom: 24,
            color: "#e81123",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* Filters Sidebar */}
        <FiltersComponent filters={filters} onFilterChange={handleFilterChange} />

        {/* Transactions Table */}
        <div
          style={{
            backgroundColor: "#2d2d2d",
            border: "1px solid #3e3e42",
            borderRadius: 8,
            padding: 24,
          }}
        >
          <TransactionsTable
            transactions={transactions}
            isLoading={isLoading}
            onSort={handleSort}
            sortBy={filters.sortBy || "investedAt"}
            sortOrder={filters.sortOrder || "desc"}
            onRowClick={handleRowClick}
          />

          {/* Pagination */}
          {!isLoading && transactions.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 24,
                paddingTop: 24,
                borderTop: "1px solid #3e3e42",
              }}
            >
              <div style={{ color: "#9d9d9d", fontSize: 13 }}>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} transactions
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  style={{
                    backgroundColor: "#3a3a3a",
                    border: "1px solid #3e3e42",
                    borderRadius: 4,
                    color: pagination.page === 1 ? "#6e6e6e" : "#ffffff",
                    padding: "8px 16px",
                    fontSize: 13,
                    cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Previous
                </button>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 16px",
                  }}
                >
                  <span style={{ color: "#cccccc", fontSize: 13 }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  style={{
                    backgroundColor: "#3a3a3a",
                    border: "1px solid #3e3e42",
                    borderRadius: 4,
                    color:
                      pagination.page === pagination.totalPages ? "#6e6e6e" : "#ffffff",
                    padding: "8px 16px",
                    fontSize: 13,
                    cursor:
                      pagination.page === pagination.totalPages ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <TransactionDetailModal
          transactionId={selectedTransaction.id}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
}
