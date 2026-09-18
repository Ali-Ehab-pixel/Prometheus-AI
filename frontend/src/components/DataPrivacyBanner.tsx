"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye } from "lucide-react";

export function DataPrivacyBanner() {
  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-2">
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold text-emerald-300">
          Your Data Stays Private
        </h3>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>
            DataMorph AI <strong className="text-slate-300">does not review, access, or share</strong> your uploaded datasets.
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-1.5 text-xs text-slate-500">
        <Eye className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span>
          Your data is processed locally and deleted when your session ends.{" "}
          <Link
            href="/privacy"
            className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
          >
            Read our Privacy Policy
          </Link>
        </span>
      </div>
    </div>
  );
}
