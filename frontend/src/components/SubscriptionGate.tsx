"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, CreditCard, Sparkles, ArrowRight, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SubscriptionGateProps {
  children: React.ReactNode;
  /** What action is being gated, e.g. "upload a dataset" */
  action?: string;
}

export function SubscriptionGate({ children, action = "use this feature" }: SubscriptionGateProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // If not authenticated, redirect to register
  if (!isAuthenticated) {
    return (
      <div
        onClick={() => router.push("/register")}
        className="cursor-pointer"
      >
        {children}
      </div>
    );
  }

  // Admin bypasses all checks
  if (user?.role === "admin") {
    return <>{children}</>;
  }

  // Check subscription status
  const hasActiveSubscription =
    user?.subscription_plan === "monthly" || user?.subscription_plan === "yearly";
  const hasFreeUses = (user?.free_uses_remaining ?? 0) > 0;

  if (hasActiveSubscription || hasFreeUses) {
    return <>{children}</>;
  }

  // No subscription and no free uses — show gate
  return (
    <>
      <div onClick={() => setShowModal(true)} className="cursor-pointer">
        {children}
      </div>

      {/* Subscription Required Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-amber-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Subscription Required</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              You&apos;ve used your free session. To continue to{" "}
              <strong className="text-slate-200">{action}</strong> and access all
              platform features, please subscribe to one of our plans.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
                <p className="text-xs text-slate-400 font-medium">Monthly</p>
                <p className="text-xl font-bold text-white">60 <span className="text-xs text-slate-400">EGP</span></p>
                <p className="text-[10px] text-slate-500">/month</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-center space-y-1">
                <p className="text-xs text-indigo-300 font-medium">Yearly</p>
                <p className="text-xl font-bold text-white">700 <span className="text-xs text-slate-400">EGP</span></p>
                <p className="text-[10px] text-indigo-400">Save ~3%</p>
              </div>
            </div>

            <Link
              href="/subscription"
              onClick={() => setShowModal(false)}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all"
            >
              <CreditCard className="h-4 w-4" />
              <span>View Subscription Plans</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              onClick={() => setShowModal(false)}
              className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 cursor-pointer"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
