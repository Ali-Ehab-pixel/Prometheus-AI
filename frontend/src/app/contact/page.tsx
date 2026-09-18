"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Mail, MessageSquare, AlertCircle, CheckCircle2, FileText, Clock } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
}

export default function ContactPage() {
  const { user, isAuthenticated } = useAuth();
  
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('other');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  const getAxiosInstance = () => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('datamorph_auth_token') : null;
    return axios.create({
      baseURL: API_BASE,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  };

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const api = getAxiosInstance();
      const response = await api.get('/api/contact/my-tickets');
      setTickets(response.data.tickets || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.length < 10) {
      setError('Message must be at least 10 characters long.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    setSuccessTicketId(null);
    
    try {
      const api = getAxiosInstance();
      const payload = {
        subject,
        category,
        message,
        ...( !isAuthenticated && { email } )
      };
      const response = await api.post('/api/contact/submit', payload);
      setSuccessTicketId(response.data.ticket_id || 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase());
      setSubject('');
      setCategory('other');
      setMessage('');
      setEmail('');
      
      if (isAuthenticated) {
        fetchTickets();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit the form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'closed': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen bg-[#090d16] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4">
            <Mail className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-100">Contact Us</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Have a question, feedback, or need support? We're here to help. Fill out the form below and our team will get back to you.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {successTicketId ? (
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex items-center justify-center p-4 bg-green-500/10 rounded-full mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-100">Message Sent Successfully!</h3>
              <p className="text-slate-400">
                Thank you for reaching out. Your ticket ID is <span className="text-indigo-400 font-mono font-medium">{successTicketId}</span>
              </p>
              <button 
                onClick={() => setSuccessTicketId(null)}
                className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {!isAuthenticated && (
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-300">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Brief summary of your issue"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="block text-sm font-medium text-slate-300">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="category"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="account">Account Issue</option>
                    <option value="billing">Billing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-slate-300">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  placeholder="Please provide details..."
                />
                <p className="text-xs text-slate-500 text-right">
                  Minimum 10 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Previous Tickets Section */}
        {isAuthenticated && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              My Previous Tickets
            </h2>
            
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {isLoadingTickets ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  Loading tickets...
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Clock className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p>You haven't submitted any tickets yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/50">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 sm:p-6 hover:bg-slate-800/20 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-slate-500">{ticket.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                            {formatStatus(ticket.status)}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 capitalize">
                            {ticket.category}
                          </span>
                        </div>
                        <h4 className="text-slate-200 font-medium">{ticket.subject}</h4>
                      </div>
                      <div className="text-sm text-slate-500 whitespace-nowrap">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
