import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

type HealthResponse = { ok: boolean };

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasInjectedProvider = useMemo(() => {
    return typeof (window as any).ethereum !== "undefined";
  }, []);

  const connectWallet = useCallback(async () => {
    setError(null);

    if (!hasInjectedProvider) {
      setError("No injected wallet found. Install MetaMask.");
      return;
    }

    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    await provider.send("eth_requestAccounts", []);

    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    const network = await provider.getNetwork();

    setAddress(addr);
    setChainId(network.chainId);
  }, [hasInjectedProvider]);

  const loadHealth = useCallback(async () => {
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) {
        throw new Error(`Health check failed (${res.status})`);
      }
      const json = (await res.json()) as HealthResponse;
      setHealth(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  return (
    <div style={{ minHeight: "100vh", background: "#0b1220", color: "#e6edf7", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>Tokenized Investment Funds</h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 12,
            padding: 16,
            border: "1px solid rgba(230, 237, 247, 0.12)",
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Backend</div>
            <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
              {API_BASE_URL}
            </div>
            <div style={{ marginTop: 8 }}>
              <button
                onClick={loadHealth}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(230, 237, 247, 0.18)",
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                Re-check /health
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>Health:</span>{" "}
              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                {health ? JSON.stringify(health) : "(not loaded)"}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Wallet</div>
            <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={connectWallet}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(230, 237, 247, 0.18)",
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                Connect MetaMask
              </button>
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                {hasInjectedProvider ? "Injected provider detected" : "No injected provider"}
              </span>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Address</div>
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                {address || "(not connected)"}
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Chain ID</div>
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                {chainId ?? "(unknown)"}
              </div>
            </div>
          </div>

          {error ? (
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(255, 0, 0, 0.12)" }}>{error}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
