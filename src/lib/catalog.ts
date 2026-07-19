// Catalog Seed Data & Measurement Calculator Definitions
// Location: src/lib/catalog.ts
//
// This file provides:
// 1. DEMO_CATALOG — pre-loaded catalog items for Demo Mode (LocalStorage)
// 2. MEASUREMENT_TEMPLATES — calculator definitions for each job type

import {
  CatalogCategory,
  CatalogItem,
  MaterialDetail,
  LaborDetail,
  EquipmentDetail,
  AssemblyDetail,
  AssemblyComponent,
  SnippetDetail,
  MeasurementTemplate,
  MeasurementResult,
} from './types';

// ============================================================
// CATEGORIES
// ============================================================
export const DEMO_CATALOG_CATEGORIES: CatalogCategory[] = [
  { id: 'cat-concrete',    parent_id: null,            name: 'Concrete',           type: 'material',  sort_order: 1,  created_at: new Date().toISOString() },
  { id: 'cat-walls',       parent_id: null,            name: 'Retaining Walls',    type: 'material',  sort_order: 2,  created_at: new Date().toISOString() },
  { id: 'cat-drainage',    parent_id: null,            name: 'Drainage',           type: 'material',  sort_order: 3,  created_at: new Date().toISOString() },
  { id: 'cat-aggregate',   parent_id: null,            name: 'Aggregate & Base',   type: 'material',  sort_order: 4,  created_at: new Date().toISOString() },
  { id: 'cat-labor',       parent_id: null,            name: 'Labor',              type: 'labor',     sort_order: 5,  created_at: new Date().toISOString() },
  { id: 'cat-equipment',   parent_id: null,            name: 'Equipment',          type: 'equipment', sort_order: 6,  created_at: new Date().toISOString() },
  { id: 'cat-assemblies',  parent_id: null,            name: 'Assemblies',         type: 'assembly',  sort_order: 7,  created_at: new Date().toISOString() },
  { id: 'cat-snippets-scope',      parent_id: null,   name: 'Scope Snippets',     type: 'snippet',   sort_order: 8,  created_at: new Date().toISOString() },
  { id: 'cat-snippets-clauses',    parent_id: null,   name: 'Clause Snippets',    type: 'snippet',   sort_order: 9,  created_at: new Date().toISOString() },
  { id: 'cat-snippets-payment',    parent_id: null,   name: 'Payment Terms',      type: 'snippet',   sort_order: 10, created_at: new Date().toISOString() },
  { id: 'cat-snippets-warranty',   parent_id: null,   name: 'Warranty Language',  type: 'snippet',   sort_order: 11, created_at: new Date().toISOString() },
];

// ============================================================
// CATALOG ITEMS (base records)
// ============================================================
const now = new Date().toISOString();

