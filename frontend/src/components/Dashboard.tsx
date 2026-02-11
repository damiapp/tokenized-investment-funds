import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fundsApi, type Fund } from "../api/funds";
import { useAuth } from "../contexts/AuthContext";

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentFunds, setRecentFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentFunds();
  }, []);

  const fetchRecentFunds = async () => {
    try {
      setIsLoading(true);
      const response = await fundsApi.getAll({});
      const activeFunds = response.data.funds
        .filter((f: Fund) => f.status === "active")
        .sort((a: Fund, b: Fund) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 3);
      setRecentFunds(activeFunds);
    } catch (err) {
      console.error("Failed to fetch funds:", err);
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

  const news = [
    {
      id: 1,
      title: "Platform Launch",
      date: "January 2026",
      description: "Tokenize Invest is now live! Start exploring tokenized investment opportunities with blockchain-powered security and transparency.",
      icon: "🚀"
    },
    {
      id: 2,
      title: "Multi-Fund Token Support",
      date: "January 2026",
      description: "Each fund now has its own dedicated ERC-20 token contract. Track your portfolio across multiple funds with ease.",
      icon: "💎"
    },
    {
      id: 3,
      title: "Enhanced KYC Verification",
      date: "January 2026",
      description: "On-chain KYC enforcement ensures only verified investors can participate. Your security is our priority.",
      icon: "🔐"
    },
    {
      id: 4,
      title: "Polygon Network Support",
      date: "Coming Soon",
      description: "Deploy to Polygon Amoy testnet and mainnet for lower gas fees and faster transactions.",
      icon: "⚡"
    }
  ];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
      {/* Welcome Section */}
      <div style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        padding: 32,
        marginBottom: 24,
        background: "linear-gradient(135deg, #1a1f2e 0%, #161b22 100%)"
      }}>
        <h1 style={{ 
          color: "#e6edf7", 
          fontSize: 32, 
          marginBottom: 12,
          fontWeight: 700
        }}>
          Welcome back, {user?.email}! 👋
        </h1>
        <p style={{ color: "#8b949e", fontSize: 16, marginBottom: 24 }}>
          {user?.role === "GP" 
            ? "Manage your funds and track investor activity from your dashboard."
            : "Explore new investment opportunities and manage your portfolio."}
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => navigate("/funds")}
            style={{
              backgroundColor: "#238636",
              border: "none",
              borderRadius: 6,
              color: "#ffffff",
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Browse Funds
          </button>
          {user?.role === "GP" && (
            <button
              onClick={() => navigate("/funds/create")}
              style={{
                backgroundColor: "transparent",
                border: "1px solid #30363d",
                borderRadius: 6,
                color: "#c9d1d9",
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Create New Fund
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Platform News */}
        <div style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 12,
          padding: 24
        }}>
          <h2 style={{ 
            color: "#e6edf7", 
            fontSize: 24, 
            marginBottom: 20,
            fontWeight: 700
          }}>
            📰 Platform News
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {news.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  borderRadius: 8,
                  padding: 16,
                  transition: "border-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#58a6ff"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#30363d"}
              >
                <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
                  <div style={{ fontSize: 32 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8
                    }}>
                      <h3 style={{ 
                        color: "#e6edf7", 
                        fontSize: 18, 
                        fontWeight: 600,
                        margin: 0
                      }}>
                        {item.title}
                      </h3>
                      <span style={{ 
                        color: "#8b949e", 
                        fontSize: 12 
                      }}>
                        {item.date}
                      </span>
                    </div>
                    <p style={{ 
                      color: "#8b949e", 
                      fontSize: 14,
                      lineHeight: 1.5,
                      margin: 0
                    }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 12,
          padding: 24
        }}>
          <h2 style={{ 
            color: "#e6edf7", 
            fontSize: 24, 
            marginBottom: 20,
            fontWeight: 700
          }}>
            📊 Quick Stats
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              backgroundColor: "#21262d",
              borderRadius: 8,
              padding: 16,
              textAlign: "center"
            }}>
              <div style={{ 
                fontSize: 32, 
                fontWeight: 700, 
                color: "#58a6ff",
                marginBottom: 4
              }}>
                {recentFunds.length}
              </div>
              <div style={{ color: "#8b949e", fontSize: 14 }}>
                Active Funds
              </div>
            </div>
            <div style={{
              backgroundColor: "#21262d",
              borderRadius: 8,
              padding: 16,
              textAlign: "center"
            }}>
              <div style={{ 
                fontSize: 32, 
                fontWeight: 700, 
                color: "#238636",
                marginBottom: 4
              }}>
                100%
              </div>
              <div style={{ color: "#8b949e", fontSize: 14 }}>
                On-Chain Verified
              </div>
            </div>
            <div style={{
              backgroundColor: "#21262d",
              borderRadius: 8,
              padding: 16,
              textAlign: "center"
            }}>
              <div style={{ 
                fontSize: 32, 
                fontWeight: 700, 
                color: "#d29922",
                marginBottom: 4
              }}>
                24/7
              </div>
              <div style={{ color: "#8b949e", fontSize: 14 }}>
                Platform Availability
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New & Exciting Funds */}
      <div style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        padding: 24
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: 20
        }}>
          <h2 style={{ 
            color: "#e6edf7", 
            fontSize: 24, 
            fontWeight: 700,
            margin: 0
          }}>
            🌟 New & Exciting Funds
          </h2>
          <button
            onClick={() => navigate("/funds")}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #30363d",
              borderRadius: 6,
              color: "#58a6ff",
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            View All →
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#8b949e" }}>
            Loading funds...
          </div>
        ) : recentFunds.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: 40,
            backgroundColor: "#21262d",
            borderRadius: 8
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
            <p style={{ color: "#8b949e", fontSize: 16 }}>
              No active funds yet. {user?.role === "GP" ? "Create the first one!" : "Check back soon!"}
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: 20
          }}>
            {recentFunds.map((fund) => (
              <div
                key={fund.id}
                onClick={() => navigate(`/funds/${fund.id}`)}
                style={{
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  borderRadius: 8,
                  padding: 20,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#58a6ff";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#30363d";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: 12
                }}>
                  <h3 style={{ 
                    color: "#e6edf7", 
                    fontSize: 18, 
                    fontWeight: 600,
                    margin: 0
                  }}>
                    {fund.name}
                  </h3>
                  <span style={{
                    backgroundColor: getRiskColor(fund.riskLevel),
                    color: "#ffffff",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase"
                  }}>
                    {fund.riskLevel}
                  </span>
                </div>
                <p style={{ 
                  color: "#8b949e", 
                  fontSize: 14,
                  marginBottom: 16,
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {fund.description}
                </p>
                <div style={{ 
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  paddingTop: 12,
                  borderTop: "1px solid #30363d"
                }}>
                  <div>
                    <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                      Target Amount
                    </div>
                    <div style={{ color: "#238636", fontSize: 16, fontWeight: 600 }}>
                      {formatCurrency(fund.targetAmount)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 4 }}>
                      Min Investment
                    </div>
                    <div style={{ color: "#58a6ff", fontSize: 16, fontWeight: 600 }}>
                      {formatCurrency(fund.minimumInvestment)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
