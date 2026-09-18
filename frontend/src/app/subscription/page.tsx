"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, Info, AlertTriangle, Zap, CreditCard, HelpCircle } from 'lucide-react';
import { AuthGate } from '../../components/AuthGate';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

interface SubscriptionStatus {
  status: 'free' | 'active' | 'canceled' | 'past_due';
  plan: 'free' | 'monthly' | 'yearly';
  free_uses_remaining?: number;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

const features = [
  "Unlimited data uploads",
  "Unlimited AI analysis actions",
  "Advanced visualizations & charts",
  "AutoML model training",
  "AI Copilot assistant",
  "Executive report generation",
  "What-If prediction simulator",
  "Priority support"
];

const faqs = [
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period."
  },
  {
    question: "Is there a limit on file size for uploads?",
    answer: "Pro subscribers enjoy significantly higher upload limits (up to 500MB per dataset) compared to the free tier."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We are currently integrating local and international payment gateways to support credit/debit cards and e-wallets."
  },
  {
    question: "Do you offer refunds?",
    answer: "We do not offer partial refunds for mid-cycle cancellations, but you'll retain full access until the cycle ends."
  }
];

function SubscriptionContent() {
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const getAxiosInstance = () => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('datamorph_auth_token') : null;
    return axios.create({
      baseURL: API_BASE,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  };

  const fetchStatus = async () => {
    try {
      const api = getAxiosInstance();
      const response = await api.get('/api/subscription/status');
      setSubStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
      // Fallback for visual testing if api is down
      setSubStatus({ status: 'free', plan: 'free', free_uses_remaining: 3 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will keep access until the end of your billing period.')) {
      return;
    }
    
    setIsCanceling(true);
    setCancelError(null);
    try {
      const api = getAxiosInstance();
      await api.post('/api/subscription/cancel');
      await fetchStatus();
    } catch (err: any) {
      setCancelError(err.response?.data?.detail || 'Failed to cancel subscription.');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-2">
            <Zap className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100">
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Unlock all advanced features, unlimited analyses, and priority support to supercharge your data insights.
          </p>
        </div>

        {/* Status Banner */}
        {!isLoading && subStatus && (
          <div className="max-w-3xl mx-auto bg-slate-800/40 border border-slate-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
            <div>
              <h3 className="text-lg font-medium text-slate-200">Current Status</h3>
              <div className="mt-1 flex items-center gap-2">
                {subStatus.status === 'free' ? (
                  <span className="text-slate-400">
                    Free Plan • <span className="text-indigo-400 font-semibold">{subStatus.free_uses_remaining}</span> free uses remaining
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium capitalize">
                    {subStatus.plan} Plan ({subStatus.status})
                    {subStatus.cancel_at_period_end && ' - Cancels at period end'}
                  </span>
                )}
              </div>
            </div>
            
            {subStatus.status === 'active' && !subStatus.cancel_at_period_end && (
              <button
                onClick={handleCancel}
                disabled={isCanceling}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all disabled:opacity-50 text-sm font-medium"
              >
                {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
        )}

        {cancelError && (
          <div className="max-w-3xl mx-auto p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>{cancelError}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-slate-200 mb-2">Monthly Pro</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">60</span>
                <span className="text-slate-400 font-medium">EGP / month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              title="Payment integration coming soon"
              className="w-full bg-slate-800 text-slate-400 font-medium py-3.5 px-6 rounded-xl cursor-not-allowed border border-slate-700 flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <CreditCard className="w-5 h-5" />
              <span>Subscribe (Coming Soon)</span>
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="bg-gradient-to-b from-indigo-900/20 to-slate-900/50 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-8 shadow-2xl relative flex flex-col ring-1 ring-indigo-500/20">
            <div className="absolute top-0 right-8 -translate-y-1/2">
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                Save ~3%
              </span>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-indigo-300 mb-2">Yearly Pro</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">700</span>
                <span className="text-slate-400 font-medium">EGP / year</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              title="Payment integration coming soon"
              className="w-full bg-slate-800 text-slate-400 font-medium py-3.5 px-6 rounded-xl cursor-not-allowed border border-slate-700 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Subscribe (Coming Soon)</span>
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto pt-16">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <HelpCircle className="w-6 h-6 text-indigo-400" />
            <h2 className="text-2xl font-bold text-slate-100">Frequently Asked Questions</h2>
          </div>
          
          <div className="grid gap-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                <h4 className="text-lg font-medium text-slate-200 mb-2">{faq.question}</h4>
                <p className="text-slate-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <AuthGate>
      <SubscriptionContent />
    </AuthGate>
  );
}
