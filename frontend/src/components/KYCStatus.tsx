import React, { useState, useEffect } from "react";
import { kycApi, type KYCStatus as KYCStatusType } from "../api/kyc";
import { apiClient, API_BASE_URL } from "../api/auth";
import { useAuth } from "../contexts/AuthContext";

export function KYCStatus() {
  const { user } = useAuth();
  const [kycData, setKycData] = useState<KYCStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchKYCStatus();
      
      // Poll for status updates every 10 seconds if status is submitted
      const interval = setInterval(() => {
        if (kycData?.status === "submitted") {
          fetchKYCStatus();
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [user, kycData?.status]);

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

  const handleSyncToBlockchain = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const token = apiClient.getToken();
      const response = await fetch(`${API_BASE_URL}/kyc/sync-blockchain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to sync to blockchain");
      }

      // Refresh KYC status to show updated on-chain status
      await fetchKYCStatus();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sync to blockchain");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownload = async (downloadUrl: string, filename: string) => {
    const token = apiClient.getToken();
    const response = await fetch(`${API_BASE_URL}${downloadUrl}`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download document (HTTP ${response.status})`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      case "submitted":
        return "⏳";
      default:
        return "📋";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "submitted":
        return "Submitted";
      default:
        return "Pending";
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
            fontSize: 28,
          }}>
            {getStatusIcon(kycData.status)}
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

        {/* On-Chain Status Section */}
        {kycData.status === "approved" && (
          <div style={{
            backgroundColor: "#0d1117",
            border: "1px solid #30363d",
            borderRadius: 6,
            padding: 12,
            marginTop: 12,
          }}>
            <div style={{ 
              color: "#e6edf7", 
              fontSize: 14, 
              fontWeight: 500, 
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span>⛓️</span>
              <span>Blockchain Status</span>
            </div>
            
            {kycData.onChain?.verified ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8,
                  color: "#238636",
                  fontSize: 13,
                }}>
                  <span>✓</span>
                  <span>Verified on-chain</span>
                </div>
                {kycData.onChain.txHash && (
                  <div style={{ color: "#8b949e", fontSize: 12 }}>
                    <span>Tx: </span>
                    <code style={{ 
                      backgroundColor: "#21262d", 
                      padding: "2px 6px", 
                      borderRadius: 4,
                      fontFamily: "monospace",
                    }}>
                      {kycData.onChain.txHash.slice(0, 10)}...{kycData.onChain.txHash.slice(-8)}
                    </code>
                  </div>
                )}
                {kycData.onChain.syncedAt && (
                  <div style={{ color: "#8b949e", fontSize: 11 }}>
                    Synced: {new Date(kycData.onChain.syncedAt).toLocaleString()}
                  </div>
                )}
              </div>
            ) : kycData.onChain?.error ? (
              <div style={{ 
                color: "#f0883e", 
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span>⚠️</span>
                <span>Pending sync: {kycData.onChain.error}</span>
              </div>
            ) : (
              <div style={{ 
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}>
                <div style={{ 
                  color: "#8b949e", 
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span>⏳</span>
                  <span>Awaiting blockchain sync...</span>
                </div>
                <button
                  onClick={handleSyncToBlockchain}
                  disabled={isSyncing}
                  style={{
                    backgroundColor: isSyncing ? "#484f58" : "#238636",
                    border: "none",
                    borderRadius: 6,
                    color: "#ffffff",
                    padding: "8px 12px",
                    cursor: isSyncing ? "not-allowed" : "pointer",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {isSyncing ? "Syncing..." : "⛓️ Sync to Blockchain"}
                </button>
              </div>
            )}
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
                      {doc.originalName}
                    </div>
                    <div style={{ color: "#8b949e", fontSize: 12 }}>
                      {doc.type.replace(/([A-Z])/g, " $1").toUpperCase()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ color: "#8b949e", fontSize: 12 }}>
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                    {doc.downloadUrl && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await handleDownload(doc.downloadUrl!, doc.originalName);
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Failed to download document");
                          }
                        }}
                        style={{
                          backgroundColor: "#238636",
                          border: "none",
                          borderRadius: 6,
                          color: "#ffffff",
                          padding: "6px 10px",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Download
                      </button>
                    )}
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