export const DEMO_CATALOG_ITEMS: CatalogItem[] = [
  // --- MATERIALS ---
  { id: 'ci-concrete-4',      category_id: 'cat-concrete',   type: 'material',  name: '4" Concrete Slab',          description: '4-inch residential concrete slab, broom finish',       search_tags: ['concrete','slab','driveway','sidewalk','patio'], active: true, created_at: now, updated_at: now },
  { id: 'ci-concrete-5',      category_id: 'cat-concrete',   type: 'material',  name: '5" Commercial Slab',        description: '5-inch high-early commercial concrete slab',            search_tags: ['concrete','commercial','slab','heavy'],           active: true, created_at: now, updated_at: now },
  { id: 'ci-concrete-6',      category_id: 'cat-concrete',   type: 'material',  name: '6" Heavy-Duty Slab',        description: '6-inch reinforced heavy-duty concrete pour',            search_tags: ['concrete','heavy','reinforced','industrial'],      active: true, created_at: now, updated_at: now },
  { id: 'ci-allan-block',     category_id: 'cat-walls',      type: 'material',  name: 'Allan Block Install',       description: 'Allan Block segmental retaining wall installation',     search_tags: ['retaining','wall','block','allan','segmental'],    active: true, created_at: now, updated_at: now },
  { id: 'ci-keystone',        category_id: 'cat-walls',      type: 'material',  name: 'Keystone Block Install',    description: 'Keystone segmental retaining wall installation',        search_tags: ['retaining','wall','keystone','block'],             active: true, created_at: now, updated_at: now },
  { id: 'ci-versalok',        category_id: 'cat-walls',      type: 'material',  name: 'Versa-Lok Install',         description: 'Versa-Lok mortarless retaining wall system',           search_tags: ['retaining','wall','versalok','block'],             active: true, created_at: now, updated_at: now },
  { id: 'ci-capstone',        category_id: 'cat-walls',      type: 'material',  name: 'Cap Stone',                 description: 'Retaining wall cap stone, installed',                  search_tags: ['cap','capstone','wall','top'],                     active: true, created_at: now, updated_at: now },
  { id: 'ci-geogrid',         category_id: 'cat-walls',      type: 'material',  name: 'Geogrid Reinforcement',     description: 'Geogrid soil reinforcement fabric for wall stability',  search_tags: ['geogrid','grid','reinforcement','wall','fabric'],  active: true, created_at: now, updated_at: now },
  { id: 'ci-drain-tile-4',    category_id: 'cat-drainage',   type: 'material',  name: '4" Drain Tile (Perforated)',description: '4" perforated PVC drain pipe',                         search_tags: ['drain','tile','pipe','perforated','drainage','french'], active: true, created_at: now, updated_at: now },
  { id: 'ci-catch-basin',     category_id: 'cat-drainage',   type: 'material',  name: 'Catch Basin Install',       description: 'Catch basin with grate, installed',                    search_tags: ['catch','basin','grate','drain','drainage'],        active: true, created_at: now, updated_at: now },
  { id: 'ci-sump-system',     category_id: 'cat-drainage',   type: 'material',  name: 'Sump System Install',       description: 'Sump pump pit and system installation',                search_tags: ['sump','pump','basement','drainage','water'],       active: true, created_at: now, updated_at: now },
  { id: 'ci-filter-fabric',   category_id: 'cat-drainage',   type: 'material',  name: 'Filter Fabric / Geotextile',description: 'Non-woven geotextile filter fabric',                   search_tags: ['filter','fabric','geotextile','drainage','french'], active: true, created_at: now, updated_at: now },
  { id: 'ci-base-rock',       category_id: 'cat-aggregate',  type: 'material',  name: 'Base Rock (3/4" Clean)',    description: '3/4" clean crushed limestone base rock',               search_tags: ['base','rock','aggregate','gravel','limestone'],    active: true, created_at: now, updated_at: now },
  { id: 'ci-river-gravel',    category_id: 'cat-aggregate',  type: 'material',  name: 'River Gravel (Drain)',      description: 'Washed river gravel for drainage backfill',            search_tags: ['gravel','river','drainage','backfill'],            active: true, created_at: now, updated_at: now },
  { id: 'ci-rebar',           category_id: 'cat-concrete',   type: 'material',  name: 'Rebar (#4 Deformed)',       description: '#4 deformed steel rebar for concrete reinforcement',   search_tags: ['rebar','steel','reinforcement','concrete'],        active: true, created_at: now, updated_at: now },
  { id: 'ci-wire-mesh',       category_id: 'cat-concrete',   type: 'material',  name: 'Wire Mesh (6x6 W1.4)',      description: '6×6 W1.4 welded wire mesh for concrete slabs',         search_tags: ['wire','mesh','concrete','reinforcement','wwm'],    active: true, created_at: now, updated_at: now },

  // --- LABOR ---
  { id: 'ci-labor-excavation', category_id: 'cat-labor',     type: 'labor',     name: 'Excavation Labor',          description: 'Machine and hand excavation labor',                    search_tags: ['excavation','dig','labor','machine'],             active: true, created_at: now, updated_at: now },
  { id: 'ci-labor-demo',       category_id: 'cat-labor',     type: 'labor',     name: 'Demolition & Removal',      description: 'Demo, removal, and haul-away labor',                   search_tags: ['demo','demolition','removal','haul','labor'],      active: true, created_at: now, updated_at: now },
  { id: 'ci-labor-cleanup',    category_id: 'cat-labor',     type: 'labor',     name: 'Site Cleanup & Haul',       description: 'Final cleanup and debris hauling',                     search_tags: ['cleanup','haul','debris','site','labor'],          active: true, created_at: now, updated_at: now },
  { id: 'ci-labor-concrete',   category_id: 'cat-labor',     type: 'labor',     name: 'Concrete Pour & Finish',    description: 'Concrete forming, pouring, screeding, finishing',      search_tags: ['concrete','pour','finish','labor','forming'],      active: true, created_at: now, updated_at: now },
  { id: 'ci-labor-block',      category_id: 'cat-labor',     type: 'labor',     name: 'Block Installation Labor',  description: 'Retaining wall block setting and alignment labor',      search_tags: ['block','wall','labor','install','retaining'],      active: true, created_at: now, updated_at: now },
  { id: 'ci-labor-general',    category_id: 'cat-labor',     type: 'labor',     name: 'General Laborer',           description: 'General construction labor — hourly',                  search_tags: ['labor','general','hourly','helper'],               active: true, created_at: now, updated_at: now },

  // --- EQUIPMENT ---
  { id: 'ci-eq-skid',          category_id: 'cat-equipment', type: 'equipment', name: 'Skid Steer Loader',         description: 'Skid steer with operator — daily rate',                search_tags: ['skid','steer','machine','equipment','loader'],     active: true, created_at: now, updated_at: now },
  { id: 'ci-eq-excavator',     category_id: 'cat-equipment', type: 'equipment', name: 'Mini Excavator',            description: 'Mini excavator with operator — daily rate',            search_tags: ['excavator','mini','machine','equipment','dig'],    active: true, created_at: now, updated_at: now },
  { id: 'ci-eq-plate',         category_id: 'cat-equipment', type: 'equipment', name: 'Plate Compactor',           description: 'Plate compactor rental — daily rate',                  search_tags: ['compactor','plate','compact','equipment'],         active: true, created_at: now, updated_at: now },
  { id: 'ci-eq-concrete-saw',  category_id: 'cat-equipment', type: 'equipment', name: 'Concrete Saw (Walk-Behind)',description: 'Walk-behind concrete saw rental — daily rate',          search_tags: ['saw','concrete','cut','equipment','blade'],        active: true, created_at: now, updated_at: now },

  // --- ASSEMBLIES ---
  { id: 'ci-asm-french-drain', category_id: 'cat-assemblies',type: 'assembly',  name: 'French Drain (per LF)',     description: 'Complete French drain assembly: trench, tile, fabric, gravel, labor', search_tags: ['french','drain','drainage','assembly','trench','tile'], active: true, created_at: now, updated_at: now },
  { id: 'ci-asm-allan-wall',   category_id: 'cat-assemblies',type: 'assembly',  name: 'Retaining Wall — Allan Block', description: 'Full retaining wall assembly: excavation, block, cap, base rock, drain tile, geogrid', search_tags: ['retaining','wall','allan','block','assembly'], active: true, created_at: now, updated_at: now },
  { id: 'ci-asm-concrete-dw',  category_id: 'cat-assemblies',type: 'assembly',  name: 'Concrete Driveway (4")',    description: 'Complete 4" concrete driveway assembly: sub-grade, mesh, pour, finish', search_tags: ['concrete','driveway','assembly','slab','4 inch'], active: true, created_at: now, updated_at: now },
  { id: 'ci-asm-catch-basin',  category_id: 'cat-assemblies',type: 'assembly',  name: 'Catch Basin Install',       description: 'Catch basin installation with drain tile and base rock', search_tags: ['catch','basin','assembly','drainage','grate'], active: true, created_at: now, updated_at: now },

  // --- SNIPPETS ---
  { id: 'ci-snip-concrete-disc', category_id: 'cat-snippets-clauses', type: 'snippet', name: 'Concrete Disclaimer',      description: 'Standard concrete cracking and color variation disclaimer', search_tags: ['concrete','disclaimer','cracking','color','variation'], active: true, created_at: now, updated_at: now },
  { id: 'ci-snip-drainage-wty',  category_id: 'cat-snippets-warranty',type: 'snippet', name: 'Drainage Warranty (2yr)',   description: '2-year drainage workmanship warranty language',             search_tags: ['drainage','warranty','2 year','workmanship'],           active: true, created_at: now, updated_at: now },
  { id: 'ci-snip-cleanup',       category_id: 'cat-snippets-scope',   type: 'snippet', name: 'Cleanup Clause',            description: 'Daily cleanup and final site restoration statement',       search_tags: ['cleanup','haul','debris','site'],                       active: true, created_at: now, updated_at: now },
  { id: 'ci-snip-permit',        category_id: 'cat-snippets-clauses', type: 'snippet', name: 'Permit Language',           description: 'Permit responsibility and allowance clause',               search_tags: ['permit','allowance','city','compliance'],               active: true, created_at: now, updated_at: now },
  { id: 'ci-snip-weather',       category_id: 'cat-snippets-clauses', type: 'snippet', name: 'Weather Delay Clause',      description: 'Timeline extension for adverse weather conditions',         search_tags: ['weather','delay','rain','freeze','timeline'],           active: true, created_at: now, updated_at: now },
  { id: 'ci-snip-pay-503020',    category_id: 'cat-snippets-payment', type: 'snippet', name: 'Payment Terms (50/30/20)',  description: '50% deposit / 30% at material delivery / 20% completion',  search_tags: ['payment','terms','deposit','schedule'],                 active: true, created_at: now, updated_at: now },
  { id: 'ci-snip-pay-net30',     category_id: 'cat-snippets-payment', type: 'snippet', name: 'Payment Terms (Net 30)',    description: 'Net 30 commercial invoice payment terms',                  search_tags: ['payment','net 30','commercial','invoice'],              active: true, created_at: now, updated_at: now },
  { id: 'ci-snip-safety',        category_id: 'cat-snippets-clauses', type: 'snippet', name: 'Safety Notice',             description: 'OSHA safety compliance and site access restriction notice', search_tags: ['safety','osha','notice','access','site'],               active: true, created_at: now, updated_at: now },
  { id: 'ci-snip-homeowner',     category_id: 'cat-snippets-clauses', type: 'snippet', name: 'Homeowner Responsibility',  description: 'Homeowner access, utility mark, and area prep responsibilities', search_tags: ['homeowner','responsibility','utilities','access'],      active: true, created_at: now, updated_at: now },
  { id: 'ci-snip-wty-standard',  category_id: 'cat-snippets-warranty',type: 'snippet', name: 'Standard Workmanship Warranty', description: '1-year standard workmanship warranty language',         search_tags: ['warranty','workmanship','1 year','standard'],           active: true, created_at: now, updated_at: now },
];

