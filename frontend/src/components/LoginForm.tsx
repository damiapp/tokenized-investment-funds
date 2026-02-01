import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface LoginFormProps {
  onToggleMode: () => void;
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login form submitted with:", { email, password: "***" });
    clearError();
    try {
      console.log("Calling login function...");
      await login({ email, password });
      console.log("Login successful!");
      // Navigate to home page after successful login
      navigate("/home");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 24 }}>
      <h2 style={{ color: "#e6edf7", marginBottom: 24, textAlign: "center" }}>
        Login
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, color: "#8b949e", fontSize: 14 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 12,
              backgroundColor: "#21262d",
              border: "1px solid #30363d",
              borderRadius: 8,
              color: "#e6edf7",
              fontSize: 14,
            }}
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4, color: "#8b949e", fontSize: 14 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 12,
              backgroundColor: "#21262d",
              border: "1px solid #30363d",
              borderRadius: 8,
              color: "#e6edf7",
              fontSize: 14,
            }}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              backgroundColor: "rgba(248, 81, 73, 0.1)",
              border: "1px solid rgba(248, 81, 73, 0.3)",
              borderRadius: 8,
              color: "#f85149",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: 12,
            backgroundColor: isLoading ? "#238636" : "#238636",
            border: "1px solid #238636",
            borderRadius: 8,
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 500,
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <span style={{ color: "#8b949e", fontSize: 14 }}>
          Don't have an account?{" "}
        </span>
        <button
          type="button"
          onClick={onToggleMode}
          style={{
            background: "none",
            border: "none",
            color: "#58a6ff",
            fontSize: 14,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Register
        </button>
        
        {isAuthenticated && (
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={() => navigate("/home")}
              style={{
                background: "none",
                border: "none",
                color: "#238636",
                fontSize: 14,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Go to Home →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
