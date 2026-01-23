// API client for backend authentication endpoints
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

export interface User {
  id: string;
  email: string;
  role: "GP" | "LP";
  walletAddress: string | null;
  kyc: {
    status: "pending" | "approved" | "rejected";
    updatedAt: string;
  };
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  role: "GP" | "LP";
  walletAddress?: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

     const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log("API Client: login called with:", credentials);
    try {
      const response = await this.request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      console.log("API Client: login success, response:", response);
      return response;
    } catch (error) {
      console.error("API Client: login error:", error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<{ data: User }> {
    return this.request<{ data: User }>("/auth/me");
  }

  async healthCheck(): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>("/health");
  }

  // Public method for generic requests
  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, options);
  }

  // GET request helper
  async get<T>(endpoint: string, options: { params?: any; responseType?: string } = {}): Promise<T> {
    const { params, responseType } = options;
    let url = endpoint;
    
    if (params) {
      const queryString = new URLSearchParams();
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => queryString.append(key, v.toString()));
          } else {
            queryString.append(key, value.toString());
          }
        }
      });
      const queryStr = queryString.toString();
      if (queryStr) {
        url = `${endpoint}?${queryStr}`;
      }
    }

    if (responseType === "blob") {
      const fullUrl = `${API_BASE_URL}${url}`;
      const token = this.getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(fullUrl, { headers });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.blob() as Promise<T>;
    }

    return this.request<T>(url);
  }
}

export const apiClient = new ApiClient();
