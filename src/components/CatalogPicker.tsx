'use client';
// CatalogPicker — Command Palette for inserting catalog items into proposals
// Location: src/components/CatalogPicker.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, X, Package, Wrench, Truck, Layers, FileText, ChevronRight,
  Zap, AlertCircle, Calculator, Check
} from 'lucide-react';
import {
  CatalogItem, CatalogItemType, AssemblyComponent,
  MeasurementTemplate, MeasurementResult, CatalogInsertResult
} from '@/lib/types';
import {
  DEMO_CATALOG_ITEMS, DEMO_CATALOG_CATEGORIES, DEMO_MATERIALS,
  DEMO_LABOR, DEMO_EQUIPMENT, DEMO_ASSEMBLIES, DEMO_SNIPPETS,
  MEASUREMENT_TEMPLATES, catalogItemToLineItem
} from '@/lib/catalog';

// ── Hydrate catalog items with their detail records ─────────────────────────
// Two-pass: first build flat items (no assembly components), then wire components
// from that flat list. Avoids infinite recursion when assemblies reference other items.
function hydrateItems(): CatalogItem[] {
  const flat: CatalogItem[] = DEMO_CATALOG_ITEMS.map(item => {
    const category = DEMO_CATALOG_CATEGORIES.find(c => c.id === item.category_id);
    const hydrated: CatalogItem = { ...item, category };
    if (item.type === 'material') {
      hydrated.material = DEMO_MATERIALS.find(m => m.catalog_item_id === item.id);
    } else if (item.type === 'labor') {
      hydrated.labor = DEMO_LABOR.find(l => l.catalog_item_id === item.id);
    } else if (item.type === 'equipment') {
      hydrated.equipment = DEMO_EQUIPMENT.find(e => e.catalog_item_id === item.id);
    } else if (item.type === 'snippet') {
      hydrated.snippet = DEMO_SNIPPETS.find(s => s.catalog_item_id === item.id);
    }
    return hydrated;
  });

  // Second pass: wire assembly components from the already-built flat list
  for (const item of flat) {
    if (item.type === 'assembly') {
      const asm = DEMO_ASSEMBLIES.find(a => a.catalog_item_id === item.id);
      if (asm) {
        item.assembly = {
          ...asm,
          components: asm.components.map(c => ({
            ...c,
            component: flat.find(i => i.id === c.component_id),
          })),
        };
      }
    }
  }

  return flat;
}

const ALL_ITEMS = hydrateItems();

