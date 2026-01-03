import React from "react";
import { useAuth } from "../contexts/AuthContext";

export function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#238636";
      case "rejected":
        return "#f85149";
      default:
        return "#f0883e";
    }
  };

  const getKycStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "✅ Approved";
      case "rejected":
        return "❌ Rejected";
      default:
        return "⏳ Pending";
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <div style={{ 
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        padding: 32,
        marginBottom: 24
      }}>
        <h1 style={{ color: "#e6edf7", marginBottom: 24, textAlign: "center" }}>
          User Profile
        </h1>

        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <h3 style={{ color: "#8b949e", fontSize: 14, marginBottom: 8, textTransform: "uppercase" }}>
              Account Information
            </h3>
            <div style={{ backgroundColor: "#21262d", padding: 16, borderRadius: 8 }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "#8b949e", fontSize: 14 }}>Email:</span>
                <div style={{ color: "#e6edf7", fontSize: 16, marginTop: 4 }}>{user.email}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "#8b949e", fontSize: 14 }}>Role:</span>
                <div style={{ color: "#e6edf7", fontSize: 16, marginTop: 4 }}>
                  {user.role === "GP" ? "General Partner (Fund Manager)" : "Limited Partner (Investor)"}
                </div>
              </div>
              <div>
                <span style={{ color: "#8b949e", fontSize: 14 }}>User ID:</span>
                <div style={{ color: "#8b949e", fontSize: 12, marginTop: 4, fontFamily: "monospace" }}>
                  {user.id}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ color: "#8b949e", fontSize: 14, marginBottom: 8, textTransform: "uppercase" }}>
              Wallet Information
            </h3>
            <div style={{ backgroundColor: "#21262d", padding: 16, borderRadius: 8 }}>
              {user.walletAddress ? (
                <div>
                  <span style={{ color: "#8b949e", fontSize: 14 }}>Connected Wallet:</span>
                  <div style={{ 
                    color: "#e6edf7", 
                    fontSize: 14, 
                    marginTop: 4, 
                    fontFamily: "monospace",
                    wordBreak: "break-all"
                  }}>
                    {user.walletAddress}
                  </div>
                </div>
              ) : (
                <div style={{ color: "#8b949e", fontSize: 14 }}>
                  No wallet connected
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ color: "#8b949e", fontSize: 14, marginBottom: 8, textTransform: "uppercase" }}>
              KYC Status
            </h3>
            <div style={{ backgroundColor: "#21262d", padding: 16, borderRadius: 8 }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8,
                color: getKycStatusColor(user.kyc.status),
                fontSize: 16,
                fontWeight: 500
              }}>
                {getKycStatusText(user.kyc.status)}
              </div>
              <div style={{ color: "#8b949e", fontSize: 12, marginTop: 8 }}>
                Last updated: {new Date(user.kyc.updatedAt).toLocaleDateString()}
              </div>
              {user.kyc.status === "pending" && (
                <div style={{ color: "#8b949e", fontSize: 14, marginTop: 8 }}>
                  Your KYC verification is in progress. This typically takes 1-2 business days.
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <button
            onClick={logout}
            style={{
              padding: "12px 24px",
              backgroundColor: "#f85149",
              border: "1px solid #f85149",
              borderRadius: 8,
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
