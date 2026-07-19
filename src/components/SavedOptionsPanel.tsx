'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Search, Plus, Trash2, Check, Bookmark, X } from 'lucide-react';
import { db } from '@/lib/db';
import { SavedProposalOption, LineItemType } from '@/lib/types';

interface LineItemInput {
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

interface SavedOptionsPanelProps {
  onInsert: (item: LineItemInput) => void;
  isLocked: boolean;
}

const CATEGORIES = ['Upgrade', 'Phase', 'Optional', 'Drainage', 'Concrete', 'Labor', 'Materials', 'Other'];

const BLANK_FORM = {
  name: '',
  description: '',
  category: 'Optional',
  default_price: 0,
  default_unit: 'EA',
  default_quantity: 1,
  default_markup_percent: 35,
  line_item_type: 'optional' as LineItemType,
  client_selectable: true,
  selected_by_default: false,
};

export default function SavedOptionsPanel({ onInsert, isLocked }: SavedOptionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<SavedProposalOption[]>([]);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [inserted, setInserted] = useState<string | null>(null);

  const loadOptions = useCallback(async () => {
    try {
      const data = await db.getSavedOptions();
      setOptions(data);
    } catch (e) {
      console.error('Failed to load saved options:', e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadOptions();
  }, [isOpen, loadOptions]);

  const filtered = options.filter(o => {
    if (!query) return true;
    const q = query.toLowerCase();
    return o.name.toLowerCase().includes(q) || (o.category ?? '').toLowerCase().includes(q) || (o.description ?? '').toLowerCase().includes(q);
  });

  const handleInsert = (opt: SavedProposalOption) => {
    onInsert({
      category: opt.category ?? 'Materials',
      description: opt.description ?? opt.name,
      quantity: opt.default_quantity,
      unit: opt.default_unit,
      unit_cost: opt.default_price,
      markup_percent: opt.default_markup_percent,
      line_item_type: opt.line_item_type,
      client_selectable: opt.client_selectable,
      selected_by_default: opt.selected_by_default,
      sort_order: 0,
    });
    setInserted(opt.id);
    setTimeout(() => setInserted(null), 1500);
  };

  const startEdit = (opt: SavedProposalOption) => {
    setForm({
      name: opt.name,
      description: opt.description ?? '',
      category: opt.category ?? 'Optional',
      default_price: opt.default_price,
      default_unit: opt.default_unit,
      default_quantity: opt.default_quantity,
      default_markup_percent: opt.default_markup_percent,
      line_item_type: opt.line_item_type,
      client_selectable: opt.client_selectable,
      selected_by_default: opt.selected_by_default,
    });
    setEditingId(opt.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(BLANK_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await db.updateSavedOption(editingId, {
          name: form.name,
          description: form.description,
          category: form.category,
          default_price: form.default_price,
          default_unit: form.default_unit,
          default_quantity: form.default_quantity,
          default_markup_percent: form.default_markup_percent,
          line_item_type: form.line_item_type,
          client_selectable: form.client_selectable,
          selected_by_default: form.selected_by_default,
        });
      } else {
        await db.createSavedOption({
          name: form.name,
          description: form.description,
          category: form.category,
          default_price: form.default_price,
          default_unit: form.default_unit,
          default_quantity: form.default_quantity,
          default_markup_percent: form.default_markup_percent,
          line_item_type: form.line_item_type,
          client_selectable: form.client_selectable,
          selected_by_default: form.selected_by_default,
        });
      }
      await loadOptions();
      cancelForm();
    } catch (e) {
      console.error('Failed to save option:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved option?')) return;
    try {
      await db.deleteSavedOption(id);
      setOptions(prev => prev.filter(o => o.id !== id));
    } catch (e) {
      console.error('Failed to delete option:', e);
    }
  };

  const LINE_ITEM_TYPE_COLORS: Record<LineItemType, string> = {
    required: 'text-slate-700',
    optional: 'text-blue-700',
    phase: 'text-amber-700',
    alternate: 'text-purple-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 premium-shadow overflow-hidden">
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="font-bold text-slate-900 text-sm">Saved Options Library</span>
          {options.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
              {options.length}
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-6 pb-6 space-y-4 pt-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search options…"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
            {!isLocked && (
              <button
                type="button"
                onClick={() => { setShowForm(true); setEditingId(null); setForm(BLANK_FORM); }}
                className="flex items-center gap-1.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                New Option
              </button>
            )}
          </div>

          {/* Create / Edit form */}
          {showForm && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">{editingId ? 'Edit Option' : 'New Saved Option'}</p>
                <button type="button" onClick={cancelForm} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Premium Drain Tile Upgrade"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Client-facing description"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Type</label>
                  <select
                    value={form.line_item_type}
                    onChange={e => setForm(f => ({ ...f, line_item_type: e.target.value as LineItemType, client_selectable: e.target.value !== 'required' ? f.client_selectable : false }))}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="required">Required</option>
                    <option value="optional">Optional</option>
                    <option value="phase">Phase</option>
                    <option value="alternate">Alternate</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Default Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.default_price}
                    onChange={e => setForm(f => ({ ...f, default_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Unit</label>
                  <input
                    type="text"
                    value={form.default_unit}
                    onChange={e => setForm(f => ({ ...f, default_unit: e.target.value }))}
                    placeholder="EA"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Qty</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.default_quantity}
                    onChange={e => setForm(f => ({ ...f, default_quantity: parseFloat(e.target.value) || 1 }))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Markup %</label>
                  <input
                    type="number"
                    min="0"
                    value={form.default_markup_percent}
                    onChange={e => setForm(f => ({ ...f, default_markup_percent: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2 flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.client_selectable}
                      disabled={form.line_item_type === 'required'}
                      onChange={e => setForm(f => ({ ...f, client_selectable: e.target.checked }))}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 cursor-pointer"
                    />
                    <span className="text-[10px] font-semibold text-slate-600">Client selectable</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.selected_by_default}
                      disabled={!form.client_selectable}
                      onChange={e => setForm(f => ({ ...f, selected_by_default: e.target.checked }))}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 cursor-pointer"
                    />
                    <span className="text-[10px] font-semibold text-slate-600">Pre-selected in portal</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="flex items-center gap-1.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl cursor-pointer transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                  {saving ? 'Saving…' : 'Save Option'}
                </button>
                <button type="button" onClick={cancelForm} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Option list */}
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              {options.length === 0
                ? 'No saved options yet. Create your first reusable option above.'
                : `No options match "${query}".`}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(opt => (
                <div
                  key={opt.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{opt.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{opt.description || opt.category}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold ${LINE_ITEM_TYPE_COLORS[opt.line_item_type]}`}>
                        {opt.line_item_type}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ${opt.default_price.toFixed(0)}/{opt.default_unit} · qty {opt.default_quantity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!isLocked && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleInsert(opt)}
                          title="Insert into proposal"
                          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                            inserted === opt.id
                              ? 'bg-green-100 border-green-300 text-green-700'
                              : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-700'
                          }`}
                        >
                          {inserted === opt.id ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          {inserted === opt.id ? 'Added!' : 'Insert'}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(opt)}
                          title="Edit"
                          className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 cursor-pointer transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(opt.id)}
                          title="Delete"
                          className="p-1.5 text-red-300 hover:text-red-500 cursor-pointer rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
