# Day 9 — Customer Portal, Unified Quote Flow & Marketing Site Polish

**Date:** 2026-07-20 – 2026-07-21
**Repos:** SchmidtAdmin (Next.js 16 · TypeScript · Tailwind 4 · Supabase · Netlify) + SchmidtWalls (static marketing site)

> Summary: Built the customer-facing portal — first-time signup, quote-request tracking, and two-way messaging between customers and the Schmidt team. Unified the public quote flow with address capture and multi-admin email notifications. On the marketing site: product-page photo showcases, the interactive project map moved to Service Areas, mobile navigation fixes, and hero CTAs rewired to the new quote portal.

---

## 1. Customer Portal (SchmidtAdmin)

`d11b62f` — Add customer portal: first-time signup, request tracking, two-way messaging

- **`/portal`** — customers sign in (or sign up on first visit) with the email they used on their quote request and see every request they've submitted, with status.
- **Two-way messaging** — `portal_messages` thread attached to each quote request. Customers write from the portal; contractors reply from the new admin **Messages** page; replies email the customer a link back to their portal.
- **API routes** — `/api/portal/requests` (list caller's requests + threads; admins see every request that has a customer email) and `/api/portal/message` (post to a thread with role checks).
- **Tightened RLS** (migration `20260722000000_customer_portal.sql`): now that customers hold real Supabase accounts, admin access is scoped to a `portal_admins` allowlist via a `is_portal_admin()` SECURITY DEFINER helper; customers can only read/write threads on their own requests (matched by account email).
- **`/portal/reset`** — password reset flow for customer accounts.

## 2. Unified Quote Flow

- `c1a8c49` — one quote form for the public site and portal, now capturing the **job address** (migration `20260720000000_quote_requests_address.sql`), with notification emails fanned out to multiple admins.
- `fb37cd2` — middleware fix: `/quote` is reachable without an admin session.
- `7966c82` (SchmidtWalls) — auth-state listener on the login page so magic-link redirects complete instead of stalling.

## 3. Admin Quality Fixes

- `46de7d9` — reports PDF generation switched from `html2canvas` to `html-to-image` (html2canvas chokes on modern CSS color functions like `oklch` used by Tailwind 4).
- `e86746a` — quote portal header: valid PNG logo, brand-blue phone number.

## 4. Marketing Site (SchmidtWalls)

- `38fc5f2` — applied client-requested email copy changes; added photo showcases to the product pages.
- `d34b180` — interactive project map moved off the homepage onto **Service Areas**.
- `68d508d` — mobile hamburger fix: removed an orphaned form-submission fragment that broke the menu.
- `fe7caa3` / `0b30df0` / `acacd07` — removed header images, made layouts more mobile-friendly, localized pages, cleaned up the map header.
- `2e16dec` / `fc2f406` — hero CTA buttons rewired to the Netlify quote portal.

---

## Files Touched (highlights)

**New**
- `src/app/portal/page.tsx`, `src/app/portal/reset/page.tsx`
- `src/app/(app)/messages/page.tsx`
- `src/app/api/portal/requests/route.ts`, `src/app/api/portal/message/route.ts`
- `src/lib/portalAuth.ts`
- `supabase/migrations/20260720000000_quote_requests_address.sql`
- `supabase/migrations/20260722000000_customer_portal.sql`

**Modified**
- `src/middleware.ts` — public paths for `/quote` and `/portal`
- `src/lib/email.ts` — portal reply notifications
- SchmidtWalls: `index.html`, product pages, `service-areas.html`, mobile menu script

---

## Notes
- The customer portal migration was written but **not yet applied** to the production database — this surfaces (painfully) on Day 10.
