import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWallet } from "../contexts/WalletContext";
import { WalletConnect } from "./WalletConnect";

export function Navbar() {
  const { user, logout } = useAuth();
  const { disconnect } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();

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

  if (!user) return null;

  return (
    <nav
      style={{
        backgroundColor: "#2d2d2d",
        borderBottom: "1px solid #3e3e42",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* Logo */}
        <Link
          to="/profile"
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

        {/* Navigation Links */}
        <div style={{ display: "flex", gap: 4 }}>
          <Link to="/home" style={linkStyle("/home")}>
            Home
          </Link>
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

      {/* Wallet & User Info */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
  );
}
