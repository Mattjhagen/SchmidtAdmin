// Unified Database Client Adapter (Supabase + LocalStorage Fallback)
// Location: src/lib/db.ts

import { createClient } from '@supabase/supabase-js';
import {
  Client,
  Project,
  Proposal,
  ProposalVersion,
  ProposalLineItem,
  NegotiationEvent,
  ProposalStatus,
  SavedProposalOption,
} from './types';
import { PROPOSAL_TEMPLATES } from './templates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
export const isDemoMode = !isSupabaseConfigured;

// Standard Supabase Client (only instantiated if credentials exist)
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Helper to generate a random UUID locally
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// -------------------------------------------------------------
// SEED MOCK DATA FOR LOCAL STORAGE
// -------------------------------------------------------------
const MOCK_CLIENTS: Client[] = [
  {
    id: 'c-john-doe',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '(402) 555-0100',
    address: '123 Maple St, Omaha, NE 68102',
    notes: 'Preferred client. Met at Home & Garden show. Prefers text updates.',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'c-jane-smith',
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    phone: '(402) 555-0211',
    address: '456 Oak Dr, Bellevue, NE 68005',
    notes: 'Needs drainage work before septic inspection. High urgency.',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'c-omaha-bakery',
    name: 'Omaha Bakery (Attn: Marcus)',
    email: 'marcus@omahabread.com',
    phone: '(402) 555-0322',
    address: '789 Broadway, Omaha, NE 68108',
    notes: 'Small commercial client. Repair work at delivery bay entrance.',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'c-bob-johnson',
    name: 'Bob Johnson',
    email: 'bob.johnson@email.com',
    phone: '(402) 555-0455',
    address: '321 Pine St, La Vista, NE 68128',
    notes: 'Referral from John Doe. Complete kitchen redesign.',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_PROJECTS: Project[] = [
  {
    id: 'p-backyard-remodel',
    client_id: 'c-john-doe',
    name: 'Backyard Retaining Wall & Patio',
    type: 'retaining wall',
    job_site_address: '123 Maple St, Omaha, NE 68102',
    description: 'Replace crumbling wooden railroad tie wall with segmental concrete blocks, grade yard and install concrete patio.',
    desired_start_date: '2026-08-15',
    status: 'Active',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'p-drainage-correction',
    client_id: 'c-jane-smith',
    name: 'Foundation Drainage System',
    type: 'drainage',
    job_site_address: '456 Oak Dr, Bellevue, NE 68005',
    description: 'French drain installation along East side slope, reroute gutter downspouts underground to curb discharge.',
    desired_start_date: '2026-07-20',
    status: 'Planning',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'p-bakery-sidewalk',
    client_id: 'c-omaha-bakery',
    name: 'Delivery Entrance Concrete Repair',
    type: 'commercial',
    job_site_address: '789 Broadway, Omaha, NE 68108',
    description: 'Trip hazard grinding on pedestrian path, swap 3 cracked sidewalk slabs for 5" high-early concrete pour.',
    desired_start_date: '2026-07-10',
    status: 'Planning',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'p-kitchen-renovation',
    client_id: 'c-bob-johnson',
    name: 'Modern Shaker Kitchen Remodel',
    type: 'kitchen remodel',
    job_site_address: '321 Pine St, La Vista, NE 68128',
    description: 'Complete gut kitchen remodel, Custom Shaker Cabinets, Quartz Countertops, LVP Flooring, electrical relocations.',
    desired_start_date: '2026-09-01',
    status: 'Planning',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'prop-john-doe-1',
    project_id: 'p-backyard-remodel',
    proposal_number: 'SCH-2026-1001',
    current_version_id: 'pv-john-doe-v2',
    status: 'Accepted',
    share_token: 'token-john-doe-1',
    expiration_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prop-jane-smith-1',
    project_id: 'p-drainage-correction',
    proposal_number: 'SCH-2026-1002',
    current_version_id: 'pv-jane-smith-v1',
    status: 'Sent',
    share_token: 'token-jane-smith-1',
    expiration_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prop-bakery-1',
    project_id: 'p-bakery-sidewalk',
    proposal_number: 'SCH-2026-1003',
    current_version_id: 'pv-bakery-v1',
    status: 'Draft',
    share_token: 'token-bakery-1',
    expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prop-bob-johnson-1',
    project_id: 'p-kitchen-renovation',
    proposal_number: 'SCH-2026-1004',
    current_version_id: 'pv-bob-johnson-v2',
    status: 'Revised',
    share_token: 'token-bob-johnson-1',
    expiration_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expires in 2 days
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_PROPOSAL_VERSIONS: ProposalVersion[] = [
  // John Doe V1
  {
    id: 'pv-john-doe-v1',
    proposal_id: 'prop-john-doe-1',
    version_number: 1,
    title: 'Backyard Segmental block Retaining Wall (No Patio)',
    scope_of_work: 'Demolish and dispose of crumbling timber retaining wall. Excavate slope and install 80 LF of segmental block retaining wall, 4ft high. Includes geogrid soil reinforcement and gravel drainage line.',
    assumptions: '1. Machine access is available.\n2. Standard soils.',
    exclusions: '1. Permits.\n2. Patio installation or grading yard for patio.',
    timeline: '5 business days.',
    payment_terms: '50% deposit, 50% upon completion.',
    warranty_notes: '5-year workmanship warranty.',
    subtotal: 5840,
    tax: 408.80,
    discount: 0,
    total: 6248.80,
    internal_notes: 'Original scope did not include the concrete patio John wants.',
    client_message: 'Hi John, here is the estimate for the retaining wall replacement as we discussed.',
    created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
  },
  // John Doe V2
  {
    id: 'pv-john-doe-v2',
    proposal_id: 'prop-john-doe-1',
    version_number: 2,
    title: 'Retaining Wall Replacement & 12x15 Concrete Patio Combo',
    scope_of_work: 'Demolish wood tie retaining wall, build 80 LF segmental concrete block wall. Excavate patio space, set formwork, lay rebar reinforcement, and pour 600 SF concrete slab with a medium broom finish.',
    assumptions: '1. Access for skid steer.\n2. Ready-mix truck can park within 50ft.',
    exclusions: '1. Building permits.\n2. Colored stamping (retains normal gray concrete).',
    timeline: '7 to 8 business days.',
    payment_terms: '30% deposit, 40% material delivery, 30% completion.',
    warranty_notes: '5-year wall workmanship, 2-year concrete crack warranty.',
    subtotal: 10440,
    tax: 730.80,
    discount: 500, // Combo discount
    total: 10670.80,
    internal_notes: 'Offered a $500 multi-service discount to close the deal.',
    client_message: 'Hi John, here is the updated version incorporating the concrete patio with a bundle discount.',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Jane Smith V1
  {
    id: 'pv-jane-smith-v1',
    proposal_id: 'prop-jane-smith-1',
    version_number: 1,
    title: 'French Drain & Yard Drainage System',
    scope_of_work: 'Excavate 100 LF of drainage trench, 15" deep. Line with geotextile fabric. Install 4" rigid perforated PVC pipe, backfill with clean river gravel. Route gutter downspouts underground. Re-lay sod.',
    assumptions: '1. Easy trenching (no ledge rock).\n2. Sprinklers will be flagged.',
    exclusions: '1. Irrigation system repair.',
    timeline: '2 business days.',
    payment_terms: '50% deposit, 50% completion.',
    warranty_notes: '1-year workmanship warranty.',
    subtotal: 3800,
    tax: 0,
    discount: 0,
    total: 3800,
    internal_notes: 'Jane needs this done immediately. Prioritize scheduling.',
    client_message: 'Hi Jane, here is our proposal for correcting the standing water issue along the east fence line.',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Marcus Bakery V1
  {
    id: 'pv-bakery-v1',
    proposal_id: 'prop-bakery-1',
    version_number: 1,
    title: 'Commercial Sidewalk & Grind Trip Hazards',
    scope_of_work: 'Grind 12 pedestrian sidewalk joint offsets (ADA compliance). Saw cut and remove 160 SF of spalled concrete slabs. Drill and epoxy dowels, pour back 5" thick 5,000 PSI high-early concrete. Strip and seal.',
    assumptions: '1. Access during off-hours.\n2. Barricading supplied by contractor.',
    exclusions: '1. Omahas permits.',
    timeline: '2 business days (Weekend).',
    payment_terms: 'Net 30 invoice.',
    warranty_notes: '1-year commercial warranty.',
    subtotal: 5120,
    tax: 0,
    discount: 0,
    total: 5120,
    internal_notes: 'Off-hours rate applied. Margins look healthy.',
    client_message: 'Marcus, here is the proposal for sidewalk grinding and bay repairs to meet ADA specs.',
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Bob Johnson V1
  {
    id: 'pv-bob-johnson-v1',
    proposal_id: 'prop-bob-johnson-1',
    version_number: 1,
    title: 'Full Kitchen Remodel (Including Flooring)',
    scope_of_work: 'Tear out cabinets and flooring. Perform electrical rewire and plumbing rough-in. Install Custom Maple Cabinets, premium Quartz tops, ceramic backsplash, and 220 SF of LVP flooring. Hook up appliances.',
    assumptions: '1. No subfloor rot.\n2. Panel space exists.',
    exclusions: '1. Cost of purchasing appliances.',
    timeline: '3 to 4 weeks.',
    payment_terms: '10% order, 40% demolition, 30% cabinets, 20% completion.',
    warranty_notes: '1-year workmanship warranty.',
    subtotal: 21610,
    tax: 1512.70,
    discount: 0,
    total: 23122.70,
    internal_notes: 'High high quality custom cabinets ordered from local millwork.',
    client_message: 'Hi Bob, here is the complete kitchen remodeling proposal as outlined in our walkthrough.',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Bob Johnson V2
  {
    id: 'pv-bob-johnson-v2',
    proposal_id: 'prop-bob-johnson-1',
    version_number: 2,
    title: 'Kitchen Remodel (Flooring Excluded)',
    scope_of_work: 'Tear out cabinets. Perform electrical rewire and plumbing rough-in. Install Custom Maple Cabinets, premium Quartz tops, ceramic backsplash. Excludes LVP flooring (subfloor prepped only). Hook up appliances.',
    assumptions: '1. No subfloor rot.\n2. Panel space exists.',
    exclusions: '1. Cost of purchasing appliances.\n2. Supply and installation of flooring (client will handle flooring).',
    timeline: '3 weeks.',
    payment_terms: '10% order, 40% demolition, 30% cabinets, 20% completion.',
    warranty_notes: '1-year workmanship warranty.',
    subtotal: 19850,
    tax: 1389.50,
    discount: 0,
    total: 21239.50,
    internal_notes: 'Removed flooring line item per client request. Subtotal decreased by $1760.',
    client_message: 'Hi Bob, here is the updated proposal showing the flooring line item removed. Let me know if this looks good.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_LINE_ITEMS: ProposalLineItem[] = [
  // John Doe V1 Line Items (Total: $5840 subtotal)
  {
    id: 'li-jd-1',
    proposal_version_id: 'pv-john-doe-v1',
    category: 'Demolition',
    description: 'Tear down existing failing wood tie retaining wall and haul away debris',
    quantity: 80,
    unit: 'LF',
    unit_cost: 25.00,
    markup_percent: 20,
    line_total: 2400.00, // 80 * 25 * 1.2
    optional: false
  },
  {
    id: 'li-jd-2',
    proposal_version_id: 'pv-john-doe-v1',
    category: 'Excavation & Prep',
    description: 'Cut back slope, excavate foundation trench, and level subgrade',
    quantity: 10,
    unit: 'Hours',
    unit_cost: 85.00,
    markup_percent: 15,
    line_total: 977.50,
    optional: false
  },
  {
    id: 'li-jd-3',
    proposal_version_id: 'pv-john-doe-v1',
    category: 'Materials',
    description: 'Segmental retaining wall blocks, base rock, caps, pins and adhesive',
    quantity: 160,
    unit: 'SF',
    unit_cost: 12.00,
    markup_percent: 15,
    line_total: 2208.00,
    optional: false
  },
  {
    id: 'li-jd-4',
    proposal_version_id: 'pv-john-doe-v1',
    category: 'Drainage',
    description: '4-inch perforated drain tile, sock fabric filter, and clean gravel',
    quantity: 40,
    unit: 'LF',
    unit_cost: 18.00,
    markup_percent: 15,
    line_total: 828.00,
    optional: false
  },

  // John Doe V2 Line Items (Total: $10440 subtotal)
  {
    id: 'li-jd-v2-1',
    proposal_version_id: 'pv-john-doe-v2',
    category: 'Demolition',
    description: 'Tear down existing failing wood tie retaining wall and haul away debris',
    quantity: 80,
    unit: 'LF',
    unit_cost: 25.00,
    markup_percent: 20,
    line_total: 2400.00,
    optional: false
  },
  {
    id: 'li-jd-v2-2',
    proposal_version_id: 'pv-john-doe-v2',
    category: 'Excavation & Prep',
    description: 'Cut back slope, excavate foundation trench, and level subgrade for wall',
    quantity: 15,
    unit: 'Hours',
    unit_cost: 85.00,
    markup_percent: 15,
    line_total: 1466.25,
    optional: false
  },
  {
    id: 'li-jd-v2-3',
    proposal_version_id: 'pv-john-doe-v2',
    category: 'Materials',
    description: 'Segmental retaining wall blocks, base rock, caps, pins and adhesive',
    quantity: 320,
    unit: 'SF',
    unit_cost: 12.00,
    markup_percent: 15,
    line_total: 4416.00,
    optional: false
  },
  {
    id: 'li-jd-v2-4',
    proposal_version_id: 'pv-john-doe-v2',
    category: 'Drainage',
    description: '4-inch perforated drain tile, sock fabric filter, and clean gravel',
    quantity: 80,
    unit: 'LF',
    unit_cost: 18.00,
    markup_percent: 15,
    line_total: 1656.00,
    optional: false
  },
  {
    id: 'li-jd-v2-5',
    proposal_version_id: 'pv-john-doe-v2',
    category: 'Patio Slab',
    description: 'Excavate 12x15 area, lay forms, rebar grid reinforcement, pour 4" concrete patio slab, finish/joint',
    quantity: 180,
    unit: 'SF',
    unit_cost: 10.00,
    markup_percent: 15,
    line_total: 2070.00,
    optional: false
  },
  {
    id: 'li-jd-v2-6',
    proposal_version_id: 'pv-john-doe-v2',
    category: 'Patio Stamp',
    description: 'Optional upgrade: Stamp concrete patio with slate stamp pattern and add integral charcoal color dye',
    quantity: 180,
    unit: 'SF',
    unit_cost: 8.00,
    markup_percent: 15,
    line_total: 1656.00,
    optional: true
  },

  // Jane Smith V1 Line Items (Total: $3800 subtotal)
  {
    id: 'li-js-1',
    proposal_version_id: 'pv-jane-smith-v1',
    category: 'Trenching',
    description: 'Excavate 100 LF yard trench, depth averaging 15 inches with transit laser checks',
    quantity: 100,
    unit: 'LF',
    unit_cost: 12.00,
    markup_percent: 15,
    line_total: 1380.00,
    optional: false
  },
  {
    id: 'li-js-2',
    proposal_version_id: 'pv-jane-smith-v1',
    category: 'Materials',
    description: '4" rigid perforated PVC, connectors, non-woven geotextile wrap, and clean gravel',
    quantity: 100,
    unit: 'LF',
    unit_cost: 14.00,
    markup_percent: 15,
    line_total: 1610.00,
    optional: false
  },
  {
    id: 'li-js-3',
    proposal_version_id: 'pv-jane-smith-v1',
    category: 'Sod Restoration',
    description: 'Laying Kentucky Bluegrass sod over trench lines to match current yard',
    quantity: 300,
    unit: 'SF',
    unit_cost: 2.50,
    markup_percent: 15,
    line_total: 862.50,
    optional: false
  },

  // Marcus Bakery V1 Line Items (Total: $5120 subtotal)
  {
    id: 'li-mb-1',
    proposal_version_id: 'pv-bakery-v1',
    category: 'Grinding',
    description: 'Grind down joints with minor vertical displacement to meet ADA threshold (off-hours)',
    quantity: 12,
    unit: 'Joints',
    unit_cost: 95.00,
    markup_percent: 20,
    line_total: 1368.00,
    optional: false
  },
  {
    id: 'li-mb-2',
    proposal_version_id: 'pv-bakery-v1',
    category: 'Demolition',
    description: 'Saw cut, break out and excavate 5" thick spalled concrete sidewalk panels and haul to recycling',
    quantity: 160,
    unit: 'SF',
    unit_cost: 8.00,
    markup_percent: 15,
    line_total: 1472.00,
    optional: false
  },
  {
    id: 'li-mb-3',
    proposal_version_id: 'pv-bakery-v1',
    category: 'Materials',
    description: '5,000 PSI high-early strength ready-mix concrete with fiber mesh reinforcing',
    quantity: 3,
    unit: 'CY',
    unit_cost: 220.00,
    markup_percent: 10,
    line_total: 726.00,
    optional: false
  },
  {
    id: 'li-mb-4',
    proposal_version_id: 'pv-bakery-v1',
    category: 'Labor',
    description: 'Drill and epoxy #4 steel dowels, formwork, pour, finish and seal sidewalk panels',
    quantity: 160,
    unit: 'SF',
    unit_cost: 12.00,
    markup_percent: 15,
    line_total: 2208.00,
    optional: false
  },

  // Bob Johnson V1 Line Items (Total: $21610 subtotal)
  {
    id: 'li-bj-1',
    proposal_version_id: 'pv-bob-johnson-v1',
    category: 'Demolition',
    description: 'Demolish kitchen cabinets, soffits, laminate countertops, vinyl flooring, and drywall. Haul away debris.',
    quantity: 1,
    unit: 'Job',
    unit_cost: 1800.00,
    markup_percent: 15,
    line_total: 2070.00,
    optional: false
  },
  {
    id: 'li-bj-2',
    proposal_version_id: 'pv-bob-johnson-v1',
    category: 'Cabinetry',
    description: 'Supply and installation of premium Maple Shaker cabinets (custom layout)',
    quantity: 1,
    unit: 'Job',
    unit_cost: 9500.00,
    markup_percent: 15,
    line_total: 10925.00,
    optional: false
  },
  {
    id: 'li-bj-3',
    proposal_version_id: 'pv-bob-johnson-v1',
    category: 'Countertops',
    description: 'Premium 3cm solid quartz countertops including template, fabrication, cutout for sink, and installation',
    quantity: 45,
    unit: 'SF',
    unit_cost: 85.00,
    markup_percent: 15,
    line_total: 4398.75,
    optional: false
  },
  {
    id: 'li-bj-4',
    proposal_version_id: 'pv-bob-johnson-v1',
    category: 'Backsplash',
    description: 'Classic 3x6 ceramic subway tile backsplash',
    quantity: 40,
    unit: 'SF',
    unit_cost: 25.00,
    markup_percent: 15,
    line_total: 1150.00,
    optional: false
  },
  {
    id: 'li-bj-5',
    proposal_version_id: 'pv-bob-johnson-v1',
    category: 'Flooring',
    description: 'Commercial-grade luxury vinyl plank (LVP) flooring, including foam underlayment',
    quantity: 220,
    unit: 'SF',
    unit_cost: 8.00,
    markup_percent: 15,
    line_total: 2024.00,
    optional: false
  },

  // Bob Johnson V2 Line Items (Total: $19850 subtotal)
  {
    id: 'li-bj-v2-1',
    proposal_version_id: 'pv-bob-johnson-v2',
    category: 'Demolition',
    description: 'Demolish kitchen cabinets, soffits, laminate countertops, vinyl flooring, and drywall. Haul away debris.',
    quantity: 1,
    unit: 'Job',
    unit_cost: 1800.00,
    markup_percent: 15,
    line_total: 2070.00,
    optional: false
  },
  {
    id: 'li-bj-v2-2',
    proposal_version_id: 'pv-bob-johnson-v2',
    category: 'Cabinetry',
    description: 'Supply and installation of premium Maple Shaker cabinets (custom layout)',
    quantity: 1,
    unit: 'Job',
    unit_cost: 9500.00,
    markup_percent: 15,
    line_total: 10925.00,
    optional: false
  },
  {
    id: 'li-bj-v2-3',
    proposal_version_id: 'pv-bob-johnson-v2',
    category: 'Countertops',
    description: 'Premium 3cm solid quartz countertops including template, fabrication, cutout for sink, and installation',
    quantity: 45,
    unit: 'SF',
    unit_cost: 85.00,
    markup_percent: 15,
    line_total: 4398.75,
    optional: false
  },
  {
    id: 'li-bj-v2-4',
    proposal_version_id: 'pv-bob-johnson-v2',
    category: 'Backsplash',
    description: 'Classic 3x6 ceramic subway tile backsplash',
    quantity: 40,
    unit: 'SF',
    unit_cost: 25.00,
    markup_percent: 15,
    line_total: 1150.00,
    optional: false
  }
];

const MOCK_NEGOTIATION_EVENTS: NegotiationEvent[] = [
  // John Doe Events
  {
    id: 'ne-jd-1',
    proposal_id: 'prop-john-doe-1',
    proposal_version_id: 'pv-john-doe-v1',
    sender_type: 'system',
    message: 'Proposal draft created (Version 1).',
    requested_changes: '',
    created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ne-jd-2',
    proposal_id: 'prop-john-doe-1',
    proposal_version_id: 'pv-john-doe-v1',
    sender_type: 'owner',
    message: 'Sent proposal V1 to John Doe.',
    requested_changes: '',
    created_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ne-jd-3',
    proposal_id: 'prop-john-doe-1',
    proposal_version_id: 'pv-john-doe-v1',
    sender_type: 'client',
    message: 'John Doe viewed proposal.',
    requested_changes: '',
    created_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ne-jd-4',
    proposal_id: 'prop-john-doe-1',
    proposal_version_id: 'pv-john-doe-v1',
    sender_type: 'client',
    message: 'Can we add a concrete patio slab adjacent to the retaining wall? Let me know how much that would add to the cost.',
    requested_changes: 'Add a 12x15 concrete patio slab.',
    created_at: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ne-jd-5',
    proposal_id: 'prop-john-doe-1',
    proposal_version_id: 'pv-john-doe-v2',
    sender_type: 'system',
    message: 'Created revised Proposal (Version 2) from Version 1.',
    requested_changes: '',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ne-jd-6',
    proposal_id: 'prop-john-doe-1',
    proposal_version_id: 'pv-john-doe-v2',
    sender_type: 'owner',
    message: 'Hi John, I updated the proposal to include a 12x15 concrete patio slab. I also applied a $500 multi-service discount since we are doing both the retaining wall and patio at the same time.',
    requested_changes: '',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ne-jd-7',
    proposal_id: 'prop-john-doe-1',
    proposal_version_id: 'pv-john-doe-v2',
    sender_type: 'client',
    message: 'This looks fantastic! Let\'s go ahead with this. Accepted.',
    requested_changes: '',
    created_at: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ne-jd-8',
    proposal_id: 'prop-john-doe-1',
    proposal_version_id: 'pv-john-doe-v2',
    sender_type: 'system',
    message: 'Proposal accepted. E-Signature recorded: John Doe at 2026-06-06T15:24:12Z.',
    requested_changes: '',
    created_at: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString()
  },

  // Jane Smith Events
  {
    id: 'ne-js-1',
    proposal_id: 'prop-jane-smith-1',
    proposal_version_id: 'pv-jane-smith-v1',
    sender_type: 'system',
    message: 'Proposal draft created (Version 1).',
    requested_changes: '',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ne-js-2',
    proposal_id: 'prop-jane-smith-1',
    proposal_version_id: 'pv-jane-smith-v1',
    sender_type: 'owner',
    message: 'Hi Jane, here is our proposal for correcting the yard drainage issue.',
    requested_changes: '',
    created_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString()
  },

  // Bob Johnson Events
  {
    id: 'ne-bj-1',
    proposal_id: 'prop-bob-johnson-1',
    proposal_version_id: 'pv-bob-johnson-v1',
    sender_type: 'system',
    message: 'Proposal draft created (Version 1).',
    requested_changes: '',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ne-bj-2',
    proposal_id: 'prop-bob-johnson-1',
    proposal_version_id: 'pv-bob-johnson-v1',
    sender_type: 'owner',
    message: 'Sent proposal V1 to Bob Johnson.',
    requested_changes: '',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ne-bj-3',
    proposal_id: 'prop-bob-johnson-1',
    proposal_version_id: 'pv-bob-johnson-v1',
    sender_type: 'client',
    message: 'Please remove the flooring installation line item. My brother-in-law is a flooring contractor and is going to do that for us as a wedding gift.',
    requested_changes: 'Remove LVP flooring installation.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ne-bj-4',
    proposal_id: 'prop-bob-johnson-1',
    proposal_version_id: 'pv-bob-johnson-v2',
    sender_type: 'system',
    message: 'Created revised Proposal (Version 2) from Version 1.',
    requested_changes: '',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ne-bj-5',
    proposal_id: 'prop-bob-johnson-1',
    proposal_version_id: 'pv-bob-johnson-v2',
    sender_type: 'owner',
    message: 'Hi Bob, I created Version 2 with the luxury vinyl flooring removed. We will still prep the subfloor for the next installer. Let me know what you think!',
    requested_changes: '',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_AUDIT_LOGS: any[] = [
  {
    id: 'al-jd-1',
    proposal_id: 'prop-john-doe-1',
    user_id: 'estimator-1',
    action: 'CREATE',
    details: 'Initial proposal SCH-2026-1001 (Version 1) created.',
    created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'al-jd-2',
    proposal_id: 'prop-john-doe-1',
    user_id: 'estimator-1',
    action: 'REVISE',
    details: 'Revised version (Version 2) drafted.',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'al-jd-3',
    proposal_id: 'prop-john-doe-1',
    user_id: null,
    action: 'SIGN',
    details: 'Proposal signed and accepted via secure portal by John Doe.',
    created_at: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// -------------------------------------------------------------
// LOCAL STORAGE STATE IMPLEMENTATION
// -------------------------------------------------------------
const getLocalStorageData = <T>(key: string, defaultVal: T): T => {
  if (typeof window === 'undefined') return defaultVal;
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(item);
  } catch (e) {
    return defaultVal;
  }
};

const setLocalStorageData = <T>(key: string, data: T) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize LocalStorage with Mock Data if empty
export const initLocalStorageDB = (force = false) => {
  if (typeof window === 'undefined') return;
  if (force || !localStorage.getItem('schmidt_clients')) {
    setLocalStorageData('schmidt_clients', MOCK_CLIENTS);
    setLocalStorageData('schmidt_projects', MOCK_PROJECTS);
    setLocalStorageData('schmidt_proposals', MOCK_PROPOSALS);
    setLocalStorageData('schmidt_proposal_versions', MOCK_PROPOSAL_VERSIONS);
    setLocalStorageData('schmidt_line_items', MOCK_LINE_ITEMS);
    setLocalStorageData('schmidt_negotiation_events', MOCK_NEGOTIATION_EVENTS);
    setLocalStorageData('schmidt_audit_logs', MOCK_AUDIT_LOGS);
  }
};

// -------------------------------------------------------------
// UNIFIED API SERVICE EXPORTS
// -------------------------------------------------------------
export const db = {
  // --- CLIENTS ---
  async getClients(): Promise<Client[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorageDB();
      return getLocalStorageData<Client[]>('schmidt_clients', []);
    }
  },

  async getClient(id: string): Promise<Client | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<Client[]>('schmidt_clients', []);
      return list.find((c) => c.id === id) || null;
    }
  },

  async createClient(client: Omit<Client, 'id' | 'created_at'>): Promise<Client> {
    const newClient: Client = {
      ...client,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clients').insert([newClient]).select().single();
      if (error) throw error;
      return data;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<Client[]>('schmidt_clients', []);
      list.push(newClient);
      setLocalStorageData('schmidt_clients', list);
      return newClient;
    }
  },

  async updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'created_at'>>): Promise<Client> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<Client[]>('schmidt_clients', []);
      const index = list.findIndex((c) => c.id === id);
      if (index === -1) throw new Error('Client not found');
      const updated = { ...list[index], ...updates };
      list[index] = updated;
      setLocalStorageData('schmidt_clients', list);
      return updated;
    }
  },

  // --- PROJECTS ---
  async getProjects(): Promise<Project[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorageDB();
      return getLocalStorageData<Project[]>('schmidt_projects', []);
    }
  },

  async getProject(id: string): Promise<Project | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<Project[]>('schmidt_projects', []);
      return list.find((p) => p.id === id) || null;
    }
  },

  async getProjectHistory(clientId: string): Promise<Project[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('projects').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<Project[]>('schmidt_projects', []);
      return list.filter((p) => p.client_id === clientId);
    }
  },

  async createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const newProject: Project = {
      ...project,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('projects').insert([newProject]).select().single();
      if (error) throw error;
      return data;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<Project[]>('schmidt_projects', []);
      list.push(newProject);
      setLocalStorageData('schmidt_projects', list);
      return newProject;
    }
  },

  async updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'created_at'>>): Promise<Project> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<Project[]>('schmidt_projects', []);
      const index = list.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Project not found');
      const updated = { ...list[index], ...updates };
      list[index] = updated;
      setLocalStorageData('schmidt_projects', list);
      return updated;
    }
  },

  // --- PROPOSALS ---
  async getProposals(): Promise<Proposal[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorageDB();
      return getLocalStorageData<Proposal[]>('schmidt_proposals', []);
    }
  },

  async getProposal(id: string): Promise<Proposal | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposals').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<Proposal[]>('schmidt_proposals', []);
      return list.find((p) => p.id === id) || null;
    }
  },

  async getProposalByShareToken(shareToken: string): Promise<Proposal | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposals').select('*').eq('share_token', shareToken).single();
      if (error) return null;
      return data;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<Proposal[]>('schmidt_proposals', []);
      return list.find((p) => p.share_token === shareToken) || null;
    }
  },

  async getProjectProposals(projectId: string): Promise<Proposal[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposals').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<Proposal[]>('schmidt_proposals', []);
      return list.filter((p) => p.project_id === projectId);
    }
  },

  async createProposal(
    proposal: Omit<Proposal, 'id' | 'current_version_id' | 'share_token' | 'expiration_date' | 'created_at'>,
    versionData: Omit<ProposalVersion, 'id' | 'proposal_id' | 'version_number' | 'created_at'>,
    lineItems: Omit<ProposalLineItem, 'id' | 'proposal_version_id'>[]
  ): Promise<Proposal> {
    const proposalId = generateUUID();
    const versionId = generateUUID();
    const shareToken = generateUUID();
    const timestamp = new Date().toISOString();
    const defaultExpDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newProposal: Proposal = {
      ...proposal,
      id: proposalId,
      current_version_id: versionId,
      share_token: shareToken,
      expiration_date: defaultExpDate,
      created_at: timestamp
    };

    const newVersion: ProposalVersion = {
      ...versionData,
      id: versionId,
      proposal_id: proposalId,
      version_number: 1,
      created_at: timestamp
    };

    const newLineItems: ProposalLineItem[] = lineItems.map((li) => ({
      ...li,
      id: generateUUID(),
      proposal_version_id: versionId
    }));

    const systemEvent: NegotiationEvent = {
      id: generateUUID(),
      proposal_id: proposalId,
      proposal_version_id: versionId,
      sender_type: 'system',
      message: `Proposal created (Version 1).`,
      requested_changes: '',
      created_at: timestamp
    };

    if (isSupabaseConfigured && supabase) {
      // Create proposal (current_version_id null initially to bypass circular FK, updated after version insert)
      const { error: pErr } = await supabase.from('proposals').insert([{
        ...newProposal,
        current_version_id: null
      }]);
      if (pErr) throw pErr;

      // wall_sections requires migration 20260704 — strip for the insert, apply silently after.
      const { wall_sections: ws, ...coreNewVersion } = newVersion as any;
      const { error: vErr } = await supabase.from('proposal_versions').insert([coreNewVersion]);
      if (vErr) throw vErr;
      if (ws !== undefined && ws !== null) {
        await supabase.from('proposal_versions').update({ wall_sections: ws }).eq('id', versionId)
          .then(({ error }) => { if (error) console.warn('wall_sections not yet migrated:', error.message); });
      }

      // Update current version key
      const { error: pUpdateErr } = await supabase.from('proposals').update({ current_version_id: versionId }).eq('id', proposalId);
      if (pUpdateErr) throw pUpdateErr;

      if (newLineItems.length > 0) {
        const { error: liErr } = await supabase.from('proposal_line_items').insert(newLineItems);
        if (liErr) throw liErr;
      }

      await supabase.from('negotiation_events').insert([systemEvent]);
      
      // Log audit trail
      await supabase.from('audit_logs').insert([{
        proposal_id: proposalId,
        action: 'CREATE',
        details: `Initial proposal package ${newProposal.proposal_number} (Version 1) created.`
      }]);

      return newProposal;
    } else {
      initLocalStorageDB();

      const pList = getLocalStorageData<Proposal[]>('schmidt_proposals', []);
      const vList = getLocalStorageData<ProposalVersion[]>('schmidt_proposal_versions', []);
      const liList = getLocalStorageData<ProposalLineItem[]>('schmidt_line_items', []);
      const neList = getLocalStorageData<NegotiationEvent[]>('schmidt_negotiation_events', []);
      const alList = getLocalStorageData<any[]>('schmidt_audit_logs', []);

      pList.push(newProposal);
      vList.push(newVersion);
      newLineItems.forEach((li) => liList.push(li));
      neList.push(systemEvent);
      alList.push({
        id: generateUUID(),
        proposal_id: proposalId,
        user_id: 'estimator-1',
        action: 'CREATE',
        details: `Initial proposal package ${newProposal.proposal_number} (Version 1) created.`,
        created_at: timestamp
      });

      setLocalStorageData('schmidt_proposals', pList);
      setLocalStorageData('schmidt_proposal_versions', vList);
      setLocalStorageData('schmidt_line_items', liList);
      setLocalStorageData('schmidt_negotiation_events', neList);
      setLocalStorageData('schmidt_audit_logs', alList);

      return newProposal;
    }
  },

  async updateProposalStatus(
    proposalId: string,
    status: ProposalStatus,
    senderType: 'owner' | 'client' | 'system',
    comment?: string,
    requestedChanges?: string
  ): Promise<Proposal> {
    const timestamp = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposals').update({ status }).eq('id', proposalId).select().single();
      if (error) throw error;

      const event: Omit<NegotiationEvent, 'id'> = {
        proposal_id: proposalId,
        proposal_version_id: data.current_version_id,
        sender_type: senderType,
        message: comment || `Proposal status updated to ${status}.`,
        requested_changes: requestedChanges || '',
        created_at: timestamp
      };

      await supabase.from('negotiation_events').insert([event]);

      // Audit log
      await supabase.from('audit_logs').insert([{
        proposal_id: proposalId,
        action: status === 'Accepted' ? 'SIGN' : 'STATUS_CHANGE',
        details: comment || `Proposal status updated to ${status} by ${senderType}.`
      }]);

      return data;
    } else {
      initLocalStorageDB();
      const pList = getLocalStorageData<Proposal[]>('schmidt_proposals', []);
      const neList = getLocalStorageData<NegotiationEvent[]>('schmidt_negotiation_events', []);
      const alList = getLocalStorageData<any[]>('schmidt_audit_logs', []);

      const pIndex = pList.findIndex((p) => p.id === proposalId);
      if (pIndex === -1) throw new Error('Proposal not found');

      pList[pIndex].status = status;
      const updatedProposal = pList[pIndex];

      const event: NegotiationEvent = {
        id: generateUUID(),
        proposal_id: proposalId,
        proposal_version_id: updatedProposal.current_version_id,
        sender_type: senderType,
        message: comment || `Proposal status updated to ${status}.`,
        requested_changes: requestedChanges || '',
        created_at: timestamp
      };

      neList.push(event);
      alList.push({
        id: generateUUID(),
        proposal_id: proposalId,
        user_id: senderType === 'owner' ? 'estimator-1' : null,
        action: status === 'Accepted' ? 'SIGN' : 'STATUS_CHANGE',
        details: comment || `Proposal status updated to ${status} by ${senderType}.`,
        created_at: timestamp
      });

      setLocalStorageData('schmidt_proposals', pList);
      setLocalStorageData('schmidt_negotiation_events', neList);
      setLocalStorageData('schmidt_audit_logs', alList);

      return updatedProposal;
    }
  },

  async updateProposalExpiration(proposalId: string, expirationDate: string): Promise<Proposal> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposals').update({ expiration_date: expirationDate }).eq('id', proposalId).select().single();
      if (error) throw error;
      
      // Log audit
      await supabase.from('audit_logs').insert([{
        proposal_id: proposalId,
        action: 'STATUS_CHANGE',
        details: `Proposal expiration extended to ${expirationDate}.`
      }]);
      return data;
    } else {
      initLocalStorageDB();
      const pList = getLocalStorageData<Proposal[]>('schmidt_proposals', []);
      const alList = getLocalStorageData<any[]>('schmidt_audit_logs', []);
      const pIndex = pList.findIndex((p) => p.id === proposalId);
      if (pIndex === -1) throw new Error('Proposal not found');
      pList[pIndex].expiration_date = expirationDate;
      const updated = pList[pIndex];
      
      alList.push({
        id: generateUUID(),
        proposal_id: proposalId,
        user_id: 'estimator-1',
        action: 'STATUS_CHANGE',
        details: `Proposal expiration extended to ${expirationDate}.`,
        created_at: new Date().toISOString()
      });
      setLocalStorageData('schmidt_proposals', pList);
      setLocalStorageData('schmidt_audit_logs', alList);
      return updated;
    }
  },

  // --- PROPOSAL VERSIONS ---
  async getProposalVersions(proposalId: string): Promise<ProposalVersion[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('proposal_versions')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<ProposalVersion[]>('schmidt_proposal_versions', []);
      return list.filter((v) => v.proposal_id === proposalId).sort((a, b) => b.version_number - a.version_number);
    }
  },

  async getProposalVersion(id: string): Promise<ProposalVersion | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposal_versions').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<ProposalVersion[]>('schmidt_proposal_versions', []);
      return list.find((v) => v.id === id) || null;
    }
  },

  async createRevisedVersion(
    proposalId: string,
    versionData: Omit<ProposalVersion, 'id' | 'proposal_id' | 'version_number' | 'created_at'>,
    lineItems: Omit<ProposalLineItem, 'id' | 'proposal_version_id'>[]
  ): Promise<ProposalVersion> {
    const versionId = generateUUID();
    const timestamp = new Date().toISOString();

    let nextVersionNumber = 1;
    const versions = await this.getProposalVersions(proposalId);
    if (versions.length > 0) {
      nextVersionNumber = versions[0].version_number + 1;
    }

    const newVersion: ProposalVersion = {
      ...versionData,
      id: versionId,
      proposal_id: proposalId,
      version_number: nextVersionNumber,
      created_at: timestamp
    };

    const newLineItems: ProposalLineItem[] = lineItems.map((li) => ({
      ...li,
      id: generateUUID(),
      proposal_version_id: versionId
    }));

    const systemEvent: NegotiationEvent = {
      id: generateUUID(),
      proposal_id: proposalId,
      proposal_version_id: versionId,
      sender_type: 'system',
      message: `Revised Proposal created (Version ${nextVersionNumber}).`,
      requested_changes: '',
      created_at: timestamp
    };

    if (isSupabaseConfigured && supabase) {
      // wall_sections requires migration 20260704 — strip it for the main insert,
      // then apply it in a silent follow-up so saves work before migration runs.
      const { wall_sections, ...coreVersion } = newVersion as any;
      const { error: vErr } = await supabase.from('proposal_versions').insert([coreVersion]);
      if (vErr) throw vErr;
      if (wall_sections !== undefined && wall_sections !== null) {
        await supabase.from('proposal_versions').update({ wall_sections }).eq('id', versionId)
          .then(({ error }) => { if (error) console.warn('wall_sections not yet migrated:', error.message); });
      }

      const { error: pErr } = await supabase.from('proposals').update({
        current_version_id: versionId,
        status: 'Revised' // Bump status when revised
      }).eq('id', proposalId);
      if (pErr) throw pErr;

      if (newLineItems.length > 0) {
        const { error: liErr } = await supabase.from('proposal_line_items').insert(newLineItems);
        if (liErr) throw liErr;
      }

      await supabase.from('negotiation_events').insert([systemEvent]);
      
      // Log audit
      await supabase.from('audit_logs').insert([{
        proposal_id: proposalId,
        action: 'REVISE',
        details: `Proposal revised. Created new Version ${nextVersionNumber}.`
      }]);

      return newVersion;
    } else {
      initLocalStorageDB();
      const pList = getLocalStorageData<Proposal[]>('schmidt_proposals', []);
      const vList = getLocalStorageData<ProposalVersion[]>('schmidt_proposal_versions', []);
      const liList = getLocalStorageData<ProposalLineItem[]>('schmidt_line_items', []);
      const neList = getLocalStorageData<NegotiationEvent[]>('schmidt_negotiation_events', []);
      const alList = getLocalStorageData<any[]>('schmidt_audit_logs', []);

      vList.push(newVersion);
      newLineItems.forEach((li) => liList.push(li));

      const pIndex = pList.findIndex((p) => p.id === proposalId);
      if (pIndex !== -1) {
        pList[pIndex].current_version_id = versionId;
        pList[pIndex].status = 'Revised';
      }

      neList.push(systemEvent);
      alList.push({
        id: generateUUID(),
        proposal_id: proposalId,
        user_id: 'estimator-1',
        action: 'REVISE',
        details: `Proposal revised. Created new Version ${nextVersionNumber}.`,
        created_at: timestamp
      });

      setLocalStorageData('schmidt_proposals', pList);
      setLocalStorageData('schmidt_proposal_versions', vList);
      setLocalStorageData('schmidt_line_items', liList);
      setLocalStorageData('schmidt_negotiation_events', neList);
      setLocalStorageData('schmidt_audit_logs', alList);

      return newVersion;
    }
  },

  async updateProposalVersion(
    versionId: string,
    versionData: Omit<ProposalVersion, 'id' | 'proposal_id' | 'version_number' | 'created_at'>,
    lineItems: Omit<ProposalLineItem, 'id' | 'proposal_version_id'>[]
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      // wall_sections requires migration 20260704 — strip it for the main update,
      // then apply it in a silent follow-up so saves work before migration runs.
      const { wall_sections, ...coreVersionData } = versionData as any;
      const { error: vErr } = await supabase.from('proposal_versions').update(coreVersionData).eq('id', versionId);
      if (vErr) throw vErr;
      if (wall_sections !== undefined && wall_sections !== null) {
        await supabase.from('proposal_versions').update({ wall_sections }).eq('id', versionId)
          .then(({ error }) => { if (error) console.warn('wall_sections not yet migrated:', error.message); });
      }

      const { error: delErr } = await supabase.from('proposal_line_items').delete().eq('proposal_version_id', versionId);
      if (delErr) throw delErr;

      if (lineItems.length > 0) {
        const newItems = lineItems.map(li => ({ ...li, id: generateUUID(), proposal_version_id: versionId }));
        const { error: liErr } = await supabase.from('proposal_line_items').insert(newItems);
        if (liErr) throw liErr;
      }
    } else {
      initLocalStorageDB();
      const vList = getLocalStorageData<ProposalVersion[]>('schmidt_proposal_versions', []);
      const liList = getLocalStorageData<ProposalLineItem[]>('schmidt_line_items', []);
      const vIdx = vList.findIndex(v => v.id === versionId);
      if (vIdx !== -1) vList[vIdx] = { ...vList[vIdx], ...versionData };
      const remaining = liList.filter(li => li.proposal_version_id !== versionId);
      const newItems = lineItems.map(li => ({ ...li, id: generateUUID(), proposal_version_id: versionId }));
      setLocalStorageData('schmidt_proposal_versions', vList);
      setLocalStorageData('schmidt_line_items', [...remaining, ...newItems]);
    }
  },

  // --- LINE ITEMS ---
  async getLineItems(versionId: string): Promise<ProposalLineItem[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposal_line_items').select('*').eq('proposal_version_id', versionId);
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<ProposalLineItem[]>('schmidt_line_items', []);
      return list.filter((li) => li.proposal_version_id === versionId);
    }
  },

  // --- NEGOTIATION EVENTS ---
  async getNegotiationEvents(proposalId: string): Promise<NegotiationEvent[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('negotiation_events')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<NegotiationEvent[]>('schmidt_negotiation_events', []);
      return list.filter((ne) => ne.proposal_id === proposalId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
  },

  async createNegotiationEvent(event: Omit<NegotiationEvent, 'id' | 'created_at'>): Promise<NegotiationEvent> {
    const newEvent: NegotiationEvent = {
      ...event,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('negotiation_events').insert([newEvent]).select().single();
      if (error) throw error;
      return data;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<NegotiationEvent[]>('schmidt_negotiation_events', []);
      list.push(newEvent);
      setLocalStorageData('schmidt_negotiation_events', list);
      return newEvent;
    }
  },

  // --- AUDIT LOGS ---
  async getAuditLogs(proposalId: string): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<any[]>('schmidt_audit_logs', []);
      return list.filter((al) => al.proposal_id === proposalId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async createAuditLog(log: { proposal_id: string; user_id: string | null; action: string; details: string }): Promise<any> {
    const newLog = {
      ...log,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('audit_logs').insert([newLog]).select().single();
      if (error) throw error;
      return data;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<any[]>('schmidt_audit_logs', []);
      list.push(newLog);
      setLocalStorageData('schmidt_audit_logs', list);
      return newLog;
    }
  },

  // --- SAVED PROPOSAL OPTIONS ---
  async getSavedOptions(): Promise<SavedProposalOption[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('saved_proposal_options')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data || []) as SavedProposalOption[];
    } else {
      initLocalStorageDB();
      return getLocalStorageData<SavedProposalOption[]>('schmidt_saved_options', [])
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  async createSavedOption(
    option: Omit<SavedProposalOption, 'id' | 'created_at' | 'updated_at'>
  ): Promise<SavedProposalOption> {
    const now = new Date().toISOString();
    const newOption: SavedProposalOption = { ...option, id: generateUUID(), created_at: now, updated_at: now };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('saved_proposal_options').insert([newOption]).select().single();
      if (error) throw error;
      return data as SavedProposalOption;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<SavedProposalOption[]>('schmidt_saved_options', []);
      list.push(newOption);
      setLocalStorageData('schmidt_saved_options', list);
      return newOption;
    }
  },

  async updateSavedOption(
    id: string,
    updates: Partial<Omit<SavedProposalOption, 'id' | 'created_at'>>
  ): Promise<void> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('saved_proposal_options').update({ ...updates, updated_at: now }).eq('id', id);
      if (error) throw error;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<SavedProposalOption[]>('schmidt_saved_options', []);
      const idx = list.findIndex(o => o.id === id);
      if (idx !== -1) list[idx] = { ...list[idx], ...updates, updated_at: now };
      setLocalStorageData('schmidt_saved_options', list);
    }
  },

  async deleteSavedOption(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('saved_proposal_options').delete().eq('id', id);
      if (error) throw error;
    } else {
      initLocalStorageDB();
      const list = getLocalStorageData<SavedProposalOption[]>('schmidt_saved_options', []);
      setLocalStorageData('schmidt_saved_options', list.filter(o => o.id !== id));
    }
  },

  // --- SERVER-SIDE SANITIZATION ---
  sanitizeProposalVersionForClient(version: ProposalVersion): ProposalVersion {
    const sanitized = { ...version };
    // Securely delete internal notes so they never reach the client payload
    delete (sanitized as any).internal_notes;
    return sanitized;
  },

  async getProposalVersionSanitized(id: string): Promise<ProposalVersion | null> {
    const version = await this.getProposalVersion(id);
    if (!version) return null;
    return this.sanitizeProposalVersionForClient(version);
  }
};

