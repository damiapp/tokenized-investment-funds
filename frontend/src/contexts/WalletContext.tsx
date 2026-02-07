import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient, API_BASE_URL } from "../api/auth";

interface WalletState {
  address: string | null;
  chainId: number | null;
  balance: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

const EXPECTED_CHAIN_ID = 1337; // Hardhat local

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  const updateState = (updates: Partial<WalletState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const fetchBalance = useCallback(async (address: string) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum || !address) return;
    
    try {
      const balanceHex = await ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });
      const balanceWei = BigInt(balanceHex);
      const balanceEth = Number(balanceWei) / 1e18;
      updateState({ balance: balanceEth.toFixed(4) });
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  }, []);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      updateState({ address: null, isConnected: false, balance: null });
    } else {
      updateState({ address: accounts[0], isConnected: true });
      fetchBalance(accounts[0]);
    }
  }, [fetchBalance]);

  const handleChainChanged = useCallback((chainIdHex: string) => {
    const chainId = parseInt(chainIdHex, 16);
    updateState({ chainId });
  }, []);

  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        updateState({ address: accounts[0], isConnected: true });
        fetchBalance(accounts[0]);
      }
    });

    ethereum.request({ method: "eth_chainId" }).then((chainIdHex: string) => {
      updateState({ chainId: parseInt(chainIdHex, 16) });
    });

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [handleAccountsChanged, handleChainChanged]);

  const connect = async () => {
    const ethereum = (window as any).ethereum;
    
    if (!ethereum) {
      updateState({ error: "MetaMask not installed. Please install MetaMask to connect." });
      return;
    }

    updateState({ isConnecting: true, error: null });

    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const chainIdHex = await ethereum.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex, 16);

      updateState({
        address: accounts[0],
        chainId,
        isConnected: true,
        isConnecting: false,
      });

      fetchBalance(accounts[0]);
    } catch (error: any) {
      updateState({
        isConnecting: false,
        error: error.message || "Failed to connect wallet",
      });
    }
  };

  const disconnect = () => {
    updateState({
      address: null,
      balance: null,
      isConnected: false,
      error: null,
    });
  };

  const refreshBalance = async () => {
    if (state.address) {
      await fetchBalance(state.address);
    }
  };

  const switchNetwork = async (targetChainId: number) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902 && targetChainId === EXPECTED_CHAIN_ID) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${EXPECTED_CHAIN_ID.toString(16)}`,
                chainName: "Hardhat Local",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["http://127.0.0.1:8545"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      }
    }
  };

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        switchNetwork,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

export { EXPECTED_CHAIN_ID };