// ============================================================
// MATERIAL DETAILS
// ============================================================
export const DEMO_MATERIALS: MaterialDetail[] = [
  { id: 'md-concrete-4',     catalog_item_id: 'ci-concrete-4',     unit: 'SF',  unit_cost: 6.50,   default_markup: 35, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-concrete-5',     catalog_item_id: 'ci-concrete-5',     unit: 'SF',  unit_cost: 8.25,   default_markup: 35, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-concrete-6',     catalog_item_id: 'ci-concrete-6',     unit: 'SF',  unit_cost: 10.00,  default_markup: 35, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-allan-block',    catalog_item_id: 'ci-allan-block',    unit: 'SF',  unit_cost: 28.00,  default_markup: 40, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-keystone',       catalog_item_id: 'ci-keystone',       unit: 'SF',  unit_cost: 32.00,  default_markup: 40, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-versalok',       catalog_item_id: 'ci-versalok',       unit: 'SF',  unit_cost: 35.00,  default_markup: 40, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-capstone',       catalog_item_id: 'ci-capstone',       unit: 'LF',  unit_cost: 12.00,  default_markup: 35, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-geogrid',        catalog_item_id: 'ci-geogrid',        unit: 'SF',  unit_cost: 0.65,   default_markup: 30, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-drain-tile-4',   catalog_item_id: 'ci-drain-tile-4',   unit: 'LF',  unit_cost: 1.85,   default_markup: 30, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-catch-basin',    catalog_item_id: 'ci-catch-basin',    unit: 'EA',  unit_cost: 450.00, default_markup: 35, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-sump-system',    catalog_item_id: 'ci-sump-system',    unit: 'EA',  unit_cost: 1800.00,default_markup: 30, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-filter-fabric',  catalog_item_id: 'ci-filter-fabric',  unit: 'LF',  unit_cost: 0.55,   default_markup: 25, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-base-rock',      catalog_item_id: 'ci-base-rock',      unit: 'TON', unit_cost: 32.00,  default_markup: 20, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-river-gravel',   catalog_item_id: 'ci-river-gravel',   unit: 'TON', unit_cost: 28.00,  default_markup: 20, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-rebar',          catalog_item_id: 'ci-rebar',           unit: 'LF',  unit_cost: 0.95,   default_markup: 25, taxable: false, supplier_id: null, last_price_date: null },
  { id: 'md-wire-mesh',      catalog_item_id: 'ci-wire-mesh',       unit: 'SF',  unit_cost: 0.45,   default_markup: 25, taxable: false, supplier_id: null, last_price_date: null },
];

