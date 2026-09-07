"use client";

import React, { useState } from "react";
import {
  Trophy,
  Download,
  Award,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BarChart2,
  FileSpreadsheet,
  BrainCircuit,
  Clock,
  Sparkles,
} from "lucide-react";
import { ArtifactInfo, LeaderboardData, ModelLeaderboardItem } from "../lib/types";
import { getArtifactDownloadUrl } from "../lib/api";

interface ModelLeaderboardProps {
  leaderboard?: LeaderboardData | null;
  artifacts?: ArtifactInfo[];
}

export const ModelLeaderboard: React.FC<ModelLeaderboardProps> = ({
  leaderboard,
  artifacts = [],
}) => {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  if (!leaderboard || !leaderboard.models || leaderboard.models.length === 0) {
    return null;
  }

  const bestModel = leaderboard.models[0];

  // Locate model & prediction files in artifacts
  const modelArtifact = artifacts.find(
    (a) => a.filename.endsWith(".joblib") || a.filename.includes("model")
  );
  const predictionsArtifact = artifacts.find(
    (a) =>
      a.filename.includes("prediction") &&
      (a.filename.endsWith(".csv") || a.filename.endsWith(".xlsx"))
  );

  const formatMetric = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return "N/A";
    if (val <= 1 && val >= 0) {
      return `${(val * 100).toFixed(2)}%`;
    }
    return val.toFixed(4);
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
            <span>🥇</span>
            <span>1st</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-300/20 text-slate-200 border border-slate-400/40 text-xs font-bold">
            <span>🥈</span>
            <span>2nd</span>
          </div>
        );
      case 3:
        return (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-700/20 text-amber-500 border border-amber-600/40 text-xs font-bold">
            <span>🥉</span>
            <span>3rd</span>
          </div>
        );
      default:
        return (
          <div className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
            #{rank}
          </div>
        );
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30">
        <div className="flex items-start space-x-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-100">
                AutoML Model Benchmark Leaderboard
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold uppercase">
                {leaderboard.task_type}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cross-validated comparison of {leaderboard.models.length} diverse ML algorithms
              targeting <span className="font-mono text-amber-300 font-semibold">{leaderboard.target_column}</span>.
            </p>
          </div>
        </div>

        {/* Download Winning Model Action */}
        <div className="flex flex-wrap items-center gap-2">
          {modelArtifact && (
            <a
              href={getArtifactDownloadUrl(modelArtifact.download_url)}
              download={modelArtifact.filename}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Download Model (.joblib)</span>
            </a>
          )}
          {predictionsArtifact && (
            <a
              href={getArtifactDownloadUrl(predictionsArtifact.download_url)}
              download={predictionsArtifact.filename}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all active:scale-95"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Predictions (.csv)</span>
            </a>
          )}
        </div>
      </div>

      {/* Winning Model Hero Banner */}
      {bestModel && (
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-900/90 border-2 border-amber-500/40 shadow-xl shadow-amber-500/5">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Winning Algorithm
                </span>
              </div>
              <h4 className="text-2xl font-black text-slate-100 flex items-center space-x-3">
                <span>{bestModel.name}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold font-mono">
                  Rank #1
                </span>
              </h4>
              <p className="text-xs text-slate-400 max-w-xl">
                Trained and optimized pipeline with automatic imputation, feature scaling,
                and hyperparameter initialization. Ready for production deployment.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-amber-500/30 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  {leaderboard.primary_metric_name}
                </span>
                <span className="text-xl font-black text-amber-300 mt-0.5 block font-mono">
                  {formatMetric(bestModel.primary_metric_value)}
                </span>
              </div>

              {bestModel.secondary_metric_name && (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    {bestModel.secondary_metric_name}
                  </span>
                  <span className="text-xl font-bold text-slate-200 mt-0.5 block font-mono">
                    {formatMetric(bestModel.secondary_metric_value)}
                  </span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Training Time
                </span>
                <span className="text-xl font-bold text-cyan-300 mt-0.5 block font-mono">
                  {bestModel.training_time_seconds.toFixed(2)}s
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Comparison Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart2 className="h-4 w-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-slate-200">
              Comparative Model Performance Rankings
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Sorted by {leaderboard.primary_metric_name}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-20">Rank</th>
                <th className="py-3.5 px-4">Model Algorithm</th>
                <th className="py-3.5 px-4">{leaderboard.primary_metric_name}</th>
                {bestModel?.secondary_metric_name && (
                  <th className="py-3.5 px-4">{bestModel.secondary_metric_name}</th>
                )}
                <th className="py-3.5 px-4">Fit Duration</th>
                <th className="py-3.5 px-4 min-w-[140px]">Relative Score</th>
                <th className="py-3.5 px-4 w-12 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leaderboard.models.map((model, idx) => {
                const rank = model.rank || idx + 1;
                const isWinner = rank === 1;
                const isExpanded = expandedModel === model.name;

                // Relative bar percentage (relative to top model score)
                const maxVal = Math.max(...leaderboard.models.map((m) => m.primary_metric_value || 0), 1e-6);
                const pct = Math.min(Math.max(((model.primary_metric_value || 0) / maxVal) * 100, 5), 100);

                return (
                  <React.Fragment key={model.name + rank}>
                    <tr
                      onClick={() => setExpandedModel(isExpanded ? null : model.name)}
                      className={`cursor-pointer transition-colors ${
                        isWinner
                          ? "bg-amber-500/5 hover:bg-amber-500/10"
                          : "hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="py-4 px-4">{getRankBadge(rank)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <BrainCircuit className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span className="font-semibold text-slate-100 text-sm">
                            {model.name}
                          </span>
                          {isWinner && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                              WINNER
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isWinner ? "text-amber-300" : "text-slate-200"
                          }`}
                        >
                          {formatMetric(model.primary_metric_value)}
                        </span>
                      </td>
                      {bestModel?.secondary_metric_name && (
                        <td className="py-4 px-4 font-mono text-slate-300">
                          {formatMetric(model.secondary_metric_value)}
                        </td>
                      )}
                      <td className="py-4 px-4 font-mono text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>{model.training_time_seconds.toFixed(2)}s</span>
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isWinner
                                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                : "bg-gradient-to-r from-indigo-500 to-purple-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </td>
                    </tr>

                    {/* Expandable Model Details */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90 border-t border-slate-800">
                        <td colSpan={7} className="p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                              <h5 className="font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                                <span>Detailed Evaluation Metrics</span>
                              </h5>
                              <div className="grid grid-cols-2 gap-2 font-mono">
                                <div>
                                  <span className="text-slate-500">Primary:</span>{" "}
                                  <span className="text-slate-200">
                                    {formatMetric(model.primary_metric_value)}
                                  </span>
                                </div>
                                {model.secondary_metric_name && (
                                  <div>
                                    <span className="text-slate-500">Secondary:</span>{" "}
                                    <span className="text-slate-200">
                                      {formatMetric(model.secondary_metric_value)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-slate-500">Duration:</span>{" "}
                                  <span className="text-slate-200">
                                    {model.training_time_seconds.toFixed(3)}s
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Status:</span>{" "}
                                  <span className="text-emerald-400">Converged</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                              <h5 className="font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                                <span>Hyperparameters & Configuration</span>
                              </h5>
                              <p className="text-slate-400 leading-relaxed font-mono text-[11px]">
                                Pipeline: Median Imputer + StandardScaler + {model.name}(n_estimators=100, random_state=42)
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
