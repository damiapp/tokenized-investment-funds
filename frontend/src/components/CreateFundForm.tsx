import React, { useState } from "react";
import { fundsApi, type CreateFundData } from "../api/funds";
import { useAuth } from "../contexts/AuthContext";

interface CreateFundFormProps {
  onFundCreated?: () => void;
}

export function CreateFundForm({ onFundCreated }: CreateFundFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<CreateFundData>({
    name: "",
    description: "",
    targetAmount: 0,
    minimumInvestment: 0,
    managementFee: 2,
    performanceFee: 20,
    investmentStrategy: "",
    riskLevel: "medium",
    fundingDeadline: "",
    tokenSymbol: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["targetAmount", "minimumInvestment", "managementFee", "performanceFee"].includes(name)
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name || !formData.description || !formData.investmentStrategy) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.targetAmount <= 0 || formData.minimumInvestment <= 0) {
      setError("Target amount and minimum investment must be greater than 0");
      return;
    }

    setIsLoading(true);
    try {
      await fundsApi.create(formData);
      setSuccess(true);
      setFormData({
        name: "",
        description: "",
        targetAmount: 0,
        minimumInvestment: 0,
        managementFee: 2,
        performanceFee: 20,
        investmentStrategy: "",
        riskLevel: "medium",
        fundingDeadline: "",
        tokenSymbol: "",
      });
      if (onFundCreated) {
        onFundCreated();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create fund");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== "GP") {
    return (
      <div style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        padding: 40,
        margin: 20,
        textAlign: "center",
      }}>
        <div style={{ color: "#f85149", fontSize: 18, marginBottom: 8 }}>
          Access Denied
        </div>
        <div style={{ color: "#8b949e", fontSize: 14 }}>
          Only General Partners can create funds
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <div style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        padding: 32,
      }}>
        <h1 style={{ color: "#e6edf7", marginBottom: 24, textAlign: "center" }}>
          Create New Fund
        </h1>

        {success && (
          <div style={{
            backgroundColor: "#238636",
            border: "1px solid #238636",
            borderRadius: 8,
            padding: 16,
            color: "#ffffff",
            marginBottom: 20,
          }}>
            ✅ Fund created successfully!
          </div>
        )}

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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
              Fund Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                backgroundColor: "#21262d",
                border: "1px solid #30363d",
                borderRadius: 6,
                color: "#e6edf7",
                padding: "12px",
                fontSize: 14,
              }}
              placeholder="e.g., Tech Growth Fund 2026"
            />
          </div>

          <div>
            <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              style={{
                width: "100%",
                backgroundColor: "#21262d",
                border: "1px solid #30363d",
                borderRadius: 6,
                color: "#e6edf7",
                padding: "12px",
                fontSize: 14,
                resize: "vertical",
              }}
              placeholder="Describe your fund's objectives and focus..."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
                Target Amount ($) *
              </label>
              <input
                type="number"
                name="targetAmount"
                value={formData.targetAmount || ""}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                style={{
                  width: "100%",
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  color: "#e6edf7",
                  padding: "12px",
                  fontSize: 14,
                }}
                placeholder="1000000"
              />
            </div>

            <div>
              <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
                Minimum Investment ($) *
              </label>
              <input
                type="number"
                name="minimumInvestment"
                value={formData.minimumInvestment || ""}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                style={{
                  width: "100%",
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  color: "#e6edf7",
                  padding: "12px",
                  fontSize: 14,
                }}
                placeholder="10000"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
                Management Fee (%) *
              </label>
              <input
                type="number"
                name="managementFee"
                value={formData.managementFee || ""}
                onChange={handleChange}
                required
                min="0"
                max="100"
                step="0.01"
                style={{
                  width: "100%",
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  color: "#e6edf7",
                  padding: "12px",
                  fontSize: 14,
                }}
                placeholder="2"
              />
            </div>

            <div>
              <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
                Performance Fee (%) *
              </label>
              <input
                type="number"
                name="performanceFee"
                value={formData.performanceFee || ""}
                onChange={handleChange}
                required
                min="0"
                max="100"
                step="0.01"
                style={{
                  width: "100%",
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  color: "#e6edf7",
                  padding: "12px",
                  fontSize: 14,
                }}
                placeholder="20"
              />
            </div>
          </div>

          <div>
            <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
              Investment Strategy *
            </label>
            <textarea
              name="investmentStrategy"
              value={formData.investmentStrategy}
              onChange={handleChange}
              required
              rows={3}
              style={{
                width: "100%",
                backgroundColor: "#21262d",
                border: "1px solid #30363d",
                borderRadius: 6,
                color: "#e6edf7",
                padding: "12px",
                fontSize: 14,
                resize: "vertical",
              }}
              placeholder="Describe your investment strategy..."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
                Risk Level *
              </label>
              <select
                name="riskLevel"
                value={formData.riskLevel}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  color: "#e6edf7",
                  padding: "12px",
                  fontSize: 14,
                }}
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>

            <div>
              <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
                Funding Deadline
              </label>
              <input
                type="date"
                name="fundingDeadline"
                value={formData.fundingDeadline}
                onChange={handleChange}
                style={{
                  width: "100%",
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  color: "#e6edf7",
                  padding: "12px",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
              Token Symbol (optional)
            </label>
            <input
              type="text"
              name="tokenSymbol"
              value={formData.tokenSymbol}
              onChange={handleChange}
              maxLength={10}
              style={{
                width: "100%",
                backgroundColor: "#21262d",
                border: "1px solid #30363d",
                borderRadius: 6,
                color: "#e6edf7",
                padding: "12px",
                fontSize: 14,
              }}
              placeholder="e.g., TGF26"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? "#484f58" : "#238636",
              border: "none",
              borderRadius: 8,
              color: "#ffffff",
              padding: "16px 24px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 500,
              marginTop: 8,
            }}
          >
            {isLoading ? "Creating Fund..." : "Create Fund"}
          </button>
        </form>
      </div>
    </div>
  );
}
