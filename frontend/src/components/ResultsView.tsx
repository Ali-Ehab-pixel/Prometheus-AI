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
  TrendingUp,
  BrainCircuit,
  Wand2,
  Layers,
  FileCheck,
} from "lucide-react";
import { ActionResponse } from "../lib/types";
import { getArtifactDownloadUrl } from "../lib/api";
import { CodeViewer } from "./CodeViewer";

interface ResultsViewProps {
  result: ActionResponse;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ result }) => {
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
              {result.action === "predict" && "Machine Learning Forecast & Predictions Complete"}
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase font-semibold">
              {result.action}
            </span>
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
          ) : result.action === "predict" ? (
            <BrainCircuit className="h-3.5 w-3.5" />
          ) : (
            <FileSpreadsheet className="h-3.5 w-3.5" />
          )}
          <span>
            {result.action === "visualize" && "Interactive Visualization View"}
            {result.action === "predict" && "Model Forecast & Scores Dashboard"}
            {result.action === "clean" && "Cleaned Dataset & Changes Summary"}
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
            <div className="space-y-4">
              {/* Plotly Interactive Frame or Static Matplotlib/Seaborn Image */}
              {isImageViz && downloadUrl ? (
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center shadow-xl">
                  <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 px-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
                      <ImageIcon className="h-4 w-4 text-emerald-400" />
                      <span>Rendered Chart (Seaborn / Matplotlib / High-Res)</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PNG</span>
                    </button>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={downloadUrl}
                    alt="Visualization Output"
                    className="max-h-[600px] w-auto rounded-xl object-contain shadow-md"
                  />
                </div>
              ) : (
                <div
                  className={`relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl transition-all ${
                    isFullscreen ? "fixed inset-4 z-50 p-4 bg-slate-950 flex flex-col" : "h-[600px]"
                  }`}
                >
                  {/* Plotly Top Interactive Controls */}
                  <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-xl">
                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      className="flex items-center space-x-1.5 text-slate-200 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors font-medium cursor-pointer"
                      title="Download Plot as PNG Image"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Save PNG</span>
                    </button>
                    <div className="h-3.5 w-px bg-slate-700" />
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Toggle Fullscreen"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-3.5 w-3.5" />
                      ) : (
                        <Maximize2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {downloadUrl && downloadUrl !== "#" && (
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                        title="Open in new window"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Interactive Plotly iframe */}
                  <iframe
                    ref={iframeRef}
                    srcDoc={result.artifact?.html_content || undefined}
                    src={!result.artifact?.html_content ? downloadUrl : undefined}
                    className="w-full h-full border-0 rounded-xl"
                    title="Interactive Plotly Graph"
                    sandbox="allow-scripts allow-same-origin allow-downloads"
                  />
                </div>
              )}

              {/* Chart Insights Card */}
              {result.stdout && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
                    <Sparkles className="h-4 w-4" />
                    <span>Visual Analysis & Key Insights</span>
                  </div>
                  <pre className="text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                    {result.stdout}
                  </pre>
                </div>
              )}
            </div>
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
          {/* 3. PREDICT & FORECAST OUTPUT CONTAINER                   */}
          {/* ======================================================== */}
          {result.action === "predict" && (
            <div className="space-y-6">
              {/* Model Scores & Summary Dashboard */}
              <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-base">
                        Machine Learning Model Evaluation & Scores
                      </h4>
                      <p className="text-xs text-slate-400">
                        Automated feature engineering, model training, and predictions generation
                      </p>
                    </div>
                  </div>

                  {result.artifact?.download_url && (
                    <a
                      href={downloadUrl}
                      download={result.artifact.filename || "output_predictions.csv"}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Enriched Predictions ({result.artifact.filename || "output_predictions.csv"})</span>
                    </a>
                  )}
                </div>

                {/* Evaluation Scores Summary */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Detailed Model Performance & Metric Scores:
                  </span>
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 text-purple-200/90 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {result.stdout || "Model trained and evaluated successfully. Predictions and confidence probabilities appended to output_predictions.csv."}
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
