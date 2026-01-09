import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fundsApi, type Fund } from "../api/funds";
import { useAuth } from "../contexts/AuthContext";

export function FundList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    status?: string;
    riskLevel?: string;
  }>({});

  useEffect(() => {
    if (user) {
      fetchFunds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const fetchFunds = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fundsApi.getAll(filter);
      setFunds(response.data.funds);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch funds");
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "#238636";
      case "medium":
        return "#f0883e";
      case "high":
        return "#f85149";
      default:
        return "#8b949e";
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "#8b949e",
      active: "#238636",
      closed: "#f0883e",
      liquidated: "#6e7681",
    };
    return colors[status] || "#8b949e";
  };

  if (!user) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#8b949e" }}>
        Please log in to view funds
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
      }}>
        <h1 style={{ color: "#e6edf7", margin: 0 }}>Investment Funds</h1>
        
        <div style={{ display: "flex", gap: 12 }}>
          <select
            value={filter.status || ""}
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            style={{
              backgroundColor: "#21262d",
              border: "1px solid #30363d",
              borderRadius: 6,
              color: "#e6edf7",
              padding: "8px 12px",
              fontSize: 14,
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={filter.riskLevel || ""}
            onChange={(e) => setFilter({ ...filter, riskLevel: e.target.value || undefined })}
            style={{
              backgroundColor: "#21262d",
              border: "1px solid #30363d",
              borderRadius: 6,
              color: "#e6edf7",
              padding: "8px 12px",
              fontSize: 14,
            }}
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: "#f85149",
          border: "1px solid #f85149",
          borderRadius: 8,
          padding: 16,
          color: "#ffffff",
          marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#8b949e" }}>
          Loading funds...
        </div>
      ) : funds.length === 0 ? (
        <div style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 12,
          padding: 40,
          textAlign: "center",
        }}>
          <div style={{ color: "#8b949e", fontSize: 16 }}>
            No funds found
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {funds.map((fund) => (
            <div
              key={fund.id}
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
                padding: 24,
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onClick={() => navigate(`/funds/${fund.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#58a6ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#30363d";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h3 style={{ color: "#e6edf7", margin: "0 0 8px 0", fontSize: 20 }}>
                    {fund.name}
                  </h3>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      style={{
                        backgroundColor: getStatusBadge(fund.status),
                        color: "#ffffff",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {fund.status.toUpperCase()}
                    </span>
                    <span
                      style={{
                        backgroundColor: getRiskColor(fund.riskLevel),
                        color: "#ffffff",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {fund.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                    Target Amount
                  </div>
                  <div style={{ color: "#e6edf7", fontSize: 20, fontWeight: 500 }}>
                    ${parseFloat(fund.targetAmount).toLocaleString()}
                  </div>
                </div>
              </div>

              <p style={{ color: "#8b949e", marginBottom: 16, fontSize: 14, lineHeight: 1.5 }}>
                {fund.description}
              </p>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 16,
                marginBottom: 16,
              }}>
                <div>
                  <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                    Raised Amount
                  </div>
                  <div style={{ color: "#e6edf7", fontSize: 16, fontWeight: 500 }}>
                    ${parseFloat(fund.raisedAmount).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                    Min. Investment
                  </div>
                  <div style={{ color: "#e6edf7", fontSize: 16, fontWeight: 500 }}>
                    ${parseFloat(fund.minimumInvestment).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                    Management Fee
                  </div>
                  <div style={{ color: "#e6edf7", fontSize: 16, fontWeight: 500 }}>
                    {fund.managementFee}%
                  </div>
                </div>
                <div>
                  <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                    Performance Fee
                  </div>
                  <div style={{ color: "#e6edf7", fontSize: 16, fontWeight: 500 }}>
                    {fund.performanceFee}%
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: "#21262d",
                borderRadius: 6,
                padding: 12,
                marginBottom: 12,
              }}>
                <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                  Investment Strategy
                </div>
                <div style={{ color: "#e6edf7", fontSize: 14 }}>
                  {fund.investmentStrategy}
                </div>
              </div>

              <div style={{
                width: "100%",
                height: 8,
                backgroundColor: "#21262d",
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: 8,
              }}>
                <div
                  style={{
                    width: `${Math.min((parseFloat(fund.raisedAmount) / parseFloat(fund.targetAmount)) * 100, 100)}%`,
                    height: "100%",
                    backgroundColor: "#238636",
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <div style={{ color: "#8b949e", fontSize: 12 }}>
                {((parseFloat(fund.raisedAmount) / parseFloat(fund.targetAmount)) * 100).toFixed(1)}% funded
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
