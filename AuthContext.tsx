/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthState, SystemHealth } from "../types";

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
  systemHealth: SystemHealth | null;
  refreshHealth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setSystemHealth(data);
      }
    } catch (e) {
      console.warn("Failed to retrieve API system health:", e);
    }
  };

  useEffect(() => {
    // Check for existing token and user on mount
    const savedToken = localStorage.getItem("om_token");
    const savedUserStr = localStorage.getItem("om_user");

    if (savedToken && savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        setState({
          token: savedToken,
          user: savedUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (e) {
        console.error("Error parsing saved user from localStorage:", e);
        localStorage.removeItem("om_token");
        localStorage.removeItem("om_user");
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }

    fetchHealth();
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem("om_token", token);
    localStorage.setItem("om_user", JSON.stringify(user));
    setState({
      token,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("om_token");
    localStorage.removeItem("om_user");
    setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const apiFetch = async (url: string, options: RequestInit = {}): Promise<any> => {
    const headers = new Headers(options.headers || {});
    
    // Auto-append Authorization header if token exists
    const currentToken = state.token || localStorage.getItem("om_token");
    if (currentToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${currentToken}`);
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401 || res.status === 403) {
      // Automatic session expiry redirect
      logout();
      throw new Error("Your session has expired. Please log in again.");
    }

    let data: any = null;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch (err: any) {
        const text = await res.text().catch(() => "");
        throw new Error(text || err.message || "Failed to parse response JSON.");
      }
    } else {
      const text = await res.text().catch(() => "");
      if (!res.ok) {
        throw new Error(text || `API error with status ${res.status}`);
      }
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!res.ok) {
      throw new Error(data?.error || data?.message || `An API error occurred (${res.status})`);
    }

    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        apiFetch,
        systemHealth,
        refreshHealth: fetchHealth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
