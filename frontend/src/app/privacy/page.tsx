"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Lock,
  EyeOff,
  Database,
  Server,
  FileText,
  Cookie,
  UserCheck,
  RefreshCw,
  Mail,
  Scale,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Shield,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 bg-grid-pattern relative flex flex-col">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Prometheus AI
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Legal
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-8 relative z-10">
        {/* Page Hero Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>Transparency & Data Security</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Privacy Policy
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center space-x-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Last updated: September 2026</span>
            </span>
            <span>•</span>
            <span className="text-indigo-400 font-medium">Applicable to all Prometheus AI users</span>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-2">
            At Prometheus AI, your privacy and analytical autonomy are our highest priorities. This
            Privacy Policy explains how we collect, handle, store, and protect your personal
            information and outlines our strict commitment to safeguarding your proprietary datasets.
          </p>
        </div>

        {/* ---------------------------------------------------- */}
        {/* PROMINENT HIGHLIGHT: WE DO NOT REVIEW YOUR DATA */}
        {/* ---------------------------------------------------- */}
        <section className="relative overflow-hidden rounded-2xl border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-purple-950/50 p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <div className="p-3.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/20">
              <EyeOff className="h-7 w-7 text-indigo-300" />
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
                Core Guarantee
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                We Do Not Review Your Data
              </h2>
              <p className="text-sm sm:text-base text-indigo-100/90 font-medium leading-relaxed">
                Prometheus AI does not access, review, analyze, or share any datasets uploaded by
                users. Your data remains entirely yours.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-950/60 border border-indigo-500/20 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Zero Human Eyes:</strong> No staff, developers, or operators ever inspect
                    or review your raw files or tabular datasets.
                  </span>
                </div>
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-950/60 border border-indigo-500/20 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>No Model Training:</strong> Your datasets and feature structures are
                    never used to train, adjust, or tune external foundation models.
                  </span>
                </div>
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-950/60 border border-indigo-500/20 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Isolated Sandboxes:</strong> Python operations and Pandas routines run in
                    isolated, short-lived sandbox compute instances.
                  </span>
                </div>
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-950/60 border border-indigo-500/20 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>100% User Ownership:</strong> All inputs, generated cleaning scripts,
                    plots, and AutoML metrics remain your exclusive intellectual property.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Introduction */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">1. Introduction</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Prometheus AI (&ldquo;Prometheus AI&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;)
            provides an autonomous AI-assisted data science and analytics platform. This Privacy Policy
            governs your use of our web application, tools, APIs, and associated services. By
            creating an account, uploading data, or utilizing Prometheus AI, you acknowledge and agree
            to the terms set forth in this policy.
          </p>
        </section>

        {/* Section 2: What Information We Collect */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Database className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">2. What Information We Collect</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We collect only the minimum necessary information required to operate, secure, and deliver
            our autonomous analytical services:
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <h3 className="text-xs sm:text-sm font-semibold text-indigo-300">
                A. Account & Registration Information
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When you register an account, we collect your full name, valid email address, and a
                securely hashed password. For paid subscribers, payment transaction references are
                logged through our payment processors (we do not store raw credit card numbers).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <h3 className="text-xs sm:text-sm font-semibold text-indigo-300">
                B. Usage & Telemetry Data
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We log technical operational telemetry including execution status, requested pipeline
                actions (e.g., automated cleaning, statistical profiling, AutoML training, interactive
                visualization generation), sandbox compute execution time, IP address, device/browser
                information, and system error traces for maintenance and fraud prevention.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <h3 className="text-xs sm:text-sm font-semibold text-indigo-300">
                C. Uploaded Datasets & Session Artifacts
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When you upload a dataset (such as CSV, XLSX, or Parquet), the file is placed into an
                isolated sandbox environment solely to perform user-instructed actions. As emphasized
                above, Prometheus AI treats your datasets as strictly confidential payloads and never
                inspects or reads their content outside of your explicit computational requests.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: How We Use Your Information */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Cpu className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">3. How We Use Your Information</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We use collected operational data strictly for the following purposes:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside marker:text-indigo-500">
            <li>
              <strong className="text-slate-200">Executing Data Analysis:</strong> Running user-requested
              LangGraph workflows, Python scripts, statistical profiling, and machine learning models in isolated sandboxes.
            </li>
            <li>
              <strong className="text-slate-200">Platform Authentication & Security:</strong> Authenticating your session,
              enforcing token quotas, and securing your account against unauthorized logins.
            </li>
            <li>
              <strong className="text-slate-200">Billing & Subscriptions:</strong> Managing subscription status (Monthly 60 EGP /
              Yearly 700 EGP), billing renewals, and trial usage enforcement.
            </li>
            <li>
              <strong className="text-slate-200">Service Reliability:</strong> Identifying software exceptions, memory spikes,
              and optimizing sandbox spin-up performance.
            </li>
            <li>
              <strong className="text-slate-200">Service Communication:</strong> Transmitting necessary transactional messages,
              password reset tokens, and security notices.
            </li>
          </ul>
        </section>

        {/* Section 4: Data Storage & Security */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Lock className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">4. Data Storage & Security</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We implement defense-in-depth technical and organizational controls to protect user data from
            unauthorized access, modification, or exposure:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs">
                <Shield className="h-4 w-4" />
                <span>TLS 1.3 In Transit</span>
              </div>
              <p className="text-xs text-slate-400">
                All communications between client and server are encrypted using modern TLS 1.3 cryptographic protocols.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs">
                <Server className="h-4 w-4" />
                <span>AES-256 Storage</span>
              </div>
              <p className="text-xs text-slate-400">
                Uploaded files and database records are encrypted at rest using industry-grade AES-256 standards.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs">
                <Cpu className="h-4 w-4" />
                <span>Isolated Sandboxes</span>
              </div>
              <p className="text-xs text-slate-400">
                Code execution takes place in isolated, ephemeral sandbox containers (e.g. E2B) preventing cross-tenant access.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Cookies */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Cookie className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">5. Cookies & Local Storage</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Prometheus AI uses essential cookies and local browser storage strictly for session
            management, authentication token persistence, and user preferences (such as dark mode theme
            settings and copilot view preferences).
          </p>
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-indigo-300">No Third-Party Advertising Trackers</p>
            <p className="text-slate-400">
              We do not use tracking pixels, behavioral advertising networks, or third-party ad brokers.
              Your activity within our analytical workspace is never sold or syndicated to advertisers.
            </p>
          </div>
        </section>

        {/* Section 6: Third-Party Services */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Server className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">6. Third-Party Services</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            To power autonomous AI operations and scalable compute, we interface with trusted
            infrastructure partners:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside marker:text-indigo-500">
            <li>
              <strong className="text-slate-200">E2B Sandbox Cloud:</strong> Provides hardware-isolated,
              short-lived microVMs for executing arbitrary Python scripts and Pandas transformations.
            </li>
            <li>
              <strong className="text-slate-200">AI Model Gateways (e.g., OpenRouter / Qwen / Gemma):</strong> Used
              to generate analytical code snippets and interpret high-level schema metadata. Raw dataset
              records are never sent for foundation model training.
            </li>
            <li>
              <strong className="text-slate-200">Payment Processors:</strong> Secure third-party gateways that
              process card and mobile wallet transactions under stringent PCI-DSS compliance.
            </li>
          </ul>
        </section>

        {/* Section 7: Your Rights */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <UserCheck className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">7. Your Rights & Data Controls</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Regardless of your jurisdiction, we uphold fundamental privacy rights for every user:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <h4 className="text-xs font-semibold text-indigo-300">Right to Access</h4>
              <p className="text-xs text-slate-400">
                You can review your profile information, subscription state, and historical analysis logs directly from your dashboard.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <h4 className="text-xs font-semibold text-indigo-300">Right to Deletion</h4>
              <p className="text-xs text-slate-400">
                You can request the immediate deletion of your account, uploaded datasets, and generated artifacts at any time.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <h4 className="text-xs font-semibold text-indigo-300">Right to Portability</h4>
              <p className="text-xs text-slate-400">
                Export your cleaned datasets, generated charts, trained model metrics, and code scripts in open standards (CSV, JSON, HTML).
              </p>
            </div>
          </div>
        </section>

        {/* Section 8: Data Retention */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <RefreshCw className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">8. Data Retention</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We retain your account profile as long as your Prometheus AI account is active. Uploaded
            datasets and sandbox artifacts are subject to our ephemeral data lifecycle: temporary sandbox
            scratch files are automatically destroyed following session completion or after 24 hours of
            inactivity unless explicitly saved to your persistent history. You may permanently clear
            your files at any time via your workspace.
          </p>
        </section>

        {/* Section 9: Changes to Privacy Policy */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Scale className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">9. Changes to Privacy Policy</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We may periodically update this Privacy Policy to reflect advancements in our technology,
            new platform features, or evolving regulatory standards. When updates occur, we will revise
            the &ldquo;Last updated&rdquo; timestamp at the top of this page and notify registered users
            via in-app notification or email in the event of any material revisions.
          </p>
        </section>

        {/* Section 10: Contact Information */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Mail className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">10. Contact Information</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            If you have any questions, concerns, or requests regarding this Privacy Policy, your personal
            data, or our security practices, please reach out to our privacy team directly:
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-slate-200">Prometheus AI Privacy & Compliance Office</p>
              <p className="text-slate-400">Email: support@datamorph.ai &bull; Cairo, Egypt</p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-medium text-xs shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Contact Support</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Related Links Card */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
          <span>Looking for our contractual usage conditions?</span>
          <Link
            href="/terms"
            className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            <span>Read Terms & Conditions</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 px-4 sm:px-8 mt-12 text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">Prometheus AI Platform</span>
            <span>&bull;</span>
            <span>Privacy Policy</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/" className="hover:text-slate-300 transition-colors">
              Home
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">
              Contact
            </Link>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3 text-center sm:text-left text-[11px] text-slate-600">
          &copy; 2026 Prometheus AI. All rights reserved. Last updated September 2026.
        </div>
      </footer>
    </div>
  );
}
