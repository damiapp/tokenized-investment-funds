import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPage } from "./components/AuthPage";
import { UserProfile } from "./components/UserProfile";
import { FundList } from "./components/FundList";
import { CreateFundForm } from "./components/CreateFundForm";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ minHeight: "100vh", backgroundColor: "#0d1117" }}>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
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
            <Route path="/" element={<Navigate to="/profile" replace />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
