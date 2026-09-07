"use client";

import React from "react";
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  HelpCircle,
  BarChart,
  Layers,
} from "lucide-react";
import { ExplainabilityData } from "../lib/types";

interface FeatureImportanceProps {
  explainability?: ExplainabilityData | null;
}

export const FeatureImportance: React.FC<FeatureImportanceProps> = ({
  explainability,
}) => {
  if (!explainability || !explainability.top_features || explainability.top_features.length === 0) {
    return null;
  }

  const { target_column, method, summary, top_features } = explainability;
  const maxImportance = Math.max(...top_features.map((f) => f.importance || 0), 1e-4);

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      {/* Header Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="h-11 w-11 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-base font-bold text-slate-100">
                Model Explainability & Feature Drivers
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono uppercase font-bold">
                {method}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluated contribution of individual features on target variable{" "}
              <span className="font-mono text-cyan-300 font-semibold">{target_column}</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1 text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Positive Driver</span>
          </span>
          <span className="flex items-center space-x-1 text-rose-400">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>Negative Driver</span>
          </span>
        </div>
      </div>

      {/* Summary Narrative */}
      {summary && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start space-x-3">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200 block mb-0.5">Key Model Insight:</span>
            <p>{summary}</p>
          </div>
        </div>
      )}

      {/* Feature Rankings Horizontal Bars */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-semibold text-slate-200 flex items-center space-x-2">
            <BarChart className="h-4 w-4 text-indigo-400" />
            <span>Ranked Feature Influence (Relative Weight %)</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Top {top_features.length} Features
          </span>
        </div>

        <div className="space-y-3.5">
          {top_features.map((feat, idx) => {
            const pct = Math.min(Math.max((feat.importance / maxImportance) * 100, 4), 100);
            const isPositive = feat.direction === "positive";
            const isNegative = feat.direction === "negative";

            return (
              <div key={feat.feature + idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-400 text-[11px] w-5 text-right">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-200">{feat.feature}</span>
                    {isPositive && (
                      <span className="p-0.5 rounded bg-emerald-500/20 text-emerald-400" title="Positive impact on prediction">
                        <TrendingUp className="h-3 w-3" />
                      </span>
                    )}
                    {isNegative && (
                      <span className="p-0.5 rounded bg-rose-500/20 text-rose-400" title="Negative impact on prediction">
                        <TrendingDown className="h-3 w-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="text-slate-400 text-[11px]">
                      raw: {feat.raw_score.toFixed(4)}
                    </span>
                    <span className="font-bold text-cyan-300">
                      {(feat.importance * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0
                        ? "bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500"
                        : "bg-gradient-to-r from-indigo-500 to-purple-600"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
