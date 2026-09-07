"use client";

import React, { useState } from "react";
import {
  Sliders,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  RotateCcw,
} from "lucide-react";
import { ColumnInfo, PredictWhatIfResponse } from "../lib/types";
import { runPredictWhatIf } from "../lib/api";

interface PredictionSimulatorProps {
  fileId: string;
  columns: ColumnInfo[];
  targetColumn?: string;
}

export const PredictionSimulator: React.FC<PredictionSimulatorProps> = ({
  fileId,
  columns,
  targetColumn,
}) => {
  // Filter out target column and potential ID/timestamp columns
  const featureCols = columns
    .filter((col) => col.name !== targetColumn)
    .slice(0, 8); // top 8 features for simulator

  // Initial state for features
  const initialFeatures: Record<string, any> = {};
  featureCols.forEach((col) => {
    if (col.sample_values && col.sample_values.length > 0) {
      initialFeatures[col.name] = col.sample_values[0];
    } else {
      initialFeatures[col.name] = col.dtype.includes("int") || col.dtype.includes("float") ? 0 : "";
    }
  });

  const [features, setFeatures] = useState<Record<string, any>>(initialFeatures);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PredictWhatIfResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (colName: string, val: any) => {
    setFeatures((prev) => ({
      ...prev,
      [colName]: val,
    }));
  };

  const handlePredict = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const res = await runPredictWhatIf(fileId, {
        file_id: fileId,
        features,
      });

      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || "Prediction simulator failed.");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to execute inference.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setFeatures(initialFeatures);
    setResult(null);
    setError(null);
  };

  return (
    <div className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">
              Interactive What-If Scenario Simulator
            </h4>
            <p className="text-xs text-slate-400">
              Adjust feature inputs to simulate predictions with the trained pipeline in real-time.
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Inputs</span>
        </button>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
        {featureCols.map((col) => {
          const isNumeric = col.dtype.includes("int") || col.dtype.includes("float");
          const currentValue = features[col.name] !== undefined ? features[col.name] : "";

          return (
            <div key={col.name} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 truncate block">
                {col.name}
              </label>

              {isNumeric ? (
                <input
                  type="number"
                  step="any"
                  value={currentValue}
                  onChange={(e) =>
                    handleChange(col.name, e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                />
              ) : col.sample_values && col.sample_values.length > 0 ? (
                <select
                  value={currentValue}
                  onChange={(e) => handleChange(col.name, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                >
                  {col.sample_values.map((val, idx) => (
                    <option key={idx} value={String(val)}>
                      {String(val)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={currentValue}
                  onChange={(e) => handleChange(col.name, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Simulator Run Button */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
        <span className="text-[11px] text-slate-400">
          Target: <strong className="text-purple-300 font-mono">{targetColumn || "Outcome"}</strong>
        </span>

        <button
          onClick={handlePredict}
          disabled={isRunning}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Run Scenario Simulation</span>
            </>
          )}
        </button>
      </div>

      {/* Prediction Output Display */}
      {result && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider block">
              Simulated Prediction Outcome:
            </span>
            <div className="flex items-baseline space-x-3">
              <span className="text-2xl font-black text-slate-100 font-mono">
                {String(result.prediction)}
              </span>
              {result.confidence !== undefined && result.confidence !== null && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {(result.confidence * 100).toFixed(1)}% Confidence
                </span>
              )}
            </div>
          </div>

          {/* Probability Breakdown Chips if classification */}
          {result.probabilities && (
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(result.probabilities).map(([cls, prob]) => (
                <div key={cls} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
                  <span className="text-slate-400">{cls}: </span>
                  <strong className="text-cyan-300">{(prob * 100).toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
