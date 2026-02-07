import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { WalletConnect } from "./WalletConnect";

export function Navbar() {
  const { user, logout } = useAuth();
  const { address, balance, connect, disconnect } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    disconnect();
    logout();
    navigate("/auth");
  };

  const isActive = (path: string) => location.pathname === path;

  const linkStyle = (path: string) => ({
    color: isActive(path) ? "#ffffff" : "#cccccc",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: 4,
    fontSize: 14,
    fontWeight: isActive(path) ? 600 : 400,
    backgroundColor: isActive(path) ? "#3a3a3a" : "transparent",
    transition: "all 0.2s",
  });

  const mobileLinkStyle = (path: string) => ({
    color: isActive(path) ? "#ffffff" : "#cccccc",
    textDecoration: "none",
    padding: "12px 16px",
    borderRadius: 6,
    fontSize: 15,
    fontWeight: isActive(path) ? 600 : 400,
    backgroundColor: isActive(path) ? "#3a3a3a" : "transparent",
    display: "block",
    borderBottom: "1px solid #3e3e42",
    transition: "all 0.2s",
  });

  const handleMobileNavClick = () => {
    setMenuOpen(false);
  };

  if (!user) return null;

  return (
    <>
      <nav
        className="navbar"
        style={{
          backgroundColor: "#2d2d2d",
          borderBottom: "1px solid #3e3e42",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        {/* Hamburger - mobile only */}
        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            fontSize: 24,
            cursor: "pointer",
            padding: "4px 8px",
            lineHeight: 1,
          }}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <div className="navbar-left">
          {/* Logo */}
          <Link
            to="/home"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <img 
              src="/logo.png" 
              alt="Tokenize Invest" 
              style={{ height: 60 }}
            />
          </Link>

          {/* Navigation Links - desktop only */}
          <div className="navbar-links">
            <Link to="/funds" style={linkStyle("/funds")}>
              Browse Funds
            </Link>
            <Link to="/transactions" style={linkStyle("/transactions")}>
              Transactions
            </Link>
            {user.role === "GP" ? (
              <>
                <Link to="/my-funds" style={linkStyle("/my-funds")}>
                  My Funds
                </Link>
                <Link to="/portfolio" style={linkStyle("/portfolio")}>
                  Portfolio
                </Link>
                <Link to="/investors" style={linkStyle("/investors")}>
                  Investors
                </Link>
                <Link to="/funds/create" style={linkStyle("/funds/create")}>
                  Create Fund
                </Link>
              </>
            ) : (
              <Link to="/my-investments" style={linkStyle("/my-investments")}>
                My Investments
              </Link>
            )}
          </div>
        </div>

        {/* Wallet & User Info - desktop only */}
        <div className="navbar-right">
          <WalletConnect />
          <div style={{ width: 1, height: 24, backgroundColor: "#3e3e42" }} />
          <Link
            to="/profile"
            style={{
              textDecoration: "none",
              textAlign: "right",
              padding: "8px 12px",
              borderRadius: 4,
              backgroundColor: isActive("/profile") ? "#3a3a3a" : "transparent",
              transition: "background-color 0.2s",
            }}
          >
            <div style={{ color: "#ffffff", fontSize: 14 }}>{user.email}</div>
            <div
              style={{
                color: user.role === "GP" ? "#107c10" : "#0078d4",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {user.role === "GP" ? "General Partner" : "Limited Partner"}
            </div>
          </Link>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#3a3a3a",
              border: "1px solid #3e3e42",
              borderRadius: 4,
              color: "#ffffff",
              padding: "8px 16px",
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e81123";
              e.currentTarget.style.borderColor = "#e81123";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3a3a3a";
              e.currentTarget.style.borderColor = "#3e3e42";
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile Slide-out Menu */}
      {menuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="mobile-menu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Info */}
            <div style={{ padding: "16px", borderBottom: "1px solid #3e3e42" }}>
              <div style={{ color: "#ffffff", fontSize: 15, fontWeight: 600 }}>{user.email}</div>
              <div
                style={{
                  color: user.role === "GP" ? "#107c10" : "#0078d4",
                  fontSize: 13,
                  fontWeight: 500,
                  marginTop: 4,
                }}
              >
                {user.role === "GP" ? "General Partner" : "Limited Partner"}
              </div>
            </div>

            {/* Navigation Links */}
            <div style={{ padding: "8px 0" }}>
              <Link to="/funds" style={mobileLinkStyle("/funds")} onClick={handleMobileNavClick}>
                Browse Funds
              </Link>
              <Link to="/transactions" style={mobileLinkStyle("/transactions")} onClick={handleMobileNavClick}>
                Transactions
              </Link>
              {user.role === "GP" ? (
                <>
                  <Link to="/my-funds" style={mobileLinkStyle("/my-funds")} onClick={handleMobileNavClick}>
                    My Funds
                  </Link>
                  <Link to="/portfolio" style={mobileLinkStyle("/portfolio")} onClick={handleMobileNavClick}>
                    Portfolio
                  </Link>
                  <Link to="/investors" style={mobileLinkStyle("/investors")} onClick={handleMobileNavClick}>
                    Investors
                  </Link>
                  <Link to="/funds/create" style={mobileLinkStyle("/funds/create")} onClick={handleMobileNavClick}>
                    Create Fund
                  </Link>
                </>
              ) : (
                <Link to="/my-investments" style={mobileLinkStyle("/my-investments")} onClick={handleMobileNavClick}>
                  My Investments
                </Link>
              )}
              <Link to="/profile" style={mobileLinkStyle("/profile")} onClick={handleMobileNavClick}>
                Profile
              </Link>
            </div>

            {/* Wallet - compact for mobile */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #3e3e42" }}>
              {address ? (
                <div>
                  <div style={{
                    backgroundColor: "#21262d",
                    border: "1px solid #30363d",
                    borderRadius: 6,
                    padding: "10px 12px",
                    marginBottom: 8,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#238636" }} />
                      <span style={{ color: "#e6edf7", fontSize: 13, fontFamily: "monospace" }}>
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </span>
                    </div>
                    {balance && (
                      <div style={{ color: "#58a6ff", fontSize: 13, fontWeight: 600 }}>
                        {balance} ETH
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { handleMobileNavClick(); disconnect(); }}
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "1px solid #30363d",
                      borderRadius: 6,
                      color: "#8b949e",
                      padding: "8px 12px",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Disconnect Wallet
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  style={{
                    width: "100%",
                    backgroundColor: "#238636",
                    border: "none",
                    borderRadius: 6,
                    color: "#ffffff",
                    padding: "10px 16px",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  🦊 Connect Wallet
                </button>
              )}
            </div>

            {/* Logout */}
            <div style={{ padding: "12px 16px" }}>
              <button
                onClick={() => { handleMobileNavClick(); handleLogout(); }}
                style={{
                  width: "100%",
                  backgroundColor: "#e81123",
                  border: "none",
                  borderRadius: 6,
                  color: "#ffffff",
                  padding: "12px 16px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
