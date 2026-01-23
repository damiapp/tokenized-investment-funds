import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect to funds if already logged in
  if (isAuthenticated) {
    navigate("/funds");
    return null;
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#0d1117",
      color: "#e6edf7"
    }}>
      {/* Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%)",
        padding: "80px 24px",
        textAlign: "center",
        borderBottom: "1px solid #30363d"
      }}>
        <img 
          src="/logo.png" 
          alt="Tokenize Invest" 
          style={{ height: 80, marginBottom: 32 }}
        />
        <h1 style={{
          fontSize: 48,
          fontWeight: 700,
          marginBottom: 24,
          background: "linear-gradient(135deg, #58a6ff 0%, #79c0ff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          Blockchain-Powered Investment Funds
        </h1>
        <p style={{
          fontSize: 20,
          color: "#8b949e",
          maxWidth: 700,
          margin: "0 auto 40px",
          lineHeight: 1.6
        }}>
          A secure, transparent platform connecting General Partners with Limited Partners 
          through tokenized fund ownership and on-chain verification.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button
            onClick={() => navigate("/auth")}
            style={{
              backgroundColor: "#238636",
              border: "none",
              borderRadius: 6,
              color: "#ffffff",
              padding: "14px 32px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2ea043"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#238636"}
          >
            Get Started
          </button>
          <button
            onClick={() => {
              const featuresSection = document.getElementById("features");
              featuresSection?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #30363d",
              borderRadius: 6,
              color: "#c9d1d9",
              padding: "14px 32px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              transition: "border-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#58a6ff"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#30363d"}
          >
            Learn More
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" style={{ 
        maxWidth: 1200, 
        margin: "0 auto", 
        padding: "80px 24px" 
      }}>
        <h2 style={{
          fontSize: 36,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 60
        }}>
          Why Choose Tokenize Invest?
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 32
        }}>
          {/* Feature 1 */}
          <div style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 12,
            padding: 32,
            transition: "transform 0.2s, border-color 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor = "#58a6ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "#30363d";
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
              Secure & Compliant
            </h3>
            <p style={{ color: "#8b949e", lineHeight: 1.6 }}>
              KYC verification with on-chain enforcement ensures only verified investors can participate. 
              All transactions are secured by blockchain technology.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 12,
            padding: 32,
            transition: "transform 0.2s, border-color 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor = "#58a6ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "#30363d";
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💎</div>
            <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
              Tokenized Ownership
            </h3>
            <p style={{ color: "#8b949e", lineHeight: 1.6 }}>
              Each fund has its own ERC-20 token representing ownership. 
              Track your portfolio and token balances in real-time on the blockchain.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 12,
            padding: 32,
            transition: "transform 0.2s, border-color 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor = "#58a6ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "#30363d";
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌐</div>
            <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
              Transparent & Decentralized
            </h3>
            <p style={{ color: "#8b949e", lineHeight: 1.6 }}>
              All fund operations are recorded on-chain. Smart contracts ensure 
              transparent and automated execution of investment agreements.
            </p>
          </div>

          {/* Feature 4 */}
          <div style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 12,
            padding: 32,
            transition: "transform 0.2s, border-color 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor = "#58a6ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "#30363d";
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
              Portfolio Management
            </h3>
            <p style={{ color: "#8b949e", lineHeight: 1.6 }}>
              Comprehensive dashboard for tracking investments, fund performance, 
              and token holdings across multiple funds.
            </p>
          </div>

          {/* Feature 5 */}
          <div style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 12,
            padding: 32,
            transition: "transform 0.2s, border-color 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor = "#58a6ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "#30363d";
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
            <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
              Fast & Efficient
            </h3>
            <p style={{ color: "#8b949e", lineHeight: 1.6 }}>
              Streamlined investment process from KYC verification to token minting. 
              Automated workflows reduce administrative overhead.
            </p>
          </div>

          {/* Feature 6 */}
          <div style={{
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 12,
            padding: 32,
            transition: "transform 0.2s, border-color 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor = "#58a6ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "#30363d";
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
            <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
              For GPs & LPs
            </h3>
            <p style={{ color: "#8b949e", lineHeight: 1.6 }}>
              General Partners can create and manage funds. Limited Partners can 
              discover opportunities and invest with confidence.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{
        backgroundColor: "#161b22",
        borderTop: "1px solid #30363d",
        borderBottom: "1px solid #30363d",
        padding: "80px 24px"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{
            fontSize: 36,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 60
          }}>
            How It Works
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 40
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "#238636",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 700,
                margin: "0 auto 20px"
              }}>
                1
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
                Register & Verify
              </h3>
              <p style={{ color: "#8b949e", lineHeight: 1.6 }}>
                Create an account and complete KYC verification to access the platform.
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "#238636",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 700,
                margin: "0 auto 20px"
              }}>
                2
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
                Connect Wallet
              </h3>
              <p style={{ color: "#8b949e", lineHeight: 1.6 }}>
                Link your MetaMask wallet to receive and manage your fund tokens.
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "#238636",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 700,
                margin: "0 auto 20px"
              }}>
                3
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
                Browse & Invest
              </h3>
              <p style={{ color: "#8b949e", lineHeight: 1.6 }}>
                Explore available funds and submit investment requests.
              </p>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "#238636",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 700,
                margin: "0 auto 20px"
              }}>
                4
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
                Receive Tokens
              </h3>
              <p style={{ color: "#8b949e", lineHeight: 1.6 }}>
                Once approved, tokens are minted to your wallet representing your ownership.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        padding: "80px 24px",
        textAlign: "center"
      }}>
        <h2 style={{
          fontSize: 36,
          fontWeight: 700,
          marginBottom: 24
        }}>
          Ready to Get Started?
        </h2>
        <p style={{
          fontSize: 18,
          color: "#8b949e",
          maxWidth: 600,
          margin: "0 auto 40px",
          lineHeight: 1.6
        }}>
          Join the future of investment fund management. Create an account today 
          and start exploring tokenized investment opportunities.
        </p>
        <button
          onClick={() => navigate("/auth")}
          style={{
            backgroundColor: "#238636",
            border: "none",
            borderRadius: 6,
            color: "#ffffff",
            padding: "16px 48px",
            fontSize: 18,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2ea043"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#238636"}
        >
          Create Account
        </button>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid #30363d",
        padding: "32px 24px",
        textAlign: "center",
        color: "#8b949e",
        fontSize: 14
      }}>
        <p>© 2026 Tokenize Invest. Powered by blockchain technology.</p>
      </div>
    </div>
  );
}
