import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { useAuth } from "../contexts/AuthContext";

export function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => setIsLogin(!isLogin);

  // Redirect to funds if already logged in
  if (isAuthenticated) {
    return <Navigate to="/funds" replace />;
  }

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#0d1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#e6edf7",
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 12,
          padding: 32,
          width: "100%",
          maxWidth: 400,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ color: "#e6edf7", fontSize: 24, marginBottom: 8 }}>
            Tokenized Investment Funds
          </h1>
          <p style={{ color: "#8b949e", fontSize: 14 }}>
            {isLogin ? "Welcome back! Please login to continue." : "Create an account to get started."}
          </p>
        </div>

        {isLogin ? (
          <LoginForm onToggleMode={toggleMode} />
        ) : (
          <RegisterForm onToggleMode={toggleMode} />
        )}
      </div>
    </div>
  );
}
