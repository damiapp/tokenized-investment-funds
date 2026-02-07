import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Company {
  companyId: number;
  name: string;
  industry: string;
  country: string;
  foundedYear: number;
  registeredBy: string;
  registeredAt: number;
  active: boolean;
  investments?: Investment[];
}

interface Investment {
  companyId: number;
  fundId: number;
  amount: string;
  equityPercentage: number;
  valuation: string;
  investedAt: number;
  active: boolean;
}

interface Fund {
  id: string;
  name: string;
  onChainFundId?: number;
  investmentContractFundId?: number;
}

const PortfolioManagement: React.FC = () => {
  const { token } = useAuth();
  const [myFunds, setMyFunds] = useState<Fund[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [portfolio, setPortfolio] = useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'portfolio' | 'add' | 'all'>('portfolio');

  // Form states
  const [companyForm, setCompanyForm] = useState({
    name: '',
    industry: '',
    country: '',
    foundedYear: new Date().getFullYear(),
  });


  useEffect(() => {
    fetchMyFunds();
    fetchAllCompanies();
  }, []);

  useEffect(() => {
    setError('');
    setPortfolio([]);
    
    if (selectedFund?.investmentContractFundId !== undefined) {
      fetchFundPortfolio(selectedFund.investmentContractFundId);
    }
  }, [selectedFund]);

  const fetchMyFunds = async () => {
    try {
      const response = await axios.get('http://localhost:3001/funds/my-funds', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allFunds = response.data.data.funds || [];
      // Only show funds that are deployed (have investmentContractFundId)
      const deployedFunds = allFunds.filter((f: Fund) => f.investmentContractFundId !== null && f.investmentContractFundId !== undefined);
      setMyFunds(deployedFunds);
      if (deployedFunds.length > 0) {
        setSelectedFund(deployedFunds[0]);
      }
    } catch (err: any) {
      console.error('Failed to fetch funds:', err);
    }
  };

  const fetchFundPortfolio = async (fundId: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`http://localhost:3001/portfolio/fund/${fundId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPortfolio(response.data.data.companies || []);
    } catch (err: any) {
      console.error('Portfolio fetch error:', err);
      setError(err.response?.data?.error?.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCompanies = async () => {
    try {
      const response = await axios.get('http://localhost:3001/portfolio/companies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllCompanies(response.data.data.companies || []);
    } catch (err: any) {
      console.error('Failed to fetch companies:', err);
    }
  };

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(
        'http://localhost:3001/portfolio/companies',
        companyForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCompanyForm({
        name: '',
        industry: '',
        country: '',
        foundedYear: new Date().getFullYear(),
      });
      
      fetchAllCompanies();
      setActiveTab('portfolio');
      alert('Company registered successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to register company');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1e1e1e', 
      color: '#ffffff',
      padding: '32px 24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 700, 
            marginBottom: '8px',
            color: '#ffffff'
          }}>
            Portfolio Management
          </h1>
          <p style={{ color: '#a0a0a0', fontSize: '14px' }}>
            Manage your fund's portfolio companies and investments
          </p>
        </div>

        {/* Fund Selector */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: 500, 
            marginBottom: '8px',
            color: '#e0e0e0'
          }}>
            Select Fund
          </label>
          <select
            value={selectedFund?.id || ''}
            onChange={(e) => {
              const fund = myFunds.find(f => f.id === e.target.value);
              setSelectedFund(fund || null);
            }}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '12px 16px',
              backgroundColor: '#2d2d2d',
              border: '1px solid #3e3e42',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="">{myFunds.length === 0 ? 'No deployed funds available' : 'Select a fund...'}</option>
            {myFunds.map(fund => (
              <option key={fund.id} value={fund.id}>
                {fund.name} (Portfolio ID: {fund.investmentContractFundId})
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="portfolio-tabs" style={{ 
          marginBottom: '32px',
          borderBottom: '1px solid #3e3e42'
        }}>
          <button
            onClick={() => setActiveTab('portfolio')}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'portfolio' ? '2px solid #0078d4' : '2px solid transparent',
              color: activeTab === 'portfolio' ? '#0078d4' : '#a0a0a0',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Portfolio Companies
          </button>
          <button
            onClick={() => setActiveTab('add')}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'add' ? '2px solid #0078d4' : '2px solid transparent',
              color: activeTab === 'add' ? '#0078d4' : '#a0a0a0',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Add Company
          </button>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'all' ? '2px solid #0078d4' : '2px solid transparent',
              color: activeTab === 'all' ? '#0078d4' : '#a0a0a0',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            All Companies
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#3d1f1f',
            border: '1px solid #6b2c2c',
            color: '#ff6b6b',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Portfolio View */}
        {activeTab === 'portfolio' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#ffffff' }}>
              Portfolio Companies
            </h2>
            {!selectedFund ? (
              <div style={{ 
                backgroundColor: '#2d2d2d', 
                border: '1px solid #3e3e42',
                borderRadius: '8px',
                padding: '48px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#a0a0a0', fontSize: '16px' }}>
                  {myFunds.length === 0 
                    ? 'No deployed funds available. Deploy a fund to manage its portfolio.' 
                    : 'Please select a fund to view its portfolio.'}
                </p>
              </div>
            ) : loading ? (
              <p style={{ color: '#a0a0a0', padding: '40px', textAlign: 'center' }}>Loading...</p>
            ) : portfolio.length === 0 ? (
              <div style={{ 
                backgroundColor: '#2d2d2d', 
                border: '1px solid #3e3e42',
                borderRadius: '8px',
                padding: '48px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#a0a0a0', fontSize: '16px' }}>No portfolio companies yet. Add companies and record investments to build your portfolio.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {portfolio.map(company => (
                  <div key={company.companyId} style={{ 
                    backgroundColor: '#2d2d2d',
                    border: '1px solid #3e3e42',
                    borderRadius: '8px',
                    padding: '24px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>{company.name}</h3>
                        <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '4px' }}>{company.industry} • {company.country}</p>
                        <p style={{ color: '#8b949e', fontSize: '13px' }}>Founded: {company.foundedYear}</p>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: company.active ? '#1a3d1a' : '#3d3d3d',
                        color: company.active ? '#107c10' : '#a0a0a0'
                      }}>
                        {company.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  
                    {company.investments && company.investments.length > 0 && (
                      <div style={{ marginTop: '16px', borderTop: '1px solid #3e3e42', paddingTop: '16px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#e0e0e0' }}>Investments</h4>
                        {company.investments.map((inv, idx) => (
                          <div key={idx} style={{ 
                            backgroundColor: '#252525',
                            padding: '12px',
                            borderRadius: '6px',
                            marginBottom: '8px'
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                              <div>
                                <span style={{ color: '#a0a0a0' }}>Amount:</span> <span style={{ color: '#ffffff', fontWeight: 500 }}>${parseFloat(inv.amount).toLocaleString()}</span>
                              </div>
                              <div>
                                <span style={{ color: '#a0a0a0' }}>Equity:</span> <span style={{ color: '#ffffff', fontWeight: 500 }}>{inv.equityPercentage / 100}%</span>
                              </div>
                              <div>
                                <span style={{ color: '#a0a0a0' }}>Valuation:</span> <span style={{ color: '#ffffff', fontWeight: 500 }}>${parseFloat(inv.valuation).toLocaleString()}</span>
                              </div>
                              <div>
                                <span style={{ color: '#a0a0a0' }}>Date:</span> <span style={{ color: '#ffffff', fontWeight: 500 }}>{new Date(inv.investedAt * 1000).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
          )}
        </div>
      )}

        {/* Add Company Form */}
        {activeTab === 'add' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#ffffff' }}>
              Register New Company
            </h2>
            <form onSubmit={handleRegisterCompany} style={{ 
              backgroundColor: '#2d2d2d',
              border: '1px solid #3e3e42',
              padding: '24px',
              borderRadius: '8px'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#e0e0e0' }}>Company Name</label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #3e3e42',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#e0e0e0' }}>Industry</label>
                <input
                  type="text"
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #3e3e42',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#e0e0e0' }}>Country</label>
                <input
                  type="text"
                  value={companyForm.country}
                  onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #3e3e42',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#e0e0e0' }}>Founded Year</label>
                <input
                  type="number"
                  value={companyForm.foundedYear}
                  onChange={(e) => setCompanyForm({ ...companyForm, foundedYear: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #3e3e42',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: loading ? '#484f58' : '#0078d4',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Registering...' : 'Register Company'}
              </button>
            </form>
          </div>
        )}

        {/* All Companies View */}
        {activeTab === 'all' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#ffffff' }}>
              All Registered Companies
            </h2>
            {allCompanies.length === 0 ? (
              <div style={{ 
                backgroundColor: '#2d2d2d', 
                border: '1px solid #3e3e42',
                borderRadius: '8px',
                padding: '48px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#a0a0a0', fontSize: '16px' }}>No companies registered yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {allCompanies.map(company => (
                  <div key={company.companyId} style={{ 
                    backgroundColor: '#2d2d2d',
                    border: '1px solid #3e3e42',
                    borderRadius: '8px',
                    padding: '24px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>{company.name}</h3>
                        <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '4px' }}>{company.industry} • {company.country}</p>
                        <p style={{ color: '#8b949e', fontSize: '13px' }}>Founded: {company.foundedYear}</p>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: company.active ? '#1a3d1a' : '#3d3d3d',
                        color: company.active ? '#107c10' : '#a0a0a0'
                      }}>
                        {company.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioManagement;
