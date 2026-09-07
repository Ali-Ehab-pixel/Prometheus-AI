"use client";

import React, { useState, useRef } from "react";
import {
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Sparkles,
  Layers,
  BarChart3,
  Check,
} from "lucide-react";
import { ArtifactInfo } from "../lib/types";
import { getArtifactDownloadUrl } from "../lib/api";

interface ChartGalleryProps {
  primaryArtifact?: ArtifactInfo | null;
  artifacts?: ArtifactInfo[];
  stdout?: string | null;
}

export const ChartGallery: React.FC<ChartGalleryProps> = ({
  primaryArtifact,
  artifacts = [],
  stdout,
}) => {
  // Filter for visual artifacts (html, images)
  const vizArtifacts = (artifacts.length > 0 ? artifacts : primaryArtifact ? [primaryArtifact] : []).filter(
    (a) => ["html", "png", "jpg", "jpeg", "svg", "webp"].includes(a.file_type.toLowerCase())
  );

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeArtifact = vizArtifacts[selectedIdx] || primaryArtifact;
  const downloadUrl = activeArtifact ? getArtifactDownloadUrl(activeArtifact.download_url) : "#";
  const fileType = activeArtifact?.file_type?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "svg", "webp"].includes(fileType);

  const handleDownloadImage = () => {
    if (isImage && downloadUrl && downloadUrl !== "#") {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = activeArtifact?.filename || "visualization_plot.png";
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
            filename: activeArtifact?.filename?.replace(/\.html$/i, "") || "visualization_plot",
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

    // Fallback
    if (downloadUrl && downloadUrl !== "#") {
      window.open(downloadUrl, "_blank");
    }
  };

  if (!activeArtifact) return null;

  return (
    <div className="space-y-4 w-full">
      {/* Multi-Chart Selector (if more than 1 visual artifact generated) */}
      {vizArtifacts.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1 shrink-0 mr-2">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>Generated Panels ({vizArtifacts.length}):</span>
          </span>
          {vizArtifacts.map((art, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
                selectedIdx === idx
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800"
              }`}
            >
              <BarChart3 className="h-3 w-3" />
              <span>{art.filename.replace(/^[a-f0-9-]+_/, "")}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Interactive Canvas */}
      <div
        className={`relative rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl transition-all ${
          isFullscreen ? "fixed inset-4 z-50 p-4 bg-slate-950 flex flex-col" : "h-[650px] w-full"
        }`}
      >
        {/* Floating Top Interactive Toolbar */}
        <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-xl">
          <button
            type="button"
            onClick={handleDownloadImage}
            className="flex items-center space-x-1.5 text-slate-200 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors font-medium cursor-pointer"
            title="Download Chart as High-Res PNG Image"
          >
            <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
            <span>Save PNG</span>
          </button>

          <div className="h-3.5 w-px bg-slate-700" />

          {downloadUrl && downloadUrl !== "#" && (
            <a
              href={downloadUrl}
              download={activeArtifact.filename}
              className="flex items-center space-x-1 text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Download raw file"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span>{isImage ? "PNG" : "HTML"}</span>
            </a>
          )}

          <div className="h-3.5 w-px bg-slate-700" />

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Fullscreen Canvas"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {downloadUrl && downloadUrl !== "#" && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              title="Open Dashboard in New Window"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* View Content: Image or Plotly HTML iframe */}
        {isImage ? (
          <div className="w-full h-full flex items-center justify-center p-6 bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={downloadUrl}
              alt="Visualization"
              className="max-h-full max-w-full rounded-xl object-contain shadow-lg"
            />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            srcDoc={activeArtifact.html_content || undefined}
            src={!activeArtifact.html_content ? downloadUrl : undefined}
            className="w-full h-full border-0 rounded-2xl"
            title="Interactive Visual Dashboard"
            sandbox="allow-scripts allow-same-origin allow-downloads"
          />
        )}
      </div>

      {/* Visual Analysis Takeaways (from stdout) */}
      {stdout && (
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2.5 shadow-md">
          <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Visual Analytics & Pattern Insights</span>
          </div>
          <pre className="text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
            {stdout}
          </pre>
        </div>
      )}
    </div>
  );
};
