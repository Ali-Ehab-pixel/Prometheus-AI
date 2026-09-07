"use client";

import React, { useState } from "react";
import { DatasetProfileData, HealthScoreBreakdown, Recommendation } from "../lib/types";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  BarChart3,
  Sparkles,
  Shield,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DatasetProfilerProps {
  profile: DatasetProfileData | null;
  healthScore: HealthScoreBreakdown | null;
  recommendations: Recommendation[] | null;
  onRecommendationApply?: (action: string, targetColumn?: string) => void;
}

export const DatasetProfiler: React.FC<DatasetProfilerProps> = ({
  profile,
  healthScore,
  recommendations,
  onRecommendationApply,
}) => {
  const [expandedIssues, setExpandedIssues] = useState(false);

  if (!profile || !healthScore) return null;

  const score = healthScore.overall_score;
  let scoreColor = "text-emerald-400";
  let strokeColor = "stroke-emerald-400";
  let glowColor = "shadow-emerald-500/20";
  if (score < 40) {
    scoreColor = "text-red-400";
    strokeColor = "stroke-red-400";
    glowColor = "shadow-red-500/20";
  } else if (score < 70) {
    scoreColor = "text-yellow-400";
    strokeColor = "stroke-yellow-400";
    glowColor = "shadow-yellow-500/20";
  } else if (score < 90) {
    scoreColor = "text-emerald-400"; // Or green
    strokeColor = "stroke-emerald-400";
    glowColor = "shadow-emerald-500/20";
  }

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-8">
      {/* Top Section: Health Score Ring & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Health Score Ring */}
        <div className={`col-span-1 flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded-2xl border border-slate-800 shadow-xl ${glowColor}`}>
          <h3 className="text-slate-300 font-semibold mb-4 flex items-center space-x-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            <span>Dataset Health</span>
          </h3>
          <div className="relative flex items-center justify-center">
            <svg className="transform -rotate-90 w-36 h-36">
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`${strokeColor} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${scoreColor}`}>{score}</span>
              <span className="text-xs text-slate-400 mt-1 font-bold">Grade {healthScore.grade}</span>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="col-span-1 md:col-span-2 flex flex-col justify-center space-y-4 p-6 bg-slate-950/60 rounded-2xl border border-slate-800">
          <h3 className="text-slate-300 font-semibold mb-2 flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            <span>Health Metrics Breakdown</span>
          </h3>
          {[
            { label: "Completeness", value: healthScore.completeness },
            { label: "Consistency", value: healthScore.consistency },
            { label: "Uniqueness", value: healthScore.uniqueness },
            { label: "Validity", value: healthScore.validity },
            { label: "Shape", value: healthScore.shape },
          ].map((metric) => (
            <div key={metric.label} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{metric.label}</span>
                <span className="text-slate-200 font-mono">{metric.value}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${
                    metric.value < 40 ? "bg-red-400" : metric.value < 70 ? "bg-yellow-400" : "bg-emerald-400"
                  }`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Rows", value: profile.row_count.toLocaleString(), icon: <Activity className="h-3.5 w-3.5" /> },
          { label: "Columns", value: profile.col_count, icon: <BarChart3 className="h-3.5 w-3.5" /> },
          { label: "Memory Usage", value: `${profile.memory_usage_mb.toFixed(2)} MB`, icon: <Zap className="h-3.5 w-3.5" /> },
          { label: "Duplicates", value: profile.duplicate_row_count, icon: <Shield className="h-3.5 w-3.5" /> },
          { label: "Total Nulls", value: profile.total_null_count, icon: <AlertTriangle className="h-3.5 w-3.5" /> },
          { label: "Null %", value: `${profile.total_null_percentage.toFixed(1)}%`, icon: <TrendingUp className="h-3.5 w-3.5" /> },
        ].map((stat, i) => (
          <div key={i} className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <span className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
              {stat.icon}
              <span>{stat.label}</span>
            </span>
            <span className="text-sm font-semibold text-slate-200">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Issues & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quality Issues */}
        <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 font-semibold flex items-center space-x-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span>Data Quality Issues ({healthScore.issues.length})</span>
            </h3>
            <button
              onClick={() => setExpandedIssues(!expandedIssues)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              <span>{expandedIssues ? "Collapse" : "Expand"}</span>
              {expandedIssues ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
          
          <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-64">
            {healthScore.issues.slice(0, expandedIssues ? undefined : 3).map((issue, i) => {
              const severityColor =
                issue.severity === "critical"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : issue.severity === "high"
                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  : issue.severity === "medium"
                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/20";
                  
              return (
                <div key={i} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">{issue.issue_type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border font-medium ${severityColor}`}>
                      {issue.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-400">{issue.description}</p>
                  {issue.column && <p className="text-slate-500 font-mono mt-1 pt-1 border-t border-slate-800/50">Col: {issue.column}</p>}
                </div>
              );
            })}
            {!expandedIssues && healthScore.issues.length > 3 && (
              <div className="text-center pt-2">
                <span className="text-xs text-slate-500 italic">+{healthScore.issues.length - 3} more issues...</span>
              </div>
            )}
            {healthScore.issues.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8 space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-500/40" />
                <span>No major issues found!</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 flex flex-col">
          <h3 className="text-slate-300 font-semibold mb-4 flex items-center space-x-2 text-sm">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>AI Action Recommendations</span>
          </h3>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-64">
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 text-xs flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-indigo-300">{rec.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-400">
                        {rec.confidence}% Match
                      </span>
                    </div>
                    <p className="text-slate-400">{rec.reason}</p>
                  </div>
                  {onRecommendationApply && (
                    <button
                      onClick={() => onRecommendationApply(rec.action)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-medium transition-colors mt-1"
                    >
                      Apply
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                <span>No recommendations available.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Target Suggestions */}
      {profile.target_suggestions && profile.target_suggestions.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-300 flex items-center space-x-1.5">
              <Target className="h-4 w-4 text-indigo-400" />
              <span>Suggested Targets:</span>
            </span>
            {profile.target_suggestions.map((target, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
                {target}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
