"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  X,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  Sparkles,
  BarChart3,
  Wand2,
  BrainCircuit,
  Lightbulb,
  FileSpreadsheet,
  HelpCircle,
  Filter,
} from "lucide-react";
import { getAnalysisHistory, getArtifactDownloadUrl } from "../lib/api";
import { AnalysisHistoryItem } from "../lib/types";

interface ExperimentHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  fileId?: string;
  datasetName?: string;
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: React.FC<{ className?: string }>; color: string; bg: string; border: string }
> = {
  clean: {
    label: "Clean & Transform",
    icon: Wand2,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  visualize: {
    label: "Visualization",
    icon: BarChart3,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  predict: {
    label: "Regression / Forecast",
    icon: BrainCircuit,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  classify: {
    label: "Classification",
    icon: Target,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  automl: {
    label: "AutoML Leaderboard",
    icon: Sparkles,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
  insights: {
    label: "Automated Insights",
    icon: Lightbulb,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
  analyze_all: {
    label: "Full Pipeline",
    icon: Sparkles,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
  },
};

export const ExperimentHistory: React.FC<ExperimentHistoryProps> = ({
  isOpen,
  onClose,
  fileId,
  datasetName = "Current Dataset",
}) => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalysisHistory(fileId);
      setHistory(res.history || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to load experiment history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fileId]);

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    if (selectedFilter === "all") return true;
    return item.action.toLowerCase() === selectedFilter.toLowerCase();
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Experiment & Run History</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {history.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[280px]">
                Audit log for <span className="font-mono text-slate-300">{datasetName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
              title="Refresh History"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Close Drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/20 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          <span className="text-slate-500 text-[11px] font-semibold flex items-center mr-1">
            <Filter className="h-3 w-3 mr-1" /> Filter:
          </span>
          {["all", "clean", "visualize", "predict", "classify", "automl", "insights"].map((actionKey) => {
            const isSelected = selectedFilter === actionKey;
            return (
              <button
                key={actionKey}
                onClick={() => setSelectedFilter(actionKey)}
                className={`px-2.5 py-1 rounded-lg font-medium capitalize text-[11px] transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {actionKey}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && history.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
              <p className="text-xs">Loading experiment audit trail...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-950/30 border border-dashed border-slate-800 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                <History className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">No Experiment History Found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Runs from Clean, Visualize, Predict, AutoML, and Insights will automatically record here.
                </p>
              </div>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const config =
                ACTION_CONFIG[item.action.toLowerCase()] || {
                  label: item.action,
                  icon: Sparkles,
                  color: "text-slate-300",
                  bg: "bg-slate-800",
                  border: "border-slate-700",
                };
              const ActionIcon = config.icon;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`h-9 w-9 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center ${config.color}`}
                      >
                        <ActionIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-200">{config.label}</h4>
                          {item.success ? (
                            <span className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              <span>Success</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                              <AlertCircle className="h-2.5 w-2.5" />
                              <span>Failed</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[11px]">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>{item.execution_time_seconds.toFixed(2)}s</span>
                    </div>
                  </div>

                  {/* Metadata & Target */}
                  {(item.target_column || item.custom_prompt) && (
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-[11px] space-y-1">
                      {item.target_column && (
                        <div className="flex items-center space-x-1.5 text-slate-300">
                          <Target className="h-3 w-3 text-purple-400" />
                          <span className="text-slate-500">Target:</span>
                          <span className="font-mono font-semibold text-purple-300">
                            {item.target_column}
                          </span>
                        </div>
                      )}
                      {item.custom_prompt && (
                        <p className="text-slate-400 italic line-clamp-2">
                          &ldquo;{item.custom_prompt}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {/* Artifact Download Link */}
                  {item.artifact_filename && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/50 text-xs">
                      <span className="text-slate-500 font-mono text-[10px] truncate max-w-[240px]">
                        {item.artifact_filename}
                      </span>
                      <a
                        href={getArtifactDownloadUrl(`/api/artifacts/${item.artifact_filename}`)}
                        download={item.artifact_filename}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold text-[11px] transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
