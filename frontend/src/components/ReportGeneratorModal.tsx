"use client";

import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  X,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { generateDatasetReport, getArtifactDownloadUrl } from "../lib/api";
import { ReportGenerateResponse } from "../lib/types";

interface ReportGeneratorModalProps {
  fileId: string;
  datasetName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  fileId,
  datasetName = "Dataset",
  isOpen,
  onClose,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<"html" | "xlsx">("html");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<ReportGenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedReport(null);

    try {
      const res = await generateDatasetReport(fileId, {
        file_id: fileId,
        format: selectedFormat,
        title: `Executive Data Science Report — ${datasetName}`,
      });

      if (res.success) {
        setGeneratedReport(res);
        // Automatically trigger download
        const url = getArtifactDownloadUrl(res.download_url);
        const link = document.createElement("a");
        link.href = url;
        link.download = res.filename;
        link.click();
      } else {
        setError(res.message || "Failed to generate report.");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Report Exporter</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100">Generate Executive Report</h3>
          <p className="text-xs text-slate-400">
            Export an autonomous data science report for <strong className="text-slate-300 font-mono">{datasetName}</strong>.
          </p>
        </div>

        {/* Format Selection Cards */}
        <div className="space-y-3">
          <div
            onClick={() => setSelectedFormat("html")}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start space-x-3.5 ${
              selectedFormat === "html"
                ? "bg-indigo-500/10 border-indigo-500 text-slate-100"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-sm">Executive HTML Report</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase">
                  Print to PDF Ready
                </span>
              </div>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Complete styled dashboard with health audits, schema statistics, and analysis history.
              </p>
            </div>
          </div>

          <div
            onClick={() => setSelectedFormat("xlsx")}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start space-x-3.5 ${
              selectedFormat === "xlsx"
                ? "bg-emerald-500/10 border-emerald-500 text-slate-100"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-sm">Multi-Sheet Excel (.xlsx)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                  5 Sheets
                </span>
              </div>
              <p className="text-slate-400 mt-1 leading-relaxed">
                Structured workbook with Summary, Issues, Column Profiles, Data Samples, and Logged Analyses.
              </p>
            </div>
          </div>
        </div>

        {/* Download Feedback State */}
        {generatedReport && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Report generated and downloaded!</span>
            </div>
            <a
              href={getArtifactDownloadUrl(generatedReport.download_url)}
              target="_blank"
              rel="noreferrer"
              className="font-bold underline flex items-center space-x-1"
            >
              <span>View</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating Report...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export {selectedFormat.toUpperCase()} Report</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
