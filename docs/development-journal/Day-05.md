# Schmidt Construction
## Development Journal
### Day 5

Date: July 4, 2026

---

# Objective

Add a practical retaining-wall estimating helper to the Proposal Builder: enter wall dimensions, calculate core quantities, generate proposal line items, and save reusable named options to the database for future jobs.

This is an in-editor helper — not a separate estimating module. All new panels are collapsible and optional. Non-wall proposals are completely unaffected.

---

# Feature 1: Wall Dimensions Panel

Added a collapsible **Wall Dimensions & Pre-Calculation** panel directly inside the Proposal Editor, positioned above the line items table.

Capabilities:

- Add unlimited named wall sections (Front Wall, North Wall, Wall A, etc.)
- Per section: Label, Length (ft), Height (ft), optional Notes
- "Include in total" checkbox per section — unchecked walls become phase items
- Auto-calculates area: `area_sf = length_ft × height_ft`
- Summary badges: Total Area, Included Area, Phase / Future Area
- Collapsed by default — opens on demand, invisible on non-wall proposals

Example:

```
Wall A — Front Wall
Length: 80 ft | Height: 4 ft | Area: 320 SF ✓ Included

Wall B — Rear Wall
Length: 45 ft | Height: 3.5 ft | Area: 157.5 SF ✗ Phase
```

---

# Feature 2: Generate Wall Estimate Items

The panel includes a **Generate Wall Estimate Items** button that creates proposal line items from the entered dimensions.

Included walls generate 6 required line items:

| Line Item | Unit | Qty Formula |
|-----------|------|-------------|
| Demolition & Tear Out | SF | Included area |
| Excavation & Footing Prep | LF | Included wall length |
| Retaining Wall Installation | SF | Included area |
| Drain Tile Installation | LF | Included wall length |
| Backfill Material | SF | Included area |
| Cleanup & Debris Haul Away | EA | 1 |

Default pricing is applied (editable after generation):
- Demo: $8/SF · Excavation: $12/LF · Wall Install: $45/SF · Drain Tile: $18/LF · Backfill: $6/SF · Cleanup: $150/EA · Markup: 35%

Phase / excluded walls generate one phase line item per wall section:
- Type: Phase · Client selectable · Not selected by default
- Quantity: wall area SF · Price: $45/SF · Description: `Phase: {Label} — {dimensions}`

Generated items are standard proposal line items. The estimator can edit every field (description, quantity, unit, cost, markup, type, client-selectable).

---

# Feature 3: Phase Wall Sections

Walls with "Include in total" unchecked become Phase-type line items when the estimator clicks Generate. These items are client-selectable in the portal, not selected by default, and not counted in the base contract total.

This directly supports the Schmidt use case: "Not every wall needs immediate attention. Client may choose which walls to proceed with."

---

# Feature 4: Saved Options Library

Added a collapsible **Saved Options Library** panel in the Proposal Editor, positioned above the line items table.

A saved option is a named, reusable line item template. It stores:

- Name and description
- Category (Upgrade, Phase, Optional, Drainage, Concrete, Labor, Materials, Other)
- Default price, unit, quantity, markup
- Line item type (required/optional/phase/alternate)
- Client selectable and selected-by-default flags

Capabilities:

- View all saved options with search/filter by name or category
- One-click insert into current proposal
- Create new option manually via inline form
- Edit existing option
- Delete option

When a saved option is inserted into a proposal, it creates a standard proposal line item. It is **not live-linked** — future edits to the saved option do not alter existing proposals. This keeps proposal history stable.

Example saved options:

- Premium Drain Tile Upgrade (Upgrade · Optional)
- Decorative Stone Backfill (Materials · Optional)
- French Drain Extension (Drainage · Phase)
- Landscape Restoration (Labor · Optional)
- Concrete Cap Upgrade (Concrete · Optional)
- Permit Coordination (Other · Required)
- Engineering Review Allowance (Other · Optional)

---

# Feature 5: Database Migration

Created `supabase/migrations/20260704000000_phase_5_wall_dimensions_saved_options.sql`:

