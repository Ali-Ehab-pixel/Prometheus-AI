"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, Settings2 } from "lucide-react";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("datamorph_cookie_consent");
    if (!consent) {
      // Small delay for smoother UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("datamorph_cookie_consent", "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("datamorph_cookie_consent", "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-5 shadow-2xl shadow-black/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon & Text */}
          <div className="flex items-start space-x-3 flex-1">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Cookie className="h-4.5 w-4.5 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-100">
                We use cookies
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We use essential cookies for session management and preferences.
                By continuing to use DataMorph AI, you consent to our use of cookies.{" "}
                <Link
                  href="/privacy"
                  className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleDecline}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Accept Cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
