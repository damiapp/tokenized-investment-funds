import React from "react";
import { useWallet, EXPECTED_CHAIN_ID } from "../contexts/WalletContext";

export function WalletConnect() {
  const { address, chainId, balance, isConnecting, isConnected, error, connect, disconnect, switchNetwork } =
    useWallet();

  const isWrongNetwork = isConnected && chainId !== EXPECTED_CHAIN_ID;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={connect}
          disabled={isConnecting}
          style={{
            backgroundColor: "#238636",
            border: "none",
            borderRadius: 6,
            color: "#ffffff",
            padding: "8px 16px",
            fontSize: 14,
            cursor: isConnecting ? "not-allowed" : "pointer",
            opacity: isConnecting ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {isConnecting ? (
            "Connecting..."
          ) : (
            <>
              <span style={{ fontSize: 16 }}>🦊</span>
              Connect Wallet
            </>
          )}
        </button>
        {error && (
          <span style={{ color: "#f85149", fontSize: 12 }}>{error}</span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {isWrongNetwork && (
        <button
          onClick={() => switchNetwork(EXPECTED_CHAIN_ID)}
          style={{
            backgroundColor: "#d29922",
            border: "none",
            borderRadius: 6,
            color: "#ffffff",
            padding: "6px 12px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Switch to Hardhat
        </button>
      )}
      <div
        style={{
          backgroundColor: "#21262d",
          border: "1px solid #30363d",
          borderRadius: 6,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: isWrongNetwork ? "#d29922" : "#238636",
            }}
          />
          <span style={{ color: "#e6edf7", fontSize: 14, fontFamily: "monospace" }}>
            {formatAddress(address!)}
          </span>
        </div>
        {balance && (
          <div
            style={{
              backgroundColor: "#161b22",
              padding: "4px 8px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ color: "#58a6ff", fontSize: 13, fontWeight: 600 }}>
              {balance}
            </span>
            <span style={{ color: "#8b949e", fontSize: 12 }}>ETH</span>
          </div>
        )}
        <span style={{ color: "#8b949e", fontSize: 11 }}>
          {chainId === EXPECTED_CHAIN_ID ? "Hardhat" : `Chain ${chainId}`}
        </span>
      </div>
      <button
        onClick={disconnect}
        style={{
          backgroundColor: "transparent",
          border: "1px solid #30363d",
          borderRadius: 6,
          color: "#8b949e",
          padding: "6px 12px",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        Disconnect
      </button>
    </div>
  );
}
