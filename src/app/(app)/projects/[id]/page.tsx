// Project Details, Version List, & Negotiation Timeline
// Location: src/app/projects/[id]/page.tsx

'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Project, Client, Proposal, ProposalVersion, NegotiationEvent, ProposalStatus } from '@/lib/types';
import {
  Briefcase,
  User,
  MapPin,
  Calendar,
  FileText,
  History,
  MessageSquare,
  Send,
  CheckCircle,
  Copy,
  Check,
  ArrowLeft,
  ChevronDown,
  Layers,
  Clock,
  Unlock,
  Eye,
  AlertCircle,
  Plus,
  Mail,
  ShieldAlert,
  FolderOpen
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id: projectId } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalVersions, setProposalVersions] = useState<Record<string, ProposalVersion[]>>({});
  const [proposalAuditLogs, setProposalAuditLogs] = useState<Record<string, any[]>>({});
  const [negotiationEvents, setNegotiationEvents] = useState<NegotiationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [expandedAuditProposal, setExpandedAuditProposal] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [selectedProposalForComment, setSelectedProposalForComment] = useState<string>('');
  
  // Status edit state
  const [updatingStatusProposalId, setUpdatingStatusProposalId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<ProposalStatus>('Draft');

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const proj = await db.getProject(projectId);
      if (!proj) {
        setProject(null);
        return;
      }
      setProject(proj);

      const clientInfo = await db.getClient(proj.client_id);
      setClient(clientInfo);

      const propsList = await db.getProjectProposals(projectId);
      setProposals(propsList);

      if (propsList.length > 0) {
        setExpandedProposal(propsList[0].id);
        setSelectedProposalForComment(propsList[0].id);

        // Fetch versions and negotiation events for all proposals
        const versionsMap: Record<string, ProposalVersion[]> = {};
        const auditLogsMap: Record<string, any[]> = {};
        let allEvents: NegotiationEvent[] = [];

        for (const p of propsList) {
          const versions = await db.getProposalVersions(p.id);
          versionsMap[p.id] = versions;

          const events = await db.getNegotiationEvents(p.id);
          allEvents = [...allEvents, ...events];

          // Fetch audits
          const audits = await db.getAuditLogs(p.id);
          auditLogsMap[p.id] = audits;
        }

        setProposalVersions(versionsMap);
        setProposalAuditLogs(auditLogsMap);
        
        // Sort negotiation events chronologically
        allEvents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setNegotiationEvents(allEvents);
      }
    } catch (e) {
      console.error('Error loading project details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const copyShareLink = (proposal: Proposal) => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const link = `${origin}/portal/${proposal.share_token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(proposal.id);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const handleStatusUpdateSubmit = async (proposalId: string) => {
    try {
      await db.updateProposalStatus(
        proposalId, 
        newStatus, 
        'owner', 
        `Proposal status manually updated to ${newStatus} by Estimator.`
      );
      setUpdatingStatusProposalId(null);
      await loadProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  const [emailingProposalId, setEmailingProposalId] = useState<string | null>(null);
  const [emailToast, setEmailToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setEmailToast({ type, message });
    setTimeout(() => setEmailToast(null), 5000);
  };

  const handleSendEmail = async (proposal: Proposal) => {
    if (!client) return;
    try {
      setEmailingProposalId(proposal.id);

      // Get Supabase session token if available (for server-side auth)
      let authToken: string | null = null;
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
        if (supabaseUrl && supabaseAnonKey) {
          const client = createClient(supabaseUrl, supabaseAnonKey);
          const { data } = await client.auth.getSession();
          authToken = data.session?.access_token ?? null;
        }
      } catch {
        // demo mode — no token
      }

      const res = await fetch('/api/proposals/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ proposalId: proposal.id }),
      });

      const json = await res.json();

      if (!res.ok) {
        // Demo mode: fall back to mailer simulation
        if (res.status === 503) {
          const pVersions = proposalVersions[proposal.id] || [];
          const activeVersion = pVersions.find(v => v.id === proposal.current_version_id);
          if (activeVersion) {
            await db.updateProposalStatus(proposal.id, 'Sent', 'owner', `Proposal sent to client email ${client.email}.`);
            const { mailer } = await import('@/lib/mailer');
            await mailer.sendProposalEmail({
              toEmail: client.email,
              clientName: client.name,
              proposalNumber: proposal.proposal_number,
              projectTitle: activeVersion.title,
              shareToken: proposal.share_token,
            });
            showToast('success', `Demo mode: email simulated for ${client.email}. Check terminal logs.`);
            await loadProjectData();
          }
          return;
        }
        showToast('error', json.error ?? 'Failed to send email.');
        return;
      }

      showToast('success', `Proposal email sent to ${json.sentTo}`);
      await loadProjectData();
    } catch (e) {
      console.error(e);
      showToast('error', 'Unexpected error while sending email.');
    } finally {
      setEmailingProposalId(null);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedProposalForComment) return;

    try {
      const activeProposal = proposals.find(p => p.id === selectedProposalForComment);
      const currentVerId = activeProposal?.current_version_id || null;

      await db.createNegotiationEvent({
        proposal_id: selectedProposalForComment,
        proposal_version_id: currentVerId,
        sender_type: 'owner',
        message: commentText.trim(),
        requested_changes: ''
      });

      setCommentText('');
      await loadProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  const reviseProposalDirectly = (proposal: Proposal) => {
    // Navigate to editor with duplicate flag
    router.push(`/proposals/${proposal.id}/edit?revise=true`);
  };

  const getStatusBadge = (status: ProposalStatus) => {
    const styles = {
      Draft: 'bg-slate-100 text-slate-700 border-slate-200',
      Sent: 'bg-blue-50 text-blue-700 border-blue-200',
      Viewed: 'bg-purple-50 text-purple-700 border-purple-200',
      Revised: 'bg-amber-50 text-amber-700 border-amber-200',
      Accepted: 'bg-green-50 text-green-700 border-green-200',
      Rejected: 'bg-red-50 text-red-700 border-red-200',
      Expired: 'bg-gray-100 text-gray-500 border-gray-200'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        <p className="mt-4 text-slate-500 text-sm">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 premium-shadow">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-lg">Project Not Found</h3>
        <p className="text-slate-500 text-sm mt-1">The project you are looking for does not exist or has been deleted.</p>
        <Link href="/" className="mt-4 inline-flex items-center text-amber-500 font-semibold text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email toast notification */}
      {emailToast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-4 rounded-xl shadow-xl border text-sm font-semibold transition-all ${
          emailToast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {emailToast.type === 'success'
            ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
            : <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}
          <span>{emailToast.message}</span>
        </div>
      )}

      {/* Breadcrumb Back */}
      <Link href="/clients" className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold no-print">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Clients directory</span>
      </Link>

      {/* Main Title Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 premium-shadow p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Client Profile: <span className="font-semibold text-slate-700">{client?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Project Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            project.status === 'Active' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {project.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Project & Proposal Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details Info */}
          <div className="bg-white rounded-2xl border border-slate-200 premium-shadow p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Project Specification</h3>
            
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {project.description || 'No detailed specifications entered yet.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
              <div className="flex items-center space-x-2.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-xs text-slate-400 block">Job Site Address</span>
                  <span className="font-medium text-slate-800">{project.job_site_address || 'Same as client billing'}</span>
                </div>
              </div>
              {project.desired_start_date && (
                <div className="flex items-center space-x-2.5">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 block">Desired Start Date</span>
                    <span className="font-medium text-slate-800">{project.desired_start_date}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Proposals List Card */}
          <div className="bg-white rounded-2xl border border-slate-200 premium-shadow overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                <FileText className="h-5 w-5 text-amber-500" />
                <span>Estimate Proposal Packages</span>
              </h3>
              
              <Link
                href={`/proposals/new?project_id=${project.id}`}
                className="flex items-center space-x-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Package</span>
              </Link>
            </div>

            {proposals.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">No estimates generated yet</p>
                <p className="text-xs text-slate-400 mt-1">Draft a proposal to send a cost estimate breakdown to the client.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {proposals.map((prop) => {
                  const pVersions = proposalVersions[prop.id] || [];
                  const activeVersion = pVersions.find(v => v.id === prop.current_version_id);
                  const isExpanded = expandedProposal === prop.id;

                  return (
                    <div key={prop.id} className="p-6 space-y-4">
                      {/* Proposal Header Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-bold text-lg text-slate-900">{prop.proposal_number}</span>
                            {getStatusBadge(prop.status)}
                          </div>
                          {activeVersion && (
                            <p className="text-sm font-medium text-slate-600">
                              Active Version: <span className="text-slate-900 font-semibold">{activeVersion.title} (V{activeVersion.version_number})</span>
                            </p>
                          )}
                        </div>

                        {/* Cost total */}
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Estimate Value</span>
                          <span className="text-xl font-bold text-slate-900">
                            {activeVersion ? `$${Number(activeVersion.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions for Current Version */}
                      <div className="flex flex-wrap gap-2.5 border-t border-slate-150 pt-4">
                        {activeVersion && (
                          <Link
                            href={`/proposals/${prop.id}/edit`}
                            className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg transition-colors border border-slate-200"
                          >
                            <span>Open Builder</span>
                          </Link>
                        )}
                        <button
                          onClick={() => reviseProposalDirectly(prop)}
                          className="flex items-center space-x-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-lg transition-colors border border-amber-600"
                        >
                          <span>Draft Revision (V{(activeVersion?.version_number || 0) + 1})</span>
                        </button>
                        {pVersions.length > 1 && (
                          <Link
                            href={`/proposals/${prop.id}/compare`}
                            className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg transition-colors border border-slate-200"
                          >
                            <Layers className="h-3.5 w-3.5" />
                            <span>Compare Versions</span>
                          </Link>
                        )}

                        <button
                          onClick={() => handleSendEmail(prop)}
                          disabled={emailingProposalId === prop.id}
                          className="flex items-center space-x-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-lg transition-colors border border-amber-600 shadow-sm ml-auto"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span>{emailingProposalId === prop.id ? 'Sending...' : 'Email Proposal'}</span>
                        </button>

                        <button
                          onClick={() => copyShareLink(prop)}
                          className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                        >
                          {copiedToken === prop.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-green-400" />
                              <span>Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-slate-400" />
                              <span>Copy Portal Link</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Status Manual Editor / Override option */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center space-x-3.5">
                          <span className="text-slate-500 font-semibold">Estimator Controls</span>
                          <span className="text-slate-350">|</span>
                          <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>Expires: {new Date(prop.expiration_date).toLocaleDateString()}</span>
                            {Math.ceil((new Date(prop.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 3 && (
                              <span className="text-red-650 font-bold animate-pulse text-[9px] uppercase tracking-wide bg-red-50 border border-red-100 px-1 rounded">Near Expiry</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={async () => {
                              const newExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                              try {
                                await db.updateProposalExpiration(prop.id, newExp);
                                alert(`Proposal expiration successfully extended to ${new Date(newExp).toLocaleDateString()}`);
                                await loadProjectData();
                              } catch (err) {
                                console.error(err);
                                alert('Error extending expiration.');
                              }
                            }}
                            className="text-amber-600 hover:text-amber-700 font-bold hover:underline"
                          >
                            Extend +30 Days
                          </button>
                          
                          <span className="text-slate-300 font-normal">|</span>

                          {updatingStatusProposalId === prop.id ? (
                            <div className="flex items-center space-x-2">
                              <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value as ProposalStatus)}
                                className="bg-white px-2 py-1 rounded border border-slate-300 focus:outline-none text-xs"
                              >
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Viewed">Viewed</option>
                                <option value="Revised">Revised</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Expired">Expired</option>
                              </select>
                              <button
                                onClick={() => handleStatusUpdateSubmit(prop.id)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold px-2.5 py-1 rounded text-xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setUpdatingStatusProposalId(null)}
                                className="text-slate-500 hover:text-slate-700 px-1 py-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setNewStatus(prop.status);
                                setUpdatingStatusProposalId(prop.id);
                              }}
                              className="text-amber-600 hover:text-amber-700 font-bold hover:underline"
                            >
                              Update Status Manually
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Version Accordion */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedProposal(isExpanded ? null : prop.id)}
                          className="w-full bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-colors"
                        >
                          <span className="flex items-center space-x-1.5">
                            <History className="h-3.5 w-3.5 text-slate-400" />
                            <span>Version Audit Log ({pVersions.length} versions)</span>
                          </span>
                          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="bg-white divide-y divide-slate-100 text-xs">
                            {pVersions.map((v) => (
                              <div key={v.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-slate-900">Version {v.version_number}</span>
                                    <span className="text-slate-500">|</span>
                                    <span className="font-semibold text-slate-700">{v.title}</span>
                                    {prop.current_version_id === v.id && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-slate-400 mt-1 block">Created: {new Date(v.created_at).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center space-x-3 font-semibold">
                                  <span className="text-slate-900 font-bold">${Number(v.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                  <Link
                                    href={`/proposals/${prop.id}/edit?version_id=${v.id}`}
                                    className="text-slate-400 hover:text-slate-900"
                                    title="View locked version details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Security Audit Trail Accordion */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                        <button
                          type="button"
                          onClick={() => setExpandedAuditProposal(expandedAuditProposal === prop.id ? null : prop.id)}
                          className="w-full bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-colors"
                        >
                          <span className="flex items-center space-x-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                            <span>Security Audit Trail ({(proposalAuditLogs[prop.id] || []).length} logs)</span>
                          </span>
                          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedAuditProposal === prop.id ? 'rotate-180' : ''}`} />
                        </button>

                        {expandedAuditProposal === prop.id && (
                          <div className="bg-white divide-y divide-slate-100 text-xs">
                            {(proposalAuditLogs[prop.id] || []).length === 0 ? (
                              <div className="p-4 text-slate-500 font-medium">No audit logs recorded for this proposal.</div>
                            ) : (
                              (proposalAuditLogs[prop.id] || []).map((al) => (
                                <div key={al.id} className="p-3 hover:bg-slate-50/50 space-y-1 font-medium">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wide text-[8px] ${
                                      al.action === 'SIGN' ? 'bg-green-100 text-green-800' :
                                      al.action === 'REVISE' ? 'bg-amber-100 text-amber-800' :
                                      al.action === 'CREATE' ? 'bg-blue-100 text-blue-800' :
                                      'bg-slate-100 text-slate-700'
                                    }`}>
                                      {al.action}
                                    </span>
                                    <span className="text-slate-400 font-semibold">{new Date(al.created_at).toLocaleString()}</span>
                                  </div>
                                  <p className="text-slate-700 text-xs mt-1 leading-normal font-semibold">{al.details}</p>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Operator: <span className="font-semibold text-slate-600">{al.user_id ? `Estimator (${al.user_id})` : 'Public Client (Portal Link)'}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Project Documentation Placeholder */}
          <div className="bg-white rounded-2xl border border-slate-200 premium-shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <FolderOpen className="h-4.5 w-4.5 text-slate-400" />
                <span>Project Documentation</span>
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full uppercase tracking-wide">Coming Soon</span>
            </div>
            <div className="px-6 py-5 text-xs text-slate-500 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-slate-700">Planned: before &amp; after photos, existing conditions, permits, and liability documentation.</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li>Before-work site photos</li>
                <li>After-work completion photos</li>
                <li>Existing conditions documentation</li>
                <li>Permits and inspection records</li>
                <li>Liability / insurance documentation</li>
              </ul>
              <p className="text-[11px] text-slate-400 pt-1">File uploads will be available in a future update.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Negotiation & Timeline Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 premium-shadow flex flex-col h-[650px] overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-950 text-base flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              <span>Negotiation Timeline</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Communication audit trail between owner & clients</p>
          </div>

          {/* Timeline events feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {negotiationEvents.length === 0 ? (
              <div className="text-center text-slate-400 pt-12">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No activity recorded yet</p>
              </div>
            ) : (
              <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-6">
                {negotiationEvents.map((evt) => {
                  let badgeBg = 'bg-slate-100 text-slate-700 ring-slate-200';
                  let senderName = 'System';

                  if (evt.sender_type === 'owner') {
                    badgeBg = 'bg-amber-100 text-amber-800 border border-amber-200';
                    senderName = 'Estimator (You)';
                  } else if (evt.sender_type === 'client') {
                    badgeBg = 'bg-blue-100 text-blue-800 border border-blue-200';
                    senderName = client?.name || 'Client';
                  }

                  return (
                    <div key={evt.id} className="relative text-xs">
                      {/* Timeline circle indicator */}
                      <span className={`absolute -left-[24px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                        evt.sender_type === 'owner' ? 'bg-amber-500' : evt.sender_type === 'client' ? 'bg-blue-500' : 'bg-slate-400'
                      }`} />

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase mb-1">
                        <span className={`px-2 py-0.5 rounded ${badgeBg}`}>{senderName}</span>
                        <span>{new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {evt.message && (
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-medium">
                          {evt.message}
                        </p>
                      )}

                      {evt.requested_changes && (
                        <div className="mt-1.5 p-2 bg-red-50/50 text-red-800 rounded-lg border border-red-100/50">
                          <span className="font-extrabold uppercase tracking-wide text-[9px] block text-red-700">Requested Changes:</span>
                          <span className="font-semibold block text-[11px] mt-0.5">{evt.requested_changes}</span>
                        </div>
                      )}

                      <span className="text-[10px] text-slate-400 block mt-1">Date: {new Date(evt.created_at).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Message/Comment Box */}
          {proposals.length > 0 && (
            <form onSubmit={handleAddComment} className="p-4 border-t border-slate-100 bg-slate-50 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-600">Post Timeline Comment</label>
                  <select
                    value={selectedProposalForComment}
                    onChange={(e) => setSelectedProposalForComment(e.target.value)}
                    className="bg-white px-2 py-1 rounded border border-slate-300 focus:outline-none text-[10px] font-semibold"
                  >
                    {proposals.map(p => (
                      <option key={p.id} value={p.id}>{p.proposal_number}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end space-x-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type comments, notes, or client-facing updates here..."
                    rows={2}
                    className="flex-1 bg-white px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-xl hover:text-amber-500 transition-colors shadow-sm cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  * Note: Submitting comments writes directly to the negotiation event log. Clients will view this timeline on the Shared Link.
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
