import React, { createContext, useContext, useMemo, useState } from "react";
import type { AuthResponseDto, LoginRequestDto, RegisterRequestDto } from "../types/auth";
import { loginApi, registerApi } from "../api/authApi";

type AuthState = {
  token: string | null;
  role: string | null;
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

function persistAuth(res: AuthResponseDto) {
  localStorage.setItem(LS_TOKEN, res.token);
  localStorage.setItem(LS_ROLE, res.role);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(LS_TOKEN));
  const [role, setRole] = useState<string | null>(() => localStorage.getItem(LS_ROLE));

  const login = async (payload: LoginRequestDto) => {
    const res = await loginApi(payload);
    persistAuth(res);
    setToken(res.token);
    setRole(res.role);
  };

  const register = async (payload: RegisterRequestDto) => {
    const res = await registerApi(payload);
    persistAuth(res);
    setToken(res.token);
    setRole(res.role);
  };

  const logout = () => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_ROLE);
    setToken(null);
    setRole(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      role,
      isAuthenticated: !!token,
      login,
      register,
      logout,
    }),
    [token, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
