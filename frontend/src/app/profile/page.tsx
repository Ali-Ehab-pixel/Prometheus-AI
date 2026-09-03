"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Phone,
  Globe2,
  Briefcase,
  Calendar,
  Sparkles,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Database,
  BarChart3,
  TrendingUp,
  Shield,
  Edit3,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Navbar } from "../../components/Navbar";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, updateProfile, logout } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhoneNumber(user.phone_number || "");
      setCountry(user.country || "");
      setJobTitle(user.job_title || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSaving(true);

    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        country: country.trim(),
        job_title: jobTitle.trim(),
      });
      setStatusMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      const msg = err.response?.data?.detail || err.message || "Failed to update profile.";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grid-pattern">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <span className="text-xs text-slate-400">Loading user profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get initials for avatar badge
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-grid-pattern">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out</span>
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar */}
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-1 shadow-xl shadow-indigo-500/20 flex items-center justify-center shrink-0">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center font-extrabold text-2xl tracking-wider text-indigo-300">
                {initials || "U"}
              </div>
            </div>

            {/* Profile Info Summary */}
            <div className="text-center sm:text-left space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">{user.full_name}</h1>
                <span className="px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  {user.job_title}
                </span>
              </div>

              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start space-x-4">
                <span className="flex items-center space-x-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{user.email}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1.5">
                  <Globe2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>{user.country}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Member since {user.created_at}</span>
                </span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-3 text-xs">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <span className="text-slate-400">Datasets Ingested</span>
                <div className="text-sm font-bold text-slate-100 font-mono">
                  {user.datasets_uploaded || 0}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-3 text-xs">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <span className="text-slate-400">Visualizations Rendered</span>
                <div className="text-sm font-bold text-slate-100 font-mono">
                  {user.analyses_performed || 0}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-3 text-xs">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <span className="text-slate-400">Sandbox Isolation</span>
                <div className="text-sm font-bold text-emerald-400 font-mono">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Profile Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
                <Edit3 className="h-4 w-4 text-indigo-400" />
                <span>Account Information</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your personal and professional profile details
              </p>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`flex items-center space-x-2.5 p-3.5 rounded-xl text-xs ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                </div>
              </div>

              {/* Email Address (Disabled for security) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">
                  Email Address <span className="text-[10px] text-slate-500">(Primary Identifier)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-400 cursor-not-allowed font-sans"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Country</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Globe2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                </div>
              </div>

              {/* Job Title / Role */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Current Job or Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end pt-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 active:scale-98 transition-all disabled:opacity-70 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
