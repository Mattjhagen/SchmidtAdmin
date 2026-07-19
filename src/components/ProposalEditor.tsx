// Comprehensive Proposal Builder / Editor Component
// Location: src/components/ProposalEditor.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../lib/db';
import { PROPOSAL_TEMPLATES } from '../lib/templates';
import { Proposal, Project, Client, ProposalVersion, ProposalLineItem, LineItemType, CatalogInsertResult, WallSection } from '../lib/types';
import CatalogPicker from './CatalogPicker';
import WallDimensionsPanel from './WallDimensionsPanel';
import SavedOptionsPanel from './SavedOptionsPanel';
import {
  FileText,
  Trash2,
  Plus,
  Save,
  ArrowLeft,
  Calculator,
  Unlock,
  Lock,
  MessageSquare,
  Eye,
  Printer,
  AlertTriangle,
  FolderOpen,
  Bookmark,
  Library,
  Info
} from 'lucide-react';

interface ProposalEditorProps {
  projectId?: string;
  templateId?: string;
  proposalId?: string;
  viewVersionId?: string;
  isRevision?: boolean;
}

interface LineItemState {
  id?: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  markup_percent: number;
  line_item_type: LineItemType;
  client_selectable: boolean;
  selected_by_default: boolean;
  sort_order: number;
}

const LINE_ITEM_TYPE_LABELS: Record<LineItemType, string> = {
  required: 'Required',
  optional: 'Optional',
  phase: 'Phase',
  alternate: 'Alternate',
};

const LINE_ITEM_TYPE_COLORS: Record<LineItemType, string> = {
  required: 'text-slate-700',
  optional: 'text-blue-700',
  phase: 'text-amber-700',
  alternate: 'text-purple-700',
};

