import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Investor {
  investmentId: string;
  investor: {
    id: string;
    email: string;
    walletAddress: string;
    createdAt: string;
  };
  fund?: {
    id: string;
    name: string;
  };
  amount: string;
  tokensIssued: string;
  status: string;
  investedAt: string;
  onChainInvestmentId?: number;
  onChainTxHash?: string;
}

interface Fund {
  id: string;
  name: string;
}

interface Analytics {
  fundId: string;
  fundName: string;
  targetAmount: string;
  raisedAmount: string;
  percentageRaised: number;
  totalInvestors: number;
  totalInvestments: number;
  confirmedInvestments: number;
  pendingInvestments: number;
  averageInvestment: number;
  minimumInvestment: string;
  status: string;
}

const InvestorsDashboard: React.FC = () => {
  const { token } = useAuth();
  const [myFunds, setMyFunds] = useState<Fund[]>([]);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [filteredInvestors, setFilteredInvestors] = useState<Investor[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'investors' | 'analytics'>('investors');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchMyFunds();
  }, []);

  useEffect(() => {
    if (selectedFund) {
      fetchInvestors();
      fetchAnalytics();
    }
  }, [selectedFund]);

  const fetchMyFunds = async () => {
    try {
      const response = await axios.get('http://localhost:3001/funds/my-funds', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const funds = response.data.data.funds || [];
      setMyFunds(funds);
      if (funds.length > 0) {
        setSelectedFund({ id: 'all', name: 'All Funds' } as Fund);
      }
    } catch (err: any) {
      console.error('Failed to fetch funds:', err);
    }
  };

  const fetchInvestors = async () => {
    if (!selectedFund) return;

    setLoading(true);
    setError('');

    try {
      if (selectedFund.id === 'all') {
        const allInvestors: Investor[] = [];
        for (const fund of myFunds) {
          const response = await axios.get(
            `http://localhost:3001/funds/${fund.id}/investors`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          allInvestors.push(...(response.data.data.investors || []));
        }
        setInvestors(allInvestors);
        filterInvestors(allInvestors, statusFilter);
      } else {
        const response = await axios.get(
          `http://localhost:3001/funds/${selectedFund.id}/investors`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const investorsList = response.data.data.investors || [];
        setInvestors(investorsList);
        filterInvestors(investorsList, statusFilter);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load investors');
    } finally {
      setLoading(false);
    }
  };

  const filterInvestors = (investorsList: Investor[], filter: string) => {
    if (filter === 'all') {
      setFilteredInvestors(investorsList);
    } else {
      setFilteredInvestors(investorsList.filter(inv => inv.status === filter));
    }
  };

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter);
    filterInvestors(investors, filter);
  };

  const handleConfirmAndMint = async (investmentId: string) => {
    try {
      await axios.put(
        `http://localhost:3001/investments/${investmentId}/status`,
        { status: 'confirmed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchInvestors();
      fetchAnalytics();
      alert('Investment confirmed and tokens minted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to confirm and mint tokens');
    }
  };

  const handleCancelInvestment = async (investmentId: string) => {
    try {
      await axios.put(
        `http://localhost:3001/investments/${investmentId}/status`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchInvestors();
      fetchAnalytics();
      alert('Investment cancelled successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel investment');
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedFund) return;

    try {
      if (selectedFund.id === 'all') {
        let totalTarget = 0;
        let totalRaised = 0;
        let totalInvestors = 0;
        let totalInvestments = 0;
        let totalConfirmed = 0;
        let totalPending = 0;
        let minInvestment = Infinity;

        for (const fund of myFunds) {
          const response = await axios.get(
            `http://localhost:3001/funds/${fund.id}/analytics`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const analytics = response.data.data.analytics;
          totalTarget += parseFloat(analytics.targetAmount);
          totalRaised += parseFloat(analytics.raisedAmount);
          totalInvestors += analytics.totalInvestors;
          totalInvestments += analytics.totalInvestments;
          totalConfirmed += analytics.confirmedInvestments;
          totalPending += analytics.pendingInvestments;
          minInvestment = Math.min(minInvestment, parseFloat(analytics.minimumInvestment));
        }

        setAnalytics({
          fundId: 'all',
          fundName: 'All Funds',
          targetAmount: totalTarget.toString(),
          raisedAmount: totalRaised.toString(),
          percentageRaised: (totalRaised / totalTarget) * 100,
          totalInvestors,
          totalInvestments,
          confirmedInvestments: totalConfirmed,
          pendingInvestments: totalPending,
          averageInvestment: totalInvestments > 0 ? totalRaised / totalInvestments : 0,
          minimumInvestment: minInvestment.toString(),
          status: 'active'
        });
      } else {
        const response = await axios.get(
          `http://localhost:3001/funds/${selectedFund.id}/analytics`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAnalytics(response.data.data.analytics);
      }
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            Investors Dashboard
          </h1>
          <p style={{ color: '#a0a0a0', fontSize: '14px' }}>
            Track and analyze your fund's investor base
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
            value={selectedFund?.id || 'all'}
            onChange={(e) => {
              if (e.target.value === 'all') {
                setSelectedFund({ id: 'all', name: 'All Funds' } as Fund);
              } else {
                const fund = myFunds.find(f => f.id === e.target.value);
                setSelectedFund(fund || null);
              }
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
            <option value="all">All Funds</option>
            {myFunds.map(fund => (
              <option key={fund.id} value={fund.id}>
                {fund.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '32px',
          borderBottom: '1px solid #3e3e42'
        }}>
          <button
            onClick={() => setActiveTab('investors')}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'investors' ? '2px solid #0078d4' : '2px solid transparent',
              color: activeTab === 'investors' ? '#0078d4' : '#a0a0a0',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Investors
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'analytics' ? '2px solid #0078d4' : '2px solid transparent',
              color: activeTab === 'analytics' ? '#0078d4' : '#a0a0a0',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Analytics
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

      {/* Investors Tab */}
      {activeTab === 'investors' && (
        <div>
          <div className="investors-header">
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                Investors ({filteredInvestors.length})
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleStatusFilterChange('all')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    backgroundColor: statusFilter === 'all' ? '#0078d4' : 'transparent',
                    border: `1px solid ${statusFilter === 'all' ? '#0078d4' : '#3e3e42'}`,
                    borderRadius: '6px',
                    color: statusFilter === 'all' ? '#ffffff' : '#a0a0a0',
                    cursor: 'pointer'
                  }}
                >
                  All ({investors.length})
                </button>
                <button
                  onClick={() => handleStatusFilterChange('pending')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    backgroundColor: statusFilter === 'pending' ? '#ffd700' : 'transparent',
                    border: `1px solid ${statusFilter === 'pending' ? '#ffd700' : '#3e3e42'}`,
                    borderRadius: '6px',
                    color: statusFilter === 'pending' ? '#1e1e1e' : '#a0a0a0',
                    cursor: 'pointer'
                  }}
                >
                  Pending ({investors.filter(i => i.status === 'pending').length})
                </button>
                <button
                  onClick={() => handleStatusFilterChange('confirmed')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    backgroundColor: statusFilter === 'confirmed' ? '#107c10' : 'transparent',
                    border: `1px solid ${statusFilter === 'confirmed' ? '#107c10' : '#3e3e42'}`,
                    borderRadius: '6px',
                    color: statusFilter === 'confirmed' ? '#ffffff' : '#a0a0a0',
                    cursor: 'pointer'
                  }}
                >
                  Confirmed ({investors.filter(i => i.status === 'confirmed').length})
                </button>
              </div>
            </div>
            {analytics && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', color: '#a0a0a0', marginBottom: '4px' }}>Total Raised</p>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#107c10' }}>
                  ${parseFloat(analytics.raisedAmount).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {loading ? (
            <p style={{ color: '#a0a0a0', padding: '40px', textAlign: 'center' }}>Loading...</p>
          ) : filteredInvestors.length === 0 ? (
            <div style={{ 
              backgroundColor: '#2d2d2d', 
              border: '1px solid #3e3e42',
              borderRadius: '8px',
              padding: '48px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#a0a0a0', fontSize: '16px' }}>
                {investors.length === 0 ? 'No investors yet.' : `No ${statusFilter} investments.`}
              </p>
            </div>
          ) : (
            <div style={{ 
              backgroundColor: '#2d2d2d',
              border: '1px solid #3e3e42',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div className="table-scroll-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#252525', borderBottom: '1px solid #3e3e42' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Investor
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Fund
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Amount
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Tokens
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Date
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Wallet
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvestors.map((inv) => (
                    <tr key={inv.investmentId} style={{ borderBottom: '1px solid #3e3e42' }}>
                      <td style={{ padding: '16px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#ffffff', marginBottom: '4px' }}>
                            {inv.investor.email}
                          </div>
                          <div style={{ fontSize: '12px', color: '#a0a0a0' }}>
                            ID: {inv.investor.id.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '14px', color: '#e0e0e0' }}>
                          {inv.fund?.name || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                          ${parseFloat(inv.amount).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '14px', color: '#e0e0e0' }}>
                          {inv.tokensIssued ? parseFloat(inv.tokensIssued).toLocaleString() : 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '12px',
                          backgroundColor: inv.status === 'confirmed' ? '#1a3d1a' : inv.status === 'pending' ? '#3d3d1a' : '#3d1a1a',
                          color: inv.status === 'confirmed' ? '#107c10' : inv.status === 'pending' ? '#ffd700' : '#ff6b6b'
                        }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#a0a0a0' }}>
                        {new Date(inv.investedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#a0a0a0', fontFamily: 'monospace' }}>
                          {inv.investor.walletAddress ? 
                            `${inv.investor.walletAddress.substring(0, 6)}...${inv.investor.walletAddress.substring(38)}` 
                            : 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {inv.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleConfirmAndMint(inv.investmentId)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 500,
                                backgroundColor: '#107c10',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#ffffff',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              ✓ Confirm & Mint Tokens
                            </button>
                            <button
                              onClick={() => handleCancelInvestment(inv.investmentId)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 500,
                                backgroundColor: 'transparent',
                                border: '1px solid #e81123',
                                borderRadius: '4px',
                                color: '#e81123',
                                cursor: 'pointer'
                              }}
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        )}
                        {inv.status === 'confirmed' && (
                          <span style={{ fontSize: '12px', color: '#a0a0a0' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#ffffff' }}>
            Fund Analytics
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* Target vs Raised */}
            <div style={{ backgroundColor: '#2d2d2d', padding: '24px', borderRadius: '8px', border: '1px solid #3e3e42' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#a0a0a0', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fundraising Progress</h3>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#0078d4', marginBottom: '8px' }}>
                {analytics.percentageRaised.toFixed(1)}%
              </div>
              <div style={{ fontSize: '14px', color: '#e0e0e0', marginBottom: '12px' }}>
                ${parseFloat(analytics.raisedAmount).toLocaleString()} / ${parseFloat(analytics.targetAmount).toLocaleString()}
              </div>
              <div style={{ width: '100%', backgroundColor: '#1a1a1a', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    backgroundColor: '#0078d4',
                    height: '8px',
                    borderRadius: '4px',
                    width: `${Math.min(analytics.percentageRaised, 100)}%`,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* Total Investors */}
            <div style={{ backgroundColor: '#2d2d2d', padding: '24px', borderRadius: '8px', border: '1px solid #3e3e42' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#a0a0a0', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Investors</h3>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#107c10' }}>
                {analytics.totalInvestors}
              </div>
              <div style={{ fontSize: '14px', color: '#e0e0e0', marginTop: '8px' }}>
                {analytics.totalInvestments} total investments
              </div>
            </div>

            {/* Average Investment */}
            <div style={{ backgroundColor: '#2d2d2d', padding: '24px', borderRadius: '8px', border: '1px solid #3e3e42' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#a0a0a0', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Investment</h3>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#8b5cf6' }}>
                ${analytics.averageInvestment.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#e0e0e0', marginTop: '8px' }}>
                Min: ${parseFloat(analytics.minimumInvestment).toLocaleString()}
              </div>
            </div>

            {/* Investment Status */}
            <div style={{ backgroundColor: '#2d2d2d', padding: '24px', borderRadius: '8px', border: '1px solid #3e3e42' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#a0a0a0', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confirmed Investments</h3>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#107c10' }}>
                {analytics.confirmedInvestments}
              </div>
              <div style={{ fontSize: '14px', color: '#e0e0e0', marginTop: '8px' }}>
                {analytics.pendingInvestments} pending
              </div>
            </div>

            {/* Fund Status */}
            <div style={{ backgroundColor: '#2d2d2d', padding: '24px', borderRadius: '8px', border: '1px solid #3e3e42' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#a0a0a0', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fund Status</h3>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', textTransform: 'capitalize' }}>
                {analytics.status}
              </div>
            </div>
          </div>

          {/* Investment Breakdown */}
          <div style={{ backgroundColor: '#2d2d2d', padding: '24px', borderRadius: '8px', border: '1px solid #3e3e42' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#ffffff' }}>Investment Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a0a0a0', fontSize: '14px' }}>Confirmed Investments:</span>
                <span style={{ fontWeight: 600, fontSize: '16px', color: '#ffffff' }}>{analytics.confirmedInvestments}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a0a0a0', fontSize: '14px' }}>Pending Investments:</span>
                <span style={{ fontWeight: 600, fontSize: '16px', color: '#ffd700' }}>{analytics.pendingInvestments}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a0a0a0', fontSize: '14px' }}>Total Investments:</span>
                <span style={{ fontWeight: 600, fontSize: '16px', color: '#ffffff' }}>{analytics.totalInvestments}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default InvestorsDashboard;
