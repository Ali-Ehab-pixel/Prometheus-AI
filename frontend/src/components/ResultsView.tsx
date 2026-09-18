"use client";

import React, { useState, useRef } from "react";
import {
  Download,
  ExternalLink,
  Code2,
  Terminal,
  Clock,
  Sparkles,
  BarChart,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Wand2,
  FileCheck,
  Lightbulb,
  BookmarkCheck,
  FileJson,
} from "lucide-react";
import { ActionResponse, ColumnInfo } from "../lib/types";
import { getArtifactDownloadUrl } from "../lib/api";
import { CodeViewer } from "./CodeViewer";
import { ChartGallery } from "./ChartGallery";

interface ResultsViewProps {
  result: ActionResponse;
  fileId?: string;
  columns?: ColumnInfo[];
  targetColumn?: string;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  fileId,
  columns,
}) => {
  const [activeTab, setActiveTab] = useState<"result" | "code" | "logs">("result");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const downloadUrl = getArtifactDownloadUrl(result.artifact?.download_url);
  const fileType = result.artifact?.file_type?.toLowerCase() || "";
  const isImageViz = ["png", "jpg", "jpeg", "svg", "webp"].includes(fileType);
  const isHtmlViz = fileType === "html" || (result.action === "visualize" && !isImageViz);

  // Trigger Plotly client-side high-res PNG export from within the iframe
  const handleDownloadImage = () => {
    if (isImageViz && downloadUrl) {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = result.artifact?.filename || "visualization_plot.png";
      a.click();
      return;
    }

    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        const win = iframe.contentWindow as any;
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const plotEl =
          doc.querySelector(".plotly-graph-div") || doc.querySelector(".js-plotly-plot");

        if (plotEl && win.Plotly) {
          win.Plotly.downloadImage(plotEl, {
            format: "png",
            filename: "visualization_plot",
            height: 900,
            width: 1400,
            scale: 2,
          });
          return;
        }
      }
    } catch (e) {
      console.warn("Could not access iframe directly for PNG export:", e);
    }

    // Fallback: download the artifact directly
    if (downloadUrl && downloadUrl !== "#") {
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl backdrop-blur-xl">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            {result.success ? (
              <div className="h-7 w-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            ) : (
              <div className="h-7 w-7 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-sm">
                <AlertCircle className="h-4 w-4" />
              </div>
            )}
            <h3 className="text-base font-bold text-slate-100 tracking-tight">
              {result.action === "clean" && "Data Clean & Transform Pipeline Succeeded"}
              {result.action === "visualize" && "Interactive Visualization Generated"}
              {result.action === "insights" && "Automated Statistical Insights & Discoveries"}
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase font-semibold">
              {result.action}
            </span>
            {result.version_saved && (
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold flex items-center space-x-1">
                <BookmarkCheck className="h-3 w-3 text-emerald-400" />
                <span>Version {result.version_saved} Saved</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Script orchestrated via LangGraph and executed in an isolated sandbox environment.
          </p>
        </div>

        {/* Runtime & Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span>Execution:</span>
            <strong className="text-slate-200">{result.execution_time_seconds}s</strong>
          </div>

          {/* Visualization Download Controls */}
          {result.action === "visualize" ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
                title="Download graph as high-resolution PNG image"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Download Graph as Image (PNG)</span>
              </button>

              {result.artifact?.download_url && (
                <a
                  href={downloadUrl}
                  download={result.artifact.filename || "visualization.html"}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-all border border-slate-700 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isImageViz ? "Image" : "HTML"}</span>
                </a>
              )}
            </div>
          ) : (
            /* Clean & Predict Download Button */
            result.artifact?.download_url && (
              <a
                href={downloadUrl}
                download={result.artifact.filename}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download {result.artifact.filename || "dataset.csv"}</span>
              </a>
            )
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("result")}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-medium transition-all cursor-pointer ${
            activeTab === "result"
              ? "bg-indigo-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {result.action === "visualize" ? (
            <BarChart className="h-3.5 w-3.5" />
          ) : (
            <FileSpreadsheet className="h-3.5 w-3.5" />
          )}
          <span>
            {result.action === "visualize" ? "Interactive Visualization" : 
             result.action === "insights" ? "Insights & Discoveries" :
             "Cleaned Dataset Summary"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("code")}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-medium transition-all cursor-pointer ${
            activeTab === "code"
              ? "bg-indigo-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Generated Python Script</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg font-medium transition-all cursor-pointer ${
            activeTab === "logs"
              ? "bg-indigo-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Console Logs & Output</span>
        </button>
      </div>

      {/* TAB 1: Main Output Display */}
      {activeTab === "result" && (
        <div className="space-y-6">
          {/* ======================================================== */}
          {/* 1. VISUALIZATION OUTPUT CONTAINER                         */}
          {/* ======================================================== */}
          {result.action === "visualize" && (
            <ChartGallery
              primaryArtifact={result.artifact}
              artifacts={result.artifacts}
              stdout={result.stdout}
            />
          )}

          {/* ======================================================== */}
          {/* 2. CLEAN & TRANSFORM OUTPUT CONTAINER                    */}
          {/* ======================================================== */}
          {result.action === "clean" && (
            <div className="space-y-6">
              {/* Detailed Summary Card */}
              <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Wand2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-base">
                        Data Cleaning & Normalization Report
                      </h4>
                      <p className="text-xs text-slate-400">
                        Processed using Pandas and NumPy data engineering pipelines
                      </p>
                    </div>
                  </div>

                  {result.artifact?.download_url && (
                    <a
                      href={downloadUrl}
                      download={result.artifact.filename || "dataset.csv"}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Cleaned Dataset ({result.artifact.filename || "dataset.csv"})</span>
                    </a>
                  )}
                </div>

                {/* Structured Operations Log */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Detailed Summary of Changes:
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {result.stdout || "Dataset cleaned and normalized successfully. Duplicates removed, missing values imputed, column headers standardized."}
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* ======================================================== */}
          {/* 4. FIND INSIGHTS OUTPUT CONTAINER                        */}
          {/* ======================================================== */}
          {result.action === "insights" && (
            <div className="space-y-6">
              {/* Structured Insights Dashboard */}
              {result.insights_data && (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  {result.insights_data.executive_summary && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-amber-200 text-xs leading-relaxed space-y-1.5">
                      <div className="flex items-center space-x-2 font-bold text-amber-300">
                        <Lightbulb className="h-4 w-4" />
                        <span>Executive Summary</span>
                      </div>
                      <p className="text-slate-300">{result.insights_data.executive_summary}</p>
                    </div>
                  )}

                  {/* Key Insights Grid */}
                  {result.insights_data.key_insights && result.insights_data.key_insights.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Key Statistical Discoveries:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.insights_data.key_insights.map((item, idx) => {
                          let badgeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                          if (item.category === "anomaly") badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                          if (item.category === "correlation") badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                          if (item.category === "trend") badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                          if (item.category === "distribution") badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";

                          return (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-md hover:border-slate-700 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                  {item.category}
                                </span>
                                {item.metric && (
                                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                    {item.metric}
                                  </span>
                                )}
                              </div>
                              <h5 className="font-semibold text-slate-100 text-xs">{item.title}</h5>
                              <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Top Correlations & Anomalies Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.insights_data.top_correlations && result.insights_data.top_correlations.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                        <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-purple-400" />
                          <span>Strongest Feature Correlations</span>
                        </span>
                        <div className="space-y-2 text-xs">
                          {result.insights_data.top_correlations.slice(0, 5).map((corr, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80">
                              <span className="text-slate-300 font-mono truncate max-w-[200px]">
                                {corr.feature_x} ↔ {corr.feature_y}
                              </span>
                              <span className="font-mono font-bold text-purple-400">
                                {corr.correlation > 0 ? `+${corr.correlation.toFixed(3)}` : corr.correlation.toFixed(3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.insights_data.anomalies_detected && result.insights_data.anomalies_detected.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                        <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-rose-400" />
                          <span>Statistical Outliers & Deviations</span>
                        </span>
                        <div className="space-y-2 text-xs">
                          {result.insights_data.anomalies_detected.slice(0, 5).map((anom, idx) => (
                            <div key={idx} className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                              <div className="flex items-center justify-between font-mono">
                                <span className="text-slate-200 font-semibold">{anom.column}</span>
                                <span className="text-rose-400 font-bold">{anom.outlier_count} outliers</span>
                              </div>
                              <p className="text-[11px] text-slate-400">{anom.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Formatted Insights Report (from stdout) */}
              <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-base">
                        Comprehensive Insights & Patterns Report
                      </h4>
                      <p className="text-xs text-slate-400">
                        Statistical discovery analysis generated and computed in isolated sandbox
                      </p>
                    </div>
                  </div>

                  {result.artifact?.download_url && (
                    <a
                      href={downloadUrl}
                      download={result.artifact.filename || "output_insights.json"}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-semibold text-xs shadow-md shadow-amber-600/20"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Insights Report ({result.artifact.filename || "output_insights.json"})</span>
                    </a>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Detailed Statistical Findings:
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 text-amber-200/90 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {result.stdout || "Exploratory data insights extracted successfully."}
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      )}

      {/* TAB 2: Generated Python Code */}
      {activeTab === "code" && (
        <CodeViewer
          code={result.generated_code || "# No code generated"}
          title={`LangGraph Generated Python Script (${result.action})`}
        />
      )}

      {/* TAB 3: Console Logs */}
      {activeTab === "logs" && (
        <div className="rounded-2xl border border-slate-800 bg-[#090d16] p-5 font-mono text-xs text-slate-300 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-semibold text-slate-300 flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-indigo-400" />
              <span>Sandbox Console Log Stream</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                result.success
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              Exit Status: {result.success ? "0 (SUCCESS)" : "1 (ERROR)"}
            </span>
          </div>

          <div className="space-y-3">
            {result.stdout && (
              <div>
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block mb-1">
                  STDOUT:
                </span>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {result.stdout}
                </pre>
              </div>
            )}

            {result.stderr && (
              <div>
                <span className="text-[10px] text-rose-400 uppercase tracking-wider font-bold block mb-1">
                  STDERR:
                </span>
                <pre className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {result.stderr}
                </pre>
              </div>
            )}

            {result.error && (
              <div>
                <span className="text-[10px] text-rose-400 uppercase tracking-wider font-bold block mb-1">
                  ERROR:
                </span>
                <pre className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800 text-rose-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {result.error}
                </pre>
              </div>
            )}

            {!result.stdout && !result.stderr && !result.error && (
              <p className="text-slate-500 italic">No output logged.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
