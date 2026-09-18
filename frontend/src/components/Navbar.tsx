"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Activity,
  Cpu,
  Sparkles,
  Terminal,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Shield,
  History,
  FileText,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { checkBackendHealth } from "../lib/api";
import { HealthStatus } from "../lib/types";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  onOpenHistory?: () => void;
  onOpenReport?: () => void;
  hasActiveDataset?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHistory,
  onOpenReport,
  hasActiveDataset = false,
}) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await checkBackendHealth();
        setHealth(res);
      } catch (err) {
        console.warn("Backend currently unreachable or booting:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHealth();
    const interval = setInterval(loadHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                DataMorph AI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                LangGraph + E2B
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous AI Data Scientist Platform</p>
          </div>
        </Link>

        {/* Status Indicators, Model Pill, & Auth Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4 text-xs">
          {/* Active Model Indicator */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-slate-400">Model:</span>
            <span className="font-mono text-purple-300 font-medium truncate max-w-[180px]">
              {health?.primary_model || "qwen/qwen3-30b-a3b:free"}
            </span>
          </div>

          {/* Sandbox Status */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Terminal className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-slate-400">Sandbox:</span>
            <span className="font-medium text-slate-200">
              {health?.e2b_configured ? "E2B Cloud" : "Isolated Subprocess"}
            </span>
          </div>

          {/* Backend Status Dot */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Activity
              className={`h-3.5 w-3.5 ${
                health?.status === "online" ? "text-emerald-400 animate-pulse" : "text-amber-400"
              }`}
            />
            <span
              className={`font-semibold ${
                health?.status === "online" ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {health?.status === "online" ? "Online" : loading ? "Connecting..." : "Offline"}
            </span>
          </div>

          {/* Quick Action: Report Exporter */}
          {hasActiveDataset && onOpenReport && (
            <button
              type="button"
              onClick={onOpenReport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 font-semibold text-xs transition-all shadow-sm"
              title="Generate Executive Report"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export Report</span>
            </button>
          )}

          {/* Quick Action: Experiment History */}
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all shadow-sm"
              title="View Experiment & Analysis Run History"
            >
              <History className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Run History</span>
            </button>
          )}

          {/* User Auth Buttons or Profile Dropdown */}
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2.5 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
              >
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                  {userInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-semibold text-slate-200 text-xs truncate max-w-[110px]">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[110px]">
                    {user.job_title || "Analyst"}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <p className="font-bold text-slate-100 text-xs truncate">{user.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {user.country}
                    </span>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs font-medium"
                  >
                    <UserIcon className="h-4 w-4 text-indigo-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs font-medium"
                  >
                    <LayoutDashboard className="h-4 w-4 text-purple-400" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/subscription"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs font-medium"
                  >
                    <CreditCard className="h-4 w-4 text-emerald-400" />
                    <span>Subscription</span>
                  </Link>

                  <Link
                    href="/contact"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs font-medium"
                  >
                    <MessageSquare className="h-4 w-4 text-amber-400" />
                    <span>Contact Us</span>
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-xs font-medium"
                    >
                      <Shield className="h-4 w-4 text-rose-400" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <div className="border-t border-slate-800/80 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-xs font-medium text-left cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-semibold text-xs"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
