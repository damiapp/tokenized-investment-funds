import React, { useState, useRef } from "react";
import { kycApi, type KYCUploadDocument, type KYCDocumentType } from "../api/kyc";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";

interface KYCFormProps {
  onKYCSubmitted: () => void;
}

export function KYCForm({ onKYCSubmitted }: KYCFormProps) {
  const { user } = useAuth();
  const { isConnected, address } = useWallet();
  const [documents, setDocuments] = useState<KYCUploadDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = {
    passport: useRef<HTMLInputElement>(null),
    idCard: useRef<HTMLInputElement>(null),
    proofOfAddress: useRef<HTMLInputElement>(null),
    bankStatement: useRef<HTMLInputElement>(null),
  };

  const handleFileUpload = (type: KYCDocumentType, file: File) => {
    const document: KYCUploadDocument = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      file,
      uploadedAt: new Date().toISOString(),
    };

    setDocuments(prev => {
      const filtered = prev.filter(doc => doc.type !== type);
      return [...filtered, document];
    });
    setError(null);
  };

  const handleFileChange = (type: KYCDocumentType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File size must be less than 5MB`);
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setError(`Only JPEG, PNG, and PDF files are allowed`);
        return;
      }

      handleFileUpload(type, file);
    }
  };

  const removeDocument = (type: KYCDocumentType) => {
    setDocuments(prev => prev.filter(doc => doc.type !== type));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (documents.length === 0) {
      setError("Please upload at least one document");
      return;
    }

    setIsLoading(true);
    try {
      await kycApi.submitDocuments(documents);
      onKYCSubmitted();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to submit KYC documents");
    } finally {
      setIsLoading(false);
    }
  };

  const documentTypes: { type: KYCDocumentType; label: string; description: string }[] = [
    {
      type: "passport",
      label: "Passport",
      description: "Government-issued passport",
    },
    {
      type: "idCard",
      label: "ID Card",
      description: "National identity card",
    },
    {
      type: "proofOfAddress",
      label: "Proof of Address",
      description: "Utility bill or bank statement showing current address",
    },
    {
      type: "bankStatement",
      label: "Bank Statement",
      description: "Recent bank statement (last 3 months)",
    },
  ];

  if (!user) {
    return <div>Please log in to submit KYC documents</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <div style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        padding: 32,
        marginBottom: 24,
      }}>
        <h1 style={{ color: "#e6edf7", marginBottom: 24, textAlign: "center" }}>
          KYC Verification
        </h1>

        {/* Wallet connection warning */}
        {!isConnected && (
          <div style={{
            backgroundColor: "#0d1117",
            border: "1px solid #f0883e",
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}>
            <span style={{ fontSize: 20 }}></span>
            <div>
              <div style={{ color: "#f0883e", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                Wallet Not Connected
              </div>
              <div style={{ color: "#8b949e", fontSize: 13 }}>
                Connect your wallet before submitting KYC to enable on-chain verification. 
                Without a wallet address, your KYC approval cannot be synced to the blockchain.
              </div>
            </div>
          </div>
        )}

        {isConnected && address && (
          <div style={{
            backgroundColor: "#0d1117",
            border: "1px solid #238636",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <span style={{ fontSize: 16 }}></span>
            <div>
              <div style={{ color: "#238636", fontSize: 13 }}>
                Wallet connected: <code style={{ fontFamily: "monospace" }}>{address.slice(0, 6)}...{address.slice(-4)}</code>
              </div>
              <div style={{ color: "#8b949e", fontSize: 12 }}>
                KYC approval will be synced to this address on-chain.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {documentTypes.map(({ type, label, description }) => {
            const uploadedDoc = documents.find(doc => doc.type === type);
            
            return (
              <div key={type} style={{ marginBottom: 24 }}>
                <h3 style={{ color: "#e6edf7", marginBottom: 8, fontSize: 16 }}>
                  {label}
                </h3>
                <p style={{ color: "#8b949e", marginBottom: 16, fontSize: 14 }}>
                  {description}
                </p>
                
                {uploadedDoc ? (
                  <div style={{
                    backgroundColor: "#21262d",
                    border: "1px solid #30363d",
                    borderRadius: 8,
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div>
                      <div style={{ color: "#e6edf7", fontSize: 14, marginBottom: 4 }}>
                        {uploadedDoc.name}
                      </div>
                      <div style={{ color: "#8b949e", fontSize: 12 }}>
                        Uploaded: {new Date(uploadedDoc.uploadedAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(type)}
                      style={{
                        backgroundColor: "#f85149",
                        border: "none",
                        borderRadius: 6,
                        color: "#ffffff",
                        padding: "8px 16px",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRefs[type]}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileChange(type, e)}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs[type].current?.click()}
                      style={{
                        backgroundColor: "#21262d",
                        border: "1px solid #30363d",
                        borderRadius: 8,
                        color: "#e6edf7",
                        padding: "16px",
                        cursor: "pointer",
                        fontSize: 14,
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      📄 Choose File
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {error && (
            <div style={{
              backgroundColor: "#f85149",
              border: "1px solid #f85149",
              borderRadius: 8,
              padding: 16,
              color: "#ffffff",
              fontSize: 14,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || documents.length === 0}
            style={{
              backgroundColor: isLoading || documents.length === 0 ? "#484f58" : "#238636",
              border: "none",
              borderRadius: 8,
              color: "#ffffff",
              padding: "16px 24px",
              cursor: isLoading || documents.length === 0 ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            {isLoading ? "Submitting..." : `Submit KYC (${documents.length} documents)`}
          </button>
        </form>
      </div>
    </div>
  );
}
