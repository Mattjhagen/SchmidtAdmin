// Side-by-Side Proposal Version Comparison
// Location: src/app/proposals/[id]/compare/page.tsx

'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Proposal, Project, ProposalVersion, ProposalLineItem } from '@/lib/types';
import { 
  ArrowLeft, 
  Layers, 
  ArrowRight, 
  Minus, 
  Plus, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  HelpCircle 
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CompareProposalsPage({ params }: PageProps) {
  const router = useRouter();
  const { id: proposalId } = use(params);

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Compare selection states
  const [verAId, setVerAId] = useState<string>('');
  const [verBId, setVerBId] = useState<string>('');
  
  const [versionA, setVersionA] = useState<ProposalVersion | null>(null);
  const [versionB, setVersionB] = useState<ProposalVersion | null>(null);
  const [itemsA, setItemsA] = useState<ProposalLineItem[]>([]);
  const [itemsB, setItemsB] = useState<ProposalLineItem[]>([]);

  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        const prop = await db.getProposal(proposalId);
        if (!prop) {
          alert('Proposal not found');
          router.push('/');
          return;
        }
        setProposal(prop);

        const proj = await db.getProject(prop.project_id);
        if (proj) setProject(proj);

        const vers = await db.getProposalVersions(proposalId);
        // Sort ascending by version number for selection list
        const sortedVers = [...vers].sort((a, b) => a.version_number - b.version_number);
        setVersions(sortedVers);

        if (sortedVers.length < 2) {
          alert('Comparison requires at least two proposal versions.');
          router.push(`/projects/${proj?.id}`);
          return;
        }

        // Default: Compare V1 (Version A) vs Newest Version (Version B)
        const vA = sortedVers[0];
        const vB = sortedVers[sortedVers.length - 1];

        setVerAId(vA.id);
        setVerBId(vB.id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [proposalId, router]);

  // Handle version change triggers
  useEffect(() => {
    const loadVersionsData = async () => {
      if (!verAId || !verBId) return;
      try {
        const vA = await db.getProposalVersion(verAId);
        const vB = await db.getProposalVersion(verBId);
        setVersionA(vA);
        setVersionB(vB);

        if (vA) {
          const itA = await db.getLineItems(vA.id);
          setItemsA(itA);
        }
        if (vB) {
          const itB = await db.getLineItems(vB.id);
          setItemsB(itB);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadVersionsData();
  }, [verAId, verBId]);

  // Compute pricing differences
  const getPriceDiff = () => {
    if (!versionA || !versionB) return { value: 0, percent: 0, direction: 'flat' as const };
    const valA = Number(versionA.total);
    const valB = Number(versionB.total);
    const diff = valB - valA;
    const pct = valA > 0 ? (diff / valA) * 100 : 0;
    
    return {
      value: diff,
      percent: Math.abs(pct),
      direction: diff > 0 ? 'up' as const : diff < 0 ? 'down' as const : 'flat' as const
    };
  };

  const diff = getPriceDiff();

  // Compare line items by category & description mapping
  // We build a list of compared line item rows
  const getComparedLineItems = () => {
    const rows: {
      category: string;
      description: string;
      itemA?: ProposalLineItem;
      itemB?: ProposalLineItem;
      status: 'added' | 'removed' | 'modified' | 'identical';
    }[] = [];

    // Map items A by description for comparison lookup
    const mapA = new Map(itemsA.map(item => [item.description.trim().toLowerCase(), item]));
    const mapB = new Map(itemsB.map(item => [item.description.trim().toLowerCase(), item]));

    // Match A items (may be identical, modified, or removed in B)
    itemsA.forEach((itemA) => {
      const descKey = itemA.description.trim().toLowerCase();
      const itemB = mapB.get(descKey);

      if (itemB) {
        // Exists in both: check if attributes changed
        const matches = 
          itemA.category === itemB.category &&
          Number(itemA.quantity) === Number(itemB.quantity) &&
          itemA.unit === itemB.unit &&
          Number(itemA.unit_cost) === Number(itemB.unit_cost) &&
          Number(itemA.markup_percent) === Number(itemB.markup_percent) &&
          itemA.optional === itemB.optional;

        rows.push({
          category: itemB.category,
          description: itemB.description,
          itemA,
          itemB,
          status: matches ? 'identical' : 'modified'
        });
      } else {
        // Exists in A but not in B: REMOVED
        rows.push({
          category: itemA.category,
          description: itemA.description,
          itemA,
          status: 'removed'
        });
      }
    });

    // Match B items that do not exist in A: ADDED
    itemsB.forEach((itemB) => {
      const descKey = itemB.description.trim().toLowerCase();
      if (!mapA.has(descKey)) {
        rows.push({
          category: itemB.category,
          description: itemB.description,
          itemB,
          status: 'added'
        });
      }
    });

    return rows;
  };

  const comparedItems = getComparedLineItems();

  if (loading || !versionA || !versionB) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        <p className="mt-4 text-slate-500 text-sm">Computing version differentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between gap-4">
        <Link 
          href={`/projects/${project?.id}`} 
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold no-print"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Project: {project?.name}</span>
        </Link>
      </div>

      {/* Selector & Statistics Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 premium-shadow">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* selectors */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-amber-500 text-slate-950 p-2.5 rounded-xl">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white m-0 leading-none">
                Proposal Versions Compare
              </h2>
              <span className="text-xs text-slate-400 block mt-1.5">
                Compare proposal: <span className="font-semibold text-slate-200">{proposal?.proposal_number}</span>
              </span>
            </div>
          </div>

          {/* Selector Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 text-slate-900 text-xs">
            <div className="flex items-center bg-slate-850 p-2 rounded-xl border border-slate-850">
              <span className="text-slate-400 font-semibold px-2 shrink-0">Version A:</span>
              <select
                value={verAId}
                onChange={(e) => setVerAId(e.target.value)}
                className="bg-white rounded px-2.5 py-1.5 focus:outline-none font-bold"
              >
                {versions.map(v => (
                  <option key={v.id} value={v.id}>V{v.version_number} ({v.title.substring(0,20)}...)</option>
                ))}
              </select>
            </div>

            <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 hidden sm:block" />

            <div className="flex items-center bg-slate-850 p-2 rounded-xl border border-slate-850">
              <span className="text-slate-400 font-semibold px-2 shrink-0">Version B:</span>
              <select
                value={verBId}
                onChange={(e) => setVerBId(e.target.value)}
                className="bg-white rounded px-2.5 py-1.5 focus:outline-none font-bold"
              >
                {versions.map(v => (
                  <option key={v.id} value={v.id}>V{v.version_number} ({v.title.substring(0,20)}...)</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing change indicator */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Base Version A (V{versionA.version_number})</span>
            <span className="text-lg font-bold text-white">${Number(versionA.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="bg-slate-850 px-4 py-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold block tracking-wider">Pricing Shift</span>
            <div className="flex items-center justify-center space-x-1.5 mt-1 font-bold">
              {diff.direction === 'up' && (
                <>
                  <TrendingUp className="h-4.5 w-4.5 text-green-400" />
                  <span className="text-green-400">+${diff.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} (+{diff.percent.toFixed(1)}%)</span>
                </>
              )}
              {diff.direction === 'down' && (
                <>
                  <TrendingDown className="h-4.5 w-4.5 text-red-400" />
                  <span className="text-red-400">-${Math.abs(diff.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} (-{diff.percent.toFixed(1)}%)</span>
                </>
              )}
              {diff.direction === 'flat' && (
                <span className="text-slate-400">No Net Change</span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Revised Version B (V{versionB.version_number})</span>
            <span className="text-lg font-bold text-white">${Number(versionB.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Scope Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 premium-shadow">
        <div className="space-y-2 border-r border-slate-100 pr-0 md:pr-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Scope Version A (V{versionA.version_number})</span>
          <h3 className="font-extrabold text-slate-900 text-base">{versionA.title}</h3>
          <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {versionA.scope_of_work || 'No scope described.'}
          </p>
        </div>

        <div className="space-y-2 pl-0 md:pl-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Scope Version B (V{versionB.version_number})</span>
          <h3 className="font-extrabold text-slate-900 text-base">{versionB.title}</h3>
          <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {versionB.scope_of_work || 'No scope described.'}
          </p>
        </div>
      </div>

      {/* Detailed Line Items Diff Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 premium-shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-900">Line Items Detailed Comparison</h3>
          <p className="text-xs text-slate-500">Displays individual labor/materials line items additions, modifications, or removals.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-6">Description (Category)</th>
                <th className="py-3 px-4 text-center w-28">Status</th>
                <th className="py-3 px-4 text-right w-36">Version A Cost</th>
                <th className="py-3 px-4 text-right w-36">Version B Cost</th>
                <th className="py-3 px-4 text-right w-36">Difference ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {comparedItems.map((row, index) => {
                let statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';
                let rowBg = '';
                
                const costA = row.itemA ? (row.itemA.quantity * row.itemA.unit_cost * (1 + row.itemA.markup_percent / 100)) : 0;
                const costB = row.itemB ? (row.itemB.quantity * row.itemB.unit_cost * (1 + row.itemB.markup_percent / 100)) : 0;
                const costDiff = costB - costA;

                if (row.status === 'added') {
                  statusBadge = 'bg-green-100 text-green-800 border-green-200';
                  rowBg = 'bg-green-50/20';
                } else if (row.status === 'removed') {
                  statusBadge = 'bg-red-100 text-red-800 border-red-200';
                  rowBg = 'bg-red-50/20';
                } else if (row.status === 'modified') {
                  statusBadge = 'bg-amber-100 text-amber-800 border-amber-200';
                  rowBg = 'bg-amber-50/10';
                }

                return (
                  <tr key={index} className={`${rowBg} hover:bg-slate-50/40 transition-colors`}>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-slate-900 block text-sm">{row.description}</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">Category: {row.category}</span>
                      {row.status === 'modified' && row.itemA && row.itemB && (
                        <span className="text-[10px] text-slate-500 block mt-1 leading-normal">
                          Changed: V{(versionA.version_number)} ({row.itemA.quantity} {row.itemA.unit} @ ${row.itemA.unit_cost} +{row.itemA.markup_percent}%) 
                          → V{(versionB.version_number)} ({row.itemB.quantity} {row.itemB.unit} @ ${row.itemB.unit_cost} +{row.itemB.markup_percent}%)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${statusBadge}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {row.itemA ? `$${costA.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {row.itemB ? `$${costB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                      costDiff > 0 ? 'text-green-600' : costDiff < 0 ? 'text-red-600' : 'text-slate-400'
                    }`}>
                      {costDiff > 0 ? `+$${costDiff.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : costDiff < 0 ? `-$${Math.abs(costDiff).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
