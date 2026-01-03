import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface RegisterFormProps {
  onToggleMode: () => void;
}

export function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"GP" | "LP">("LP");
  const [walletAddress, setWalletAddress] = useState("");
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (password !== confirmPassword) {
      return;
    }

    const credentials = {
      email,
      password,
      role,
      ...(walletAddress && { walletAddress }),
    };

    await register(credentials);
    // Navigate to profile after successful registration
    navigate("/profile");
  };

  const isFormValid = email && password && confirmPassword && password === confirmPassword && password.length >= 8;

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 24 }}>
      <h2 style={{ color: "#e6edf7", marginBottom: 24, textAlign: "center" }}>
        Register
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

        <div>
          <label style={{ display: "block", marginBottom: 4, color: "#8b949e", fontSize: 14 }}>
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            style={{
              width: "100%",
              padding: 12,
              backgroundColor: "#21262d",
              border: password === confirmPassword ? "1px solid #30363d" : "1px solid #f85149",
              borderRadius: 8,
              color: "#e6edf7",
              fontSize: 14,
            }}
            placeholder="••••••••"
          />
          {password !== confirmPassword && confirmPassword && (
            <div style={{ color: "#f85149", fontSize: 12, marginTop: 4 }}>
              Passwords do not match
            </div>
          )}
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4, color: "#8b949e", fontSize: 14 }}>
            Account Type
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "GP" | "LP")}
            style={{
              width: "100%",
              padding: 12,
              backgroundColor: "#21262d",
              border: "1px solid #30363d",
              borderRadius: 8,
              color: "#e6edf7",
              fontSize: 14,
            }}
          >
            <option value="LP">Limited Partner (Investor)</option>
            <option value="GP">General Partner (Fund Manager)</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 4, color: "#8b949e", fontSize: 14 }}>
            Wallet Address (Optional)
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x1234567890123456789012345678901234567890"
            style={{
              width: "100%",
              padding: 12,
              backgroundColor: "#21262d",
              border: "1px solid #30363d",
              borderRadius: 8,
              color: "#e6edf7",
              fontSize: 14,
            }}
          />
          <div style={{ color: "#8b949e", fontSize: 12, marginTop: 4 }}>
            Ethereum wallet address (42 characters starting with 0x)
          </div>
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
          disabled={!isFormValid || isLoading}
          style={{
            padding: 12,
            backgroundColor: !isFormValid || isLoading ? "#484f58" : "#238636",
            border: "1px solid #484f58",
            borderRadius: 8,
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 500,
            cursor: !isFormValid || isLoading ? "not-allowed" : "pointer",
            opacity: !isFormValid || isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Creating account..." : "Register"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <span style={{ color: "#8b949e", fontSize: 14 }}>
          Already have an account?{" "}
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
          Login
        </button>
      </div>
    </div>
  );
}
