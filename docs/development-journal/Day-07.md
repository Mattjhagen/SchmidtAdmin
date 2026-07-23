# Schmidt Construction — Development Journal

A running log of features built, bugs fixed, and decisions made across the SchmidtConstruction and Schmidt-Construction2 repos.

---

## 2026-07-08 — Client Portal, Auth, Redesign

### Customer Portal (`/portal/[share_token]`)
- Portal page was already fully built (server component, sanitizes `internal_notes` server-side via `sanitizeProposalVersionForClient()`)
- Fixed critical bug: `/portal` was not in `PUBLIC_PATHS` in `proxy.ts` — unauthenticated clients were being redirected to admin login
- Fixed portal URL in proposal emails: added `NEXT_PUBLIC_PORTAL_URL` env var (falls back to `NEXT_PUBLIC_SITE_URL`) so emailed links point to `login.schmidt-construction.com` instead of the Vercel preview URL
- Fixed placeholder contact info in proposal PDF header (old phone/email replaced with real values)

### Client Account System
- Added `@supabase/ssr` for server-side Supabase session reads
- Built `/portal/login` — email/password sign up, sign in, forgot password, Google OAuth button
- Built `/portal/dashboard` — authenticated client view of all proposals linked by email to the `clients` table
- Built `/portal/auth/callback` — handles Supabase OAuth redirects and magic links
- Added "Create Account / Sign In" CTA banner to `ClientPortalView`
- Fixed build error: `useSearchParams()` in portal login required Suspense boundary

### Google OAuth
- Supabase Google provider enabled; Authorized redirect URI: `https://bumbtuwjukbxfnyrjhti.supabase.co/auth/v1/callback`
- Google OAuth consent screen needs `schmidt-construction.com` as authorized domain and `/privacy` URL before publishing

### Supabase RLS Fix
- Root cause of portal 404: RLS policies blocked anon key from reading proposals, projects, clients, proposal_versions, proposal_line_items
- Fix: add `SELECT` policies for `anon` role on those tables (share_token UUID acts as the access credential)

### Terms of Service & Privacy Policy
- `/terms` — covers electronic signatures (E-SIGN Act), Nebraska governing law, portal account terms, payment/lien rights
- `/privacy` — covers data collected, Supabase/Resend/Vercel as processors, retention (7 years), user rights, deletion requests
- Both linked in footer Company column and included in `sitemap.ts` at priority 0.3

---

## 2026-07-07 — Navigation, Walls2 Redirect, Sitemap

### Dropdown Navigation
- Rewrote `MarketingHeader` with hover-open desktop dropdowns using `useRef`/`useEffect` outside-click detection
- **Retaining Walls ▾**: Wall Installation, Block, Timber, Seawall & Lakeside, Commercial, Drainage
- **Remodeling ▾**: Kitchen, Bathroom
- **More ▾**: Service Areas, About Us, Hiring
- Fixed: menus were closing if cursor moved off the button before reaching the panel — added 120ms debounced close timer

### walls2.com Redirect
- Added 301 redirect in `proxy.ts` for `walls2.com` / `www.walls2.com` → `www.schmidt-construction.com`
- Requires walls2.com added as domain in Vercel + DNS CNAME at registrar

### Seawall & Lakeside Service Page
- New service entry in `src/content/services.ts` with slug `seawall-lakeside`
- Standard `ServicePageTemplate` page at `src/app/(marketing)/seawall-lakeside/page.tsx`
- Added to Retaining Walls dropdown and sitemap

### Hiring Page
- `/hiring` — 4 open positions (Retaining Wall Installer, Concrete Laborer, Equipment Operator, General Laborer)
- "Why Work With Us" bullet list + How to Apply section with phone + contact link

### Sitemap
- `src/app/sitemap.ts` auto-generates all service slugs plus static pages
- Footer link added; `/hiring`, `/seawall-lakeside`, `/terms`, `/privacy` all included

---

## 2026-07-06 — Photos, Hero Slideshow, Services Grid, Contact

### Asset Pipeline
- Downloaded 10 photos from original `schmidt-construction.com` CDN to `public/assets/`
- All service cards now use real photos from `/assets/`
- Portfolio page fixed: was backwards-checking `image_url` — showed emoji instead of photos

### Hero Slideshow
- `HeroSlideshow` client component: CSS crossfade every 5s, dot indicators, clickable
- Homepage fetches portfolio items from Supabase; slideshow auto-updates when photos change in Site Editor
- Falls back to static `/images/retaining-wall.jpg` if no portfolio photos in DB

