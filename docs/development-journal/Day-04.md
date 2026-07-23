# Schmidt Construction
## Development Journal
### Day 4

Date: July 3, 2026

---

# Objective

Identify and resolve a series of production crash bugs in the Proposal Builder, improve error visibility for client-side failures, and ship a stable Catalog Picker with working calculator tab to the beta branch.

---

# Bugs Fixed

## Revision Page Crash — "This Page Couldn't Load"

**Symptom:** Navigating to a proposal revision (`/proposals/[id]/edit?revise=true`) in Vercel production showed a blank "This page couldn't load" screen with no error in the server logs.

**Root Cause:** The `useEffect` in `ProposalEditor.tsx` that loads proposal data included `router` and `isRevisionMode` in its dependency array. The `router` object from `useRouter()` is not referentially stable between renders in Next.js App Router, causing the data-load effect to re-fire on every render and create a React "Maximum update depth exceeded" infinite loop. Client-side crashes of this kind do not appear in Vercel's server logs.

**Fix:** Removed `router` and `isRevisionMode` from the `useEffect` dependency array. The load effect now depends only on stable identifiers: `projectId`, `templateId`, `proposalId`, `viewVersionId`, and `isRevision`.

---

## Incomplete Draft Save

**Symptom:** Saving an existing draft proposal (non-revision Supabase path) silently did nothing — it showed an alert but never wrote to the database.

**Root Cause:** A code path in `ProposalEditor.tsx` reached an `alert('Draft successfully updated.')` call with no actual database write behind it.

**Fix:** Added `updateProposalVersion()` to `src/lib/db.ts` (Supabase + localStorage paths) and replaced the placeholder alert with a real `await db.updateProposalVersion(targetVerId, versionData, itemsForSave)` call.

---

## Eye Button / Version History Crash

**Symptom:** Clicking the eye icon (👁) next to V1 in the project's version history navigated to `/proposals/[id]/edit?version_id=...` and showed an error page.

**Root Cause:** `CatalogPicker.tsx` called `hydrateItems()` recursively. When hydrating assembly items, each assembly looked up its components by calling `hydrateItems()` again before the flat list existed, causing a `RangeError: Maximum call stack size exceeded`. Because `const ALL_ITEMS = hydrateItems()` runs at module load time, the crash occurred the instant `ProposalEditor` imported `CatalogPicker` — before any JSX rendered, on every proposal edit route.

**Fix:** Rewrote `hydrateItems()` as a two-pass function. Pass 1 builds a flat array of all items without assembly components. Pass 2 iterates that flat array and wires assembly components from it. No recursion, no stack overflow.

---

## Calculator Tab Browser Freeze

**Symptom:** Clicking the CALCULATORS tab in the Catalog Picker completely froze the browser renderer (45-second CDP timeout, no JS evaluation possible).

**Root Cause:** `useState<MeasurementTemplate>(MEASUREMENT_TEMPLATES[0])` stored an object with a `calculate()` shorthand method in React state. React's state update mechanism checks `typeof action === 'function'` to decide whether to invoke a functional updater. Storing a function-containing object in state and updating it with `setCalcTemplate(t)` caused React to enter an infinite reconciliation loop — the component re-rendered every frame until the renderer was exhausted.

**Fix:** Changed `calcTemplate` from a `useState<MeasurementTemplate>` to a `useState<string>` holding only the `jobType` key. The full template object is derived during render via `MEASUREMENT_TEMPLATES.find(t => t.jobType === calcJobType)`. The `useEffect` dependency array was updated from `[calcTemplate]` to `[calcJobType]`.

**Rule established:** Functions must never be stored in React state. Store a string key and derive the object during render.

---

# Error Boundary Added

Added `src/app/proposals/[id]/error.tsx` — a React error boundary for the proposals route segment. Client-side crashes on any proposal page now:

- Log the error message and stack trace to the browser console (visible in DevTools)
- Render a "Something went wrong" UI with a "Try again" button instead of a blank screen

Previously, client crashes were invisible: no server log entry, no visible error message. This makes future debugging significantly faster.

---

# Security Maintained

All security constraints from prior sessions remain intact:

- `RESEND_API_KEY` is never exposed to client code
- Internal estimator notes are stripped server-side by `sanitizeProposalVersionForClient()` before any client receives proposal data
- All email sending remains server-side via API routes
- `EMAIL_OVERRIDE_TO` is displayed only from the server-provided prop

---

# Files Changed

| File | Change |
|------|--------|
| `src/components/ProposalEditor.tsx` | Removed unstable `router` from useEffect deps; fixed incomplete draft save |
| `src/lib/db.ts` | Added `updateProposalVersion()` for Supabase and localStorage |
| `src/components/CatalogPicker.tsx` | Two-pass `hydrateItems()` to fix stack overflow; `calcJobType` string state to fix calculator freeze |
| `src/app/proposals/[id]/error.tsx` | New — client error boundary for proposal routes |

---

# Lessons Learned

**Client-side React crashes do not appear in Vercel server logs.** When a page works locally but fails in production with no log entry, check the browser console directly — the error is happening in the browser, not on the server.

**Never put functions in React state.** Objects with methods (shorthand or otherwise) can cause React's functional-update detection to misfire, producing infinite render loops. Store string keys and derive full objects during render.

**Module-level execution is eager.** `const X = expensiveFunction()` at the top of a module runs at import time — before any component mounts or any JSX renders. A crash here takes down every route that imports the module.

**Unstable references in useEffect deps cause infinite loops.** `useRouter()` returns a `router` object that may not be referentially stable across renders. Including it in a `useEffect` dependency array that calls `setState` creates a guaranteed infinite update loop.

---

# Status

✓ Client Management

✓ Project Management

✓ Proposal Builder

✓ Proposal Versioning — revision flow stable

✓ Draft Save — writing to database correctly

✓ Client Portal

✓ Electronic Acceptance

✓ PDF Generation

✓ Production Email Delivery

✓ Branded Proposal Emails

✓ Catalog Picker — search and calculator tabs stable

✓ Measurement Calculators — retaining wall, concrete slab, french drain

✓ Audit Logging

✓ Supabase Integration

✓ Cloudflare DNS

✓ Error Boundaries on Proposal Routes

---

# Next Priorities

- Add Change Orders module
- AI-assisted estimate generation
- Expand project management tools (scheduling, milestones)
- Connect calculator results to live catalog pricing
- Client-facing proposal acceptance notifications
