"use client";

import React, { useState } from "react";
import {
  Table as TableIcon,
  Columns,
  Hash,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { DatasetMetadata } from "../lib/types";

interface DataPreviewProps {
  metadata: DatasetMetadata;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ metadata }) => {
  const [columnSearch, setColumnSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"head" | "schema">("head");

  const totalNulls = metadata.columns.reduce((acc, col) => acc + col.null_count, 0);

  const filteredColumns = metadata.columns.filter((c) =>
    c.name.toLowerCase().includes(columnSearch.toLowerCase())
  );

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-100">Dataset Metadata Footprint</h3>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {metadata.filename}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Lightweight schema footprint extracted for LangGraph agent context
          </p>
        </div>

        {/* 4 Stat Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400">Rows:</span>
            <span className="font-mono font-bold text-slate-100">{metadata.row_count.toLocaleString()}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400">Cols:</span>
            <span className="font-mono font-bold text-slate-100">{metadata.col_count}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400">Memory:</span>
            <span className="font-mono font-bold text-slate-100">{metadata.memory_usage_mb} MB</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400">Missing:</span>
            <span
              className={`font-mono font-bold ${
                totalNulls > 0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {totalNulls.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("head")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "head"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>First 5 Rows (df.head())</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schema")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "schema"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Schema & Dtypes ({metadata.columns.length})</span>
          </button>
        </div>

        {activeTab === "schema" && (
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search column..."
              value={columnSearch}
              onChange={(e) => setColumnSearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: df.head() preview table */}
      {activeTab === "head" && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300 font-semibold">
                <th className="py-2.5 px-3 text-slate-500 font-mono text-[10px] w-12 text-center">#</th>
                {metadata.columns.map((col) => (
                  <th key={col.name} className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <span>{col.name}</span>
                      <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {col.dtype}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-200">
              {metadata.head_rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 text-slate-500 text-center">{idx + 1}</td>
                  {metadata.columns.map((col) => {
                    const val = row[col.name];
                    const isNull = val === null || val === undefined;
                    return (
                      <td key={col.name} className="py-2 px-3 whitespace-nowrap">
                        {isNull ? (
                          <span className="text-rose-400/80 italic font-sans text-[10px]">null</span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Column Schema & Dtypes */}
      {activeTab === "schema" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredColumns.map((col) => (
            <div
              key={col.name}
              className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-200 truncate pr-2">{col.name}</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
                  {col.dtype}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Unique: <strong className="text-slate-200 font-mono">{col.unique_count}</strong></span>
                <span className="flex items-center space-x-1">
                  {col.null_count > 0 ? (
                    <span className="text-amber-400 flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{col.null_count} nulls</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>0 nulls</span>
                    </span>
                  )}
                </span>
              </div>

              {col.sample_values && col.sample_values.length > 0 && (
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  Samples: {col.sample_values.filter((v) => v !== null).slice(0, 3).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
