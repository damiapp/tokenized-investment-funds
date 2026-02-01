import React, { useState, useEffect } from "react";
import { fundsApi, type CreateFundData } from "../api/funds";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

interface CreateFundFormProps {
  onFundCreated?: () => void;
}

interface Company {
  companyId: number;
  name: string;
  industry: string;
  country: string;
}

export function CreateFundForm({ onFundCreated }: CreateFundFormProps) {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: '',
    country: '',
    foundedYear: new Date().getFullYear()
  });
  
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

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('http://localhost:3001/portfolio/companies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanies(response.data.data.companies || []);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  };

  const toggleCompany = (companyId: number) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name || !newCompany.industry || !newCompany.country) {
      return;
    }

    try {
      await axios.post(
        'http://localhost:3001/portfolio/companies',
        newCompany,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewCompany({
        name: '',
        industry: '',
        country: '',
        foundedYear: new Date().getFullYear()
      });
      
      setShowAddCompanyModal(false);
      fetchCompanies();
    } catch (err) {
      console.error('Failed to add company:', err);
      alert('Failed to add company. Please try again.');
    }
  };

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
                boxSizing: "border-box",
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
                boxSizing: "border-box",
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
                  boxSizing: "border-box",
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
                  boxSizing: "border-box",
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
                  boxSizing: "border-box",
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
                  boxSizing: "border-box",
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
                boxSizing: "border-box",
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
                  boxSizing: "border-box",
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
                  boxSizing: "border-box",
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
                boxSizing: "border-box",
                backgroundColor: "#21262d",
                border: "1px solid #30363d",
                borderRadius: 6,
                color: "#e6edf7",
                padding: "12px",
                fontSize: 14,
              }}
              placeholder="e.g., TGF"
            />
          </div>

          {/* Portfolio Companies Selection */}
          <div>
            <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
              Portfolio Companies (optional)
            </label>
            <div style={{ 
              backgroundColor: "#21262d",
              border: "1px solid #30363d",
              borderRadius: 6,
              padding: "12px",
              maxHeight: "200px",
              overflowY: "auto"
            }}>
              {companies.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ color: "#8b949e", fontSize: 14, marginBottom: "12px" }}>
                    No portfolio companies available yet.
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCompanyModal(true)}
                    style={{
                      backgroundColor: "#238636",
                      border: "none",
                      borderRadius: 6,
                      color: "#ffffff",
                      padding: "8px 16px",
                      fontSize: 14,
                      cursor: "pointer",
                      fontWeight: 500
                    }}
                  >
                    + Add New Company
                  </button>
                </div>
              ) : (
                companies.map(company => (
                  <div
                    key={company.companyId}
                    onClick={() => toggleCompany(company.companyId)}
                    style={{
                      padding: "10px",
                      marginBottom: "8px",
                      backgroundColor: selectedCompanies.includes(company.companyId) ? "#238636" : "#161b22",
                      border: `1px solid ${selectedCompanies.includes(company.companyId) ? "#238636" : "#30363d"}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="checkbox"
                        checked={selectedCompanies.includes(company.companyId)}
                        onChange={() => {}}
                        style={{ cursor: "pointer" }}
                      />
                      <div>
                        <div style={{ color: "#e6edf7", fontSize: 14, fontWeight: 500 }}>
                          {company.name}
                        </div>
                        <div style={{ color: "#8b949e", fontSize: 12 }}>
                          {company.industry} • {company.country}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {companies.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddCompanyModal(true)}
                style={{
                  marginTop: "8px",
                  backgroundColor: "transparent",
                  border: "1px solid #30363d",
                  borderRadius: 6,
                  color: "#8b949e",
                  padding: "8px 12px",
                  fontSize: 13,
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                + Add Another Company
              </button>
            )}
            {selectedCompanies.length > 0 && (
              <div style={{ color: "#8b949e", fontSize: 12, marginTop: "8px" }}>
                {selectedCompanies.length} {selectedCompanies.length === 1 ? 'company' : 'companies'} selected
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
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

      {/* Add Company Modal */}
      {showAddCompanyModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowAddCompanyModal(false)}
        >
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 12,
              padding: 32,
              maxWidth: 500,
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ color: "#e6edf7", margin: 0 }}>Add Portfolio Company</h2>
              <button
                onClick={() => setShowAddCompanyModal(false)}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#8b949e",
                  fontSize: 24,
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddCompany} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "#21262d",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    color: "#e6edf7",
                    padding: "12px",
                    fontSize: 14,
                  }}
                  placeholder="e.g., TechCorp Inc."
                />
              </div>

              <div>
                <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
                  Industry *
                </label>
                <input
                  type="text"
                  value={newCompany.industry}
                  onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "#21262d",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    color: "#e6edf7",
                    padding: "12px",
                    fontSize: 14,
                  }}
                  placeholder="e.g., Technology"
                />
              </div>

              <div>
                <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
                  Country *
                </label>
                <input
                  type="text"
                  value={newCompany.country}
                  onChange={(e) => setNewCompany({ ...newCompany, country: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "#21262d",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    color: "#e6edf7",
                    padding: "12px",
                    fontSize: 14,
                  }}
                  placeholder="e.g., USA"
                />
              </div>

              <div>
                <label style={{ color: "#e6edf7", fontSize: 14, marginBottom: 8, display: "block" }}>
                  Founded Year *
                </label>
                <input
                  type="number"
                  value={newCompany.foundedYear}
                  onChange={(e) => setNewCompany({ ...newCompany, foundedYear: parseInt(e.target.value) })}
                  required
                  min="1800"
                  max={new Date().getFullYear()}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    backgroundColor: "#21262d",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    color: "#e6edf7",
                    padding: "12px",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: "transparent",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    color: "#e6edf7",
                    padding: "12px",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: "#238636",
                    border: "none",
                    borderRadius: 6,
                    color: "#ffffff",
                    padding: "12px",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