// ============================================================
// LABOR DETAILS
// ============================================================
export const DEMO_LABOR: LaborDetail[] = [
  { id: 'ld-excavation', catalog_item_id: 'ci-labor-excavation', skill_type: 'operator',  rate_per_hour: 85, burden_rate: 0, default_markup: 25 },
  { id: 'ld-demo',       catalog_item_id: 'ci-labor-demo',       skill_type: 'laborer',   rate_per_hour: 75, burden_rate: 0, default_markup: 25 },
  { id: 'ld-cleanup',    catalog_item_id: 'ci-labor-cleanup',    skill_type: 'laborer',   rate_per_hour: 65, burden_rate: 0, default_markup: 25 },
  { id: 'ld-concrete',   catalog_item_id: 'ci-labor-concrete',   skill_type: 'finisher',  rate_per_hour: 80, burden_rate: 0, default_markup: 30 },
  { id: 'ld-block',      catalog_item_id: 'ci-labor-block',      skill_type: 'mason',     rate_per_hour: 90, burden_rate: 0, default_markup: 30 },
  { id: 'ld-general',    catalog_item_id: 'ci-labor-general',    skill_type: 'laborer',   rate_per_hour: 60, burden_rate: 0, default_markup: 25 },
];

// ============================================================
// EQUIPMENT DETAILS
// ============================================================
export const DEMO_EQUIPMENT: EquipmentDetail[] = [
  { id: 'ed-skid',         catalog_item_id: 'ci-eq-skid',        rate_type: 'daily', hourly_rate: null, daily_rate: 650,  weekly_rate: 2800, default_markup: 15 },
  { id: 'ed-excavator',    catalog_item_id: 'ci-eq-excavator',   rate_type: 'daily', hourly_rate: null, daily_rate: 550,  weekly_rate: 2400, default_markup: 15 },
  { id: 'ed-plate',        catalog_item_id: 'ci-eq-plate',       rate_type: 'daily', hourly_rate: null, daily_rate: 125,  weekly_rate: 450,  default_markup: 15 },
  { id: 'ed-concrete-saw', catalog_item_id: 'ci-eq-concrete-saw',rate_type: 'daily', hourly_rate: null, daily_rate: 185,  weekly_rate: 650,  default_markup: 15 },
];

