'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Zap, Ruler } from 'lucide-react';
import { WallSection, LineItemType } from '@/lib/types';

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

interface WallDimensionsPanelProps {
  wallSections: WallSection[];
  onChange: (sections: WallSection[]) => void;
  onGenerateItems: (items: LineItemInput[]) => void;
  isLocked: boolean;
}

function newWallSection(): WallSection {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    label: '',
    length_ft: 0,
    height_ft: 0,
    area_sf: 0,
    notes: '',
    include_in_total: true,
  };
}

export default function WallDimensionsPanel({ wallSections, onChange, onGenerateItems, isLocked }: WallDimensionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateSection = (idx: number, field: keyof WallSection, value: string | number | boolean) => {
    const updated = wallSections.map((s, i) => {
      if (i !== idx) return s;
      const next = { ...s, [field]: value };
      // Recalculate area whenever length or height changes
      if (field === 'length_ft' || field === 'height_ft') {
        const l = field === 'length_ft' ? Number(value) : s.length_ft;
        const h = field === 'height_ft' ? Number(value) : s.height_ft;
        next.area_sf = Math.round(l * h * 100) / 100;
      }
      return next;
    });
    onChange(updated);
  };

  const addSection = () => onChange([...wallSections, newWallSection()]);

  const removeSection = (idx: number) => onChange(wallSections.filter((_, i) => i !== idx));

  const includedSections = wallSections.filter(s => s.include_in_total);
  const excludedSections = wallSections.filter(s => !s.include_in_total);
  const totalArea = wallSections.reduce((sum, s) => sum + s.area_sf, 0);
  const includedArea = includedSections.reduce((sum, s) => sum + s.area_sf, 0);
  const includedLength = includedSections.reduce((sum, s) => sum + s.length_ft, 0);
  const excludedArea = excludedSections.reduce((sum, s) => sum + s.area_sf, 0);

  const generateItems = () => {
    if (includedSections.length === 0 && excludedSections.length === 0) return;

    const items: LineItemInput[] = [];
    let sort = 0;

    if (includedArea > 0 || includedLength > 0) {
      const mk = 35;
      items.push(
        { category: 'Demolition', description: 'Demolition & Tear Out — existing wall material removal', quantity: Math.round(includedArea * 10) / 10, unit: 'SF', unit_cost: 8, markup_percent: mk, line_item_type: 'required', client_selectable: false, selected_by_default: true, sort_order: sort++ },
        { category: 'Excavation', description: 'Excavation & Footing Prep — grade and compact wall base', quantity: Math.round(includedLength * 10) / 10, unit: 'LF', unit_cost: 12, markup_percent: mk, line_item_type: 'required', client_selectable: false, selected_by_default: true, sort_order: sort++ },
        { category: 'Materials', description: 'Retaining Wall Installation — block setting and alignment', quantity: Math.round(includedArea * 10) / 10, unit: 'SF', unit_cost: 45, markup_percent: mk, line_item_type: 'required', client_selectable: false, selected_by_default: true, sort_order: sort++ },
        { category: 'Drainage', description: 'Drain Tile Installation — 4" perforated tile behind wall base', quantity: Math.round(includedLength * 10) / 10, unit: 'LF', unit_cost: 18, markup_percent: mk, line_item_type: 'required', client_selectable: false, selected_by_default: true, sort_order: sort++ },
        { category: 'Materials', description: 'Backfill Material — compacted gravel backfill', quantity: Math.round(includedArea * 10) / 10, unit: 'SF', unit_cost: 6, markup_percent: mk, line_item_type: 'required', client_selectable: false, selected_by_default: true, sort_order: sort++ },
        { category: 'Labor', description: 'Cleanup & Debris Haul Away — final site cleanup and disposal', quantity: 1, unit: 'EA', unit_cost: 150, markup_percent: mk, line_item_type: 'required', client_selectable: false, selected_by_default: true, sort_order: sort++ },
      );
    }

    // Each excluded wall section becomes a phase/selectable item
    for (const s of excludedSections) {
      const label = s.label || 'Additional Wall Section';
      items.push({
        category: 'Materials',
        description: `Phase: ${label} — ${s.length_ft} LF × ${s.height_ft} FT retaining wall installation (${s.area_sf} SF)`,
        quantity: s.area_sf,
        unit: 'SF',
        unit_cost: 45,
        markup_percent: 35,
        line_item_type: 'phase',
        client_selectable: true,
        selected_by_default: false,
        sort_order: sort++,
      });
    }

    onGenerateItems(items);
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
          <Ruler className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="font-bold text-slate-900 text-sm">Wall Dimensions &amp; Pre-Calculation</span>
          {wallSections.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
              {wallSections.length} wall{wallSections.length !== 1 ? 's' : ''} · {includedArea.toLocaleString()} SF included
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 space-y-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mt-4">
            Enter each wall section. Checked walls are included in the base contract total. Unchecked walls become phase/client-selectable items when you generate line items.
          </p>

          {/* Wall section rows */}
          {wallSections.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">
              No wall sections added yet. Click "Add Wall Section" to start.
            </div>
          ) : (
            <div className="space-y-3">
              {wallSections.map((s, idx) => (
                <div key={s.id} className={`rounded-xl border p-4 space-y-3 ${s.include_in_total ? 'border-slate-200 bg-slate-50/40' : 'border-amber-200 bg-amber-50/30'}`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Include checkbox */}
                    <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        disabled={isLocked}
                        checked={s.include_in_total}
                        onChange={e => updateSection(idx, 'include_in_total', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-600">Include in total</span>
                    </label>

                    {/* Label */}
                    <input
                      type="text"
                      disabled={isLocked}
                      value={s.label}
                      onChange={e => updateSection(idx, 'label', e.target.value)}
                      placeholder="Wall label (e.g. Front Wall, Wall A)"
                      className="flex-1 min-w-32 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500 disabled:bg-slate-50"
                    />

                    {/* Area badge */}
                    {s.area_sf > 0 && (
                      <span className="shrink-0 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
                        {s.area_sf.toLocaleString()} SF
                      </span>
                    )}

                    {/* Remove */}
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => removeSection(idx)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Length (ft)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={isLocked}
                        value={s.length_ft || ''}
                        onChange={e => updateSection(idx, 'length_ft', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500 disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Height (ft)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={isLocked}
                        value={s.height_ft || ''}
                        onChange={e => updateSection(idx, 'height_ft', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500 disabled:bg-slate-50"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Notes (optional)</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={s.notes || ''}
                        onChange={e => updateSection(idx, 'notes', e.target.value)}
                        placeholder="e.g. Railroad tie removal, difficult access"
                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500 disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  {!s.include_in_total && (
                    <p className="text-[10px] text-amber-700 font-semibold">
                      This wall will be generated as a Phase line item — client-selectable, not selected by default.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add section button */}
          {!isLocked && (
            <button
              type="button"
              onClick={addSection}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Wall Section
            </button>
          )}

          {/* Totals summary */}
          {wallSections.length > 0 && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="text-center bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Area</p>
                <p className="text-base font-extrabold text-slate-900">{totalArea.toLocaleString()} <span className="text-xs font-bold text-slate-500">SF</span></p>
              </div>
              <div className="text-center bg-blue-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Included</p>
                <p className="text-base font-extrabold text-blue-900">{includedArea.toLocaleString()} <span className="text-xs font-bold text-blue-500">SF</span></p>
              </div>
              <div className="text-center bg-amber-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">Phase / Future</p>
                <p className="text-base font-extrabold text-amber-900">{excludedArea.toLocaleString()} <span className="text-xs font-bold text-amber-500">SF</span></p>
              </div>
            </div>
          )}

          {/* Generate button */}
          {!isLocked && wallSections.length > 0 && (
            <button
              type="button"
              onClick={generateItems}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              Generate Wall Estimate Items
            </button>
          )}
        </div>
      )}
    </div>
  );
}