1. Added `wall_sections JSONB DEFAULT '[]'::jsonb` to `proposal_versions` — stores wall section data on the version, no extra table needed.

2. Created `saved_proposal_options` table with all option fields.

3. Enabled RLS on `saved_proposal_options`.

4. Policy: authenticated estimators can manage all saved options. No public access.

---

# Feature 6: TypeScript Types

Added to `src/lib/types.ts`:

```typescript
export interface WallSection {
  id: string;
  label: string;
  length_ft: number;
  height_ft: number;
  area_sf: number;
  notes?: string;
  include_in_total: boolean;
}

export interface SavedProposalOption {
  id: string;
  name: string;
  description?: string;
  category?: string;
  default_price: number;
  default_unit: string;
  default_quantity: number;
  default_markup_percent: number;
  line_item_type: LineItemType;
  client_selectable: boolean;
  selected_by_default: boolean;
  created_at: string;
  updated_at: string;
}
```

`ProposalVersion` updated to include `wall_sections?: WallSection[]`.

---

# Files Changed

| File | Change |
|------|--------|
| `src/lib/types.ts` | Added `WallSection`, `SavedProposalOption`; updated `ProposalVersion` |
| `src/lib/db.ts` | Added `getSavedOptions`, `createSavedOption`, `updateSavedOption`, `deleteSavedOption` |
| `src/components/WallDimensionsPanel.tsx` | New collapsible wall dimension helper component |
| `src/components/SavedOptionsPanel.tsx` | New collapsible saved options library component |
| `src/components/ProposalEditor.tsx` | Integrated both panels; wall_sections in save/load path |
| `supabase/migrations/20260704000000_...` | Wall sections JSONB + saved_proposal_options table |

---

# Design Decisions

**Store wall sections as JSONB on proposal_versions, not a separate table.**
Each proposal version has its own wall section state. Version history is preserved automatically. No joins required. Simpler to implement and maintain.

**Saved options are copied into proposals, not live-linked.**
If Schmidt updates "Concrete Cap Upgrade" pricing in the library, past proposals remain accurate. Proposal history integrity is non-negotiable.

**Formulas kept simple.**
No engineering-grade soil load, geogrid, or batter calculations yet. Area = length × height. Estimators can always override any generated quantity. Complexity should be added when there's real field feedback, not speculatively.

**Panels are collapsible and default-closed.**
Wall dimensions and saved options panels do not appear unless the estimator opens them. Concrete, drainage, and remodel proposals are completely unaffected.

---

# Lessons Learned

**Collapsible panels are the right pattern for optional helpers.** The editor already has many fields. New features that aren't always needed must not add visual weight to every proposal.

**Storing JSONB on the version row is the right trade-off for small embedded data.** Wall sections are tightly coupled to a version's context — they don't need their own lifecycle, relationships, or RLS.

**Copy-on-insert preserves proposal integrity.** Reusable libraries should feed proposals like a stamp, not maintain a live link. Legal and accounting need stable records.

---

# Status

✓ Client Management

✓ Project Management

✓ Proposal Builder

✓ Proposal Versioning

✓ Draft Save

✓ Client Portal

✓ Electronic Acceptance

✓ PDF Generation

✓ Production Email Delivery

✓ Branded Proposal Emails

✓ Catalog Picker (search + calculators)

✓ Measurement Calculators (retaining wall, concrete slab, french drain)

✓ Wall Dimensions Pre-Calculation

✓ Generate Wall Estimate Items from Dimensions

✓ Phase / Future Wall Sections

✓ Saved Options Library (create, edit, insert, delete)

✓ Audit Logging

✓ Supabase Integration

✓ Cloudflare DNS

✓ Error Boundaries on Proposal Routes

---

# Next Priorities

- Add "Save current line item to library" button directly in the line items table
- Connect wall calculator to catalog pricing (pull material unit costs from catalog)
- Change Orders module
- AI-assisted estimate generation
- Scheduling and milestone tracking
- Client-facing acceptance notifications
