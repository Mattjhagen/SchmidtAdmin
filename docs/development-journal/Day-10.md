# Day 10 — Live Site Editor Wiring, Supabase Project Migration & Env Hardening

**Date:** 2026-07-22
**Repos:** SchmidtAdmin + SchmidtWalls (both auto-deploying from `main` via Netlify)

> Summary: Closed the gap that made the Site Editor a write-only illusion — the public site (walls2.com) now reads editor content live from Supabase, so the owner can change photos, phone, hours, and service copy with zero code. Then a plot twist: the login for the original Supabase project was lost, so the entire backend moved to the GitHub-linked **Schmidt-Construction** project (`hrrofmyuatuzjzrgyezo`) — full schema bootstrap, seeded site content, and time-clock history migrated by email mapping. Finished by hardening the app against corrupted env-var values that were crashing login.

---

## 1. Site Editor → Public Site, For Real

**The bug:** the Site Editor at `/admin` saved to Supabase (`portfolio_items`, `site_config`, `service_overrides`), but walls2.com is static HTML that never read those tables. Edits went nowhere.

**The fix — live hydration (SchmidtWalls `d605c9b`):**
- New **`site-content.js`**, loaded deferred on every page: fetches the three tables via Supabase REST (public anon key; RLS allows read-only) and updates the DOM in place. Editor changes appear on the next page refresh — no rebuild, no deploy.
- Phone/email rewritten site-wide (all `tel:`/`mailto:` hrefs plus regex over text nodes); `[data-sc="<key>"]`-tagged elements get `site_config` values (hours, about text); `hero_image_1..4` keys override the homepage slideshow.
- `[data-sc-portfolio="all"]` (gallery page) and `[data-sc-portfolio="featured"]` (homepage grid) rebuild from `portfolio_items` when non-empty; static HTML remains the no-JS fallback.
- Service pages tagged `<body data-sc-service="<slug>">` + `[data-sc-service-desc]` / `[data-sc-service-img]` — mapping: retaining-walls → `retaining-wall-installation`, concrete → `concrete-contractor`, remodeling → `kitchen-remodeling`.
- Homepage lightbox converted to **event delegation** so live-swapped gallery items keep working.

**Admin additions (`4e2b45e`):**
- Portfolio editor: **one-click import of the 38 photos** hard-coded on the website (`src/content/websitePhotos.ts`; homepage ones flagged `featured`) so every photo becomes editable/deletable.
- Site Info editor: upload slots for the 4 homepage hero photos.
- `siteContentDb.createPortfolioItems()` bulk insert.

**Writes moved server-side (`73f94e3`):** the browser's authenticated role had no RLS write policy on `portfolio_items`, so all Site Editor writes now go through admin-verified server actions (`src/app/actions/siteContent.ts`) using the service-role key — same pattern as image upload.

## 2. The Lost Login & Supabase Project Migration

Investigating why the Messages page failed ("could not find table `portal_messages`") revealed the Day-9 migration was never applied — and the dashboard login for the original Supabase project (`bumbtuwjukbxfnyrjhti`) was **lost**. Several SQL runs landed in wrong projects before the fingerprint test (`select count(*) from portfolio_items` → 38) proved which database was which.

**Decision:** abandon the orphaned project; move to the **Schmidt-Construction** project (`hrrofmyuatuzjzrgyezo`) already GitHub-linked to this repo.

- **`supabase/migrations/20260722000002_full_schema_bootstrap.sql`** (`a2ab1e9`) — fully idempotent creation of *every* table the app uses: quote requests, portal messages/admins, estimating core (clients, projects, proposals + versions + line items, negotiation events, audit logs, saved options), the time-clock suite, and site content — with RLS throughout (`is_portal_admin()` gating writes; public read only where the site needs it) — plus seeded site config, service copy, and the 38 portfolio photos.
- **Time clock preserved:** exported entries/breaks/audit/settings from the old project via its service key (REST), generated an import script that resolves `user_id` by **email** against `auth.users` at run time — history reattached after the users were recreated. 6 entries, 2 breaks, full audit trail survived.
- Netlify env vars switched to the new project; walls2.com's `site-content.js` repointed (`a260bc7`).
- Supabase auth email templates added under `emails/` (paste into Supabase → Auth → Email Templates).