// ============================================================
// ASSEMBLY DETAILS & COMPONENTS
// ============================================================
export const DEMO_ASSEMBLIES: AssemblyDetail[] = [
  {
    id: 'ad-french-drain',
    catalog_item_id: 'ci-asm-french-drain',
    notes: 'Quantities are per linear foot of drain run. Adjust for depth.',
    components: [
      { id: 'acp-fd-1', assembly_id: 'ad-french-drain', component_id: 'ci-drain-tile-4',   quantity: 1,    quantity_unit: 'LF',  quantity_formula: null, sort_order: 1 },
      { id: 'acp-fd-2', assembly_id: 'ad-french-drain', component_id: 'ci-filter-fabric',  quantity: 1,    quantity_unit: 'LF',  quantity_formula: null, sort_order: 2 },
      { id: 'acp-fd-3', assembly_id: 'ad-french-drain', component_id: 'ci-river-gravel',   quantity: 0.04, quantity_unit: 'TON', quantity_formula: null, sort_order: 3 },
      { id: 'acp-fd-4', assembly_id: 'ad-french-drain', component_id: 'ci-labor-excavation',quantity: 0.15,quantity_unit: 'HR',  quantity_formula: null, sort_order: 4 },
      { id: 'acp-fd-5', assembly_id: 'ad-french-drain', component_id: 'ci-labor-cleanup',  quantity: 0.05, quantity_unit: 'HR',  quantity_formula: null, sort_order: 5 },
    ],
  },
  {
    id: 'ad-allan-wall',
    catalog_item_id: 'ci-asm-allan-wall',
    notes: 'Per square face foot of wall. Geogrid included for walls over 3ft.',
    components: [
      { id: 'acp-aw-1', assembly_id: 'ad-allan-wall', component_id: 'ci-allan-block',       quantity: 1,    quantity_unit: 'SF',  quantity_formula: null, sort_order: 1 },
      { id: 'acp-aw-2', assembly_id: 'ad-allan-wall', component_id: 'ci-capstone',           quantity: 0.2,  quantity_unit: 'LF',  quantity_formula: null, sort_order: 2 },
      { id: 'acp-aw-3', assembly_id: 'ad-allan-wall', component_id: 'ci-base-rock',          quantity: 0.05, quantity_unit: 'TON', quantity_formula: null, sort_order: 3 },
      { id: 'acp-aw-4', assembly_id: 'ad-allan-wall', component_id: 'ci-drain-tile-4',       quantity: 0.25, quantity_unit: 'LF',  quantity_formula: null, sort_order: 4 },
      { id: 'acp-aw-5', assembly_id: 'ad-allan-wall', component_id: 'ci-geogrid',            quantity: 0.8,  quantity_unit: 'SF',  quantity_formula: null, sort_order: 5 },
      { id: 'acp-aw-6', assembly_id: 'ad-allan-wall', component_id: 'ci-labor-excavation',   quantity: 0.1,  quantity_unit: 'HR',  quantity_formula: null, sort_order: 6 },
      { id: 'acp-aw-7', assembly_id: 'ad-allan-wall', component_id: 'ci-labor-block',        quantity: 0.2,  quantity_unit: 'HR',  quantity_formula: null, sort_order: 7 },
    ],
  },
  {
    id: 'ad-concrete-dw',
    catalog_item_id: 'ci-asm-concrete-dw',
    notes: 'Per square foot of 4" concrete driveway/patio slab.',
    components: [
      { id: 'acp-cd-1', assembly_id: 'ad-concrete-dw', component_id: 'ci-concrete-4',       quantity: 1,    quantity_unit: 'SF',  quantity_formula: null, sort_order: 1 },
      { id: 'acp-cd-2', assembly_id: 'ad-concrete-dw', component_id: 'ci-wire-mesh',         quantity: 1,    quantity_unit: 'SF',  quantity_formula: null, sort_order: 2 },
      { id: 'acp-cd-3', assembly_id: 'ad-concrete-dw', component_id: 'ci-base-rock',         quantity: 0.025,quantity_unit: 'TON', quantity_formula: null, sort_order: 3 },
      { id: 'acp-cd-4', assembly_id: 'ad-concrete-dw', component_id: 'ci-labor-concrete',    quantity: 0.05, quantity_unit: 'HR',  quantity_formula: null, sort_order: 4 },
      { id: 'acp-cd-5', assembly_id: 'ad-concrete-dw', component_id: 'ci-labor-cleanup',     quantity: 0.01, quantity_unit: 'HR',  quantity_formula: null, sort_order: 5 },
    ],
  },
  {
    id: 'ad-catch-basin',
    catalog_item_id: 'ci-asm-catch-basin',
    notes: 'Per catch basin installation with 10LF of outlet drain tile.',
    components: [
      { id: 'acp-cb-1', assembly_id: 'ad-catch-basin', component_id: 'ci-catch-basin',      quantity: 1,    quantity_unit: 'EA',  quantity_formula: null, sort_order: 1 },
      { id: 'acp-cb-2', assembly_id: 'ad-catch-basin', component_id: 'ci-drain-tile-4',      quantity: 10,   quantity_unit: 'LF',  quantity_formula: null, sort_order: 2 },
      { id: 'acp-cb-3', assembly_id: 'ad-catch-basin', component_id: 'ci-base-rock',         quantity: 0.3,  quantity_unit: 'TON', quantity_formula: null, sort_order: 3 },
      { id: 'acp-cb-4', assembly_id: 'ad-catch-basin', component_id: 'ci-labor-excavation',  quantity: 2,    quantity_unit: 'HR',  quantity_formula: null, sort_order: 4 },
    ],
  },
];