// ── Type icons & colors ───────────────────────────────────────────────────────
const TYPE_META: Record<CatalogItemType, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  material:  { icon: <Package  className="h-3.5 w-3.5" />, label: 'Material',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  labor:     { icon: <Wrench   className="h-3.5 w-3.5" />, label: 'Labor',     color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  equipment: { icon: <Truck    className="h-3.5 w-3.5" />, label: 'Equipment', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  assembly:  { icon: <Layers   className="h-3.5 w-3.5" />, label: 'Assembly',  color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  snippet:   { icon: <FileText className="h-3.5 w-3.5" />, label: 'Snippet',   color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  template:  { icon: <Zap      className="h-3.5 w-3.5" />, label: 'Template',  color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-200' },
};

// ── Fuzzy search helper ───────────────────────────────────────────────────────
function searchItems(query: string, filterType?: CatalogItemType): CatalogItem[] {
  const q = query.toLowerCase().trim();
  let items = ALL_ITEMS.filter(i => i.active);
  if (filterType) items = items.filter(i => i.type === filterType);
  if (!q) return items.slice(0, 40);

  return items
    .map(item => {
      let score = 0;
      const name = item.name.toLowerCase();
      const desc = (item.description ?? '').toLowerCase();
      const tags = (item.search_tags ?? []).join(' ').toLowerCase();

      if (name === q)                     score += 100;
      if (name.startsWith(q))            score += 60;
      if (name.includes(q))              score += 40;
      if (tags.includes(q))              score += 30;
      if (desc.includes(q))              score += 15;
      // Word match
      q.split(' ').forEach(word => {
        if (word && name.includes(word))  score += 10;
        if (word && tags.includes(word))  score += 5;
      });

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, 30);
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface CatalogPickerProps {
  onInsert: (result: CatalogInsertResult) => void;
  onClose: () => void;
  filterType?: CatalogItemType;  // narrow to snippets only, etc.
  snippetTarget?: 'scope_of_work' | 'assumptions' | 'exclusions' | 'payment_terms' | 'warranty_notes';
}

type Tab = 'search' | 'calculator';

export default function CatalogPicker({ onInsert, onClose, filterType, snippetTarget }: CatalogPickerProps) {
  const [query, setQuery]             = useState('');
  const [activeTab, setActiveTab]     = useState<Tab>('search');
  const [results, setResults]         = useState<CatalogItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [preview, setPreview]         = useState<CatalogItem | null>(null);
  const [quantityMap, setQuantityMap] = useState<Record<string, number>>({});

  // Calculator state — store jobType string only, never a function-containing object
  const [calcJobType, setCalcJobType]           = useState<string>(MEASUREMENT_TEMPLATES[0].jobType);
  const calcTemplate = MEASUREMENT_TEMPLATES.find(t => t.jobType === calcJobType) ?? MEASUREMENT_TEMPLATES[0];
  const [calcInputs, setCalcInputs]             = useState<Record<string, number>>({});
  const [calcResults, setCalcResults]           = useState<MeasurementResult[]>([]);
  const [calcSelected, setCalcSelected]         = useState<Record<number, boolean>>({});

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Init calculator defaults ─────────────────────────────────────────────
  useEffect(() => {
    const defaults: Record<string, number> = {};
    calcTemplate.inputs.forEach(inp => { defaults[inp.key] = inp.default ?? 0; });
    setCalcInputs(defaults);
    setCalcResults([]);
  }, [calcJobType]); // depend on the string key, not the template object

  // ── Search ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setResults(searchItems(query, filterType));
    setSelectedIdx(0);
    setPreview(null);
  }, [query, filterType]);

  // ── Focus input on open ──────────────────────────────────────────────────
  useEffect(() => { inputRef.current?.focus(); }, []);

  // ── Keyboard navigation ──────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (activeTab !== 'search') return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) { e.preventDefault(); handleInsertItem(results[selectedIdx]); }
  }, [activeTab, results, selectedIdx]);

  // ── Insert a single catalog item ─────────────────────────────────────────
  const handleInsertItem = (item: CatalogItem) => {
    if (item.type === 'snippet') {
      if (!item.snippet) return;
      onInsert({ type: 'snippet', snippetContent: item.snippet.content, snippetTarget: item.snippet.insert_target });
      return;
    }

    if (item.type === 'assembly' && item.assembly) {
      const lineItems = item.assembly.components
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(comp => {
          if (!comp.component) return null;
          const qty = quantityMap[comp.id] ?? comp.quantity;
          return catalogItemToLineItem(comp.component, qty);
        })
        .filter(Boolean) as ReturnType<typeof catalogItemToLineItem>[];

      onInsert({ type: 'line_items', lineItems });
      return;
    }

    // Single material / labor / equipment
    const qty = quantityMap[item.id] ?? 1;
    const lineItem = catalogItemToLineItem(item, qty);
    onInsert({ type: 'line_items', lineItems: [lineItem] });
  };

  // ── Calculator run ───────────────────────────────────────────────────────
  const runCalculator = () => {
    try {
      const results = calcTemplate.calculate(calcInputs);
      setCalcResults(results);
      const sel: Record<number, boolean> = {};
      results.forEach((_, i) => { sel[i] = true; });
      setCalcSelected(sel);
    } catch (err) {
      console.error('Calculator error:', err);
    }
  };

  const insertCalcResults = () => {
    const lineItems = calcResults
      .filter((_, i) => calcSelected[i])
      .map(r => ({
        category: r.category,
        description: r.description,
        quantity: r.quantity,
        unit: r.unit,
        unit_cost: 0, // Will be 0 if we can't match catalog; estimator can update
        markup_percent: 35,
        line_total: 0,
        optional: false,
      }));

    // Try to match catalog items to fill in costs
    const enriched = lineItems.map(li => {
      const match = ALL_ITEMS.find(ci =>
        ci.name.toLowerCase().includes(li.description.toLowerCase().split(' ').slice(0,2).join(' ').toLowerCase())
      );
      if (match && match.type === 'material' && match.material) {
        return { ...li, unit_cost: match.material.unit_cost, markup_percent: match.material.default_markup, line_total: li.quantity * match.material.unit_cost * (1 + match.material.default_markup / 100) };
      }
      if (match && match.type === 'labor' && match.labor) {
        return { ...li, unit_cost: match.labor.rate_per_hour, markup_percent: match.labor.default_markup, line_total: li.quantity * match.labor.rate_per_hour * (1 + match.labor.default_markup / 100) };
      }
      return li;
    });

    onInsert({ type: 'line_items', lineItems: enriched });
  };

  // ── Unit cost display helper ─────────────────────────────────────────────
  const getUnitCostDisplay = (item: CatalogItem): string => {
    if (item.type === 'material' && item.material)   return `$${item.material.unit_cost.toFixed(2)}/${item.material.unit}`;
    if (item.type === 'labor' && item.labor)         return `$${item.labor.rate_per_hour.toFixed(2)}/HR`;
    if (item.type === 'equipment' && item.equipment) return `$${(item.equipment.daily_rate ?? 0).toFixed(2)}/DAY`;
    if (item.type === 'assembly')                    return `${item.assembly?.components.length ?? 0} items`;
    if (item.type === 'snippet')                     return `→ ${item.snippet?.insert_target?.replace(/_/g, ' ')}`;
    return '';
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[75vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-100">
          <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={filterType === 'snippet' ? 'Search snippets…' : 'Search catalog: "french drain", "labor", "Allan Block"…'}
            className="flex-1 text-sm text-slate-900 placeholder-slate-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Tabs (hidden when filterType is set) */}
        {!filterType && (
          <div className="flex border-b border-slate-100">
            {(['search', 'calculator'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer
                  ${activeTab === tab ? 'border-b-2 border-amber-500 text-amber-700 bg-amber-50/30' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab === 'calculator' && <Calculator className="h-3.5 w-3.5" />}
                {tab === 'search' && <Search className="h-3.5 w-3.5" />}
                {tab === 'search' ? 'Catalog' : 'Calculators'}
              </button>
            ))}
          </div>
        )}

        {/* ── SEARCH TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'search' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Results list */}
            <div className="flex-1 overflow-y-auto">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No results for "{query}"</p>
                  <p className="text-xs mt-1">Try broader terms or switch to Calculator tab</p>
                </div>
              ) : (
                results.map((item, idx) => {
                  const meta = TYPE_META[item.type];
                  const isSelected = idx === selectedIdx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => item.type === 'assembly' || item.type === 'material' || item.type === 'labor' || item.type === 'equipment'
                        ? setPreview(item)
                        : handleInsertItem(item)
                      }
                      onDoubleClick={() => handleInsertItem(item)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-slate-50 transition-colors cursor-pointer
                        ${isSelected ? 'bg-amber-50' : 'hover:bg-slate-50'}`}
                    >
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${meta.color} ${meta.bg}`}>
                        {meta.icon} {meta.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500 truncate">{item.description}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-500 shrink-0 whitespace-nowrap">{getUnitCostDisplay(item)}</span>
                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Preview / quantity panel */}
            {preview && (
              <div className="w-64 border-l border-slate-100 bg-slate-50/60 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
                <div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mb-2 ${TYPE_META[preview.type].color} ${TYPE_META[preview.type].bg}`}>
                    {TYPE_META[preview.type].icon} {TYPE_META[preview.type].label}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{preview.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{preview.description}</p>
                </div>

                {/* Assembly components preview */}
                {preview.type === 'assembly' && preview.assembly && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Components</p>
                    {preview.assembly.components.map(comp => (
                      <div key={comp.id} className="flex items-center justify-between text-xs text-slate-700 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200">
                        <span className="truncate">{comp.component?.name ?? '—'}</span>
                        <span className="text-slate-400 shrink-0 ml-2">{comp.quantity} {comp.quantity_unit}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-400 mt-1">{preview.assembly.notes}</p>
                  </div>
                )}

                {/* Quantity input for single items */}
                {(preview.type === 'material' || preview.type === 'labor' || preview.type === 'equipment') && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Quantity ({preview.material?.unit ?? preview.labor ? 'HR' : 'DAY'})
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={quantityMap[preview.id] ?? 1}
                      onChange={e => setQuantityMap(m => ({ ...m, [preview.id]: parseFloat(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Unit cost: {getUnitCostDisplay(preview)}</p>
                  </div>
                )}

                <button
                  onClick={() => { handleInsertItem(preview); setPreview(null); }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {preview.type === 'assembly' ? 'Insert All Items' : 'Insert Item'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CALCULATOR TAB ─────────────────────────────────────────────── */}
        {activeTab === 'calculator' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Template selector */}
            <div className="flex gap-2 flex-wrap">
              {MEASUREMENT_TEMPLATES.map(t => (
                <button
                  key={t.jobType}
                  onClick={() => { setCalcJobType(t.jobType); setCalcResults([]); }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer
                    ${calcTemplate.jobType === t.jobType
                      ? 'bg-amber-500 border-amber-500 text-slate-950'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-amber-400'}`}
                >
                  <span>{t.icon}</span> {t.name.replace(' Calculator', '')}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
              {calcTemplate.inputs.map(inp => (
                <div key={inp.key}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    {inp.label} {inp.unit && <span className="normal-case font-normal">({inp.unit})</span>}
                  </label>
                  {inp.type === 'select' ? (
                    <select
                      value={calcInputs[inp.key] ?? inp.default}
                      onChange={e => setCalcInputs(m => ({ ...m, [inp.key]: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {inp.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={calcInputs[inp.key] ?? inp.default ?? ''}
                      onChange={e => setCalcInputs(m => ({ ...m, [inp.key]: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={runCalculator}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Calculator className="h-4 w-4" /> Calculate Quantities
            </button>

            {/* Results */}
            {calcResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Calculated Line Items ({calcResults.filter((_, i) => calcSelected[i]).length} selected)
                  </p>
                  <button
                    onClick={() => {
                      const allOn = calcResults.every((_, i) => calcSelected[i]);
                      const next: Record<number, boolean> = {};
                      calcResults.forEach((_, i) => { next[i] = !allOn; });
                      setCalcSelected(next);
                    }}
                    className="text-[10px] text-amber-600 font-bold cursor-pointer hover:underline"
                  >
                    Toggle All
                  </button>
                </div>
                {calcResults.map((r, i) => (
                  <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                    ${calcSelected[i] ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <input
                      type="checkbox"
                      checked={!!calcSelected[i]}
                      onChange={() => setCalcSelected(m => ({ ...m, [i]: !m[i] }))}
                      className="h-4 w-4 rounded text-amber-500 border-slate-300 focus:ring-amber-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{r.description}</p>
                      <p className="text-xs text-slate-500">{r.category}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-700 shrink-0 whitespace-nowrap">
                      {r.quantity} {r.unit}
                    </span>
                  </label>
                ))}

                <button
                  onClick={insertCalcResults}
                  disabled={!calcResults.some((_, i) => calcSelected[i])}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Add {calcResults.filter((_, i) => calcSelected[i]).length} Items to Estimate
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4 text-[10px] text-slate-400 font-medium">
          <span>↑↓ Navigate</span>
          <span>Enter Insert</span>
          <span>Esc Close</span>
          <span className="ml-auto">Click item to preview • Double-click to insert</span>
        </div>
      </div>
    </div>
  );
}
