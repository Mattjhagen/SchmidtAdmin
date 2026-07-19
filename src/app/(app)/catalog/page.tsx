'use client';
// Catalog Manager Page
// Location: src/app/catalog/page.tsx

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package, Wrench, Truck, Layers, FileText, Zap,
  Search, Plus, ChevronRight, ArrowLeft, Edit2,
  TrendingUp, DollarSign, Clock
} from 'lucide-react';
import {
  DEMO_CATALOG_ITEMS, DEMO_CATALOG_CATEGORIES, DEMO_MATERIALS,
  DEMO_LABOR, DEMO_EQUIPMENT, DEMO_ASSEMBLIES, DEMO_SNIPPETS
} from '@/lib/catalog';
import { CatalogItem, CatalogItemType } from '@/lib/types';

const TYPE_META: Record<CatalogItemType, { icon: React.ReactNode; label: string; color: string; bg: string; border: string }> = {
  material:  { icon: <Package  className="h-4 w-4" />, label: 'Materials',  color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  labor:     { icon: <Wrench   className="h-4 w-4" />, label: 'Labor',      color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  equipment: { icon: <Truck    className="h-4 w-4" />, label: 'Equipment',  color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  assembly:  { icon: <Layers   className="h-4 w-4" />, label: 'Assemblies', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  snippet:   { icon: <FileText className="h-4 w-4" />, label: 'Snippets',   color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  template:  { icon: <Zap      className="h-4 w-4" />, label: 'Templates',  color: 'text-slate-700',  bg: 'bg-slate-50',  border: 'border-slate-200' },
};

const ALL_TYPES: CatalogItemType[] = ['material', 'labor', 'equipment', 'assembly', 'snippet'];

function hydrateItems(): CatalogItem[] {
  return DEMO_CATALOG_ITEMS.map(item => {
    const category = DEMO_CATALOG_CATEGORIES.find(c => c.id === item.category_id);
    const hydrated: CatalogItem = { ...item, category };
    if (item.type === 'material')  hydrated.material  = DEMO_MATERIALS.find(m => m.catalog_item_id === item.id);
    if (item.type === 'labor')     hydrated.labor     = DEMO_LABOR.find(l => l.catalog_item_id === item.id);
    if (item.type === 'equipment') hydrated.equipment = DEMO_EQUIPMENT.find(e => e.catalog_item_id === item.id);
    if (item.type === 'assembly')  {
      const asm = DEMO_ASSEMBLIES.find(a => a.catalog_item_id === item.id);
      if (asm) hydrated.assembly = { ...asm, components: asm.components };
    }
    if (item.type === 'snippet')   hydrated.snippet   = DEMO_SNIPPETS.find(s => s.catalog_item_id === item.id);
    return hydrated;
  });
}

function getUnitCostDisplay(item: CatalogItem): string {
  if (item.type === 'material' && item.material)   return `$${item.material.unit_cost.toFixed(2)} / ${item.material.unit}`;
  if (item.type === 'labor' && item.labor)         return `$${item.labor.rate_per_hour.toFixed(2)} / HR`;
  if (item.type === 'equipment' && item.equipment) return `$${(item.equipment.daily_rate ?? 0).toFixed(2)} / DAY`;
  if (item.type === 'assembly' && item.assembly)   return `${item.assembly.components.length} components`;
  if (item.type === 'snippet' && item.snippet)     return item.snippet.insert_target.replace(/_/g, ' ');
  return '—';
}

function getMarkup(item: CatalogItem): string {
  if (item.type === 'material' && item.material)   return `${item.material.default_markup}%`;
  if (item.type === 'labor' && item.labor)         return `${item.labor.default_markup}%`;
  if (item.type === 'equipment' && item.equipment) return `${item.equipment.default_markup}%`;
  return '—';
}

export default function CatalogPage() {
  const ALL_ITEMS = useMemo(hydrateItems, []);
  const [query, setQuery]       = useState('');
  const [activeType, setActiveType] = useState<CatalogItemType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = ALL_ITEMS;
    if (activeType !== 'all') items = items.filter(i => i.type === activeType);
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.description ?? '').toLowerCase().includes(q) ||
        (i.search_tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    }
    return items;
  }, [ALL_ITEMS, query, activeType]);

  const countByType = useMemo(() =>
    ALL_TYPES.reduce((acc, t) => ({ ...acc, [t]: ALL_ITEMS.filter(i => i.type === t).length }), {} as Record<string, number>),
    [ALL_ITEMS]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-white leading-none">Catalog</h1>
              <p className="text-xs text-slate-400 mt-0.5">Materials · Labor · Equipment · Assemblies · Snippets</p>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search catalog…"
                className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-56"
              />
            </div>
            <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">

        {/* Sidebar */}
        <aside className="w-48 shrink-0 space-y-1">
          <button
            onClick={() => setActiveType('all')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
              ${activeType === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <span>All Items</span>
            <span className="text-xs bg-slate-600 text-slate-300 rounded-full px-2 py-0.5">{ALL_ITEMS.length}</span>
          </button>

          <div className="pt-2 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-3 mb-1">By Type</p>
          </div>

          {ALL_TYPES.map(type => {
            const meta = TYPE_META[type];
            const isActive = activeType === type;
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
                  ${isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <span className="flex items-center gap-2">
                  <span className={isActive ? 'text-amber-400' : 'text-slate-500'}>{meta.icon}</span>
                  {meta.label}
                </span>
                <span className="text-xs bg-slate-700 text-slate-400 rounded-full px-2 py-0.5">{countByType[type]}</span>
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { icon: <DollarSign className="h-4 w-4" />, label: 'Billable Items', value: ALL_ITEMS.filter(i => i.type !== 'snippet' && i.type !== 'template').length, color: 'text-amber-400' },
              { icon: <Layers     className="h-4 w-4" />, label: 'Assemblies',     value: countByType.assembly,  color: 'text-amber-400' },
              { icon: <FileText   className="h-4 w-4" />, label: 'Snippets',       value: countByType.snippet,   color: 'text-green-400' },
              { icon: <Clock      className="h-4 w-4" />, label: 'Labor Types',    value: countByType.labor,     color: 'text-orange-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-3.5">
                <div className={`flex items-center gap-1.5 mb-1 ${stat.color}`}>{stat.icon}</div>
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Results */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">
                {filtered.length} {activeType === 'all' ? 'items' : TYPE_META[activeType as CatalogItemType]?.label.toLowerCase()}
                {query && <span className="text-slate-500"> matching "{query}"</span>}
              </p>
            </div>

            <div className="divide-y divide-slate-800">
              {filtered.map(item => {
                const meta = TYPE_META[item.type];
                const isExpanded = expandedId === item.id;
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-slate-800/50 transition-colors cursor-pointer text-left"
                    >
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${meta.color} ${meta.bg} ${meta.border}`}>
                        {meta.icon} {meta.label.slice(0, -1)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-slate-500 truncate">{item.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-amber-400">{getUnitCostDisplay(item)}</p>
                        {getMarkup(item) !== '—' && (
                          <p className="text-[10px] text-slate-500">+{getMarkup(item)} markup</p>
                        )}
                      </div>
                      <ChevronRight className={`h-4 w-4 text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 bg-slate-800/30 border-t border-slate-800">
                        {item.type === 'assembly' && item.assembly && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2">Assembly Components</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {item.assembly.components.map(comp => {
                                const ci = DEMO_CATALOG_ITEMS.find(i => i.id === comp.component_id);
                                return (
                                  <div key={comp.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2 text-xs">
                                    <span className="text-slate-300 font-medium">{ci?.name ?? '—'}</span>
                                    <span className="text-slate-500">{comp.quantity} {comp.quantity_unit}</span>
                                  </div>
                                );
                              })}
                            </div>
                            {item.assembly.notes && <p className="text-xs text-slate-500 italic mt-2">{item.assembly.notes}</p>}
                          </div>
                        )}
                        {item.type === 'snippet' && item.snippet && (
                          <div className="mt-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Inserts into: {item.snippet.insert_target.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-slate-400 leading-relaxed bg-slate-800 rounded-lg p-3 border border-slate-700">
                              {item.snippet.content}
                            </p>
                          </div>
                        )}
                        {(item.type === 'material' || item.type === 'labor' || item.type === 'equipment') && (
                          <div className="mt-2 flex flex-wrap gap-4 text-xs">
                            {item.type === 'material' && item.material && (
                              <>
                                <div><span className="text-slate-500">Unit:</span> <span className="font-bold text-slate-200">{item.material.unit}</span></div>
                                <div><span className="text-slate-500">Cost:</span> <span className="font-bold text-amber-400">${item.material.unit_cost.toFixed(2)}</span></div>
                                <div><span className="text-slate-500">Default Markup:</span> <span className="font-bold text-slate-200">{item.material.default_markup}%</span></div>
                                <div><span className="text-slate-500">Taxable:</span> <span className="font-bold text-slate-200">{item.material.taxable ? 'Yes' : 'No'}</span></div>
                              </>
                            )}
                            {item.type === 'labor' && item.labor && (
                              <>
                                <div><span className="text-slate-500">Skill:</span> <span className="font-bold text-slate-200 capitalize">{item.labor.skill_type}</span></div>
                                <div><span className="text-slate-500">Rate:</span> <span className="font-bold text-amber-400">${item.labor.rate_per_hour.toFixed(2)}/HR</span></div>
                                <div><span className="text-slate-500">Markup:</span> <span className="font-bold text-slate-200">{item.labor.default_markup}%</span></div>
                              </>
                            )}
                            {item.type === 'equipment' && item.equipment && (
                              <>
                                <div><span className="text-slate-500">Daily:</span> <span className="font-bold text-amber-400">${(item.equipment.daily_rate ?? 0).toFixed(2)}</span></div>
                                <div><span className="text-slate-500">Weekly:</span> <span className="font-bold text-slate-200">${(item.equipment.weekly_rate ?? 0).toFixed(2)}</span></div>
                                <div><span className="text-slate-500">Markup:</span> <span className="font-bold text-slate-200">{item.equipment.default_markup}%</span></div>
                              </>
                            )}
                          </div>
                        )}
                        <div className="mt-3 flex gap-2">
                          <button className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors cursor-pointer">
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors cursor-pointer">
                            Duplicate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package className="h-10 w-10 text-slate-700 mb-3" />
                  <p className="text-slate-400 font-semibold">No items found</p>
                  <p className="text-slate-600 text-sm mt-1">Try a different search or type filter</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