// ============================================================
// SNIPPET DETAILS
// ============================================================
export const DEMO_SNIPPETS: SnippetDetail[] = [
  {
    id: 'sd-concrete-disc',
    catalog_item_id: 'ci-snip-concrete-disc',
    insert_target: 'exclusions',
    content: 'Concrete is a natural material subject to minor cracking due to thermal expansion, shrinkage, and settlement. Schmidt Construction is not responsible for hairline cracks or color variation that fall within industry-standard tolerances. Control joints are placed to manage — not eliminate — cracking.'
  },
  {
    id: 'sd-drainage-wty',
    catalog_item_id: 'ci-snip-drainage-wty',
    insert_target: 'warranty_notes',
    content: 'Schmidt Construction warrants all drainage work against defects in materials and workmanship for a period of two (2) years from the date of substantial completion. This warranty does not cover damage caused by tree root intrusion, ground movement, acts of nature, or modifications made by others.'
  },
  {
    id: 'sd-cleanup',
    catalog_item_id: 'ci-snip-cleanup',
    insert_target: 'scope_of_work',
    content: 'Daily site cleanup will be performed throughout the project. Upon completion, all excess material, packaging, and construction debris will be removed and the job site will be left in broom-clean condition. Excess spoils and materials will be hauled off-site.'
  },
  {
    id: 'sd-permit',
    catalog_item_id: 'ci-snip-permit',
    insert_target: 'assumptions',
    content: 'All required city, county, or municipal permits are the responsibility of the property owner unless otherwise noted as a line item in this proposal. Schmidt Construction will coordinate with the appropriate permitting authority upon receipt of permit authorization from the owner.'
  },
  {
    id: 'sd-weather',
    catalog_item_id: 'ci-snip-weather',
    insert_target: 'assumptions',
    content: 'Quoted timelines assume normal working conditions. Delays due to adverse weather (sustained rain, temperatures below 40°F for concrete work, or conditions deemed unsafe) will extend the project schedule accordingly. No additional cost will be charged for weather-related delays.'
  },
  {
    id: 'sd-pay-503020',
    catalog_item_id: 'ci-snip-pay-503020',
    insert_target: 'payment_terms',
    content: '50% due at contract signing / mobilization. 30% due upon material delivery to job site. 20% due upon substantial completion and client walkthrough. Final payment due within 5 business days of completion. Unpaid balances accrue 1.5% per month interest after 30 days.'
  },
  {
    id: 'sd-pay-net30',
    catalog_item_id: 'ci-snip-pay-net30',
    insert_target: 'payment_terms',
    content: 'Net 30 commercial terms. Invoice will be submitted upon project completion. Payment due within 30 days of invoice date. A service charge of 1.5% per month (18% annually) will be applied to past-due balances. Lien rights reserved per Nebraska statutes.'
  },
  {
    id: 'sd-safety',
    catalog_item_id: 'ci-snip-safety',
    insert_target: 'assumptions',
    content: 'Schmidt Construction complies with all applicable OSHA safety regulations. The active construction area will be barricaded and clearly marked. Unauthorized entry into the work zone is prohibited. Property owner is responsible for keeping children, pets, and non-essential personnel clear of the work area during all phases of construction.'
  },
  {
    id: 'sd-homeowner',
    catalog_item_id: 'ci-snip-homeowner',
    insert_target: 'assumptions',
    content: 'Property owner agrees to: (1) have all underground utilities located and marked prior to excavation, (2) provide unobstructed access to the work area during scheduled work hours, (3) remove personal property, landscaping, or obstructions from the work zone prior to mobilization. Failure to do so may result in schedule delays and additional charges.'
  },
  {
    id: 'sd-wty-standard',
    catalog_item_id: 'ci-snip-wty-standard',
    insert_target: 'warranty_notes',
    content: 'Schmidt Construction warrants all labor and workmanship for a period of one (1) year from the date of substantial completion. Manufacturer warranties on materials (if any) are passed through to the owner. This warranty does not cover damage from misuse, neglect, acts of nature, or modifications by others.'
  },
];

