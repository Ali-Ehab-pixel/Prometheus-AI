"use client";

import React, { useState } from "react";
import { Check, Copy, FileCode } from "lucide-react";

interface CodeViewerProps {
  code: string;
  title?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  title = "Generated Sandbox Python Script",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1117] overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-slate-300">
        <div className="flex items-center space-x-2 font-mono">
          <FileCode className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">{title}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[11px]">Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Block */}
      <div className="p-4 overflow-x-auto max-h-[420px] font-mono leading-relaxed text-slate-200">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
