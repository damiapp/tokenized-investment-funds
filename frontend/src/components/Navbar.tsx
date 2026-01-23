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
    color: isActive(path) ? "#58a6ff" : "#c9d1d9",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: isActive(path) ? 600 : 400,
    backgroundColor: isActive(path) ? "#21262d" : "transparent",
    transition: "all 0.2s",
  });

  if (!user) return null;

  return (
    <nav
      style={{
        backgroundColor: "#161b22",
        borderBottom: "1px solid #30363d",
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
            style={{ height: 40 }}
          />
        </Link>

        {/* Navigation Links */}
        <div style={{ display: "flex", gap: 4 }}>
          <Link to="/funds" style={linkStyle("/funds")}>
            Browse Funds
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
        <div style={{ width: 1, height: 24, backgroundColor: "#30363d" }} />
        <Link
          to="/profile"
          style={{
            textDecoration: "none",
            textAlign: "right",
            padding: "8px 12px",
            borderRadius: 6,
            backgroundColor: isActive("/profile") ? "#21262d" : "transparent",
            transition: "background-color 0.2s",
          }}
        >
          <div style={{ color: "#e6edf7", fontSize: 14 }}>{user.email}</div>
          <div
            style={{
              color: user.role === "GP" ? "#238636" : "#58a6ff",
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
            backgroundColor: "#21262d",
            border: "1px solid #30363d",
            borderRadius: 6,
            color: "#c9d1d9",
            padding: "8px 16px",
            fontSize: 14,
            cursor: "pointer",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#f85149")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#30363d")}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