export default function ProposalEditor({
  projectId,
  templateId,
  proposalId,
  viewVersionId,
  isRevision = false
}: ProposalEditorProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [currentVersion, setCurrentVersion] = useState<ProposalVersion | null>(null);

  // --- Core proposal fields ---
  const [title, setTitle] = useState('');
  const [remarks, setRemarks] = useState('');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [assumptions, setAssumptions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [timeline, setTimeline] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [depositPercentage, setDepositPercentage] = useState<number>(50);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [balanceDueText, setBalanceDueText] = useState('Balance due upon completion');
  const [warrantyNotes, setWarrantyNotes] = useState('');
  const [acceptanceLanguage, setAcceptanceLanguage] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const [taxValue, setTaxValue] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);

  const [lineItems, setLineItems] = useState<LineItemState[]>([]);
  const [wallSections, setWallSections] = useState<WallSection[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isRevisionMode, setIsRevisionMode] = useState(isRevision);
  const [activeTab, setActiveTab] = useState<'items' | 'terms' | 'notes'>('items');
  const [showCatalog, setShowCatalog] = useState(false);
  const [snippetField, setSnippetField] = useState<'scope_of_work' | 'assumptions' | 'exclusions' | 'payment_terms' | 'warranty_notes' | null>(null);

  useEffect(() => {
    if (isLocked) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCatalog(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLocked]);

  const handleCatalogInsert = useCallback((result: CatalogInsertResult) => {
    if (result.type === 'line_items' && result.lineItems) {
      const newItems = result.lineItems.map(li => ({
        category: li.category ?? 'Materials',
        description: li.description ?? '',
        quantity: li.quantity ?? 1,
        unit: li.unit ?? 'EA',
        unit_cost: li.unit_cost ?? 0,
        markup_percent: li.markup_percent ?? 35,
        line_item_type: (li.line_item_type ?? 'required') as LineItemType,
        client_selectable: li.client_selectable ?? false,
        selected_by_default: li.selected_by_default ?? true,
        sort_order: li.sort_order ?? 0,
      }));
      setLineItems(prev => [...prev, ...newItems]);
    } else if (result.type === 'snippet' && result.snippetContent) {
      const target = result.snippetTarget ?? snippetField;
      const append = (current: string) => current ? current + '\n\n' + result.snippetContent! : result.snippetContent!;
      if (target === 'scope_of_work')  setScopeOfWork(append);
      if (target === 'assumptions')    setAssumptions(append);
      if (target === 'exclusions')     setExclusions(append);
      if (target === 'payment_terms')  setPaymentTerms(append);
      if (target === 'warranty_notes') setWarrantyNotes(append);
    }
    setShowCatalog(false);
    setSnippetField(null);
  }, [snippetField]);

  const handleGenerateWallItems = useCallback((items: LineItemState[]) => {
    setLineItems(prev => [...prev, ...items]);
  }, []);

  const handleSavedOptionInsert = useCallback((item: LineItemState) => {
    setLineItems(prev => [...prev, item]);
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);

        if (proposalId) {
          const prop = await db.getProposal(proposalId);
          if (!prop) { alert('Proposal not found'); router.push('/'); return; }
          setProposal(prop);

          const proj = await db.getProject(prop.project_id);
          if (proj) {
            setProject(proj);
            const cl = await db.getClient(proj.client_id);
            setClient(cl);
          }

          const targetVersionId = viewVersionId || prop.current_version_id;
          if (targetVersionId) {
            const ver = await db.getProposalVersion(targetVersionId);
            if (ver) {
              setCurrentVersion(ver);
              setTitle(isRevision ? `Revision: ${ver.title}` : ver.title);
              setRemarks(ver.remarks || '');
              setScopeOfWork(ver.scope_of_work || '');
              setAssumptions(ver.assumptions || '');
              setExclusions(ver.exclusions || '');
              setTimeline(ver.timeline || '');
              setPaymentTerms(ver.payment_terms || '');
              setDepositPercentage(ver.deposit_percentage ?? 50);
              setDepositAmount(ver.deposit_amount ?? 0);
              setBalanceDueText(ver.balance_due_text || 'Balance due upon completion');
              setWarrantyNotes(ver.warranty_notes || '');
              setAcceptanceLanguage(ver.acceptance_language || '');
              setInternalNotes(ver.internal_notes || '');
              setClientMessage(ver.client_message || '');
              setDiscountValue(Number(ver.discount));
              setTaxValue(Number(ver.tax));
              setWallSections(Array.isArray(ver.wall_sections) ? ver.wall_sections : []);

              const isPropLocked = prop.status !== 'Draft';
              setIsLocked(isPropLocked && !isRevisionMode);

              const items = await db.getLineItems(ver.id);
              setLineItems(items.map(item => ({
                id: item.id,
                category: item.category,
                description: item.description,
                quantity: Number(item.quantity),
                unit: item.unit,
                unit_cost: Number(item.unit_cost),
                markup_percent: Number(item.markup_percent),
                line_item_type: item.line_item_type ?? (item.optional ? 'optional' : 'required'),
                client_selectable: item.client_selectable ?? false,
                selected_by_default: item.selected_by_default ?? true,
                sort_order: item.sort_order ?? 0,
              })));
            }
          }
        } else if (projectId) {
          const proj = await db.getProject(projectId);
          if (!proj) { alert('Project not found'); router.push('/clients'); return; }
          setProject(proj);
          const cl = await db.getClient(proj.client_id);
          setClient(cl);

          if (templateId) {
            const tpl = PROPOSAL_TEMPLATES.find(t => t.id === templateId);
            if (tpl) {
              setTitle(tpl.title);
              setScopeOfWork(tpl.scope_of_work);
              setAssumptions(tpl.assumptions);
              setExclusions(tpl.exclusions);
              setTimeline(tpl.timeline);
              setPaymentTerms(tpl.payment_terms);
              setWarrantyNotes(tpl.warranty_notes);
              setLineItems(tpl.line_items.map(item => ({
                category: item.category,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unit_cost: item.unit_cost,
                markup_percent: item.markup_percent,
                line_item_type: 'required' as LineItemType,
                client_selectable: false,
                selected_by_default: true,
                sort_order: 0,
              })));
            }
          } else {
            setTitle(`Estimate Proposal - ${proj.name}`);
            setTimeline('Est. 5-7 business days, weather permitting.');
            setPaymentTerms('50% deposit required to schedule. Balance due upon completion.');
            setDepositPercentage(50);
            setBalanceDueText('Balance due upon completion');
            setWarrantyNotes('5-Year Warranty: Schmidt Construction Inc. warrants all labor and materials for 5 years from the date of project completion against defects in workmanship.');
          }
        }
      } catch (e) {
        console.error('Error initializing builder:', e);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [projectId, templateId, proposalId, viewVersionId, isRevision]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        category: 'Materials',
        description: '',
        quantity: 1,
        unit: 'EA',
        unit_cost: 0,
        markup_percent: 15,
        line_item_type: 'required',
        client_selectable: false,
        selected_by_default: true,
        sort_order: lineItems.length,
      }
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, key: keyof LineItemState, val: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [key]: val };
    // When type changes to 'required', clear client_selectable
    if (key === 'line_item_type' && val === 'required') {
      updated[index].client_selectable = false;
    }
    setLineItems(updated);
  };

  const getLineTotal = (item: LineItemState) => {
    return item.quantity * item.unit_cost * (1 + item.markup_percent / 100);
  };

  // Base subtotal = only required items (client_selectable items are additions)
  const subtotal = lineItems
    .filter(item => item.line_item_type === 'required')
    .reduce((sum, item) => sum + getLineTotal(item), 0);

  const calculatedTax = taxValue;
  const grandTotal = Math.max(0, subtotal + calculatedTax - discountValue);

  // Deposit preview
  const depositDue = depositPercentage > 0
    ? grandTotal * (depositPercentage / 100)
    : depositAmount;

  const hasSelectableItems = lineItems.some(i => i.client_selectable);
  const selectableTotal = lineItems
    .filter(i => i.client_selectable)
    .reduce((sum, i) => sum + getLineTotal(i), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { alert('Please provide a proposal title'); return; }

    try {
      setLoading(true);

      const itemsForSave = lineItems.map((item, idx) => ({
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost,
        markup_percent: item.markup_percent,
        line_total: getLineTotal(item),
        optional: item.line_item_type !== 'required',
        line_item_type: item.line_item_type,
        client_selectable: item.client_selectable,
        selected_by_default: item.selected_by_default,
        sort_order: item.sort_order ?? idx,
      }));

      const versionData = {
        title,
        scope_of_work: scopeOfWork,
        assumptions,
        exclusions,
        timeline,
        payment_terms: paymentTerms,
        warranty_notes: warrantyNotes,
        subtotal,
        tax: calculatedTax,
        discount: discountValue,
        total: grandTotal,
        internal_notes: internalNotes,
        client_message: clientMessage,
        remarks,
        deposit_percentage: depositPercentage,
        deposit_amount: depositAmount,
        balance_due_text: balanceDueText,
        acceptance_language: acceptanceLanguage,
        wall_sections: wallSections,
      };

      if (proposalId && proposal) {
        if (isRevisionMode) {
          await db.createRevisedVersion(proposalId, versionData, itemsForSave);
        } else {
          const targetVerId = proposal.current_version_id;
          if (targetVerId) {
            await db.updateProposalVersion(targetVerId, versionData, itemsForSave);
          }
        }
      } else if (projectId) {
        const propNumber = `SCH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        await db.createProposal(
          { project_id: projectId, proposal_number: propNumber, status: 'Draft' },
          versionData,
          itemsForSave
        );
      }

      router.push(`/projects/${project?.id}`);
    } catch (err) {
      console.error(err);
      alert('Error saving proposal. Check console.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-500 text-sm">Building proposal interface...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 text-sm">
      {/* Sticky Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl premium-shadow border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-30 no-print">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => router.push(`/projects/${project?.id}`)}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white m-0 leading-none">
              {proposalId
                ? (isRevisionMode ? 'Drafting Revised Version' : `Editing Proposal: ${proposal?.proposal_number}`)
                : 'Build New Proposal Estimate'}
            </h2>
            <span className="text-xs text-slate-400 block mt-1">
              Project: <span className="font-semibold text-slate-200">{project?.name}</span> | Client: <span className="font-semibold text-blue-400">{client?.name}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          {isLocked && (
            <div className="flex items-center space-x-1.5 px-3 py-2 text-red-400 border border-red-900 rounded-xl text-xs font-semibold mr-auto sm:mr-0">
              <Lock className="h-3.5 w-3.5" />
              <span>Locked: View Only</span>
            </div>
          )}
          {!isLocked && (
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save & Lock Version</span>
            </button>
          )}
        </div>
      </div>

      {/* Locked notice */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 text-amber-900 no-print">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Viewing Locked Proposal Version</p>
            <p className="text-xs mt-1 leading-relaxed">
              This proposal version (V{currentVersion?.version_number}) has been sent or finalized. Use <strong>Draft Revision</strong> on the project screen to make changes.
            </p>
          </div>
        </div>
      )}

      {/* Catalog Picker Modal */}
      {showCatalog && (
        <CatalogPicker
          onInsert={handleCatalogInsert}
          onClose={() => { setShowCatalog(false); setSnippetField(null); }}
          filterType={snippetField ? 'snippet' : undefined}
          snippetTarget={snippetField ?? undefined}
        />
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">

          {/* Title & Scope */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 premium-shadow space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Scope of Work</h3>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Proposal Package Title *</label>
              <input
                type="text"
                required
                disabled={isLocked}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Multi-Wall Retaining Wall Replacement — Full Property Assessment"
                className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold">Detailed Scope Description</label>
                {!isLocked && (
                  <button type="button" onClick={() => { setSnippetField('scope_of_work'); setShowCatalog(true); }}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-800 cursor-pointer">
                    <Bookmark className="h-3 w-3" /> Insert Snippet
                  </button>
                )}
              </div>
              <textarea
                disabled={isLocked}
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                placeholder="Clearly outline the materials, dimensions, depth of excavation, concrete PSI..."
                rows={6}
                className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Client Remarks (Please Note) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 premium-shadow space-y-3">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Client Remarks</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded-full uppercase tracking-wide">Client Visible</span>
            </div>
            <p className="text-xs text-slate-500">
              Client-facing "Please Note" text block. Appears prominently in the portal before the scope. Never shown on internal notes. Use for phasing explanations, selection notes, or important context.
            </p>
            <textarea
              disabled={isLocked}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={`e.g. Not every wall on your property requires immediate attention. This proposal covers the full scope of all walls assessed. You are welcome to prioritize the walls that need the most work and phase the remaining walls later. Pricing will be adjusted based on selected walls at signing.`}
              rows={4}
              className="w-full bg-blue-50/40 px-3.5 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 leading-relaxed"
            />
          </div>

          {/* Wall Dimensions Panel */}
          <WallDimensionsPanel
            wallSections={wallSections}
            onChange={setWallSections}
            onGenerateItems={handleGenerateWallItems}
            isLocked={isLocked}
          />

          {/* Saved Options Library */}
          <SavedOptionsPanel
            onInsert={handleSavedOptionInsert}
            isLocked={isLocked}
          />

          {/* Line Items */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 premium-shadow space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cost Estimate Line Items</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Type: <span className="text-slate-700 font-semibold">Required</span> = always in contract.&nbsp;
                  <span className="text-blue-700 font-semibold">Optional</span> / <span className="text-amber-700 font-semibold">Phase</span> / <span className="text-purple-700 font-semibold">Alternate</span> = client-selectable additions.
                </p>
              </div>
              {!isLocked && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCatalog(true)}
                    className="flex items-center gap-1.5 text-xs font-extrabold bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Library className="h-3.5 w-3.5" />
                    <span>+ Catalog</span>
                    <span className="text-blue-200 font-normal hidden sm:inline">(⌘K)</span>
                  </button>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Manual</span>
                  </button>
                </div>
              )}
            </div>

            {lineItems.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl text-slate-500">
                <p className="font-semibold text-sm">No line items yet</p>
                <p className="text-xs text-slate-400 mt-1">Add items to calculate the estimate total.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5 pr-2 w-24">Category</th>
                        <th className="py-2.5 px-2">Description</th>
                        <th className="py-2.5 px-2 w-14">Qty</th>
                        <th className="py-2.5 px-2 w-12">Unit</th>
                        <th className="py-2.5 px-2 w-20">Cost ($)</th>
                        <th className="py-2.5 px-2 w-14">Mkup%</th>
                        <th className="py-2.5 px-2 w-22 text-right">Total</th>
                        <th className="py-2.5 px-2 w-24">Type</th>
                        <th className="py-2.5 px-2 w-12 text-center" title="Client Selectable">CS</th>
                        {!isLocked && <th className="py-2.5 pl-2 w-8"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {lineItems.map((item, index) => (
                        <tr key={index} className={`hover:bg-slate-50/50 ${item.line_item_type !== 'required' ? 'bg-slate-50/30' : ''}`}>
                          {/* Category */}
                          <td className="py-2 pr-2">
                            <select
                              disabled={isLocked}
                              value={item.category}
                              onChange={(e) => updateLineItem(index, 'category', e.target.value)}
                              className="w-full bg-white px-1.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                            >
                              <option>Site Prep</option>
                              <option>Excavation</option>
                              <option>Materials</option>
                              <option>Labor</option>
                              <option>Subcontracting</option>
                              <option>Restoration</option>
                              <option>Equipment</option>
                              <option>Demolition</option>
                              <option>Drainage</option>
                              <option>Concrete</option>
                              <option>Other</option>
                            </select>
                          </td>

                          {/* Description */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              required
                              disabled={isLocked}
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              placeholder="Describe work item..."
                              className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                            />
                            {/* Selected-by-default toggle inline when client_selectable */}
                            {item.client_selectable && !isLocked && (
                              <label className="flex items-center space-x-1.5 mt-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.selected_by_default}
                                  onChange={(e) => updateLineItem(index, 'selected_by_default', e.target.checked)}
                                  className="h-3 w-3 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-[10px] text-blue-700 font-semibold">Pre-selected in portal</span>
                              </label>
                            )}
                            {item.client_selectable && isLocked && item.selected_by_default && (
                              <span className="text-[10px] text-blue-600 font-semibold block mt-1">Pre-selected</span>
                            )}
                          </td>

                          {/* Qty */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              required
                              min="0.01"
                              step="any"
                              disabled={isLocked}
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                              className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                            />
                          </td>

                          {/* Unit */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              required
                              disabled={isLocked}
                              value={item.unit}
                              onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                              placeholder="LF"
                              className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                            />
                          </td>

                          {/* Unit Cost */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              required
                              min="0"
                              step="any"
                              disabled={isLocked}
                              value={item.unit_cost}
                              onChange={(e) => updateLineItem(index, 'unit_cost', Number(e.target.value))}
                              className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                            />
                          </td>

                          {/* Markup */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              required
                              min="0"
                              disabled={isLocked}
                              value={item.markup_percent}
                              onChange={(e) => updateLineItem(index, 'markup_percent', Number(e.target.value))}
                              className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                            />
                          </td>

                          {/* Line Total */}
                          <td className="py-2 px-2 font-bold text-slate-900 text-right whitespace-nowrap">
                            ${getLineTotal(item).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Type */}
                          <td className="py-2 px-2">
                            <select
                              disabled={isLocked}
                              value={item.line_item_type}
                              onChange={(e) => updateLineItem(index, 'line_item_type', e.target.value as LineItemType)}
                              className={`w-full bg-white px-1.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500 text-xs font-semibold disabled:bg-slate-50 ${LINE_ITEM_TYPE_COLORS[item.line_item_type]}`}
                            >
                              <option value="required">Required</option>
                              <option value="optional">Optional</option>
                              <option value="phase">Phase</option>
                              <option value="alternate">Alternate</option>
                            </select>
                          </td>

                          {/* Client Selectable */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              disabled={isLocked || item.line_item_type === 'required'}
                              checked={item.client_selectable && item.line_item_type !== 'required'}
                              onChange={(e) => updateLineItem(index, 'client_selectable', e.target.checked)}
                              title={item.line_item_type === 'required' ? 'Required items cannot be client-selectable' : 'Client can check/uncheck this item in the portal'}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40 cursor-pointer"
                            />
                          </td>

                          {/* Delete */}
                          {!isLocked && (
                            <td className="py-2 pl-2 text-right">
                              <button
                                type="button"
                                onClick={() => removeLineItem(index)}
                                className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 premium-shadow space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span>Financial Summary</span>
            </h3>

            <div className="space-y-3 border-y border-slate-100 py-4 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-500">Required Items Subtotal</span>
                <span className="font-bold text-slate-900">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500 shrink-0">Tax / Fee Additions ($)</span>
                <input
                  type="number"
                  disabled={isLocked}
                  value={taxValue}
                  onChange={(e) => setTaxValue(Number(e.target.value))}
                  className="w-24 bg-white px-2 py-1 rounded border border-slate-300 text-right text-xs focus:outline-none focus:border-blue-500 disabled:bg-slate-50"
                />
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500 shrink-0">Discount ($)</span>
                <input
                  type="number"
                  disabled={isLocked}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-24 bg-white px-2 py-1 rounded border border-slate-300 text-right text-xs focus:outline-none focus:border-blue-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-sm font-bold text-slate-900">Base Contract Total</span>
              <span className="text-2xl font-extrabold text-slate-900">
                ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {depositPercentage > 0 && (
              <div className="text-xs space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Deposit Due ({depositPercentage}%)</span>
                  <span className="font-bold">${depositDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>{balanceDueText}</span>
                  <span className="font-semibold">${(grandTotal - depositDue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            {hasSelectableItems && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[10px] text-blue-800 leading-snug">
                <p className="font-bold mb-0.5">+ Client-Selectable Items</p>
                <p>Up to <span className="font-bold">${selectableTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> in optional/phase/alternate items. Client selects in portal. Base total above excludes these.</p>
              </div>
            )}
          </div>

          {/* Secondary Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 premium-shadow overflow-hidden">
            <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500">
              {(['items', 'terms', 'notes'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                    activeTab === tab ? 'border-blue-600 text-slate-900 bg-white font-bold' : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  {tab === 'items' ? 'Clauses' : tab === 'terms' ? 'Terms' : 'Internal'}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {activeTab === 'items' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Assumptions</label>
                    <textarea
                      disabled={isLocked}
                      value={assumptions}
                      onChange={(e) => setAssumptions(e.target.value)}
                      placeholder="e.g. Standard soil, easy machine access..."
                      rows={3}
                      className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Exclusions</label>
                    <textarea
                      disabled={isLocked}
                      value={exclusions}
                      onChange={(e) => setExclusions(e.target.value)}
                      placeholder="e.g. Building permits, sprinkler repairs..."
                      rows={3}
                      className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Acceptance Language</label>
                    <p className="text-[10px] text-slate-400 mb-1">Shown above the signature field in the client portal.</p>
                    <textarea
                      disabled={isLocked}
                      value={acceptanceLanguage}
                      onChange={(e) => setAcceptanceLanguage(e.target.value)}
                      placeholder="e.g. If you choose to proceed with select walls only, please indicate which walls at time of signing and pricing will be adjusted accordingly."
                      rows={3}
                      className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'terms' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Project Timeline</label>
                    <textarea
                      disabled={isLocked}
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      placeholder="e.g. Est. 5-7 business days, weather permitting."
                      rows={2}
                      className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                    />
                  </div>

                  {/* Payment Terms */}
                  <div className="space-y-3 border border-slate-200 rounded-xl p-3">
                    <p className="font-bold text-slate-700 text-xs uppercase tracking-wide">Payment Schedule</p>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Deposit %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={isLocked}
                          value={depositPercentage}
                          onChange={(e) => setDepositPercentage(Number(e.target.value))}
                          className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">0 = use flat amount</p>
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Deposit $ (flat)</label>
                        <input
                          type="number"
                          min="0"
                          disabled={isLocked || depositPercentage > 0}
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(Number(e.target.value))}
                          className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50 disabled:opacity-50"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">Used when % = 0</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Balance Due Text</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={balanceDueText}
                        onChange={(e) => setBalanceDueText(e.target.value)}
                        placeholder="Balance due upon completion"
                        className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Additional Payment Notes</label>
                      <textarea
                        disabled={isLocked}
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        placeholder="e.g. Checks payable to Schmidt Construction Inc. No work commences without deposit."
                        rows={2}
                        className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Warranty</label>
                    <textarea
                      disabled={isLocked}
                      value={warrantyNotes}
                      onChange={(e) => setWarrantyNotes(e.target.value)}
                      placeholder="e.g. 5-Year Warranty: Schmidt Construction Inc. warrants all labor and materials for 5 years from the date of project completion..."
                      rows={3}
                      className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-red-700 font-bold mb-1 flex items-center space-x-1">
                      <Lock className="h-3 w-3" />
                      <span>Internal Notes (Estimator Only — Never Sent to Client)</span>
                    </label>
                    <textarea
                      disabled={isLocked}
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Pricing margins, subcontractor notes, site conditions... (NEVER visible to client)"
                      rows={4}
                      className="w-full bg-slate-50/50 border-red-200 px-3 py-2 rounded-xl border focus:outline-none focus:border-red-500 text-xs disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Accompanying Client Message</label>
                    <textarea
                      disabled={isLocked}
                      value={clientMessage}
                      onChange={(e) => setClientMessage(e.target.value)}
                      placeholder="A friendly note shown at the top of the shared proposal..."
                      rows={3}
                      className="w-full bg-white px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs disabled:bg-slate-50"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