// ============================================================
// MEASUREMENT CALCULATORS
// ============================================================

export const MEASUREMENT_TEMPLATES: MeasurementTemplate[] = [
  {
    jobType: 'retaining_wall',
    name: 'Retaining Wall Calculator',
    icon: '🧱',
    inputs: [
      { key: 'length', label: 'Wall Length',  unit: 'ft',  type: 'number', default: 40 },
      { key: 'height', label: 'Wall Height',  unit: 'ft',  type: 'number', default: 3  },
      {
        key: 'blockType', label: 'Block Type', unit: '', type: 'select',
        options: [
          { label: 'Allan Block ($28/SF)',  value: 28 },
          { label: 'Keystone ($32/SF)',     value: 32 },
          { label: 'Versa-Lok ($35/SF)',    value: 35 },
        ],
        default: 28,
      },
    ],
    calculate(inputs) {
      const { length, height, blockType } = inputs;
      const faceSF = length * height;
      const results: MeasurementResult[] = [
        { catalogItemName: 'Demolition & Removal',        quantity: Math.ceil(length * 0.5),      unit: 'HR',  description: 'Demo existing wall, haul debris',                     category: 'Demo' },
        { catalogItemName: 'Excavation Labor',            quantity: Math.ceil(faceSF * 0.1),      unit: 'HR',  description: 'Excavate for wall base and batter',                   category: 'Labor' },
        { catalogItemName: height > 3 ? 'Versa-Lok Install' : 'Allan Block Install', quantity: Math.ceil(faceSF * 1.05), unit: 'SF', description: `${length} LF × ${height} FT retaining wall (5% waste)`, category: 'Walls' },
        { catalogItemName: 'Cap Stone',                   quantity: Math.ceil(length * 1.05),     unit: 'LF',  description: 'Wall cap stone',                                      category: 'Walls' },
        { catalogItemName: 'Base Rock (3/4" Clean)',      quantity: +(length * 0.06).toFixed(1),  unit: 'TON', description: 'Compacted base rock for wall footing',                category: 'Aggregate' },
        { catalogItemName: '4" Drain Tile (Perforated)',  quantity: Math.ceil(length * 1.05),     unit: 'LF',  description: 'Drainage tile behind wall base',                      category: 'Drainage' },
        ...(height > 3 ? [{ catalogItemName: 'Geogrid Reinforcement', quantity: Math.ceil(faceSF * 0.85), unit: 'SF', description: 'Geogrid soil reinforcement (walls >3ft)', category: 'Walls' }] : []),
        { catalogItemName: 'Block Installation Labor',    quantity: Math.ceil(faceSF * 0.2),      unit: 'HR',  description: 'Block setting and alignment',                         category: 'Labor' },
        { catalogItemName: 'Site Cleanup & Haul',         quantity: Math.ceil(length * 0.1),      unit: 'HR',  description: 'Final cleanup',                                       category: 'Labor' },
      ];
      return results;
    },
  },

  {
    jobType: 'concrete_slab',
    name: 'Concrete Slab Calculator',
    icon: '⬜',
    inputs: [
      { key: 'length',    label: 'Slab Length',    unit: 'ft',  type: 'number', default: 20 },
      { key: 'width',     label: 'Slab Width',     unit: 'ft',  type: 'number', default: 12 },
      {
        key: 'thickness', label: 'Thickness',      unit: '',    type: 'select',
        options: [
          { label: '4" Residential', value: 4 },
          { label: '5" Commercial',  value: 5 },
          { label: '6" Heavy-Duty',  value: 6 },
        ],
        default: 4,
      },
    ],
    calculate(inputs) {
      const { length, width, thickness } = inputs;
      const sf = length * width;
      const cy = +((sf * (thickness / 12)) / 27 * 1.05).toFixed(1); // cubic yards with 5% waste
      const slabItem = thickness === 4 ? '4" Concrete Slab' : thickness === 5 ? '5" Commercial Slab' : '6" Heavy-Duty Slab';
      return [
        { catalogItemName: 'Excavation Labor',          quantity: Math.ceil(sf * 0.02),    unit: 'HR',  description: 'Grade and prepare sub-base',                    category: 'Labor' },
        { catalogItemName: 'Base Rock (3/4" Clean)',     quantity: +(sf * 0.025).toFixed(1),unit: 'TON', description: '4" compacted base rock sub-grade',              category: 'Aggregate' },
        { catalogItemName: 'Wire Mesh (6x6 W1.4)',       quantity: Math.ceil(sf * 1.1),     unit: 'SF',  description: 'Welded wire mesh reinforcement (10% overlap)',   category: 'Concrete' },
        { catalogItemName: slabItem,                     quantity: Math.ceil(sf * 1.02),    unit: 'SF',  description: `${length}×${width}ft, ${thickness}" thick slab`, category: 'Concrete' },
        { catalogItemName: 'Concrete Pour & Finish',     quantity: Math.ceil(sf * 0.05),    unit: 'HR',  description: 'Pour, screed, finish, and cure',                 category: 'Labor' },
        { catalogItemName: 'Site Cleanup & Haul',        quantity: Math.ceil(sf * 0.01),    unit: 'HR',  description: 'Strip forms and final cleanup',                  category: 'Labor' },
      ];
    },
  },

  {
    jobType: 'french_drain',
    name: 'French Drain Calculator',
    icon: '🌊',
    inputs: [
      { key: 'length', label: 'Drain Run Length', unit: 'ft', type: 'number', default: 80 },
      {
        key: 'depth', label: 'Trench Depth',  unit: '', type: 'select',
        options: [
          { label: '12" shallow',  value: 12 },
          { label: '18" standard', value: 18 },
          { label: '24" deep',     value: 24 },
        ],
        default: 18,
      },
    ],
    calculate(inputs) {
      const { length, depth } = inputs;
      const depthFactor = depth === 12 ? 0.8 : depth === 18 ? 1.0 : 1.3;
      return [
        { catalogItemName: 'Excavation Labor',           quantity: Math.ceil(length * 0.15 * depthFactor), unit: 'HR',  description: `Trench excavation, ${depth}" deep`,          category: 'Labor' },
        { catalogItemName: '4" Drain Tile (Perforated)', quantity: Math.ceil(length * 1.05),               unit: 'LF',  description: '4" perforated drain tile (5% fittings)',       category: 'Drainage' },
        { catalogItemName: 'Filter Fabric / Geotextile', quantity: Math.ceil(length * 1.1),                unit: 'LF',  description: 'Geotextile wrap around drain tile',            category: 'Drainage' },
        { catalogItemName: 'River Gravel (Drain)',        quantity: +(length * 0.04 * depthFactor).toFixed(1), unit: 'TON', description: 'Washed gravel backfill',               category: 'Aggregate' },
        { catalogItemName: 'Site Cleanup & Haul',         quantity: Math.ceil(length * 0.05),               unit: 'HR',  description: 'Spoil haul and site cleanup',                 category: 'Labor' },
      ];
    },
  },
];

