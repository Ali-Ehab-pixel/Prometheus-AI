"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Database,
  BarChart3,
  CheckCircle,
  RotateCcw,
  AlertCircle,
  ShieldCheck,
  Zap,
  FileText,
  History,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { FileUploader } from "../components/FileUploader";
import { DataPreview } from "../components/DataPreview";
import { ActionPanel } from "../components/ActionPanel";
import { ResultsView } from "../components/ResultsView";
import { ActionResponse, ActionType, UploadResponse } from "../lib/types";
import { triggerDataAction } from "../lib/api";
import { AuthGate } from "../components/AuthGate";
import { DatasetProfiler } from "../components/DatasetProfiler";
import { AICopilot } from "../components/AICopilot";
import { ReportGeneratorModal } from "../components/ReportGeneratorModal";
import { ExperimentHistory } from "../components/ExperimentHistory";

export default function Home() {
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionType | null>(null);
  const [actionResult, setActionResult] = useState<ActionResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Phase 7 & 8: Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  const handleTriggerAction = async (action: string, targetCol?: string) => {
    if (!uploadData || isRunning) return;
    const act = action as ActionType;
    handleActionStart(act);
    try {
      const res = await triggerDataAction({
        file_id: uploadData.file_id,
        action: act,
        output_format: act === "visualize" ? "html" : (act === "insights" ? "json" : "csv"),
      });
      if (res.success) {
        handleActionSuccess(res);
      } else {
        handleActionError(res.error || "Action execution failed.");
      }
    } catch (err: any) {
      handleActionError(err.response?.data?.detail || err.message || "Failed to execute action.");
    }
  };

  const handleUploadSuccess = (res: UploadResponse) => {
    setUploadData(res);
    setProfileData(res.profile || null);
    setHealthScore(res.health_score || null);
    setRecommendations(res.recommendations || null);
    setActionResult(null);
    setActionError(null);
  };

  const handleReset = () => {
    setUploadData(null);
    setProfileData(null);
    setHealthScore(null);
    setRecommendations(null);
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
    <AuthGate>
      <div className="flex flex-col min-h-screen">
        <Navbar
          onOpenHistory={() => setIsHistoryDrawerOpen(true)}
          onOpenReport={() => setIsReportModalOpen(true)}
          hasActiveDataset={!!uploadData}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Hero Title Section */}
          <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-Powered Data Science & Analytics Platform</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              AI Data Scientist Platform
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Upload your dataset, extract schema footprints, and trigger specialized LangGraph agents
              that generate and execute Python data workflows in an isolated sandbox.
            </p>
          </div>

          {/* 4 Step Process Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
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
                <div className="font-semibold text-slate-200">Upload</div>
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
                <div className="font-semibold text-slate-200">Profile</div>
                <div className="text-[11px] text-slate-400">Health & Metrics</div>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border flex items-center space-x-3 transition-colors ${
                uploadData && !actionResult
                  ? "bg-slate-900/70 border-indigo-500/40 text-indigo-400"
                  : actionResult
                  ? "bg-slate-900/40 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-900/40 border-slate-800/80 text-slate-500"
              }`}
            >
              <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <div className="font-semibold text-slate-200">Analyze</div>
                <div className="text-[11px] text-slate-400">Multi-Agent Action</div>
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
                4
              </div>
              <div>
                <div className="font-semibold text-slate-200">Results</div>
                <div className="text-[11px] text-slate-400">Artifacts & Logs</div>
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
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center space-x-1.5 text-xs text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all font-semibold"
                    title="Generate Executive Report (HTML or Excel)"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Export Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsHistoryDrawerOpen(true)}
                    className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all font-semibold"
                    title="View Past Run & Experiment Audit Trail"
                  >
                    <History className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Run History</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Upload Different</span>
                  </button>
                </div>
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

          {/* Section 2: Dataset Profiler & Intelligence */}
          {uploadData && (
            <section className="space-y-6 animate-in fade-in duration-300">
              {profileData && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-indigo-400" />
                    <span>Step 2: Dataset Intelligence & Health Profile</span>
                  </h2>
                  <DatasetProfiler 
                    profile={profileData}
                    healthScore={healthScore}
                    recommendations={recommendations}
                    onRecommendationApply={handleTriggerAction}
                  />
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-indigo-400" />
                  <span>Dataset Rows & Schema Inspector</span>
                </h2>
                <DataPreview metadata={uploadData.metadata} />
              </div>
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
              <ResultsView
                result={actionResult}
                fileId={uploadData?.file_id}
                columns={uploadData?.metadata?.columns}
                targetColumn={uploadData?.metadata?.columns?.[0]?.name}
              />
            </section>
          )}

          {/* Conversational AI Data Scientist Copilot */}
          {uploadData && (
            <AICopilot
              fileId={uploadData.file_id}
              datasetName={uploadData.original_filename}
              onTriggerAction={handleTriggerAction}
            />
          )}

          {/* Phase 7: Executive Report Generator Modal */}
          {uploadData && (
            <ReportGeneratorModal
              fileId={uploadData.file_id}
              datasetName={uploadData.original_filename}
              isOpen={isReportModalOpen}
              onClose={() => setIsReportModalOpen(false)}
            />
          )}

          {/* Phase 8: Run & Experiment Audit History Drawer */}
          <ExperimentHistory
            isOpen={isHistoryDrawerOpen}
            onClose={() => setIsHistoryDrawerOpen(false)}
            fileId={uploadData?.file_id}
            datasetName={uploadData?.original_filename}
          />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-6 mt-12 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="font-semibold text-slate-400">Prometheus AI</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Isolated Execution Sandbox</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="/terms" className="hover:text-slate-300 transition-colors">Terms & Conditions</a>
              <span>•</span>
              <a href="/contact" className="hover:text-slate-300 transition-colors">Contact Us</a>
            </div>
          </div>
        </footer>
      </div>
    </AuthGate>
  );
}