## 3. Env-Var Hell → Hardened Config

The cutover fought three separate Netlify issues:
1. Env edits initially landed on a **look-alike site** (five `schmidt*` projects existed; the stale ones are now deleted).
2. Netlify's **secrets scanner failed the build** for the anon key appearing in the client bundle — which is exactly where a `NEXT_PUBLIC_*` value belongs. Fixed via `SECRETS_SCAN_OMIT_KEYS` in `netlify.toml` (`472d460`).
3. The anon key kept getting saved as **masked bullet characters** (`eyJhbGci•••…`) — copy/paste of the hidden value — crashing every request with *"String contains non ISO-8859-1 code point"*.

**Permanent fix (`ed27a39`):** new **`src/lib/supabaseEnv.ts`** — single source of truth for the Supabase URL + anon key. Env values are validated (JWTs are strictly ASCII); corrupted or missing values fall back to the known-good public constants. The service-role key is validated but has **no fallback** (it stays a secret). All eleven consumers (db, auth, browser/server clients, portal auth, server actions, API routes) now import from it.

---

## Files Touched (Day 10)

**New**
- SchmidtWalls: `site-content.js`; `data-sc*` tags across all 23 pages
- `src/content/websitePhotos.ts`
- `src/app/actions/siteContent.ts`
- `src/lib/supabaseEnv.ts`
- `supabase/migrations/20260722000001_site_content.sql`
- `supabase/migrations/20260722000002_full_schema_bootstrap.sql`
- `emails/confirm_signup.html`, `emails/invite.html`, `emails/magic_link.html`

**Modified**
- `src/lib/db.ts` — site-content writes via server actions; bulk portfolio insert; supabaseEnv
- `src/app/(app)/admin/portfolio/PortfolioEditor.tsx`, `.../site-info/SiteInfoEditor.tsx`, `.../admin/page.tsx`
- `src/lib/{auth,supabaseClient,supabaseServer,portalAuth}.ts`, `src/app/actions/{uploadImage,admin}.ts`, `src/app/api/{quote,proposals/*,cron/auto-clock-out}` — hardened Supabase config
- `netlify.toml` — secrets-scan exemption for the public anon key

---

## Operational State (end of day)

| Piece | State |
|---|---|
| Database | `hrrofmyuatuzjzrgyezo` (Schmidt-Construction project, GitHub-linked) |
| walls2.com | Live-reading Site Editor content (verified: 38 photos, config, service overrides) |
| Admin app | Rebuilt on new project; login hardened against env corruption |
| Time clock | History migrated; owner confirmed "working like it never stopped" |
| Old project `bumbtuwjukbxfnyrjhti` | Orphaned (login lost) — nothing references it |

## TODO — first thing tomorrow

- [ ] **Fix `SUPABASE_SERVICE_ROLE_KEY` in Netlify (schmidtportals)** — login works, but Messages shows *"Portal is not configured."* because the stored service key is the masked-bullet paste artifact and the new validator (correctly) rejects it. Delete the variable, re-create it, paste the real key from Supabase → Project Settings → API Keys (`service_role`, value ends in `aTbFYg` — reveal before copying, verify after pasting), then **Clear cache and deploy site**. This unblocks Messages, Site Editor saves, photo uploads, and employee onboarding — everything that runs server-side with the service key.

## Notes / Follow-ups
- Service-page photos uploaded pre-migration lived in the old project's storage — re-upload via Site Editor → Service Pages.
- Recreate employee accounts via the app's onboarding; re-run `timeclock-import.sql` if `purepulse@pm.me` is added (its settings row was skipped — no matching user yet).
- Netlify's stored `NEXT_PUBLIC_SUPABASE_ANON_KEY` is still the corrupted masked string; the app no longer cares, but it should be fixed for hygiene (value must end in `ex3Pw`).
- Testimonials/reviews are the last hard-coded public content — candidate for the next Site Editor section.
