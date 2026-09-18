"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Scale,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  UserCheck,
  Ban,
  Gavel,
  RefreshCw,
  Mail,
  ExternalLink,
  Calendar,
  Zap,
  Lock,
} from "lucide-react";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 bg-grid-pattern relative flex flex-col">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

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
                DataMorph AI
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Terms of Service
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
            <Scale className="h-3.5 w-3.5 text-indigo-400" />
            <span>Binding Agreement</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Terms &amp; Conditions
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center space-x-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Last updated: September 2026</span>
            </span>
            <span>•</span>
            <span className="text-indigo-400 font-medium">Governing Law: Arab Republic of Egypt</span>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-2">
            These Terms &amp; Conditions constitute a legally binding contract between you
            (&ldquo;User&rdquo;, &ldquo;Subscriber&rdquo;, or &ldquo;you&rdquo;) and DataMorph AI
            (&ldquo;DataMorph AI&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;).
            Please read these terms carefully before accessing or using our autonomous analytics platform.
          </p>
        </div>

        {/* Subscription & Free Trial Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-900/80 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Free Trial
              </span>
              <Zap className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-white">1 Free Session</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore automated cleaning, data profiling, AutoML models, and charts on your first dataset with zero commitment.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900/80 to-purple-950/40 border border-indigo-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Monthly Plan
              </span>
              <CreditCard className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white">
              60 EGP <span className="text-xs font-normal text-slate-400">/ month</span>
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full sandbox analytics, copilot assistance, recurring monthly billing, cancel anytime.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-pink-950/30 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
                Yearly Plan
              </span>
              <Sparkles className="h-4 w-4 text-pink-400" />
            </div>
            <p className="text-2xl font-black text-white">
              700 EGP <span className="text-xs font-normal text-slate-400">/ year</span>
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Annual plan offering discounted access for dedicated analysts and research teams.
            </p>
          </div>
        </div>

        {/* Section 1: Acceptance of Terms */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            By registering for an account, accessing, browsing, or utilizing the DataMorph AI
            application, you acknowledge that you have read, understood, and agreed to be legally
            bound by these Terms &amp; Conditions and our{" "}
            <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">
              Privacy Policy
            </Link>
            . If you are entering into this agreement on behalf of a company or other legal entity, you
            represent that you hold the requisite authority to bind such entity. If you disagree with
            any provision, you must immediately cease accessing the platform.
          </p>
        </section>

        {/* Section 2: Description of Service */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Zap className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">2. Description of Service</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            DataMorph AI is an autonomous, AI-powered data science platform. Our service orchestrates
            automated data profiling, missing value imputation, algorithmic cleaning, interactive Plotly
            visualizations, AutoML model selection, feature importance evaluation, and conversational
            copilot guidance. Code execution runs in isolated cloud microVM sandbox environments
            (powered by E2B or dedicated isolation containers).
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            We continuously refine and improve our analytics engine. Consequently, DataMorph AI
            reserves the right to update, modify, or enhance system capabilities, models, and interfaces
            at its reasonable discretion.
          </p>
        </section>

        {/* Section 3: User Accounts & Registration */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <UserCheck className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">3. User Accounts &amp; Registration</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            To unlock platform capabilities, you must register for an account with accurate and current
            information (including your full name and a valid email address). You are responsible for:
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300 list-disc list-inside marker:text-indigo-500">
            <li>Maintaining the absolute confidentiality of your login credentials and passwords.</li>
            <li>All activities and data processing jobs initiated through your authenticated account.</li>
            <li>
              Promptly notifying DataMorph AI at <code className="text-indigo-300">support@datamorph.ai</code> if
              you suspect any breach of security or unauthorized account use.
            </li>
          </ul>
        </section>

        {/* Section 4: Subscription Terms */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">4. Subscription Terms &amp; Billing</h2>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-indigo-300">
                A. Pricing &amp; Currency
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                DataMorph AI offers recurring subscription tiers denominated in Egyptian Pounds (EGP):
              </p>
              <ul className="text-xs text-slate-300 list-disc list-inside space-y-1 marker:text-indigo-400">
                <li>
                  <strong className="text-white">Monthly Subscription:</strong> 60 EGP per month, billed
                  recurringly at the commencement of each monthly billing cycle.
                </li>
                <li>
                  <strong className="text-white">Yearly Subscription:</strong> 700 EGP per year, billed
                  recurringly in advance on an annual basis.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <h3 className="text-xs sm:text-sm font-semibold text-indigo-300">
                B. Automated Billing &amp; Invoicing
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                By purchasing a subscription, you authorize DataMorph AI (and its authorized payment
                gateways) to automatically charge your designated payment method for the applicable fee on
                each recurring renewal date unless cancelled prior to renewal.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <h3 className="text-xs sm:text-sm font-semibold text-indigo-300">
                C. Cancellation Policy
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You may cancel your recurring subscription at any time through your Profile dashboard or
                by contacting support. Upon cancellation, your subscription will remain active until the
                end of your current paid billing period, and no further renewal charges will occur.
                Except where mandated by applicable Egyptian consumer protection laws, subscription fees
                are non-refundable and partial-month refunds are not granted.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Free Trial */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Clock className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">5. Free Trial Policy</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            DataMorph AI provides new registered users with{" "}
            <strong className="text-white">one (1) free analysis session</strong>.
          </p>
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-200 space-y-1.5">
            <p className="font-semibold text-indigo-300">Free Session Scope</p>
            <p className="text-slate-300 leading-relaxed">
              The free trial session permits the user to upload one dataset, trigger automated cleaning,
              generate exploratory profile metrics, build charts, and test AutoML pipelines.
            </p>
            <p className="text-slate-400 leading-relaxed pt-1">
              Following the conclusion of this single session, an active paid subscription (Monthly 60 EGP
              or Yearly 700 EGP) is required to upload additional files or initiate subsequent sandboxed
              analytics runs. Attempting to circumvent the one-session limit through multiple accounts is
              a material violation of these Terms.
            </p>
          </div>
        </section>

        {/* Section 6: Acceptable Use */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Ban className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">6. Acceptable Use</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            You agree to use DataMorph AI exclusively for lawful data science, business intelligence,
            and computational analytics purposes. You must NOT:
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300 list-disc list-inside marker:text-rose-400">
            <li>
              Deploy, inject, or run malicious code, viruses, trojans, or cryptocurrency miners within our
              sandbox execution runtimes.
            </li>
            <li>
              Attempt to probe, scan, breach, or escape sandbox container virtualizations or backend APIs.
            </li>
            <li>
              Reverse engineer, decompile, disassemble, or derive the source code of the DataMorph AI
              proprietary workflow engines.
            </li>
            <li>
              Upload datasets containing illicit content, malware payloads, or data obtained in direct
              violation of intellectual property or privacy statutes.
            </li>
            <li>
              Resell, redistribute, or create automated proxies of DataMorph AI without prior written
              authorization.
            </li>
          </ul>
        </section>

        {/* Section 7: Intellectual Property */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">7. Intellectual Property</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <h3 className="text-xs sm:text-sm font-semibold text-indigo-300">Your Intellectual Property</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You retain complete, unencumbered ownership and intellectual property rights in all
                datasets uploaded by you, as well as all analytical outputs, derived metrics, machine
                learning weights, charts, and generated Python cleaning scripts produced on your behalf.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <h3 className="text-xs sm:text-sm font-semibold text-indigo-300">DataMorph AI Property</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The DataMorph AI name, logos, UI designs, LangGraph workflows, frontend components,
                algorithms, documentation, and underlying proprietary software remain the exclusive
                intellectual property of DataMorph AI.
              </p>
            </div>
          </div>
        </section>

        {/* Section 8: Data Privacy Reference */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Lock className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">8. Data Privacy</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Your privacy is integral to our relationship. As detailed extensively in our{" "}
            <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">
              Privacy Policy
            </Link>
            , DataMorph AI guarantees that{" "}
            <strong className="text-white">We Do Not Review Your Data</strong>. We do not inspect,
            audit, analyze, or share any datasets uploaded by users, nor do we employ user datasets to
            train public AI foundation models. Please review the full{" "}
            <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">
              Privacy Policy
            </Link>{" "}
            for complete technical specifications on data handling.
          </p>
        </section>

        {/* Section 9: Limitation of Liability */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">9. Limitation of Liability</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            To the maximum extent permitted by applicable law, in no event shall DataMorph AI, its
            founders, directors, or employees be liable for any indirect, punitive, incidental,
            special, or consequential damages (including loss of business profits, data corruption, or
            operational downtime) arising out of or in connection with the use or inability to use the
            platform, even if advised of the possibility of such damages. In all circumstances,
            DataMorph AI&rsquo;s aggregate liability shall not exceed the total fees paid by you to
            DataMorph AI during the preceding twelve (12) months.
          </p>
        </section>

        {/* Section 10: Disclaimer of Warranties */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">10. Disclaimer of Warranties</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            DataMorph AI is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis
            without warranties of any kind, whether express or implied. Machine learning predictions,
            automated cleaning suggestions, and AI copilot interpretations are computational estimates
            and should not be treated as formal financial, medical, or legal counsel. You bear sole
            responsibility for verifying analytical outcomes before making high-stakes decisions.
          </p>
        </section>

        {/* Section 11: Termination */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <RefreshCw className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">11. Termination</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            You may terminate your account at any time by requesting deletion or discontinuing use.
            DataMorph AI reserves the right to suspend or terminate access immediately, without prior
            notice, if you breach any term of this agreement (including fraudulent payments, sandbox
            abuse, or malicious actions). Upon termination, your right to use the platform ceases
            immediately.
          </p>
        </section>

        {/* Section 12: Governing Law */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Gavel className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">12. Governing Law &amp; Jurisdiction</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            These Terms &amp; Conditions, and any disputes, claims, or controversies arising out of or
            relating to your use of DataMorph AI, shall be governed by, interpreted, and construed in
            accordance with the <strong className="text-white">Laws of the Arab Republic of Egypt</strong>.
            Any legal dispute shall be submitted to the exclusive jurisdiction of the competent courts of
            Cairo, Egypt.
          </p>
        </section>

        {/* Section 13: Contact Information */}
        <section className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center space-x-2.5 text-indigo-400">
            <Mail className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">13. Contact Information</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            If you have questions, inquiries, or require formal notices regarding these Terms &amp;
            Conditions, please reach out to our legal and support team:
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-slate-200">DataMorph AI Legal Affairs</p>
              <p className="text-slate-400">Email: legal@datamorph.ai &bull; Cairo, Egypt</p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-medium text-xs shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Contact Legal Team</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Related Privacy Link Card */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
          <span>Need details on how we isolate and protect your data?</span>
          <Link
            href="/privacy"
            className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            <span>Read Privacy Policy</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 px-4 sm:px-8 mt-12 text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">DataMorph AI Platform</span>
            <span>&bull;</span>
            <span>Terms &amp; Conditions</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/" className="hover:text-slate-300 transition-colors">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">
              Contact
            </Link>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3 text-center sm:text-left text-[11px] text-slate-600">
          &copy; 2026 DataMorph AI. All rights reserved. Last updated September 2026.
        </div>
      </footer>
    </div>
  );
}
