"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfilePayload,
  User,
} from "../lib/types";
import { getProfile, loginUser, logoutUserApi, registerUser, updateUserProfile } from "../lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = localStorage.getItem("datamorph_auth_token");
        const storedUser = localStorage.getItem("datamorph_auth_user");

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              // fallback to fetching
            }
          }
          // Verify & refresh profile with backend
          try {
            const profile = await getProfile();
            setUser(profile);
            localStorage.setItem("datamorph_auth_user", JSON.stringify(profile));
          } catch (e) {
            console.warn("Session token expired or backend offline:", e);
          }
        }
      } catch (err) {
        console.error("Error loading auth state:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await loginUser(credentials);
    if (res.access_token && res.user) {
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem("datamorph_auth_token", res.access_token);
      localStorage.setItem("datamorph_auth_user", JSON.stringify(res.user));
    }
    return res;
  };

  const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const res = await registerUser(credentials);
    if (res.access_token && res.user) {
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem("datamorph_auth_token", res.access_token);
      localStorage.setItem("datamorph_auth_user", JSON.stringify(res.user));
    }
    return res;
  };

  const updateProfile = async (payload: UpdateProfilePayload): Promise<User> => {
    const updated = await updateUserProfile(payload);
    setUser(updated);
    localStorage.setItem("datamorph_auth_user", JSON.stringify(updated));
    return updated;
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const profile = await getProfile();
      setUser(profile);
      localStorage.setItem("datamorph_auth_user", JSON.stringify(profile));
    } catch (err) {
      console.warn("Failed to refresh user profile:", err);
    }
  };

  const logout = async (): Promise<void> => {
    await logoutUserApi();
    setUser(null);
    setToken(null);
    localStorage.removeItem("datamorph_auth_token");
    localStorage.removeItem("datamorph_auth_user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        updateProfile,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
