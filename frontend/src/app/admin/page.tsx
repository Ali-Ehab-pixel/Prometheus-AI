"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { AuthGate } from '../../components/AuthGate';
import axios from 'axios';
import {
  Users,
  CreditCard,
  MessageSquare,
  BarChart3,
  Activity,
  DollarSign,
  Search,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('datamorph_auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

type TabType = 'overview' | 'users' | 'tickets' | 'analytics';

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dataLoading, setDataLoading] = useState(true);

  // Overview State
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Tickets State
  const [tickets, setTickets] = useState<any[]>([]);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');

  // Analytics State
  const [analytics, setAnalytics] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== 'admin') {
        router.push('/');
      } else {
        fetchTabData(activeTab);
      }
    }
  }, [user, isLoading, activeTab, router]);

  const fetchTabData = async (tab: TabType) => {
    setDataLoading(true);
    try {
      const headers = getAuthHeaders();
      if (tab === 'overview') {
        const res = await axios.get(`${API_BASE}/api/admin/dashboard`, { headers });
        setDashboardData(res.data);
      } else if (tab === 'users') {
        const searchParam = userSearch ? `&search=${encodeURIComponent(userSearch)}` : '';
        const res = await axios.get(`${API_BASE}/api/admin/users?page=1&limit=20${searchParam}`, { headers });
        setUsers(res.data.users || res.data); // Adjust based on actual API response
      } else if (tab === 'tickets') {
        const res = await axios.get(`${API_BASE}/api/admin/tickets`, { headers });
        setTickets(res.data);
      } else if (tab === 'analytics') {
        const res = await axios.get(`${API_BASE}/api/admin/analyses?limit=50`, { headers });
        setAnalytics(res.data);
      }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'users') {
      fetchTabData('users');
    }
  };

  const banUser = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    try {
      await axios.delete(`${API_BASE}/api/admin/users/${userId}`, { headers: getAuthHeaders() });
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'banned' } : u));
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user');
    }
  };

  const handleTicketReply = async (ticketId: string) => {
    try {
      await axios.put(
        `${API_BASE}/api/admin/tickets/${ticketId}`,
        { reply: replyText, status: ticketStatus },
        { headers: getAuthHeaders() }
      );
      setReplyText('');
      fetchTabData('tickets');
      setExpandedTicket(null);
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket');
    }
  };

  if (isLoading || (user && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-[#090d16] text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Admin Dashboard
              </h1>
              <p className="text-slate-400 mt-1">Manage users, tickets, and monitor platform activity.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 border-b border-slate-800">
            {(['overview', 'users', 'tickets', 'analytics'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-6 font-medium text-sm transition-colors relative ${
                  activeTab === tab
                    ? 'text-indigo-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-indigo-500 rounded-t" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="min-h-[400px]">
            {dataLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <>
                {activeTab === 'overview' && dashboardData && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <StatCard icon={<Users />} title="Total Users" value={dashboardData.totalUsers} />
                      <StatCard icon={<CreditCard />} title="Active Subscriptions" value={dashboardData.activeSubscriptions} />
                      <StatCard icon={<MessageSquare />} title="Open Tickets" value={dashboardData.openTickets} />
                      <StatCard icon={<BarChart3 />} title="Analyses Today" value={dashboardData.analysesToday} />
                      <StatCard icon={<Activity />} title="Total Analyses" value={dashboardData.totalAnalyses} />
                      <StatCard icon={<DollarSign />} title="Monthly Revenue" value={`EGP ${dashboardData.monthlyRevenue || 0}`} />
                    </div>
                    {dashboardData.usersByPlan && (
                      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-medium text-slate-200 mb-4">Users by Plan</h3>
                        <div className="space-y-3">
                          {Object.entries(dashboardData.usersByPlan).map(([plan, count]) => (
                            <div key={plan} className="flex items-center justify-between">
                              <span className="capitalize text-slate-400">{plan}</span>
                              <span className="font-medium text-slate-200">{String(count)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="space-y-6">
                    <form onSubmit={handleUserSearch} className="flex gap-4">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors font-medium"
                      >
                        Search
                      </button>
                    </form>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-slate-800/50 text-slate-400">
                            <tr>
                              <th className="px-6 py-4 font-medium">Name</th>
                              <th className="px-6 py-4 font-medium">Email</th>
                              <th className="px-6 py-4 font-medium">Role</th>
                              <th className="px-6 py-4 font-medium">Plan</th>
                              <th className="px-6 py-4 font-medium">Status</th>
                              <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {users.map((u) => (
                              <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 text-slate-200">{u.name}</td>
                                <td className="px-6 py-4 text-slate-400">{u.email}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                                    u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-500/10 text-slate-400'
                                  }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                                    u.plan === 'yearly' ? 'bg-indigo-500/10 text-indigo-400' :
                                    u.plan === 'monthly' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'
                                  }`}>
                                    {u.plan || 'free'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`flex items-center gap-1.5 ${
                                    u.status === 'banned' ? 'text-red-400' : 'text-green-400'
                                  }`}>
                                    {u.status === 'banned' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                    <span className="capitalize">{u.status || 'active'}</span>
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {u.status !== 'banned' && u.role !== 'admin' && (
                                    <button
                                      onClick={() => banUser(u.id)}
                                      className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
                                    >
                                      Ban User
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {users.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                  No users found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'tickets' && (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                        <div
                          className="p-6 cursor-pointer hover:bg-slate-800/30 transition-colors flex items-center justify-between"
                          onClick={() => {
                            if (expandedTicket === ticket.id) {
                              setExpandedTicket(null);
                            } else {
                              setExpandedTicket(ticket.id);
                              setTicketStatus(ticket.status || 'open');
                            }
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div>
                              <h3 className="font-medium text-slate-200">{ticket.subject}</h3>
                              <p className="text-sm text-slate-400 mt-1">{ticket.userEmail} • {new Date(ticket.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2">
                              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md text-xs font-medium border border-slate-700">
                                {ticket.category}
                              </span>
                              <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                                ticket.status === 'closed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                ticket.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {ticket.status || 'open'}
                              </span>
                            </div>
                          </div>
                          {expandedTicket === ticket.id ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                        </div>
                        
                        {expandedTicket === ticket.id && (
                          <div className="p-6 border-t border-slate-800 bg-slate-900/50 space-y-6">
                            <div className="prose prose-invert max-w-none">
                              <p className="text-slate-300 whitespace-pre-wrap">{ticket.message}</p>
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                              <h4 className="font-medium text-slate-200">Reply & Update Status</h4>
                              <div className="flex flex-col sm:flex-row gap-4">
                                <select
                                  value={ticketStatus}
                                  onChange={(e) => setTicketStatus(e.target.value)}
                                  className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                  <option value="open">Open</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="closed">Closed</option>
                                </select>
                                <div className="flex-1 flex gap-2">
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply here..."
                                    className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2 min-h-[42px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
                                    rows={1}
                                  />
                                  <button
                                    onClick={() => handleTicketReply(ticket.id)}
                                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2 h-fit"
                                  >
                                    <Send className="w-4 h-4" />
                                    Update
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {tickets.length === 0 && (
                      <div className="text-center py-12 text-slate-500 bg-slate-900/80 border border-slate-800 rounded-2xl">
                        No support tickets found.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-800/50 text-slate-400">
                          <tr>
                            <th className="px-6 py-4 font-medium">Date</th>
                            <th className="px-6 py-4 font-medium">Action</th>
                            <th className="px-6 py-4 font-medium">File ID</th>
                            <th className="px-6 py-4 font-medium">Duration</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {analytics.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 text-slate-400">
                                {new Date(item.createdAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-slate-200 font-medium">{item.action}</td>
                              <td className="px-6 py-4 text-slate-500 font-mono text-xs">{item.fileId || '-'}</td>
                              <td className="px-6 py-4 text-slate-400">{item.durationMs ? `${item.durationMs}ms` : '-'}</td>
                              <td className="px-6 py-4">
                                {item.success ? (
                                  <span className="text-green-400 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Success</span>
                                ) : (
                                  <span className="text-red-400 flex items-center gap-1.5"><XCircle className="w-4 h-4"/> Failed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {analytics.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                No recent analyses found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string | number }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex items-start gap-4">
      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className="text-2xl font-semibold text-slate-200 mt-1">{value}</p>
      </div>
    </div>
  );
}
