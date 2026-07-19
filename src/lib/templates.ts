// Pre-configured estimate templates for Schmidt Construction
// Location: src/lib/templates.ts

import { ProjectType } from './types';

export interface TemplateLineItem {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  markup_percent: number;
  optional: boolean;
}

export interface ProposalTemplate {
  id: string;
  type: ProjectType;
  title: string;
  description: string;
  scope_of_work: string;
  assumptions: string;
  exclusions: string;
  timeline: string;
  payment_terms: string;
  warranty_notes: string;
  line_items: TemplateLineItem[];
}

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: 'temp-retaining-wall',
    type: 'retaining wall',
    title: 'Retaining Wall Replacement (Segmental Block)',
    description: 'Standard 80LF segmental block retaining wall, 4ft high, with drainage system.',
    scope_of_work: 'Tear down and dispose of failing timber/railroad tie retaining wall. Excavate slope and establish a level base trench with compacted crushed rock. Install 80 LF of segmental block retaining wall (Anchor Highland Stone or equivalent) up to 4ft in height, including caps and geogrid soil reinforcement. Install a 4" perforated drainage pipe behind the wall wrapped in geotextile fabric, and backfill with clean 1" drainage gravel to within 6" of top grade. Finish with black dirt, seed, and straw.',
    assumptions: '1. Machine access is available for a skid steer (minimum 6ft width clearance).\n2. Excavation will be in standard soil/clay (no solid ledge rock encountered).\n3. Diggers Hotline will mark public utilities; private utility lines (irrigation, dog fences) must be marked by the owner.',
    exclusions: '1. Building permits and engineering fees (can be added at cost if required by the city).\n2. Handrails or guardrails at the top of the wall.\n3. Tree removal (if any trees are directly in the wall path).',
    timeline: '5 to 7 business days, weather permitting.',
    payment_terms: '30% deposit to secure schedule slot, 40% upon delivery of blocks/materials to the site, 30% upon final cleanup and client walkthrough.',
    warranty_notes: 'Schmidt Construction provides a 5-year workmanship warranty on wall alignment and structural stability. Material warranty on blocks is provided by the manufacturer (lifetime transferrable).',
    line_items: [
      {
        category: 'Demolition',
        description: 'Tear down existing failing wood tie retaining wall and haul away debris to licensed disposal site',
        quantity: 80,
        unit: 'LF',
        unit_cost: 25.00,
        markup_percent: 20,
        optional: false
      },
      {
        category: 'Excavation & Prep',
        description: 'Cut back slope, excavate foundation trench, and level subgrade for gravel leveling pad',
        quantity: 20,
        unit: 'Hours',
        unit_cost: 85.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Materials',
        description: 'Segmental retaining wall blocks, base rock, caps, geogrid mesh, pins and adhesive',
        quantity: 320,
        unit: 'SF',
        unit_cost: 12.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Drainage',
        description: '4-inch perforated drain tile pipe, silt sock fabric filter, and clean 1-inch gravel backfill',
        quantity: 80,
        unit: 'LF',
        unit_cost: 18.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Labor',
        description: 'Installation labor for laying leveling pad, stacking blocks, pulling geogrid, backfilling and capping',
        quantity: 120,
        unit: 'Hours',
        unit_cost: 65.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Restoration',
        description: 'Haul in black topsoil, grade disturbed lawn areas, spread grass seed and cover with straw matting',
        quantity: 1,
        unit: 'Job',
        unit_cost: 800.00,
        markup_percent: 15,
        optional: false
      }
    ]
  },
  {
    id: 'temp-drainage',
    type: 'drainage',
    title: 'French Drain & Yard Drainage Correction',
    description: 'French drain, sump pump basin, and routing downspouts away from foundation.',
    scope_of_work: 'Excavate a drainage trench (approx. 100 LF) 12" to 18" deep with a minimum 1% downslope. Line the trench with commercial-grade non-woven drainage geotextile fabric. Lay a 4" rigid perforated PVC pipe, bedded in and backfilled with clean 1" washed limestone. Wrap fabric envelope over gravel. Route existing gutter downspouts into solid PVC pipes underground to discharge at the curb or a bubbler emitter. Cut out sod prior to excavation and re-lay sod upon completion.',
    assumptions: '1. Sump basin installation assumes standard basement/yard access.\n2. Electrical supply for the sump pump (if needed) is nearby or will be wired to a new GFI outlet.',
    exclusions: '1. Relocation of underground utilities not marked by Diggers Hotline.\n2. Rerouting sprinkler system lines (irrigation repairs billed separately if required).',
    timeline: '2 to 3 business days, weather permitting.',
    payment_terms: '50% deposit to initiate work, 50% upon testing, flow check, and final sod replacement.',
    warranty_notes: '1-year workmanship warranty on trench grading and pipe connections. Pump manufacturer warranty applies to the sump pump (typically 3 years).',
    line_items: [
      {
        category: 'Trenching',
        description: 'Excavate 100 LF yard trench, depth averaging 15 inches, grade checked with transit laser',
        quantity: 100,
        unit: 'LF',
        unit_cost: 12.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Drainage Materials',
        description: '4" rigid perforated PVC pipe, connectors, non-woven geotextile fabric wrap, and 1" washed river gravel',
        quantity: 100,
        unit: 'LF',
        unit_cost: 14.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Sump Basin Setup',
        description: 'Heavy-duty poly sump pit basin, 1/2 HP cast iron sump pump, check valve, plumbing exit, and electrical hookup',
        quantity: 1,
        unit: 'EA',
        unit_cost: 1200.00,
        markup_percent: 20,
        optional: false
      },
      {
        category: 'Sod Restoration',
        description: 'Laying down premium local Kentucky Bluegrass sod over compacted trench lines to match current yard',
        quantity: 300,
        unit: 'SF',
        unit_cost: 2.50,
        markup_percent: 15,
        optional: false
      }
    ]
  },
  {
    id: 'temp-concrete',
    type: 'concrete',
    title: 'Concrete Patio or Driveway Slab',
    description: 'Standard excavation, formwork, rebar reinforcement, and 4,000 PSI pour.',
    scope_of_work: 'Excavate and grade the designated slab area (approx. 600 SF) to a depth of 4 inches below finished grade. Lay and compact a 2" crushed stone subbase. Set straight wood formwork with stakes. Install a grid of #3 (3/8") steel rebar spaced at 18" on-center, supported on concrete chairs. Pour 4,000 PSI concrete to a depth of full 4 inches. Apply a uniform medium-broom slip-resistant finish. Tool all edges and cut control joints at maximum 10-foot intervals. Apply clear acrylic curing compound. Strip forms the following day.',
    assumptions: '1. Homeowner will provide access to an outdoor water spigot for washouts and curing.\n2. Concrete mixer truck can park within 50 feet of the pour area. If further distance is required, a concrete pump must be rented.',
    exclusions: '1. Concrete pumping fees (if truck access is unavailable, added at cost).\n2. Sealing with colored stains or specialized epoxy sealers.',
    timeline: '3 days total (Day 1: Excavation and formwork; Day 2: Concrete pour and finishing; Day 3: Form stripping and joint inspection).',
    payment_terms: '40% deposit to schedule, 60% upon completion of the pour and form removal.',
    warranty_notes: 'Schmidt Construction provides a 2-year warranty against major structural cracks (wider than 1/4 inch). Minor hairline cracks or surface spalling due to winter salt application are not covered.',
    line_items: [
      {
        category: 'Site Prep',
        description: 'Excavate soil to 6 inches, haul away dirt, level and compact 2-inch rock base',
        quantity: 600,
        unit: 'SF',
        unit_cost: 3.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Reinforcement',
        description: '#3 steel rebar reinforcement grid tied at 18 inches on center, set on support chairs',
        quantity: 600,
        unit: 'SF',
        unit_cost: 1.50,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Concrete Material',
        description: 'Ready-mix 4,000 PSI concrete delivery (including fiber mesh additives for strength)',
        quantity: 8,
        unit: 'CY',
        unit_cost: 185.00,
        markup_percent: 10,
        optional: false
      },
      {
        category: 'Labor',
        description: 'Formwork setup, concrete placing, screeding, hand floating, broom finishing, jointing and stripping',
        quantity: 600,
        unit: 'SF',
        unit_cost: 6.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Decorative Add-on',
        description: 'Optional upgrade: Integral color dye in mix and heavy slate stamp pattern with antiquing release agent',
        quantity: 600,
        unit: 'SF',
        unit_cost: 8.00,
        markup_percent: 15,
        optional: true
      }
    ]
  },
  {
    id: 'temp-kitchen',
    type: 'kitchen remodel',
    title: 'Full Kitchen Remodel & Transformation',
    description: 'Demolition, framing, plumbing/electrical updates, custom cabinets, and quartz countertops.',
    scope_of_work: 'Demolish and dispose of existing kitchen cabinets, countertops, flooring, drywall, and plaster. Reroute electrical circuits to meet current NEC codes, including dedicated kitchen appliance circuits and under-cabinet LED lighting. Frame and rough-in plumbing lines for new sink, faucet, dishwasher, and refrigerator ice-maker. Hang, tape, and finish new mold-resistant drywall. Install custom Maple Shaker cabinetry with soft-close hinges. Fabricate and install 3cm select quartz countertops. Install subway tile backsplash, luxury vinyl plank flooring, and hook up client-supplied appliances.',
    assumptions: '1. Subfloor is structurally sound and free of rot/water damage.\n2. Main electrical panel has adequate space for new breakers.\n3. Homeowner is responsible for purchasing appliances (dimensions must be provided prior to cabinet ordering).',
    exclusions: '1. Cost of purchasing major kitchen appliances.\n2. Wall framing changes or structural wall removals (can be engineered and priced separately).',
    timeline: '3 to 4 weeks (15 to 20 working days).',
    payment_terms: '10% deposit to book and order cabinetry, 40% due on Day 1 of demolition, 30% due upon cabinet installation, 20% due upon appliance hookup and final detail walkthrough.',
    warranty_notes: '1-year complete workmanship warranty. Cabinetry is backed by a 10-year limited manufacturer warranty. Countertops carry a 15-year material warranty.',
    line_items: [
      {
        category: 'Demolition',
        description: 'Demolish kitchen cabinets, soffits, laminate countertops, vinyl flooring, and drywall. Haul away debris.',
        quantity: 1,
        unit: 'Job',
        unit_cost: 1800.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Cabinetry',
        description: 'Supply and installation of premium Maple Shaker cabinets with soft-close hinges and drawer slides (custom layout)',
        quantity: 1,
        unit: 'Job',
        unit_cost: 9500.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Countertops',
        description: 'Premium 3cm solid quartz countertops including template, fabrication, cutout for sink, and eased edge',
        quantity: 45,
        unit: 'SF',
        unit_cost: 85.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Electrical',
        description: 'Rewire kitchen outlets to GFI standards, dedicated circuits for stove/microwave, and under-cabinet LED tape lights',
        quantity: 1,
        unit: 'Job',
        unit_cost: 2800.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Plumbing',
        description: 'Rough-in water lines, drain, sink, pull-out faucet, garbage disposal, and ice-maker line in wall box',
        quantity: 1,
        unit: 'Job',
        unit_cost: 1950.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Backsplash',
        description: 'Classic 3x6 ceramic subway tile backsplash, including waterproofing mastic, grout, and matching caulk',
        quantity: 40,
        unit: 'SF',
        unit_cost: 25.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Flooring',
        description: 'Commercial-grade luxury vinyl plank (LVP) flooring, including foam underlayment and custom color transition transitions',
        quantity: 220,
        unit: 'SF',
        unit_cost: 8.00,
        markup_percent: 15,
        optional: false
      }
    ]
  },
  {
    id: 'temp-bathroom',
    type: 'bathroom remodel',
    title: 'Modern Bathroom Remodel (Tub/Shower & Vanity)',
    description: 'Full demo, tile tub surround, luxury fixtures, and custom solid-wood vanity.',
    scope_of_work: 'Demolish and dispose of existing bathtub, tile surround, vanity, toilet, and flooring. Install a new acrylic tub. Install Schluter-Kerdi waterproof backing board in the shower area, followed by custom porcelain tile surround up to the ceiling. Rough-in Moen single-handle valve and shower trim. Install a 48" solid-wood vanity with quartz countertop and undermount porcelain sink. Install new elongated comfort-height toilet. Install new exhaust fan ducting to the exterior. Lay luxury tile flooring.',
    assumptions: '1. Subfloor is structurally sound (subfloor replacement due to rot, if found, will be billed at $75/hr plus materials).\n2. Main stack vents and main plumbing lines are in usable condition.',
    exclusions: '1. Supply of custom glass shower doors (can be added as an optional line item).\n2. Retiling the bathroom ceiling.',
    timeline: '8 to 10 business days.',
    payment_terms: '30% deposit to secure dates and order custom vanity, 40% due upon completion of plumbing rough-in/inspection, 30% due upon final paint, trim, and fixtures.',
    warranty_notes: 'Schmidt Construction provides a 2-year complete warranty against tile grout cracking and water leaks in the tub/shower assembly.',
    line_items: [
      {
        category: 'Demolition',
        description: 'Remove plaster wall surround, old tub, fiberglass vanity, vinyl floor tiles, toilet, and baseboards.',
        quantity: 1,
        unit: 'Job',
        unit_cost: 1200.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Shower Surround Tile',
        description: 'Porcelain wall tile surround on Schluter-Kerdi waterproof membrane board with accent strip and niche insert',
        quantity: 80,
        unit: 'SF',
        unit_cost: 35.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Plumbing',
        description: 'New standard acrylic tub, shower valve, trim, drain, elongated comfort-height toilet, sink basin, and fixtures',
        quantity: 1,
        unit: 'Job',
        unit_cost: 2200.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Vanity',
        description: '48-inch custom solid wood bathroom vanity cabinet with quartz countertop, undermount sink, and matching mirror',
        quantity: 1,
        unit: 'EA',
        unit_cost: 1650.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Ventilation',
        description: 'Panasonic WhisperQuiet bathroom exhaust fan, routed to exterior roof vent via insulated ducting',
        quantity: 1,
        unit: 'EA',
        unit_cost: 1400.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Glass Door Add-on',
        description: 'Optional upgrade: 3/8" frameless sliding glass shower doors, custom fit, with oil-rubbed bronze hardware',
        quantity: 1,
        unit: 'EA',
        unit_cost: 950.00,
        markup_percent: 15,
        optional: true
      }
    ]
  },
  {
    id: 'temp-commercial',
    type: 'commercial',
    title: 'Commercial Sidewalk & Trip Hazard Repair',
    description: 'ADA-compliant trip hazard grinding and localized high-early concrete slab replacement.',
    scope_of_work: 'Inspect commercial property sidewalks for trip hazards. Grind down sidewalk joints with minor offsets (up to 1" high) using dust-controlled diamond grinders to achieve a 1:12 ADA-compliant slope. Saw-cut, break out, and dispose of severely cracked or spalled concrete sidewalk sections (approx. 160 SF). Grade and compact base rock. Drill and epoxy tie-bars into surrounding slabs. Pour back 5" thick 5,000 PSI high-early concrete with fiber reinforcement to allow rapid reopening. Apply light broom finish and cure.',
    assumptions: '1. Slabs can be barricaded during off-hours. Work can proceed during standard working hours or weekend blocks.\n2. Access to electrical supply for grinding or will supply generator (included).',
    exclusions: '1. Omaha city permit fees (if lane closures are required, permits and barricade fees will be billed at cost).\n2. Underground soil remediation if sinkholes are found under sidewalk (billed as change order).',
    timeline: '2 days (typically Friday afternoon demolition and pour, Sunday morning inspection and reopen).',
    payment_terms: 'Full payment Net 30 days upon invoicing post-completion.',
    warranty_notes: '1-year commercial workmanship warranty against structural failure or settling of the newly poured slabs.',
    line_items: [
      {
        category: 'Grinding',
        description: 'Grind down joints with minor vertical displacement to meet ADA threshold (slopes 1:12)',
        quantity: 12,
        unit: 'Joints',
        unit_cost: 95.00,
        markup_percent: 20,
        optional: false
      },
      {
        category: 'Demolition',
        description: 'Saw cut, break out and excavate 5" thick spalled concrete panels and haul to concrete recycler',
        quantity: 160,
        unit: 'SF',
        unit_cost: 8.00,
        markup_percent: 15,
        optional: false
      },
      {
        category: 'Concrete Material',
        description: '5,000 PSI high-early strength ready-mix concrete with fiber mesh reinforcing, allowing foot traffic in 24 hours',
        quantity: 3,
        unit: 'CY',
        unit_cost: 220.00,
        markup_percent: 10,
        optional: false
      },
      {
        category: 'Labor',
        description: 'Drill and epoxy #4 steel dowels into surrounding concrete, formwork, pour, finish and apply curing sealant',
        quantity: 160,
        unit: 'SF',
        unit_cost: 12.00,
        markup_percent: 15,
        optional: false
      }
    ]
  }
];