// ---------------------------------------------------------------------------
// Site Content (portfolio, site_config, service_overrides)
// ---------------------------------------------------------------------------

export interface PortfolioItem {
  id: string;
  title: string;
  location: string;
  service_slug: string;
  service_name: string;
  description: string;
  image_url: string;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SiteConfigMap {
  phone: string;
  phone_href: string;
  email: string;
  address: string;
  hours_weekday: string;
  hours_weekend: string;
  about_text: string;
  tagline: string;
  [key: string]: string;
}

export interface ServiceOverride {
  slug: string;
  long_description?: string;
  image_url?: string;
  updated_at: string;
}

export const siteContentDb = {
  // Portfolio
  async getPortfolioItems(): Promise<PortfolioItem[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) { console.error('getPortfolioItems:', error.message); return []; }
    return data ?? [];
  },

  async createPortfolioItem(item: Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>): Promise<PortfolioItem | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('portfolio_items').insert([item]).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updatePortfolioItem(id: string, updates: Partial<Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>>): Promise<PortfolioItem | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('portfolio_items').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deletePortfolioItem(id: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Site Config
  async getSiteConfig(): Promise<SiteConfigMap> {
    if (!supabase) return {} as SiteConfigMap;
    const { data, error } = await supabase.from('site_config').select('key, value');
    if (error) { console.error('getSiteConfig:', error.message); return {} as SiteConfigMap; }
    return Object.fromEntries((data ?? []).map(r => [r.key, r.value])) as SiteConfigMap;
  },

  async updateSiteConfig(key: string, value: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('site_config')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw new Error(error.message);
  },

  async updateSiteConfigBatch(updates: Partial<SiteConfigMap>): Promise<void> {
    if (!supabase) return;
    const rows = Object.entries(updates).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('site_config').upsert(rows, { onConflict: 'key' });
    if (error) throw new Error(error.message);
  },

  // Service Overrides
  async getServiceOverrides(): Promise<ServiceOverride[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('service_overrides').select('*');
    if (error) { console.error('getServiceOverrides:', error.message); return []; }
    return data ?? [];
  },

  async getServiceOverride(slug: string): Promise<ServiceOverride | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('service_overrides').select('*').eq('slug', slug).single();
    if (error) return null;
    return data;
  },

  async upsertServiceOverride(slug: string, updates: { long_description?: string; image_url?: string }): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase
      .from('service_overrides')
      .upsert({ slug, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'slug' });
    if (error) throw new Error(error.message);
  },
};
