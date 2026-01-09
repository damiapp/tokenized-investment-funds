import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { investmentsApi, type Investment } from "../api/funds";
import { useAuth } from "../contexts/AuthContext";

export function MyInvestments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchInvestments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchInvestments = async () => {
    try {
      setIsLoading(true);
      const params: { status?: string } = {};
      if (statusFilter) params.status = statusFilter;

      const response = await investmentsApi.getAll(params);
      setInvestments(response.data.investments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load investments");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#238636";
      case "pending":
        return "#d29922";
      case "cancelled":
        return "#f85149";
      default:
        return "#8b949e";
    }
  };

  const totalInvested = investments
    .filter((inv) => inv.status !== "cancelled")
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  const confirmedCount = investments.filter((inv) => inv.status === "confirmed").length;
  const pendingCount = investments.filter((inv) => inv.status === "pending").length;

  if (user?.role !== "LP") {
    return (
      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
        <div
          style={{
            backgroundColor: "#d2992226",
            border: "1px solid #d29922",
            borderRadius: 6,
            padding: 16,
            color: "#d29922",
          }}
        >
          This page is only available for Limited Partners (LP).
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#e6edf7", margin: 0, fontSize: 28 }}>My Investments</h1>
        <p style={{ color: "#8b949e", marginTop: 8 }}>
          Track and manage your investment portfolio
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 6,
            padding: 20,
          }}
        >
          <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Total Invested</div>
          <div style={{ color: "#238636", fontSize: 24, fontWeight: 600 }}>
            {formatCurrency(totalInvested)}
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 6,
            padding: 20,
          }}
        >
          <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Confirmed</div>
          <div style={{ color: "#e6edf7", fontSize: 24, fontWeight: 600 }}>{confirmedCount}</div>
        </div>
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 6,
            padding: 20,
          }}
        >
          <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Pending</div>
          <div style={{ color: "#d29922", fontSize: 24, fontWeight: 600 }}>{pendingCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 6,
          padding: 16,
          marginBottom: 16,
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        <label style={{ color: "#8b949e", fontSize: 14 }}>Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            backgroundColor: "#0d1117",
            border: "1px solid #30363d",
            borderRadius: 6,
            color: "#c9d1d9",
            padding: "8px 12px",
            fontSize: 14,
          }}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            backgroundColor: "#f8514926",
            border: "1px solid #f85149",
            borderRadius: 6,
            padding: 16,
            marginBottom: 16,
            color: "#f85149",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div style={{ color: "#8b949e", textAlign: "center", padding: 40 }}>
          Loading investments...
        </div>
      ) : investments.length === 0 ? (
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 6,
            padding: 40,
            textAlign: "center",
          }}
        >
          <div style={{ color: "#8b949e", fontSize: 16, marginBottom: 16 }}>
            {statusFilter ? "No investments match this filter." : "You haven't made any investments yet."}
          </div>
          <button
            onClick={() => navigate("/funds")}
            style={{
              backgroundColor: "#238636",
              border: "none",
              borderRadius: 6,
              color: "#ffffff",
              padding: "10px 20px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Browse Funds
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {investments.map((investment) => (
            <div
              key={investment.id}
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 6,
                padding: 20,
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onClick={() => navigate(`/funds/${investment.fundId}`)}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#58a6ff")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#30363d")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ color: "#e6edf7", margin: 0, fontSize: 18 }}>
                    {investment.fund?.name || "Unknown Fund"}
                  </h3>
                  <div style={{ color: "#8b949e", fontSize: 13, marginTop: 4 }}>
                    Managed by {investment.fund?.generalPartner?.email || "Unknown GP"}
                  </div>
                </div>
                <span
                  style={{
                    backgroundColor: `${getStatusColor(investment.status)}26`,
                    color: getStatusColor(investment.status),
                    padding: "4px 12px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: "uppercase",
                  }}
                >
                  {investment.status}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 16,
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid #21262d",
                }}
              >
                <div>
                  <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Amount</div>
                  <div style={{ color: "#238636", fontSize: 16, fontWeight: 600 }}>
                    {formatCurrency(investment.amount)}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Invested On</div>
                  <div style={{ color: "#e6edf7", fontSize: 14 }}>
                    {new Date(investment.investedAt).toLocaleDateString()}
                  </div>
                </div>
                {investment.tokensIssued && (
                  <div>
                    <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                      Tokens Issued
                    </div>
                    <div style={{ color: "#58a6ff", fontSize: 14 }}>{investment.tokensIssued}</div>
                  </div>
                )}
                {investment.transactionHash && (
                  <div>
                    <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Tx Hash</div>
                    <div
                      style={{
                        color: "#58a6ff",
                        fontSize: 12,
                        fontFamily: "monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {investment.transactionHash.slice(0, 10)}...
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
