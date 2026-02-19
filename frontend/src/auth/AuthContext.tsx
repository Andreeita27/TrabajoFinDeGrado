import React, { createContext, useContext, useMemo, useState } from "react";
import type { AuthResponseDto, LoginRequestDto, RegisterRequestDto } from "../types/auth";
import { loginApi, registerApi } from "../api/authApi";

type AuthState = {
  token: string | null;
  role: string | null;
  clientId: number | null;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  login: (payload: LoginRequestDto) => Promise<void>;
  register: (payload: RegisterRequestDto) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LS_TOKEN = "rr_token";
const LS_ROLE = "rr_role";
const LS_CLIENT_ID = "rr_client_id";

function persistAuth(res: AuthResponseDto) {
  localStorage.setItem(LS_TOKEN, res.token);
  localStorage.setItem(LS_ROLE, res.role);

  if (typeof res.clientId === "number") {
    localStorage.setItem(LS_CLIENT_ID, String(res.clientId));
  } else {
    localStorage.removeItem(LS_CLIENT_ID);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(LS_TOKEN));
  const [role, setRole] = useState<string | null>(() => localStorage.getItem(LS_ROLE));

  const [clientId, setClientId] = useState<number | null>(() => {
    const raw = localStorage.getItem(LS_CLIENT_ID);
    return raw ? Number(raw) : null;
  });

  const login = async (payload: LoginRequestDto) => {
    const res = await loginApi(payload);
    persistAuth(res);
    setToken(res.token);
    setRole(res.role);
    setClientId(typeof res.clientId === "number" ? res.clientId : null);
  };

  const register = async (payload: RegisterRequestDto) => {
    const res = await registerApi(payload);
    persistAuth(res);
    setToken(res.token);
    setRole(res.role);
    setClientId(typeof res.clientId === "number" ? res.clientId : null);
  };

  const logout = () => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_ROLE);
    localStorage.removeItem(LS_CLIENT_ID);
    setToken(null);
    setRole(null);
    setClientId(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      role,
      clientId,
      isAuthenticated: !!token,
      login,
      register,
      logout,
    }),
    [token, role, clientId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}