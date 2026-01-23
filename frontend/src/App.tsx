import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { AuthPage } from "./components/AuthPage";
import { UserProfile } from "./components/UserProfile";
import { FundList } from "./components/FundList";
import { CreateFundForm } from "./components/CreateFundForm";
import { FundDetail } from "./components/FundDetail";
import { MyFunds } from "./components/MyFunds";
import { MyInvestments } from "./components/MyInvestments";
import { TransactionsPage } from "./components/TransactionsPage";
import { Navbar } from "./components/Navbar";
import { WalletProvider } from "./contexts/WalletContext";

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <Router>
          <div style={{ minHeight: "100vh", backgroundColor: "#1e1e1e" }}>
            <Navbar />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/funds"
              element={
                <ProtectedRoute>
                  <FundList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/funds/create"
              element={
                <ProtectedRoute>
                  <CreateFundForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/funds/:id"
              element={
                <ProtectedRoute>
                  <FundDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-funds"
              element={
                <ProtectedRoute>
                  <MyFunds />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-investments"
              element={
                <ProtectedRoute>
                  <MyInvestments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </div>
        </Router>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
