// Schmidt Construction Estimating Dashboard
// Location: src/app/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { Proposal, Project, Client, ProposalVersion } from '@/lib/types';
import {
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Plus,
  UserPlus,
  Calendar,
  AlertTriangle,
  Inbox,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
  HardHat
} from 'lucide-react';

interface QuoteRequest {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  service: string;
  details: string | null;
  status: 'pending' | 'contacted' | 'converted' | 'dismissed';
}

export default function Dashboard() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Statistics
  const [stats, setStats] = useState({
    totalPipeline: 0,
    acceptedValue: 0,
    sentValue: 0,
    draftValue: 0,
    acceptedCount: 0,
    sentCount: 0,
    draftCount: 0
  });

  const dismissQuote = async (id: string) => {
    const supabase = getSupabaseBrowser();
    await supabase.from('quote_requests').update({ status: 'contacted' }).eq('id', id);
    setQuoteRequests(prev => prev.filter(q => q.id !== id));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const propsData = await db.getProposals();
      const projData = await db.getProjects();
      const clientsData = await db.getClients();

      // Load pending quote requests from Supabase
      try {
        const supabase = getSupabaseBrowser();
        const { data } = await supabase
          .from('quote_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        if (data) setQuoteRequests(data as QuoteRequest[]);
      } catch { /* non-fatal */ }
      
      // Load all current versions for all proposals to compute values
      const versionsList: ProposalVersion[] = [];
      for (const p of propsData) {
        if (p.current_version_id) {
          const v = await db.getProposalVersion(p.current_version_id);
          if (v) versionsList.push(v);
        }
      }

      setProposals(propsData);
      setProjects(projData);
      setClients(clientsData);
      setVersions(versionsList);

      // Calculate statistics
      let totalPipeline = 0;
      let acceptedValue = 0;
      let sentValue = 0;
      let draftValue = 0;
      let acceptedCount = 0;
      let sentCount = 0;
      let draftCount = 0;

      propsData.forEach((p) => {
        const v = versionsList.find((ver) => ver.id === p.current_version_id);
        const val = v ? Number(v.total) : 0;
        
        totalPipeline += val;
        if (p.status === 'Accepted') {
          acceptedValue += val;
          acceptedCount++;
        } else if (p.status === 'Sent' || p.status === 'Viewed' || p.status === 'Revised') {
          sentValue += val;
          sentCount++;
        } else if (p.status === 'Draft') {
          draftValue += val;
          draftCount++;
        }
      });

      setStats({
        totalPipeline,
        acceptedValue,
        sentValue,
        draftValue,
        acceptedCount,
        sentCount,
        draftCount
      });
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getClientName = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return 'Unknown Client';
    const client = clients.find(c => c.id === proj.client_id);
    return client ? client.name : 'Unknown Client';
  };

  const getProjectName = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    return proj ? proj.name : 'Unknown Project';
  };

  const getProposalVersionTotal = (proposal: Proposal) => {
    const v = versions.find(ver => ver.id === proposal.current_version_id);
    return v ? `$${Number(v.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const getStatusBadge = (status: Proposal['status']) => {
    const styles = {
      Draft: 'bg-slate-100 text-slate-700 border-slate-200',
      Sent: 'bg-blue-50 text-blue-700 border-blue-200',
      Viewed: 'bg-purple-50 text-purple-700 border-purple-200',
      Revised: 'bg-amber-50 text-amber-700 border-amber-200',
      Accepted: 'bg-green-50 text-green-700 border-green-200',
      Rejected: 'bg-red-50 text-red-700 border-red-200',
      Expired: 'bg-gray-150 text-gray-500 border-gray-200'
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const getExpirationWarnings = () => {
    return proposals.filter(p => {
      if (p.status === 'Accepted' || p.status === 'Draft' || p.status === 'Expired') return false;
      if (!p.expiration_date) return false;
      const daysLeft = Math.ceil((new Date(p.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 3; // Expired or expiring within 3 days
    });
  };

  const warningProposals = getExpirationWarnings();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        <p className="mt-4 text-slate-500 text-sm font-medium">Loading estimate data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 text-white p-6 md:p-8 rounded-2xl premium-shadow border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-amber-500 text-sm font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Estimator Command Center</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Schmidt Construction Estimating
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage clients, build estimates, track client negotiations, and secure contracts.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/clients"
            className="flex items-center space-x-2 bg-slate-800 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-700 transition-colors text-sm font-semibold"
          >
            <UserPlus className="h-4 w-4" />
            <span>Clients & Projects</span>
          </Link>
          <Link
            href="/clients?action=new-proposal"
            className="flex items-center space-x-2 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl hover:bg-amber-600 transition-colors text-sm font-semibold accent-shadow"
          >
            <Plus className="h-4 w-4" />
            <span>New Estimate</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Pipeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 premium-shadow flex items-start justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
              Total Pipeline Value
            </span>
            <span className="text-2xl font-bold mt-1 block">
              {formatCurrency(stats.totalPipeline)}
            </span>
            <span className="text-xs text-slate-400 font-medium block mt-1.5">
              {proposals.length} active estimates
            </span>
          </div>
          <div className="bg-slate-100 p-2.5 rounded-xl text-slate-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Closed/Accepted */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 premium-shadow flex items-start justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
              Accepted Contracts
            </span>
            <span className="text-2xl font-bold mt-1 text-green-600 block">
              {formatCurrency(stats.acceptedValue)}
            </span>
            <span className="text-xs text-slate-400 font-medium block mt-1.5">
              {stats.acceptedCount} projects secured
            </span>
          </div>
          <div className="bg-green-50 p-2.5 rounded-xl text-green-600 border border-green-100">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Sent/Under Review */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 premium-shadow flex items-start justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
              Out for Review (Sent)
            </span>
            <span className="text-2xl font-bold mt-1 text-blue-600 block">
              {formatCurrency(stats.sentValue)}
            </span>
            <span className="text-xs text-slate-400 font-medium block mt-1.5">
              {stats.sentCount} awaiting signature
            </span>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 border border-blue-100">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 premium-shadow flex items-start justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
              Draft Estimates
            </span>
            <span className="text-2xl font-bold mt-1 text-slate-600 block">
              {formatCurrency(stats.draftValue)}
            </span>
            <span className="text-xs text-slate-400 font-medium block mt-1.5">
              {stats.draftCount} working files
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500 border border-slate-100">
            <FileText className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Expiration warning alerts panel */}
      {warningProposals.length > 0 && (
        <div className="bg-red-50/60 border border-red-200 rounded-2xl p-5 flex flex-col gap-4 text-xs font-semibold premium-shadow">
          <div className="flex items-center space-x-2 text-red-700 font-bold uppercase tracking-wider text-[10px]">
            <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0" />
            <span>Attention: Proposal Action Required</span>
          </div>
          <p className="text-slate-600 font-medium">
            The following estimates are expired or will expire in the next 3 days. Send reminders or extend expirations to secure customer sign-off.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {warningProposals.map(p => {
              const daysLeft = Math.ceil((new Date(p.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isExpired = daysLeft <= 0;
              
              return (
                <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between gap-3 hover:border-red-400 transition-colors">
                  <div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-900">{p.proposal_number}</span>
                      <span className={`px-2 py-0.5 rounded font-extrabold text-[8px] uppercase ${
                        isExpired ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isExpired ? 'Expired' : `${daysLeft} days left`}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 block mt-1.5">{getProjectName(p.project_id)}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Client: {getClientName(p.project_id)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span className="text-xs font-extrabold text-slate-900">{getProposalVersionTotal(p)}</span>
                    <Link
                      href={`/projects/${p.project_id}`}
                      className="text-[10px] text-amber-500 hover:text-amber-600 font-bold uppercase tracking-wider flex items-center"
                    >
                      <span>Manage</span>
                      <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending Quote Requests */}
      {quoteRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 premium-shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-amber-100 flex items-center justify-between bg-amber-50">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-xl">
                <Inbox className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Pending Quote Requests</h3>
                <p className="text-xs text-slate-500">Submitted via schmidtportals.netlify.app/quote — needs follow-up</p>
              </div>
            </div>
            <span className="text-xs font-semibold bg-amber-500 text-white px-2.5 py-1 rounded-full">
              {quoteRequests.length} pending
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {quoteRequests.map(q => (
              <div key={q.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{q.name}</span>
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">{q.service}</span>
                    <span className="text-xs text-slate-400">{new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {q.details && (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{q.details}</p>
                  )}
                  <div className="flex items-center gap-4 mt-1.5">
                    <a href={`tel:${q.phone.replace(/\D/g,'')}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                      <Phone className="h-3 w-3" />{q.phone}
                    </a>
                    {q.email && (
                      <a href={`mailto:${q.email}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                        <Mail className="h-3 w-3" />{q.email}
                      </a>
                    )}
                  </div>
                  {q.address && (
                    <div className="mt-1.5 text-xs text-slate-500 font-medium flex items-center gap-1">
                      <span className="text-slate-400">📍</span> {q.address}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/clients?action=new-proposal&name=${encodeURIComponent(q.name)}&phone=${encodeURIComponent(q.phone)}&email=${encodeURIComponent(q.email || '')}&service=${encodeURIComponent(q.service)}`}
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + New Estimate
                  </Link>
                  <button
                    onClick={() => dismissQuote(q.id)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    Mark Contacted
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Layout - Active Proposals & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Proposals List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 premium-shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Active Proposals</h3>
              <p className="text-xs text-slate-500">Track and manage recent construction proposals</p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {proposals.length} total
            </span>
          </div>

          {proposals.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">No proposals found.</p>
              <p className="text-slate-400 text-xs mt-1">Start by creating a client and starting a project.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Proposal No.</th>
                    <th className="px-6 py-3">Project & Client</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Estimate Total</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposals.map((prop) => (
                    <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        {prop.proposal_number}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800 block text-sm group-hover:text-amber-600 transition-colors">
                          {getProjectName(prop.project_id)}
                        </span>
                        <span className="text-xs text-slate-500 block">
                          Client: {getClientName(prop.project_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(prop.status)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-right whitespace-nowrap">
                        {getProposalVersionTotal(prop)}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link 
                          href={`/projects/${prop.project_id}`}
                          className="inline-flex items-center space-x-1 text-slate-400 group-hover:text-amber-600 text-xs font-semibold"
                        >
                          <span>Manage</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Information & Actions */}
        <div className="space-y-6">
          {/* Quick Info Box */}
          <div className="bg-slate-950 text-white p-6 rounded-2xl premium-shadow border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <HardHat className="h-32 w-32" />
            </div>
            
            <h4 className="font-extrabold text-lg text-white mb-2 flex items-center space-x-2">
              <span>Schmidt Construction Brand</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Our company emphasizes personal service, premium quality, and clear estimates. Proposals are version-locked. Every revision is preserved to secure customer alignment and avoid scope disputes.
            </p>
            <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Founded</span>
                <span className="font-semibold text-slate-200">1976 (50+ years)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Headquarters</span>
                <span className="font-semibold text-slate-200">Omaha, NE</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Services</span>
                <span className="font-semibold text-amber-500">Excavating, Concrete, Remodels</span>
              </div>
            </div>
          </div>

          {/* Quick Client Search Widget */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 premium-shadow">
            <h4 className="font-bold text-slate-900 mb-3">System Information</h4>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-700">Proposal Versioning Rule</p>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Always use the Proposal Builder to duplicate and revise proposals. Saved versions are **locked** and cannot be edited, maintaining an immutable audit history.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-xl border border-green-150 text-xs flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-700">Estimates Pipeline Value</p>
                  <p className="text-green-600 mt-0.5 leading-relaxed">
                    A total of {formatCurrency(stats.acceptedValue)} is signed. Keep pushing on the {formatCurrency(stats.sentValue)} currently out for client review!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
