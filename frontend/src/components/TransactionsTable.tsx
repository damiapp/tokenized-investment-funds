import React from "react";
import { Transaction } from "../api/transactions";

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onRowClick: (transaction: Transaction) => void;
}

export function TransactionsTable({
  transactions,
  isLoading,
  onSort,
  sortBy,
  sortOrder,
  onRowClick,
}: TransactionsTableProps) {
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const truncateId = (id: string) => {
    return `${id.substring(0, 8)}...`;
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span style={{ color: "#9d9d9d" }}>⇅</span>;
    return <span style={{ color: "#0078d4" }}>{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#cccccc" }}>
        Loading transactions...
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 60,
          backgroundColor: "#2d2d2d",
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <p style={{ color: "#cccccc", fontSize: 16, marginBottom: 8 }}>
          No transactions found
        </p>
        <p style={{ color: "#9d9d9d", fontSize: 14 }}>
          Try adjusting your filters to see more results
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#2d2d2d",
          borderRadius: 8,
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #3e3e42" }}>
            <th
              onClick={() => onSort("id")}
              style={{
                padding: "12px 16px",
                textAlign: "left",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Transaction ID <SortIcon field="id" />
            </th>
            <th
              onClick={() => onSort("investedAt")}
              style={{
                padding: "12px 16px",
                textAlign: "left",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Date & Time <SortIcon field="investedAt" />
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Fund
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              GP
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              LP
            </th>
            <th
              onClick={() => onSort("amount")}
              style={{
                padding: "12px 16px",
                textAlign: "right",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Amount <SortIcon field="amount" />
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "right",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Tokens
            </th>
            <th
              onClick={() => onSort("status")}
              style={{
                padding: "12px 16px",
                textAlign: "center",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Status <SortIcon field="status" />
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "center",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr
              key={transaction.id}
              onClick={() => onRowClick(transaction)}
              style={{
                borderBottom: "1px solid #3e3e42",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3a3a3a")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      color: "#cccccc",
                      fontSize: 13,
                      fontFamily: "monospace",
                    }}
                  >
                    {truncateId(transaction.id)}
                  </span>
                  <button
                    onClick={(e) => copyToClipboard(transaction.id, e)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#0078d4",
                      cursor: "pointer",
                      fontSize: 12,
                      padding: 4,
                    }}
                    title="Copy full ID"
                  >
                    📋
                  </button>
                </div>
              </td>
              <td style={{ padding: "12px 16px", color: "#cccccc", fontSize: 13 }}>
                {formatDate(transaction.investedAt)}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div>
                  <div style={{ color: "#ffffff", fontSize: 13, fontWeight: 500 }}>
                    {transaction.fundName}
                  </div>
                  <div
                    style={{
                      color: "#9d9d9d",
                      fontSize: 11,
                      fontFamily: "monospace",
                    }}
                  >
                    {transaction.fundSymbol}
                  </div>
                </div>
              </td>
              <td style={{ padding: "12px 16px", color: "#cccccc", fontSize: 13 }}>
                {transaction.gpEmail}
              </td>
              <td style={{ padding: "12px 16px", color: "#cccccc", fontSize: 13 }}>
                {transaction.lpEmail}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  color: "#0078d4",
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: "right",
                }}
              >
                {formatCurrency(transaction.amount)}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  color: "#cccccc",
                  fontSize: 13,
                  textAlign: "right",
                  fontFamily: "monospace",
                }}
              >
                {parseFloat(transaction.tokensIssued).toLocaleString()}
              </td>
              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                <span
                  style={{
                    backgroundColor: getStatusColor(transaction.status) + "20",
                    color: getStatusColor(transaction.status),
                    padding: "4px 12px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {transaction.status}
                </span>
              </td>
              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick(transaction);
                  }}
                  style={{
                    backgroundColor: "#3a3a3a",
                    border: "1px solid #3e3e42",
                    borderRadius: 4,
                    color: "#ffffff",
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#0078d4";
                    e.currentTarget.style.borderColor = "#0078d4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#3a3a3a";
                    e.currentTarget.style.borderColor = "#3e3e42";
                  }}
                >
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
