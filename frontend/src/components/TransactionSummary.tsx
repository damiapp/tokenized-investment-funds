import React from "react";
import { TransactionSummary as SummaryType } from "../api/transactions";

interface TransactionSummaryProps {
  summary: SummaryType;
}

export function TransactionSummary({ summary }: TransactionSummaryProps) {
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const formatNumber = (value: string) => {
    return parseFloat(value).toLocaleString();
  };

  const cards = [
    {
      label: "Total Transactions",
      value: summary.totalTransactions.toString(),
      color: "#0078d4",
      icon: "📊",
    },
    {
      label: "Total Invested",
      value: formatCurrency(summary.totalInvested),
      color: "#0078d4",
      icon: "💰",
    },
    {
      label: "Total Tokens Issued",
      value: formatNumber(summary.totalTokensIssued),
      color: "#0078d4",
      icon: "💎",
    },
    {
      label: "Confirmed",
      value: summary.confirmedCount.toString(),
      color: "#107c10",
      icon: "✅",
    },
    {
      label: "Pending",
      value: summary.pendingCount.toString(),
      color: "#ffc83d",
      icon: "⏳",
    },
    {
      label: "Cancelled",
      value: summary.cancelledCount.toString(),
      color: "#e81123",
      icon: "❌",
    },
  ];

  return (
    <div className="summary-cards-grid">
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            backgroundColor: "#2d2d2d",
            border: "1px solid #3e3e42",
            borderRadius: 8,
            padding: 20,
            transition: "transform 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.borderColor = card.color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "#3e3e42";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>{card.icon}</span>
            <span style={{ color: "#9d9d9d", fontSize: 12, fontWeight: 600 }}>
              {card.label}
            </span>
          </div>
          <div
            style={{
              color: card.color,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
