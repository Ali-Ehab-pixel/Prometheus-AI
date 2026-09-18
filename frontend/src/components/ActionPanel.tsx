"use client";

import React, { useState } from "react";
import {
  Sparkles,
  BarChart3,
  Play,
  Loader2,
  Wand2,
  SlidersHorizontal,
  FileCode2,
  Lightbulb
} from "lucide-react";
import { ActionRequest, ActionResponse, ActionType, DatasetMetadata, OutputFormat } from "../lib/types";
import { triggerDataAction } from "../lib/api";

interface ActionPanelProps {
  fileId: string;
  metadata: DatasetMetadata;
  onActionStart: (action: ActionType) => void;
  onActionSuccess: (res: ActionResponse) => void;
  onActionError: (err: string) => void;
  isRunning: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  fileId,
  metadata,
  onActionStart,
  onActionSuccess,
  onActionError,
  isRunning,
}) => {
  const [selectedAction, setSelectedAction] = useState<ActionType>("clean");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("csv");

  const handleExecute = async () => {
    if (isRunning) return;

    onActionStart(selectedAction);

    const payload: ActionRequest = {
      file_id: fileId,
      action: selectedAction,
      target_column: undefined,
      output_format: selectedAction === "visualize" ? "html" : (selectedAction === "insights" ? "json" : outputFormat),
    };

    try {
      const res = await triggerDataAction(payload);
      if (res.success) {
        onActionSuccess(res);
      } else {
        onActionError(res.error || "Action execution failed in sandbox.");
      }
    } catch (err: any) {
      console.error("Action execution error:", err);
      const detail = err.response?.data?.detail || err.message || "Failed to execute action.";
      onActionError(detail);
    }
  };

  const actionCards: {
    type: ActionType;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    agent: string;
    special?: boolean;
  }[] = [
    {
      type: "clean",
      title: "Clean & Transform",
      description: "Auto-impute missing values, remove duplicates, normalize dates, standard scale/encode.",
      icon: <Sparkles className="h-5 w-5" />,
      color: "from-emerald-600/20 to-teal-500/20 border-emerald-500/40 text-emerald-400",
      agent: "Data Engineer Agent (Pandas & Sklearn)",
    },
    {
      type: "visualize",
      title: "Generate Graphs",
      description: "Interactive Plotly EDA charts with correlation heatmaps, distributions, and trend lines.",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "from-blue-600/20 to-indigo-500/20 border-blue-500/40 text-blue-400",
      agent: "Visualization Agent (Plotly Express)",
    },
    {
      type: "insights",
      title: "Find Insights",
      description: "Discover hidden patterns, anomalies, and statistically significant correlations automatically.",
      icon: <Lightbulb className="h-5 w-5" />,
      color: "from-amber-600/20 to-yellow-500/20 border-amber-500/40 text-amber-400",
      agent: "Analyst Agent (Pandas Profiling)",
    }
  ];

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <Wand2 className="h-4 w-4 text-indigo-400" />
            <span>Select AI Analysis Action</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            LangGraph will route your dataset to the specialized agent to generate & execute code in the sandbox.
          </p>
        </div>
      </div>

      {/* 3 Prominent Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actionCards.map((card) => {
          const isSelected = selectedAction === card.type;
          
          let cardStyle = isSelected
            ? `bg-gradient-to-br ${card.color} shadow-lg shadow-indigo-500/5 scale-[1.02]`
            : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50";
            
          if (card.special && !isSelected) {
            cardStyle = "bg-slate-950/60 border-fuchsia-500/30 hover:border-fuchsia-500/60 hover:bg-fuchsia-900/10";
          }
            
          return (
            <div
              key={card.type}
              onClick={() => !isRunning && setSelectedAction(card.type)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 ${cardStyle} ${isRunning ? "opacity-60 pointer-events-none" : ""}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      isSelected ? "bg-slate-950 text-white" : (card.special ? "bg-fuchsia-500/10 text-fuchsia-400" : "bg-slate-800/80 text-slate-300")
                    }`}
                  >
                    {card.icon}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-950 text-white border border-slate-700">
                      Active
                    </span>
                  )}
                  {card.special && !isSelected && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
                      Pro
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-slate-100">{card.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{card.description}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-[10px] font-mono text-slate-400 truncate block">
                  {card.agent}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Specific Parameters & Refinement Prompt */}
      {selectedAction === "clean" && (
        <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 space-y-4 text-xs">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold">
            <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-400" />
            <span>Export Settings</span>
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Export File Format:</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              disabled={isRunning}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="csv">CSV (.csv)</option>
              <option value="xlsx">Excel (.xlsx)</option>
            </select>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          disabled={isRunning}
          onClick={handleExecute}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all shadow-lg ${
            isRunning
              ? "bg-slate-700 cursor-not-allowed opacity-80"
              : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-indigo-500/25 active:scale-95"
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Orchestrating Agents & Sandbox...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white" />
              <span>
                Run Pipeline
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
