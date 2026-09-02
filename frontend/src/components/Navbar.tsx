"use client";

import React, { useEffect, useState } from "react";
import { Activity, Cpu, Sparkles, Terminal } from "lucide-react";
import { checkBackendHealth } from "../lib/api";
import { HealthStatus } from "../lib/types";

export const Navbar: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
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
            <p className="text-xs text-slate-400">Autonomous Tabular AI Analyst Platform</p>
          </div>
        </div>

        {/* Status Indicators & Model Pill */}
        <div className="flex items-center space-x-4 text-xs">
          {/* Active Model Indicator */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-slate-400">Model:</span>
            <span className="font-mono text-purple-300 font-medium">
              {health?.primary_model || "nvidia/nemotron-3.5-lightning:free"}
            </span>
          </div>

          {/* Sandbox Status */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
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
        </div>
      </div>
    </header>
  );
};
