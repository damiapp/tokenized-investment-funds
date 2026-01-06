import React, { useState, useEffect } from "react";
import { kycApi, type KYCStatus } from "../api/kyc";
import { useAuth } from "../contexts/AuthContext";

export function KYCStatus() {
  const { user } = useAuth();
  const [kycData, setKycData] = useState<KYCStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchKYCStatus();
    }
  }, [user]);

  const fetchKYCStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await kycApi.getStatus();
      setKycData(response.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch KYC status");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#238636";
      case "rejected":
        return "#f85149";
      case "submitted":
        return "#f0883e";
      default:
        return "#8b949e";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "✅ Approved";
      case "rejected":
        return "❌ Rejected";
      case "submitted":
        return "⏳ Submitted";
      default:
        return "📋 Pending";
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "approved":
        return "Your KYC verification has been approved. You can now participate in investments.";
      case "rejected":
        return "Your KYC verification was rejected. Please review the feedback and resubmit.";
      case "submitted":
        return "Your documents have been submitted and are currently under review.";
      default:
        return "Complete KYC verification to unlock full platform features.";
    }
  };

  if (!user) {
    return <div>Please log in to view KYC status</div>;
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <div>Loading KYC status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: "#f85149",
        border: "1px solid #f85149",
        borderRadius: 8,
        padding: 16,
        color: "#ffffff",
        margin: 20,
      }}>
        Error: {error}
      </div>
    );
  }

  if (!kycData) {
    return (
      <div style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        padding: 24,
        margin: 20,
      }}>
        <h2 style={{ color: "#e6edf7", marginBottom: 16 }}>
          KYC Status
        </h2>
        <div style={{
          backgroundColor: "#21262d",
          border: "1px solid #30363d",
          borderRadius: 8,
          padding: 20,
          textAlign: "center",
        }}>
          <div style={{ color: "#8b949e", fontSize: 16, marginBottom: 8 }}>
            📋 Not Started
          </div>
          <div style={{ color: "#8b949e", fontSize: 14 }}>
            Complete KYC verification to unlock full platform features.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: "#161b22",
      border: "1px solid #30363d",
      borderRadius: 12,
      padding: 24,
      margin: 20,
    }}>
      <h2 style={{ color: "#e6edf7", marginBottom: 16 }}>
        KYC Status
      </h2>
      
      <div style={{
        backgroundColor: "#21262d",
        border: "1px solid #30363d",
        borderRadius: 8,
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            backgroundColor: getStatusColor(kycData.status),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}>
            {getStatusText(kycData.status).charAt(0)}
          </div>
          <div>
            <div style={{
              color: getStatusColor(kycData.status),
              fontSize: 18,
              fontWeight: 500,
              marginBottom: 4,
            }}>
              {getStatusText(kycData.status)}
            </div>
            <div style={{ color: "#8b949e", fontSize: 14 }}>
              {getStatusDescription(kycData.status)}
            </div>
          </div>
        </div>

        {kycData.submittedAt && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: "#8b949e", fontSize: 12 }}>
              Submitted: {new Date(kycData.submittedAt).toLocaleString()}
            </span>
          </div>
        )}

        {kycData.reviewedAt && (
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: "#8b949e", fontSize: 12 }}>
              Reviewed: {new Date(kycData.reviewedAt).toLocaleString()}
            </span>
          </div>
        )}

        {kycData.rejectionReason && (
          <div style={{
            backgroundColor: "#f85149",
            border: "1px solid #f85149",
            borderRadius: 6,
            padding: 12,
            marginTop: 12,
          }}>
            <div style={{ color: "#ffffff", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Rejection Reason
            </div>
            <div style={{ color: "#ffffff", fontSize: 12 }}>
              {kycData.rejectionReason}
            </div>
          </div>
        )}

        {kycData.documents && kycData.documents.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ color: "#e6edf7", marginBottom: 8, fontSize: 14 }}>
              Submitted Documents ({kycData.documents.length})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {kycData.documents.map((doc) => (
                <div key={doc.id} style={{
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ color: "#e6edf7", fontSize: 14, marginBottom: 4 }}>
                      {doc.name}
                    </div>
                    <div style={{ color: "#8b949e", fontSize: 12 }}>
                      {doc.type.replace(/([A-Z])/g, ' $1').toUpperCase()}
                    </div>
                  </div>
                  <div style={{ color: "#8b949e", fontSize: 12 }}>
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
