import React, { useState, useEffect } from "react";
import { transactionsApi, TransactionDetail } from "../api/transactions";

interface TransactionDetailModalProps {
  transactionId: string;
  onClose: () => void;
}

export function TransactionDetailModal({ transactionId, onClose }: TransactionDetailModalProps) {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactionDetail();
  }, [transactionId]);

  const fetchTransactionDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await transactionsApi.getById(transactionId);
      setTransaction(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transaction details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#107c10";
      case "pending":
        return "#ffc83d";
      case "cancelled":
        return "#e81123";
      default:
        return "#9d9d9d";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#2d2d2d",
          border: "1px solid #3e3e42",
          borderRadius: 8,
          maxWidth: 700,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: 32,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: "1px solid #3e3e42",
          }}
        >
          <h2 style={{ color: "#ffffff", fontSize: 24, fontWeight: 700, margin: 0 }}>
            Transaction Details
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#cccccc",
              fontSize: 24,
              cursor: "pointer",
              padding: 0,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: 40, color: "#cccccc" }}>
            Loading transaction details...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            style={{
              backgroundColor: "#e8112320",
              border: "1px solid #e81123",
              borderRadius: 4,
              padding: 16,
              color: "#e81123",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Transaction Details */}
        {transaction && !isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Transaction ID */}
            <div>
              <label style={{ color: "#9d9d9d", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Transaction ID
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#ffffff", fontSize: 14, fontFamily: "monospace", wordBreak: "break-all" }}>
                  {transaction.id}
                </span>
                <button
                  onClick={() => copyToClipboard(transaction.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0078d4",
                    cursor: "pointer",
                    fontSize: 16,
                    padding: 4,
                  }}
                  title="Copy ID"
                >
                  📋
                </button>
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={{ color: "#9d9d9d", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                Status
              </label>
              <span
                style={{
                  backgroundColor: getStatusColor(transaction.status) + "20",
                  color: getStatusColor(transaction.status),
                  padding: "6px 16px",
                  borderRadius: 16,
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  display: "inline-block",
                }}
              >
                {transaction.status}
              </span>
            </div>

            {/* Fund Information */}
            <div
              style={{
                backgroundColor: "#3a3a3a",
                borderRadius: 6,
                padding: 16,
              }}
            >
              <h3 style={{ color: "#ffffff", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                Fund Information
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ color: "#9d9d9d", fontSize: 12, display: "block", marginBottom: 4 }}>
                    Fund Name
                  </label>
                  <span style={{ color: "#ffffff", fontSize: 14 }}>{transaction.fundName}</span>
                </div>
                <div>
                  <label style={{ color: "#9d9d9d", fontSize: 12, display: "block", marginBottom: 4 }}>
                    Symbol
                  </label>
                  <span style={{ color: "#0078d4", fontSize: 14, fontFamily: "monospace" }}>
                    {transaction.fundSymbol}
                  </span>
                </div>
                {transaction.fundDescription && (
                  <div>
                    <label style={{ color: "#9d9d9d", fontSize: 12, display: "block", marginBottom: 4 }}>
                      Description
                    </label>
                    <span style={{ color: "#cccccc", fontSize: 13 }}>{transaction.fundDescription}</span>
                  </div>
                )}
                {transaction.fundContractAddress && (
                  <div>
                    <label style={{ color: "#9d9d9d", fontSize: 12, display: "block", marginBottom: 4 }}>
                      Contract Address
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#cccccc", fontSize: 13, fontFamily: "monospace", wordBreak: "break-all" }}>
                        {transaction.fundContractAddress}
                      </span>
                      <button
                        onClick={() => copyToClipboard(transaction.fundContractAddress!)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#0078d4",
                          cursor: "pointer",
                          fontSize: 14,
                          padding: 4,
                        }}
                      >
                        📋
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Parties */}
            <div className="modal-grid-2">
              {/* GP */}
              <div
                style={{
                  backgroundColor: "#3a3a3a",
                  borderRadius: 6,
                  padding: 16,
                }}
              >
                <h3 style={{ color: "#ffffff", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  General Partner
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <label style={{ color: "#9d9d9d", fontSize: 11, display: "block", marginBottom: 2 }}>
                      Email
                    </label>
                    <span style={{ color: "#cccccc", fontSize: 13 }}>{transaction.gpEmail}</span>
                  </div>
                  {transaction.gpWallet && (
                    <div>
                      <label style={{ color: "#9d9d9d", fontSize: 11, display: "block", marginBottom: 2 }}>
                        Wallet
                      </label>
                      <span style={{ color: "#cccccc", fontSize: 11, fontFamily: "monospace" }}>
                        {transaction.gpWallet.substring(0, 10)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* LP */}
              <div
                style={{
                  backgroundColor: "#3a3a3a",
                  borderRadius: 6,
                  padding: 16,
                }}
              >
                <h3 style={{ color: "#ffffff", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  Limited Partner
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <label style={{ color: "#9d9d9d", fontSize: 11, display: "block", marginBottom: 2 }}>
                      Email
                    </label>
                    <span style={{ color: "#cccccc", fontSize: 13 }}>{transaction.lpEmail}</span>
                  </div>
                  {transaction.lpWallet && (
                    <div>
                      <label style={{ color: "#9d9d9d", fontSize: 11, display: "block", marginBottom: 2 }}>
                        Wallet
                      </label>
                      <span style={{ color: "#cccccc", fontSize: 11, fontFamily: "monospace" }}>
                        {transaction.lpWallet.substring(0, 10)}...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Investment Details */}
            <div
              style={{
                backgroundColor: "#3a3a3a",
                borderRadius: 6,
                padding: 16,
              }}
            >
              <h3 style={{ color: "#ffffff", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                Investment Details
              </h3>
              <div className="modal-grid-2">
                <div>
                  <label style={{ color: "#9d9d9d", fontSize: 12, display: "block", marginBottom: 4 }}>
                    Amount Invested
                  </label>
                  <span style={{ color: "#0078d4", fontSize: 20, fontWeight: 700 }}>
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
                <div>
                  <label style={{ color: "#9d9d9d", fontSize: 12, display: "block", marginBottom: 4 }}>
                    Tokens Issued
                  </label>
                  <span style={{ color: "#0078d4", fontSize: 20, fontWeight: 700, fontFamily: "monospace" }}>
                    {parseFloat(transaction.tokensIssued).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Hash */}
            {transaction.transactionHash && (
              <div>
                <label style={{ color: "#9d9d9d", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  Blockchain Transaction
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#cccccc", fontSize: 13, fontFamily: "monospace" }}>
                    {transaction.transactionHash}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.transactionHash!)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0078d4",
                      cursor: "pointer",
                      fontSize: 14,
                      padding: 4,
                    }}
                  >
                    📋
                  </button>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <label style={{ color: "#9d9d9d", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>
                Timeline
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#cccccc", fontSize: 13 }}>Created:</span>
                  <span style={{ color: "#ffffff", fontSize: 13 }}>{formatDate(transaction.createdAt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#cccccc", fontSize: 13 }}>Invested:</span>
                  <span style={{ color: "#ffffff", fontSize: 13 }}>{formatDate(transaction.investedAt)}</span>
                </div>
                {transaction.confirmedAt && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#cccccc", fontSize: 13 }}>Confirmed:</span>
                    <span style={{ color: "#ffffff", fontSize: 13 }}>{formatDate(transaction.confirmedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
