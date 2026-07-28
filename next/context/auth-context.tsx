"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import type { AuthSession, AuthUser, UserRole } from "@/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession["session"] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{ error?: string; data?: any }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession["session"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await authClient.getSession();
      if (error) {
        setUser(null);
        setSession(null);
        return;
      }
      if (data?.user) {
        setUser(data.user as unknown as AuthUser);
        setSession(data.session as AuthSession["session"]);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch {
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    const { error } = await authClient.signIn.email({
      email,
      password,
      rememberMe,
    });
    if (error) {
      return { error: error.message || error.code || "Invalid credentials" };
    }
    await refresh();
    return {};
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    const { data, error } = await authClient.signUp.email({
      name,
      email,
      password,
      role,
    });
    if (error) {
      return { error: error.message || error.code || "Registration failed" };
    }
    return { data };
  };

  const logout = async () => {
    await authClient.signOut();
    setUser(null);
    setSession(null);
  };

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    role: user?.role ?? null,
    login,
    register,
    logout,
    refresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