// ============================================================
// HELPER: resolve catalog item name → line item fields for proposal editor
// ============================================================
export function catalogItemToLineItem(
  item: CatalogItem,
  quantity: number,
): Omit<import('./types').ProposalLineItem, 'id' | 'proposal_version_id'> {
  let unit_cost = 0;
  let markup_percent = 35;
  let unit = 'EA';

  if (item.type === 'material' && item.material) {
    unit_cost = item.material.unit_cost;
    markup_percent = item.material.default_markup;
    unit = item.material.unit;
  } else if (item.type === 'labor' && item.labor) {
    unit_cost = item.labor.rate_per_hour;
    markup_percent = item.labor.default_markup;
    unit = 'HR';
  } else if (item.type === 'equipment' && item.equipment) {
    unit_cost = item.equipment.daily_rate ?? item.equipment.hourly_rate ?? 0;
    markup_percent = item.equipment.default_markup;
    unit = item.equipment.rate_type === 'hourly' ? 'HR' : item.equipment.rate_type === 'weekly' ? 'WK' : 'DAY';
  }

  const line_total = quantity * unit_cost * (1 + markup_percent / 100);

  return {
    category: item.category?.name ?? item.type,
    description: item.description || item.name,
    quantity,
    unit,
    unit_cost,
    markup_percent,
    line_total,
    optional: false,
  };
}
