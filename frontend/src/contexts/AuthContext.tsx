import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { apiClient, User, LoginCredentials, RegisterCredentials } from "../api/auth";
import { useWallet } from "./WalletContext";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_USER"; payload: User };

// Check if there's a token in localStorage to determine initial loading state
const hasStoredToken = !!localStorage.getItem("auth_token");

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: hasStoredToken, // Start loading if we have a token to verify
  error: null,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        user: null,
        token: null,
        isAuthenticated: false,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const wallet = useWallet();

  useEffect(() => {
    // Check for existing token on app start
    const token = apiClient.getToken();
    if (token) {
      dispatch({ type: "AUTH_START" });
      apiClient
        .getCurrentUser()
        .then((response) => {
          dispatch({
            type: "AUTH_SUCCESS",
            payload: { user: response.data, token },
          });
        })
        .catch((error) => {
          console.error("Failed to restore session:", error);
          apiClient.setToken(null);
          dispatch({ type: "LOGOUT" });
        });
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    console.log("AuthContext: login called with:", credentials);
    dispatch({ type: "AUTH_START" });
    try {
      console.log("AuthContext: calling apiClient.login...");
      const response = await apiClient.login(credentials);
      console.log("AuthContext: apiClient.login success, response:", response);
      apiClient.setToken(response.data.token);
      console.log("AuthContext: token set, dispatching AUTH_SUCCESS");
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: response.data.user, token: response.data.token },
      });
      console.log("AuthContext: AUTH_SUCCESS dispatched");
    } catch (error) {
      console.error("AuthContext: login error:", error);
      dispatch({
        type: "AUTH_FAILURE",
        payload: error instanceof Error ? error.message : "Login failed",
      });
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    dispatch({ type: "AUTH_START" });
    try {
      const response = await apiClient.register(credentials);
      apiClient.setToken(response.data.token);
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: response.data.user, token: response.data.token },
      });
    } catch (error) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: error instanceof Error ? error.message : "Registration failed",
      });
    }
  };

  const logout = () => {
    apiClient.setToken(null);
    wallet.disconnect();
    dispatch({ type: "LOGOUT" });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
