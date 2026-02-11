import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { KYCForm } from "./KYCForm";
import { KYCStatus } from "./KYCStatus";

export function UserProfile() {
  const { user, logout } = useAuth();
  const { address: connectedWallet } = useWallet();
  const navigate = useNavigate();
  const [showKYCForm, setShowKYCForm] = useState(false);

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

  const kycData = user.kyc || { status: "pending", updatedAt: new Date().toISOString() };

  const handleKYCSubmit = () => {
    setShowKYCForm(false);
  };

  if (showKYCForm) {
    return <KYCForm onKYCSubmitted={handleKYCSubmit} />;
  }

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
                  {user.role === "LP" ? "Limited Partner (Investor)" : "General Partner (Fund Manager)"}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "#8b949e", fontSize: 14 }}>Registered Wallet:</span>
                <div style={{ color: "#e6edf7", fontSize: 16, marginTop: 4, fontFamily: "monospace", wordBreak: "break-all" }}>
                  {user.walletAddress || "Not set"}
                </div>
              </div>
              <div>
                <span style={{ color: "#8b949e", fontSize: 14 }}>Connected Wallet:</span>
                <div style={{ 
                  color: connectedWallet ? "#238636" : "#8b949e", 
                  fontSize: 16, 
                  marginTop: 4,
                  fontFamily: "monospace",
                  wordBreak: "break-all"
                }}>
                  {connectedWallet || "Not connected"}
                </div>
                {connectedWallet && user.walletAddress && 
                 connectedWallet.toLowerCase() !== user.walletAddress.toLowerCase() && (
                  <div style={{ 
                    color: "#f0883e", 
                    fontSize: 12, 
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}>
                    ⚠️ Connected wallet does not match registered wallet
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ color: "#e6edf7", fontSize: 20 }}>
                KYC Status
              </h2>
              {(kycData.status === "pending" || kycData.status === "rejected") && (
                <button
                  onClick={() => setShowKYCForm(true)}
                  style={{
                    backgroundColor: "#238636",
                    border: "none",
                    borderRadius: 6,
                    color: "#ffffff",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  {kycData.status === "pending" ? "Start KYC" : "Resubmit KYC"}
                </button>
              )}
            </div>
            <KYCStatus />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <button
            onClick={() => {
              logout();
              navigate("/auth");
            }}
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
