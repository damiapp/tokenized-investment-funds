import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fundsApi, investmentsApi, type Fund } from "../api/funds";
import { kycApi, type KYCStatus } from "../api/kyc";
import { useAuth } from "../contexts/AuthContext";

export function FundDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fund, setFund] = useState<Fund | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [investAmount, setInvestAmount] = useState("");
  const [isInvesting, setIsInvesting] = useState(false);
  const [investError, setInvestError] = useState<string | null>(null);
  const [investSuccess, setInvestSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchFund();
      if (user?.role === "LP") {
        fetchKycStatus();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.role]);

  const fetchFund = async () => {
    try {
      setIsLoading(true);
      const response = await fundsApi.getById(id!);
      setFund(response.data.fund);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fund");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKycStatus = async () => {
    try {
      const response = await kycApi.getStatus();
      setKycStatus(response.data);
    } catch {
      // KYC status not found is okay
    }
  };

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fund || !investAmount) return;

    setInvestError(null);
    setInvestSuccess(null);
    setIsInvesting(true);

    try {
      await investmentsApi.create({
        fundId: fund.id,
        amount: parseFloat(investAmount),
      });
      setInvestSuccess("Investment submitted successfully!");
      setInvestAmount("");
      fetchFund(); // Refresh fund data
    } catch (err) {
      setInvestError(err instanceof Error ? err.message : "Failed to invest");
    } finally {
      setIsInvesting(false);
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

  const formatPercent = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `${num}%`;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#238636";
      case "draft":
        return "#8b949e";
      case "closed":
        return "#d29922";
      case "liquidated":
        return "#f85149";
      default:
        return "#8b949e";
    }
  };

  const isKycApproved = kycStatus?.status === "approved";
  const canInvest = user?.role === "LP" && fund?.status === "active" && isKycApproved;
  const remainingCapacity = fund
    ? parseFloat(fund.targetAmount) - parseFloat(fund.raisedAmount)
    : 0;
  const progressPercent = fund
    ? (parseFloat(fund.raisedAmount) / parseFloat(fund.targetAmount)) * 100
    : 0;

  if (isLoading) {
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ color: "#8b949e", textAlign: "center", padding: 40 }}>
          Loading fund details...
        </div>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            backgroundColor: "#f8514926",
            border: "1px solid #f85149",
            borderRadius: 6,
            padding: 16,
            color: "#f85149",
          }}
        >
          {error || "Fund not found"}
        </div>
        <button
          onClick={() => navigate("/funds")}
          style={{
            marginTop: 16,
            backgroundColor: "#21262d",
            border: "1px solid #30363d",
            borderRadius: 6,
            color: "#c9d1d9",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Back to Funds
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate("/funds")}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#58a6ff",
            cursor: "pointer",
            padding: 0,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          ← Back to Funds
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ color: "#e6edf7", margin: 0, fontSize: 28 }}>{fund.name}</h1>
            <div style={{ color: "#8b949e", marginTop: 8 }}>
              Managed by {fund.generalPartner?.email || "Unknown GP"}
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
              {fund.riskLevel} risk
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 24 }}>
        {/* Main Content */}
        <div>
          {/* Description */}
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 6,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <h3 style={{ color: "#e6edf7", margin: "0 0 12px 0", fontSize: 16 }}>Description</h3>
            <p style={{ color: "#c9d1d9", margin: 0, lineHeight: 1.6 }}>{fund.description}</p>
          </div>

          {/* Investment Strategy */}
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 6,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <h3 style={{ color: "#e6edf7", margin: "0 0 12px 0", fontSize: 16 }}>
              Investment Strategy
            </h3>
            <p style={{ color: "#c9d1d9", margin: 0, lineHeight: 1.6 }}>{fund.investmentStrategy}</p>
          </div>

          {/* Fund Details Grid */}
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 6,
              padding: 20,
            }}
          >
            <h3 style={{ color: "#e6edf7", margin: "0 0 16px 0", fontSize: 16 }}>Fund Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Target Amount</div>
                <div style={{ color: "#e6edf7", fontSize: 18, fontWeight: 600 }}>
                  {formatCurrency(fund.targetAmount)}
                </div>
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Raised Amount</div>
                <div style={{ color: "#238636", fontSize: 18, fontWeight: 600 }}>
                  {formatCurrency(fund.raisedAmount)}
                </div>
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                  Minimum Investment
                </div>
                <div style={{ color: "#e6edf7", fontSize: 18, fontWeight: 600 }}>
                  {formatCurrency(fund.minimumInvestment)}
                </div>
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                  Remaining Capacity
                </div>
                <div style={{ color: "#58a6ff", fontSize: 18, fontWeight: 600 }}>
                  {formatCurrency(remainingCapacity)}
                </div>
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Management Fee</div>
                <div style={{ color: "#e6edf7", fontSize: 18, fontWeight: 600 }}>
                  {formatPercent(fund.managementFee)}
                </div>
              </div>
              <div>
                <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Performance Fee</div>
                <div style={{ color: "#e6edf7", fontSize: 18, fontWeight: 600 }}>
                  {formatPercent(fund.performanceFee)}
                </div>
              </div>
              {fund.fundingDeadline && (
                <div>
                  <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                    Funding Deadline
                  </div>
                  <div style={{ color: "#e6edf7", fontSize: 18, fontWeight: 600 }}>
                    {new Date(fund.fundingDeadline).toLocaleDateString()}
                  </div>
                </div>
              )}
              {fund.tokenSymbol && (
                <div>
                  <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>Token Symbol</div>
                  <div style={{ color: "#e6edf7", fontSize: 18, fontWeight: 600 }}>
                    {fund.tokenSymbol}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Investments List (for GP) */}
          {user?.role === "GP" && fund.gpId === user.id && fund.investments && fund.investments.length > 0 && (
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 6,
                padding: 20,
                marginTop: 16,
              }}
            >
              <h3 style={{ color: "#e6edf7", margin: "0 0 16px 0", fontSize: 16 }}>
                Investments ({fund.investments.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {fund.investments.map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      backgroundColor: "#21262d",
                      border: "1px solid #30363d",
                      borderRadius: 6,
                      padding: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: "#e6edf7", fontSize: 14 }}>
                          {inv.limitedPartner?.email || "Unknown LP"}
                        </div>
                        <div style={{ color: "#8b949e", fontSize: 12 }}>
                          {new Date(inv.investedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#238636", fontSize: 16, fontWeight: 600 }}>
                          {formatCurrency(inv.amount)}
                        </div>
                        <div
                          style={{
                            color:
                              inv.status === "confirmed"
                                ? "#238636"
                                : inv.status === "cancelled"
                                  ? "#f85149"
                                  : "#d29922",
                            fontSize: 12,
                            textTransform: "uppercase",
                          }}
                        >
                          {inv.status}
                        </div>
                      </div>
                    </div>
                    
                    {/* Token info for confirmed investments */}
                    {inv.status === "confirmed" && inv.tokensIssued && (
                      <div style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: "1px solid #30363d",
                        display: "flex",
                        gap: 16,
                        fontSize: 12,
                      }}>
                        <div>
                          <span style={{ color: "#8b949e" }}>Tokens: </span>
                          <span style={{ color: "#58a6ff" }}>{inv.tokensIssued}</span>
                        </div>
                        {inv.transactionHash && (
                          <div>
                            <span style={{ color: "#8b949e" }}>Tx: </span>
                            <code style={{ color: "#58a6ff", fontFamily: "monospace" }}>
                              {inv.transactionHash.slice(0, 10)}...
                            </code>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons for pending investments */}
                    {inv.status === "pending" && (
                      <div style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px solid #30363d",
                        display: "flex",
                        gap: 8,
                      }}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await investmentsApi.updateStatus(inv.id, { status: "confirmed" });
                              fetchFund();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Failed to confirm investment");
                            }
                          }}
                          style={{
                            backgroundColor: "#238636",
                            border: "none",
                            borderRadius: 6,
                            color: "#ffffff",
                            padding: "6px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          ✓ Confirm & Mint Tokens
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await investmentsApi.updateStatus(inv.id, { status: "cancelled" });
                              fetchFund();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Failed to cancel investment");
                            }
                          }}
                          style={{
                            backgroundColor: "#21262d",
                            border: "1px solid #f85149",
                            borderRadius: 6,
                            color: "#f85149",
                            padding: "6px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Investment Panel */}
        <div>
          {/* Progress */}
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 6,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#8b949e", fontSize: 14 }}>Funding Progress</span>
              <span style={{ color: "#e6edf7", fontSize: 14, fontWeight: 600 }}>
                {progressPercent.toFixed(1)}%
              </span>
            </div>
            <div
              style={{
                backgroundColor: "#21262d",
                borderRadius: 4,
                height: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: "#238636",
                  height: "100%",
                  width: `${Math.min(progressPercent, 100)}%`,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                fontSize: 12,
                color: "#8b949e",
              }}
            >
              <span>{formatCurrency(fund.raisedAmount)} raised</span>
              <span>{formatCurrency(fund.targetAmount)} target</span>
            </div>
          </div>

          {/* Investment Form (LP only) */}
          {user?.role === "LP" && (
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 6,
                padding: 20,
              }}
            >
              <h3 style={{ color: "#e6edf7", margin: "0 0 16px 0", fontSize: 16 }}>Invest</h3>

              {!isKycApproved ? (
                <div>
                  <div
                    style={{
                      backgroundColor: "#d2992226",
                      border: "1px solid #d29922",
                      borderRadius: 6,
                      padding: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ color: "#d29922", fontSize: 14, fontWeight: 500 }}>
                      KYC Required
                    </div>
                    <div style={{ color: "#c9d1d9", fontSize: 13, marginTop: 4 }}>
                      {kycStatus?.status === "submitted"
                        ? "Your KYC is under review. Please wait for approval."
                        : kycStatus?.status === "rejected"
                          ? "Your KYC was rejected. Please resubmit."
                          : "Complete KYC verification to invest in this fund."}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/profile")}
                    style={{
                      width: "100%",
                      backgroundColor: "#238636",
                      border: "none",
                      borderRadius: 6,
                      color: "#ffffff",
                      padding: "12px 16px",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Complete KYC
                  </button>
                </div>
              ) : fund.status !== "active" ? (
                <div
                  style={{
                    backgroundColor: "#8b949e26",
                    border: "1px solid #8b949e",
                    borderRadius: 6,
                    padding: 12,
                    color: "#8b949e",
                    fontSize: 14,
                  }}
                >
                  This fund is not currently accepting investments.
                </div>
              ) : (
                <form onSubmit={handleInvest}>
                  {investError && (
                    <div
                      style={{
                        backgroundColor: "#f8514926",
                        border: "1px solid #f85149",
                        borderRadius: 6,
                        padding: 12,
                        marginBottom: 16,
                        color: "#f85149",
                        fontSize: 14,
                      }}
                    >
                      {investError}
                    </div>
                  )}
                  {investSuccess && (
                    <div
                      style={{
                        backgroundColor: "#23863626",
                        border: "1px solid #238636",
                        borderRadius: 6,
                        padding: 12,
                        marginBottom: 16,
                        color: "#238636",
                        fontSize: 14,
                      }}
                    >
                      {investSuccess}
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: "block",
                        color: "#c9d1d9",
                        fontSize: 14,
                        marginBottom: 8,
                      }}
                    >
                      Investment Amount (USD)
                    </label>
                    <input
                      type="number"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      min={parseFloat(fund.minimumInvestment)}
                      max={remainingCapacity}
                      step="1000"
                      placeholder={`Min: ${formatCurrency(fund.minimumInvestment)}`}
                      style={{
                        width: "100%",
                        backgroundColor: "#0d1117",
                        border: "1px solid #30363d",
                        borderRadius: 6,
                        color: "#c9d1d9",
                        padding: "10px 12px",
                        fontSize: 16,
                        boxSizing: "border-box",
                      }}
                    />
                    <div style={{ color: "#8b949e", fontSize: 12, marginTop: 4 }}>
                      Min: {formatCurrency(fund.minimumInvestment)} | Max:{" "}
                      {formatCurrency(remainingCapacity)}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isInvesting ||
                      !investAmount ||
                      parseFloat(investAmount) < parseFloat(fund.minimumInvestment) ||
                      parseFloat(investAmount) > remainingCapacity
                    }
                    style={{
                      width: "100%",
                      backgroundColor: canInvest ? "#238636" : "#21262d",
                      border: "none",
                      borderRadius: 6,
                      color: canInvest ? "#ffffff" : "#8b949e",
                      padding: "12px 16px",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: canInvest && !isInvesting ? "pointer" : "not-allowed",
                      opacity: isInvesting ? 0.7 : 1,
                    }}
                  >
                    {isInvesting ? "Processing..." : "Invest Now"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* GP Actions */}
          {user?.role === "GP" && fund.gpId === user.id && (
            <div
              style={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 6,
                padding: 20,
              }}
            >
              <h3 style={{ color: "#e6edf7", margin: "0 0 16px 0", fontSize: 16 }}>Manage Fund</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => navigate(`/funds/${fund.id}/edit`)}
                  style={{
                    backgroundColor: "#21262d",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    color: "#c9d1d9",
                    padding: "10px 16px",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Edit Fund
                </button>
                {fund.status === "draft" && (
                  <button
                    onClick={async () => {
                      try {
                        await fundsApi.update(fund.id, { status: "active" });
                        fetchFund();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Failed to activate fund");
                      }
                    }}
                    style={{
                      backgroundColor: "#238636",
                      border: "none",
                      borderRadius: 6,
                      color: "#ffffff",
                      padding: "10px 16px",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Activate Fund
                  </button>
                )}
                {fund.status === "active" && (
                  <button
                    onClick={async () => {
                      try {
                        await fundsApi.update(fund.id, { status: "closed" });
                        fetchFund();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Failed to close fund");
                      }
                    }}
                    style={{
                      backgroundColor: "#d29922",
                      border: "none",
                      borderRadius: 6,
                      color: "#ffffff",
                      padding: "10px 16px",
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Close Fund
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
