"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Database,
  BarChart3,
  CheckCircle,
  RotateCcw,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { FileUploader } from "../components/FileUploader";
import { DataPreview } from "../components/DataPreview";
import { ActionPanel } from "../components/ActionPanel";
import { ResultsView } from "../components/ResultsView";
import { ActionResponse, ActionType, UploadResponse } from "../lib/types";

export default function Home() {
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionType | null>(null);
  const [actionResult, setActionResult] = useState<ActionResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleUploadSuccess = (res: UploadResponse) => {
    setUploadData(res);
    setActionResult(null);
    setActionError(null);
  };

  const handleReset = () => {
    setUploadData(null);
    setActionResult(null);
    setActionError(null);
    setCurrentAction(null);
  };

  const handleActionStart = (action: ActionType) => {
    setIsRunning(true);
    setCurrentAction(action);
    setActionError(null);
  };

  const handleActionSuccess = (res: ActionResponse) => {
    setIsRunning(false);
    setActionResult(res);
  };

  const handleActionError = (err: string) => {
    setIsRunning(false);
    setActionError(err);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Title Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Multi-Agent Tabular AI Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            AI Data Analyst Platform
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Upload your dataset, extract schema footprints, and trigger specialized LangGraph agents
            that generate and execute Python data workflows in an isolated sandbox.
          </p>
        </div>

        {/* 3 Step Process Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div
            className={`p-3.5 rounded-xl border flex items-center space-x-3 transition-colors ${
              uploadData
                ? "bg-slate-900/40 border-emerald-500/30 text-emerald-400"
                : "bg-slate-900/70 border-slate-800 text-slate-300"
            }`}
          >
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <div className="font-semibold text-slate-200">Upload Dataset</div>
              <div className="text-[11px] text-slate-400">CSV, Excel, TXT, JSON</div>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center space-x-3 transition-colors ${
              uploadData && !actionResult
                ? "bg-slate-900/70 border-indigo-500/40 text-indigo-400"
                : uploadData && actionResult
                ? "bg-slate-900/40 border-emerald-500/30 text-emerald-400"
                : "bg-slate-900/40 border-slate-800/80 text-slate-500"
            }`}
          >
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <div className="font-semibold text-slate-200">Select Action</div>
              <div className="text-[11px] text-slate-400">Clean, Graph, or Predict</div>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center space-x-3 transition-colors ${
              actionResult
                ? "bg-slate-900/70 border-emerald-500/40 text-emerald-400"
                : "bg-slate-900/40 border-slate-800/80 text-slate-500"
            }`}
          >
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <div className="font-semibold text-slate-200">Execute & Inspect</div>
              <div className="text-[11px] text-slate-400">Plotly charts, CSV, Python</div>
            </div>
          </div>
        </div>

        {/* Section 1: File Uploader */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
              <Database className="h-4 w-4 text-indigo-400" />
              <span>Step 1: Ingest Tabular Data</span>
            </h2>

            {uploadData && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Upload Different Dataset</span>
              </button>
            )}
          </div>

          <FileUploader
            onUploadSuccess={handleUploadSuccess}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            currentFilename={uploadData?.original_filename}
            onReset={handleReset}
          />
        </section>

        {/* Section 2: Data Schema Footprint Preview */}
        {uploadData && (
          <section className="space-y-3 animate-in fade-in duration-300">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <span>Step 2: Extracted Dataset Schema & Preview</span>
            </h2>
            <DataPreview metadata={uploadData.metadata} />
          </section>
        )}

        {/* Section 3: Action Panel */}
        {uploadData && (
          <section className="space-y-3 animate-in fade-in duration-300">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Step 3: Trigger Multi-Agent Workflow</span>
            </h2>
            <ActionPanel
              fileId={uploadData.file_id}
              metadata={uploadData.metadata}
              onActionStart={handleActionStart}
              onActionSuccess={handleActionSuccess}
              onActionError={handleActionError}
              isRunning={isRunning}
            />
          </section>
        )}

        {/* Error Notification */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Execution Failed</strong>
              <p className="font-mono">{actionError}</p>
            </div>
          </div>
        )}

        {/* Section 4: Results View */}
        {actionResult && (
          <section className="space-y-3 animate-in fade-in duration-300">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Step 4: Output Artifacts & Execution Logs</span>
            </h2>
            <ResultsView result={actionResult} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-400">AI Data Analyst Platform</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Isolated Execution Sandbox</span>
            </span>
          </div>
          <p>Built with Next.js, LangGraph, OpenRouter (Nemotron 3.5 & Gemma), Pandas, and Plotly</p>
        </div>
      </footer>
    </div>
  );
}
