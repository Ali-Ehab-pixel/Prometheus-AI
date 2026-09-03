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
  FileCode,
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
  const isHtmlViz = result.artifact?.file_type === "html" || result.action === "visualize";

  // Trigger Plotly client-side high-res PNG export from within the iframe
  const handleDownloadImage = () => {
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
            filename: "data_analysis_chart",
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

    // Fallback: alert or download the standalone HTML file
    if (downloadUrl && downloadUrl !== "#") {
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {result.success ? (
              <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            ) : (
              <div className="h-6 w-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle className="h-4 w-4" />
              </div>
            )}
            <h3 className="text-base font-semibold text-slate-100">
              {result.success ? "Analysis Execution Succeeded" : "Analysis Execution Warning"}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase font-semibold">
              {result.action}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Script orchestrated via LangGraph and executed safely in the isolated sandbox.
          </p>
        </div>

        {/* Runtime & Download Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span>Sandbox:</span>
            <strong className="text-slate-200 font-mono">{result.execution_time_seconds}s</strong>
          </div>

          {/* If Visualization: Provide Download PNG Image Button + Download HTML */}
          {isHtmlViz ? (
            <>
              <button
                type="button"
                onClick={handleDownloadImage}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95"
                title="Download high-resolution PNG image (1400x900)"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Download Graph as Image (PNG)</span>
              </button>

              {result.artifact?.download_url && (
                <a
                  href={downloadUrl}
                  download="visualization.html"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all border border-slate-700"
                  title="Download interactive HTML"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>HTML</span>
                </a>
              )}
            </>
          ) : (
            result.artifact?.download_url && (
              <a
                href={downloadUrl}
                download={result.artifact.filename}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download {result.artifact.filename}</span>
              </a>
            )
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("result")}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "result"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {isHtmlViz ? <BarChart className="h-3.5 w-3.5" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
          <span>{isHtmlViz ? "Interactive Chart View" : "Result Artifact"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("code")}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "code"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Generated Python Script</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === "logs"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Execution Output & Logs</span>
        </button>
      </div>

      {/* TAB 1: Visual Result / Artifact Card */}
      {activeTab === "result" && (
        <div className="space-y-4">
          {isHtmlViz && (result.artifact?.html_content || result.artifact?.download_url) ? (
            <div
              className={`relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden ${
                isFullscreen ? "fixed inset-4 z-50 p-4 shadow-2xl bg-slate-950" : "h-[580px]"
              }`}
            >
              {/* Plotly Frame Top Controls */}
              <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs shadow-lg">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="flex items-center space-x-1 text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                  title="Save Plot as PNG Image"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[11px] font-medium">Save PNG</span>
                </button>
                <div className="h-3 w-px bg-slate-700" />
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                  title="Open in new window"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Iframe with Plotly HTML */}
              <iframe
                ref={iframeRef}
                srcDoc={result.artifact?.html_content || undefined}
                src={!result.artifact?.html_content ? downloadUrl : undefined}
                className="w-full h-full border-0 rounded-xl"
                title="Interactive Plotly Visualization"
                sandbox="allow-scripts allow-same-origin allow-downloads"
              />
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <FileSpreadsheet className="h-8 w-8" />
              </div>
              <div className="max-w-md">
                <h4 className="font-semibold text-slate-100 text-base">
                  {result.artifact?.filename || "Processed Dataset"} Ready
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Your dataset was transformed and exported inside the isolated sandbox environment.
                </p>
              </div>

              {result.stdout && (
                <div className="w-full max-w-xl p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left font-mono text-[11px] text-slate-300">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
                    Execution Output & Summary:
                  </div>
                  <pre className="whitespace-pre-wrap">{result.stdout}</pre>
                </div>
              )}

              {result.artifact?.download_url && (
                <a
                  href={downloadUrl}
                  download={result.artifact.filename}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Output ({result.artifact.filename})</span>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Generated Python Code */}
      {activeTab === "code" && (
        <CodeViewer
          code={result.generated_code || "# No code generated"}
          title={`LangGraph Generated Script (${result.action})`}
        />
      )}

      {/* TAB 3: Terminal Logs */}
      {activeTab === "logs" && (
        <div className="rounded-xl border border-slate-800 bg-[#090d16] p-4 font-mono text-xs text-slate-300 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-slate-400 flex items-center space-x-1.5">
              <Terminal className="h-3.5 w-3.5 text-indigo-400" />
              <span>Sandbox Console Log Stream</span>
            </span>
            <span className="text-[10px] text-slate-500">
              Exit Code: {result.success ? "0 (SUCCESS)" : "1 (ERROR)"}
            </span>
          </div>

          <div className="space-y-2">
            {result.stdout && (
              <div>
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block mb-1">
                  STDOUT:
                </span>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-emerald-300/90 whitespace-pre-wrap leading-relaxed">
                  {result.stdout}
                </pre>
              </div>
            )}

            {result.stderr && (
              <div>
                <span className="text-[10px] text-rose-400 uppercase tracking-wider font-bold block mb-1">
                  STDERR / WARNINGS:
                </span>
                <pre className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300 whitespace-pre-wrap leading-relaxed">
                  {result.stderr}
                </pre>
              </div>
            )}

            {result.error && (
              <div>
                <span className="text-[10px] text-rose-400 uppercase tracking-wider font-bold block mb-1">
                  ERROR TRACE:
                </span>
                <pre className="p-3 rounded-lg bg-rose-950/30 border border-rose-800 text-rose-200 whitespace-pre-wrap leading-relaxed">
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
