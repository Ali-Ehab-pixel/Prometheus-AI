"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthResponse,
  LoginCredentials,
  OTPLoginResponse,
  OTPVerifyRequest,
  RegisterCredentials,
  UpdateProfilePayload,
  User,
} from "../lib/types";
import {
  getProfile,
  loginUser,
  logoutUserApi,
  registerUser,
  resendOTP,
  updateUserProfile,
  verifyOTP,
} from "../lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasActiveSubscription: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  verifyLoginOTP: (data: OTPVerifyRequest) => Promise<AuthResponse>;
  resendLoginOTP: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const storedToken = sessionStorage.getItem("datamorph_auth_token");
        if (storedToken) {
          setToken(storedToken);
          const profile = await getProfile();
          setUser(profile);
          sessionStorage.setItem("datamorph_auth_user", JSON.stringify(profile));
        }
      } catch (err) {
        console.warn("Failed to restore session from sessionStorage:", err);
        setToken(null);
        setUser(null);
        sessionStorage.removeItem("datamorph_auth_token");
        sessionStorage.removeItem("datamorph_auth_user");
      }
    }
    checkSession();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await loginUser(credentials);
    if (res.access_token && res.user) {
      setToken(res.access_token);
      setUser(res.user);
      sessionStorage.setItem("datamorph_auth_token", res.access_token);
      sessionStorage.setItem("datamorph_auth_user", JSON.stringify(res.user));
      localStorage.setItem("datamorph_has_registered", "true");
    }
    return res;
  };

  const verifyLoginOTP = async (data: OTPVerifyRequest): Promise<AuthResponse> => {
    // Step 2: Verify OTP and get token
    const res = await verifyOTP(data);
    if (res.access_token && res.user) {
      setToken(res.access_token);
      setUser(res.user);
      sessionStorage.setItem("datamorph_auth_token", res.access_token);
      sessionStorage.setItem("datamorph_auth_user", JSON.stringify(res.user));
      localStorage.setItem("datamorph_has_registered", "true");
    }
    return res;
  };

  const resendLoginOTP = async (credentials: LoginCredentials): Promise<{ success: boolean; message: string }> => {
    return await resendOTP(credentials);
  };

  const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const res = await registerUser(credentials);
    if (res.access_token && res.user) {
      setToken(res.access_token);
      setUser(res.user);
      sessionStorage.setItem("datamorph_auth_token", res.access_token);
      sessionStorage.setItem("datamorph_auth_user", JSON.stringify(res.user));
      localStorage.setItem("datamorph_has_registered", "true");
    }
    return res;
  };

  const updateProfile = async (payload: UpdateProfilePayload): Promise<User> => {
    const updated = await updateUserProfile(payload);
    setUser(updated);
    sessionStorage.setItem("datamorph_auth_user", JSON.stringify(updated));
    return updated;
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const profile = await getProfile();
      setUser(profile);
      sessionStorage.setItem("datamorph_auth_user", JSON.stringify(profile));
    } catch (err) {
      console.warn("Failed to refresh user profile:", err);
    }
  };

  const logout = async (): Promise<void> => {
    await logoutUserApi();
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("datamorph_auth_token");
    sessionStorage.removeItem("datamorph_auth_user");
    router.push("/login");
  };

  // Computed properties
  const isAdmin = user?.role === "admin";
  const hasActiveSubscription =
    isAdmin ||
    user?.subscription_plan === "monthly" ||
    user?.subscription_plan === "yearly" ||
    (user?.free_uses_remaining ?? 0) > 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        isAdmin,
        hasActiveSubscription,
        login,
        verifyLoginOTP,
        resendLoginOTP,
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