### Services Grid with Admin Edit
- `ServiceCard` accepts `imageUrl` prop with `object-cover` + hover scale
- Homepage builds `serviceImageMap` from Supabase `service_overrides` keyed by `slug`
- `AdminEditHint` component: shows "Edit in Site Builder" badge only when `schmidt_auth_session` in localStorage

### Contact Form
- `sendContactForm` server action — sends via Resend to `Mikiel@schmidt-construction.com`
- `ContactForm` client component with `idle | sending | success | error` status states

---

## 2026-07-05 — Site Content & Contact Info

### Contact Info
- Phone updated to `(402) 320-2600` across all files
- All occurrences of `estimates@schmidt-construction.com` replaced with `Mikiel@schmidt-construction.com`
- Admin portal footer link added pointing to `login.schmidt-construction.com`

### Email System
- Resend lazy-initialized: `function getResend() { return new Resend(process.env.RESEND_API_KEY); }` — never in client bundle
- `from` address: `"Schmidt Construction <Mikiel@schmidt-construction.com>"`
- `EMAIL_OVERRIDE_TO` Vercel env var: used for testing, removed after going live

---

## 2026-07-04 — Proposal System, PDF, Client Portal Email

### Email Proposal Flow
- `POST /api/proposals/send` — authenticates via Bearer token, loads proposal/version/project/client, builds portal URL, sends via Resend, updates status to "Sent", logs audit
- `sendProposalEmail()` in `src/lib/email.ts` — Resend template with portal link
- Portal URL: `${NEXT_PUBLIC_PORTAL_URL}/portal/${proposal.share_token}`

### Proposal PDF
- `exportProposalPDF()` — html2canvas + jsPDF, targets `#proposal-print-sheet` div
- Client-visible: scope, line items, deposit breakdown, payment terms, assumptions, exclusions, warranty notes, e-signature block
- `internal_notes` field stripped server-side by `sanitizeProposalVersionForClient()` — **never exposed to client**

---

## Earlier — Core Estimator & Admin

### Estimator (Days 1–5)
- Wall dimensions helper with block/linear foot calculator
- Saved proposal options library
- Proposal versioning (V1, V2, V3…) with status flow: Draft → Sent → Viewed → Accepted / Revised
- Negotiation events table for client ↔ estimator comments
- Audit log on every status change and view event

### Admin Site Editor
- Service override table (`service_overrides`) — per-service image URL and long description
- Portfolio items table — image upload to Supabase Storage with service role key
- `siteContentDb` helper wraps all site content DB calls
- ISR: marketing pages `revalidate = 3600`

### Auth
- Admin: cookie-based (`schmidt_admin`) via `proxy.ts` subdomain guard on `login.schmidt-construction.com`
- Client: Supabase JWT via `@supabase/ssr` (separate from admin auth)

---

## Schmidt-Construction2 (`redesign` branch)

### Visual Redesign — GoDaddy Clone
- **Color**: Royal blue `#3D52D4` replaces yellow as primary brand color
- **Hero**: Solid blue background, ALL CAPS centered headline, horizontal rule divider, pill CTA button — matches `schmidtconstruction.godaddysites.com` exactly
- **Header**: White background, logo left, blue pill phone button
- **Homepage layout**: Blue accent bar → Services grid → Project 6-image grid → Testimonials → Hours + CTA panel
- **Footer**: Deep navy (`#1a2a7a`), 4 columns, business hours, newsletter signup with "10% off" offer
- **Section content**: `src/content/sections.ts` — editable defaults for hero, about, services, projects, testimonials, hours
- **Admin section editor**: `/admin/sections` — panel-based editor for hero headline, sub-headline, CTA text, about copy, bullets, and business hours (inspired by vibeCodesSpace SectionEditor pattern)
- **ThemeProvider**: Light/dark toggle via `localStorage` + `prefers-color-scheme`
- **NewsletterSignup**: Email capture component in footer

---

## Security Constraints (permanent)

- `RESEND_API_KEY` never in client code — all email sending is server-side only
- `internal_notes` never exposed to client — `sanitizeProposalVersionForClient()` strips it server-side
- Supabase service role key never in public/client code
- `EMAIL_OVERRIDE_TO` only set server-side via Vercel env var
- Portal share_token is the access credential — treat like a private link
- `/portal/[share_token]` page: do not modify sanitization logic
