import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fundsApi, investmentsApi, type Fund, type Investment } from "../api/funds";
import { useAuth } from "../contexts/AuthContext";

export function MyFunds() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [funds, setFunds] = useState<Fund[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    if (user?.role === "GP") {
      fetchMyFunds();
    } else {
      fetchMyInvestments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, statusFilter]);

  const fetchMyFunds = async () => {
    try {
      setIsLoading(true);
      const response = await fundsApi.getMyFunds();
      let filteredFunds = response.data.funds;
      if (statusFilter) {
        filteredFunds = filteredFunds.filter((f) => f.status === statusFilter);
      }
      setFunds(filteredFunds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load funds");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyInvestments = async () => {
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
      case "active":
      case "confirmed":
        return "#238636";
      case "draft":
      case "pending":
        return "#d29922";
      case "closed":
        return "#8b949e";
      case "liquidated":
      case "cancelled":
        return "#f85149";
      default:
        return "#8b949e";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "#238636";
      case "medium":
        return "#d29922";
      case "high":
        return "#f85149";
      default:
        return "#8b949e";
    }
  };

  // GP Stats
  const totalRaised = funds.reduce((sum, f) => sum + parseFloat(f.raisedAmount || "0"), 0);
  const activeFunds = funds.filter((f) => f.status === "active").length;
  const totalInvestors = funds.reduce((sum, f) => sum + (f.investments?.length || 0), 0);

  // LP Stats
  const totalInvested = investments
    .filter((inv) => inv.status !== "cancelled")
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#e6edf7", margin: 0, fontSize: 28 }}>
            {user?.role === "GP" ? "My Funds" : "My Investments"}
          </h1>
          <p style={{ color: "#8b949e", marginTop: 8 }}>
            {user?.role === "GP"
              ? "Manage your investment funds and track investor activity"
              : "Track and manage your investment portfolio"}
          </p>
        </div>
        {user?.role === "GP" && (
          <button
            onClick={() => navigate("/funds/create")}
            style={{
              backgroundColor: "#238636",
              border: "none",
              borderRadius: 6,
              color: "#ffffff",
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            + Create Fund
          </button>
        )}
      </div>

      {/* Stats */}
      {user?.role === "GP" ? (
        <div className="stats-grid-3">
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 6,
              padding: 20,
            }}
          >
            <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Total Raised</div>
            <div style={{ color: "#238636", fontSize: 24, fontWeight: 600 }}>
              {formatCurrency(totalRaised)}
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
            <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Active Funds</div>
            <div style={{ color: "#e6edf7", fontSize: 24, fontWeight: 600 }}>{activeFunds}</div>
          </div>
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 6,
              padding: 20,
            }}
          >
            <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Total Investors</div>
            <div style={{ color: "#58a6ff", fontSize: 24, fontWeight: 600 }}>{totalInvestors}</div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
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
            <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Investments</div>
            <div style={{ color: "#e6edf7", fontSize: 24, fontWeight: 600 }}>{investments.length}</div>
          </div>
        </div>
      )}

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
          {user?.role === "GP" ? (
            <>
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="liquidated">Liquidated</option>
            </>
          ) : (
            <>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </>
          )}
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
        <div style={{ color: "#8b949e", textAlign: "center", padding: 40 }}>Loading...</div>
      ) : user?.role === "GP" ? (
        // GP: Fund List
        funds.length === 0 ? (
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
              {statusFilter ? "No funds match this filter." : "You haven't created any funds yet."}
            </div>
            <button
              onClick={() => navigate("/funds/create")}
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
              Create Your First Fund
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {funds.map((fund) => {
              const progress = (parseFloat(fund.raisedAmount) / parseFloat(fund.targetAmount)) * 100;
              return (
                <div
                  key={fund.id}
                  style={{
                    backgroundColor: "#161b22",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    padding: 20,
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onClick={() => navigate(`/funds/${fund.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#58a6ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#30363d")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ color: "#e6edf7", margin: 0, fontSize: 18 }}>{fund.name}</h3>
                      <div style={{ color: "#8b949e", fontSize: 13, marginTop: 4 }}>
                        {fund.investments?.length || 0} investor(s)
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span
                        style={{
                          backgroundColor: `${getStatusColor(fund.status)}26`,
                          color: getStatusColor(fund.status),
                          padding: "4px 12px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          textTransform: "uppercase",
                        }}
                      >
                        {fund.status}
                      </span>
                      <span
                        style={{
                          backgroundColor: `${getRiskColor(fund.riskLevel)}26`,
                          color: getRiskColor(fund.riskLevel),
                          padding: "4px 12px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 500,
                          textTransform: "uppercase",
                        }}
                      >
                        {fund.riskLevel}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#8b949e", fontSize: 12 }}>
                        {formatCurrency(fund.raisedAmount)} raised
                      </span>
                      <span style={{ color: "#8b949e", fontSize: 12 }}>
                        {formatCurrency(fund.targetAmount)} target
                      </span>
                    </div>
                    <div
                      style={{
                        backgroundColor: "#21262d",
                        borderRadius: 4,
                        height: 6,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#238636",
                          height: "100%",
                          width: `${Math.min(progress, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className="stats-grid-3"
                    style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid #21262d",
                    }}
                  >
                    <div>
                      <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Min Investment</div>
                      <div style={{ color: "#e6edf7", fontSize: 14 }}>
                        {formatCurrency(fund.minimumInvestment)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Mgmt Fee</div>
                      <div style={{ color: "#e6edf7", fontSize: 14 }}>{fund.managementFee}%</div>
                    </div>
                    <div>
                      <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Perf Fee</div>
                      <div style={{ color: "#e6edf7", fontSize: 14 }}>{fund.performanceFee}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // LP: Investment List
        investments.length === 0 ? (
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
                      {investment.fund?.generalPartner?.email || "Unknown GP"}
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
                  className="stats-grid-3"
                  style={{
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
                      <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Tokens</div>
                      <div style={{ color: "#58a6ff", fontSize: 14 }}>{investment.tokensIssued}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
