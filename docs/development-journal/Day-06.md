# Schmidt Construction
## Development Journal
### Day 6

Date: July 6, 2026

---

# Objective

Build a public, SEO-ready marketing website for Schmidt Construction inside the existing Next.js app. The estimator tool and the public site share the same codebase and domain — separated cleanly using Next.js route groups so they never interfere with each other.

---

# Architecture: Route Group Separation

The core challenge was adding a public-facing site to an app that previously wrapped every route in `AuthGuard`. The solution is Next.js route groups:

```
src/app/
  layout.tsx              ← root shell (minimal, no auth, no header)
  (marketing)/            ← public pages — no auth required
    layout.tsx            ← MarketingHeader + MarketingFooter + LocalBusinessSchema
    page.tsx              ← homepage /
    about/page.tsx
    contact/page.tsx
    portfolio/page.tsx
    service-areas/page.tsx
    retaining-wall-installation/page.tsx
    block-retaining-wall/page.tsx
    timber-retaining-wall/page.tsx
    commercial-retaining-wall/page.tsx
    drainage-solutions/page.tsx
    concrete-contractor/page.tsx
    kitchen-remodeling/page.tsx
    bathroom-remodeling/page.tsx
  (app)/                  ← estimator tool — AuthGuard required
    layout.tsx            ← AuthGuard + Header + internal footer
    dashboard/page.tsx
    clients/page.tsx
    settings/page.tsx
    catalog/page.tsx
    proposals/...
    projects/...
  login/page.tsx          ← public (outside both groups)
  portal/[share_token]/   ← public (outside both groups)
```

Route groups use parentheses — `(marketing)` and `(app)` — which are invisible in the URL. Both `/` (homepage) and `/dashboard` (estimator) resolve correctly with no path prefix.

**Key constraint:** The root `layout.tsx` must not contain `AuthGuard` or `Header`. Both are now in `(app)/layout.tsx` only. The root layout is purely a shell: font, global CSS, metadata.

---

# Feature 1: Content Files

All marketing copy lives in editable TypeScript files under `src/content/`. No CMS, no API, no rebuild required for text changes — just edit the file and deploy.

### `src/content/site.ts`
Central company config: name, phone, email, address, social links, CTA text, SEO defaults, `yearsInBusiness` (auto-calculated). All marketing components import from here so one change updates the entire site.

### `src/content/services.ts`
Defines all 8 services as structured data. Each service has: `id`, `name`, `slug`, `shortDescription`, `longDescription`, `features[]`, `icon`, `image`, `seoTitle`, `seoDescription`, `relatedSlugs[]`, `featured`. Helper functions: `getServiceBySlug()`, `getRelatedServices()`, `featuredServices`.

### `src/content/testimonials.ts`
5 customer testimonials with name, location, service, quote, rating, featured flag.

### `src/content/serviceAreas.ts`
9 communities served (Omaha, Bellevue, Papillion, La Vista, Gretna, Elkhorn, Millard, Ralston, Council Bluffs IA). Primary/secondary designation.

### `src/content/portfolio.ts`
6 completed project entries with title, location, service, description, image path.

---

# Feature 2: Marketing Components

All reusable marketing UI lives in `src/components/marketing/`.

### `MarketingHeader`
Sticky nav bar with logo, navigation links, phone number CTA. Mobile hamburger menu with client-side toggle. No auth state, no Supabase imports.

### `MarketingFooter`
Company info, services list (auto-generated from `services.ts`), company links. Copyright line auto-updates from `site.yearsInBusiness`.

### `Hero`
Full-width dark hero with background image overlay, headline, description, primary/secondary CTA buttons, trust badges (years in business, licensed, free estimates).

### `ServiceCard`
Linked card for the homepage service grid. Shows icon, name, short description, "Learn more →" link. Hover state in yellow accent.

### `TestimonialCard`
Star rating, quote, customer name, location, service type.

### `CTASection`
Yellow call-to-action band with phone number and contact page link. Used at the bottom of every service page and the homepage.

### `ServicePageTemplate`
Reusable layout for all 8 service pages. Accepts `service` and `related[]` props. Contains: hero with breadcrumb, two-column content (long description + features checklist), CTA section, related services grid. All 8 service pages are ~15 lines each — just a slug constant and metadata.

### `LocalBusinessSchema`
Renders `application/ld+json` JSON-LD structured data for Google's local business knowledge panel. Includes business name, address, phone, email, geo coordinates, service catalog.

---

# Feature 3: Marketing Pages (13 total)

| Route | Page |
|-------|------|
| `/` | Homepage: hero, service grid, why-us, testimonials, CTA |
| `/about` | Company story, founding year, commitments, service area |
| `/retaining-wall-installation` | Service page |
| `/block-retaining-wall` | Service page |
| `/timber-retaining-wall` | Service page |
| `/commercial-retaining-wall` | Service page |
| `/drainage-solutions` | Service page |
| `/concrete-contractor` | Service page |
| `/kitchen-remodeling` | Service page |
| `/bathroom-remodeling` | Service page |
| `/portfolio` | Project gallery (6 items) |
| `/service-areas` | Primary + additional coverage by community |
| `/contact` | Phone/email/hours + mailto estimate form |

---

# Feature 4: SEO Infrastructure

### `src/app/robots.ts`
Blocks crawlers from all estimator routes (`/dashboard`, `/clients`, `/projects`, `/proposals`, `/settings`, `/catalog`). Allows all marketing routes. Points to sitemap.

### `src/app/sitemap.ts`
Auto-generates sitemap from `services.ts` slugs + static pages. All entries get `lastModified: new Date()` and `changeFrequency: 'monthly'`.

### `public/llms.txt`
Plain-text index for AI assistants (following llms.txt convention). Lists all services with URLs, contact info, service area. Helps LLMs answer questions about Schmidt Construction accurately.

### Root layout metadata
Comprehensive `Metadata` object in root `layout.tsx`:
- `metadataBase` set to `https://www.schmidt-construction.com`
- `title.template` applies `%s | Schmidt Construction` to all inner pages
- `openGraph` and `twitter` card defaults for social sharing

---

# Bug Fixes

### Resend client build error
**Problem:** `new Resend(process.env.RESEND_API_KEY)` at module top level throws during Next.js build because `RESEND_API_KEY` is not available at build time — only at runtime.

**Fix:** Moved construction into a `getResend()` factory function called at send time, not import time.

```typescript
// Before — breaks build
const resend = new Resend(process.env.RESEND_API_KEY);

// After — resolves at request time
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
```

### Duplicate route path error
**Problem:** When the `(app)` route group was created with `git add`, the original files (`src/app/catalog/page.tsx`, etc.) were still tracked by git. Vercel saw both `/(app)/catalog` and `/catalog` resolving to the same path and rejected the build.

**Fix:** `git rm` on all 9 original files. The route group copies were correct; only the stale git-tracked originals needed removal.

---

# Walkthrough: How to Update the Marketing Site

The marketing site is designed to be edited without touching any component code. All content is in `src/content/`.

### Change the phone number or email

Edit `src/content/site.ts`:

```typescript
phone: '(402) 555-0100',
phoneHref: 'tel:+14025550100',
email: 'estimates@schmidt-construction.com',
```

This updates the header, footer, contact page, and CTA section everywhere simultaneously.

### Add a testimonial

Open `src/content/testimonials.ts` and add an entry to the array:

```typescript
{
  id: 't6',
  name: 'Brad K.',
  location: 'Omaha, NE',
  service: 'Retaining Wall Installation',
  quote: 'Great crew, showed up on time, walls look perfect.',
  rating: 5,
  featured: false,
},
```

Set `featured: true` to show it on the homepage.

### Add a portfolio project

Open `src/content/portfolio.ts` and add an entry:

```typescript
{
  id: 'p7',
  title: 'Backyard Drainage & Regrading',
  location: 'Omaha, NE',
  serviceSlug: 'drainage-solutions',
  serviceName: 'Drainage Solutions',
  description: 'Full yard regrade with French drain and outlet to street.',
  image: '/images/portfolio/backyard-drain.jpg',
  featured: true,
},
```

Drop the actual photo in `public/images/portfolio/backyard-drain.jpg`.

### Add a new service page

1. Add the service to `src/content/services.ts` with a unique `slug`.
2. Create `src/app/(marketing)/your-service-slug/page.tsx`:

```typescript
import { getServiceBySlug, getRelatedServices } from '@/content/services';
import ServicePageTemplate from '@/components/marketing/ServicePageTemplate';
import { notFound } from 'next/navigation';

const slug = 'your-service-slug';

export async function generateMetadata() {
  const s = getServiceBySlug(slug);
  return s ? { title: s.seoTitle, description: s.seoDescription } : {};
}

export default function Page() {
  const service = getServiceBySlug(slug);
  if (!service) notFound();
  return <ServicePageTemplate service={service} related={getRelatedServices(slug)} />;
}
```

3. The sitemap picks it up automatically since it reads from `services.ts`.

### Add real photos

Drop images into `public/images/` and reference them in the content files:

```
public/images/hero-bg.jpg          ← homepage hero background
public/images/retaining-wall.jpg   ← service card image
public/images/portfolio/p1.jpg     ← portfolio gallery
```

Current placeholder: emoji icon centered in a gray box. Replace the `image` field in the service or portfolio content file and the component will use it automatically once the `<Image>` tag is wired to the field.

---

# Walkthrough: How the Estimator Tool Still Works

The estimator tool is completely unchanged. It lives at:

| Route | Access |
|-------|--------|
| `/login` | Public — anyone can reach the login page |
| `/dashboard` | Requires login (AuthGuard in `(app)/layout.tsx`) |
| `/clients` | Requires login |
| `/proposals/[id]/edit` | Requires login |
| `/portal/[share_token]` | Public — client portal, no login required |

Post-login redirect goes to `/dashboard` (was previously `/`). The `/` route now serves the public homepage instead of the dashboard.

Crawlers cannot reach estimator routes — `robots.ts` explicitly disallows them.

---

# Files Changed

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Stripped to minimal shell with full SEO metadata |
| `src/app/(app)/layout.tsx` | New — AuthGuard + Header + footer for estimator |
| `src/app/(marketing)/layout.tsx` | New — MarketingHeader + Footer + JSON-LD |
| `src/app/(marketing)/page.tsx` | Homepage |
| `src/app/(marketing)/about/page.tsx` | About page |
| `src/app/(marketing)/contact/page.tsx` | Contact + estimate form |
| `src/app/(marketing)/portfolio/page.tsx` | Portfolio gallery |
| `src/app/(marketing)/service-areas/page.tsx` | Service area listing |
| `src/app/(marketing)/[8 service pages]` | One page per service via ServicePageTemplate |
| `src/app/robots.ts` | New — crawler rules |
| `src/app/sitemap.ts` | New — auto-generated sitemap |
| `public/llms.txt` | New — AI assistant index |
| `src/content/site.ts` | New — company config |
| `src/content/services.ts` | New — 8 services with SEO fields |
| `src/content/testimonials.ts` | New — 5 testimonials |
| `src/content/serviceAreas.ts` | New — 9 service area entries |
| `src/content/portfolio.ts` | New — 6 portfolio items |
| `src/components/marketing/MarketingHeader.tsx` | New |
| `src/components/marketing/MarketingFooter.tsx` | New |
| `src/components/marketing/Hero.tsx` | New |
| `src/components/marketing/ServiceCard.tsx` | New |
| `src/components/marketing/TestimonialCard.tsx` | New |
| `src/components/marketing/CTASection.tsx` | New |
| `src/components/marketing/ServicePageTemplate.tsx` | New |
| `src/components/marketing/LocalBusinessSchema.tsx` | New |
| `src/components/AuthGuard.tsx` | Simplified — no portal/login special-cases |
| `src/components/Header.tsx` | Updated links to /dashboard |
| `src/app/login/page.tsx` | Redirect to /dashboard post-login |
| `src/lib/email.ts` | Lazy Resend instantiation (build fix) |

---

# Design Decisions

**Content in TypeScript files, not a CMS.**
The client can edit copy by changing a `.ts` file. No admin panel, no API keys, no third-party service to manage. A developer deploys — everything else is just text in a file. If the site grows to need a CMS, the content files are the schema already.

**One `ServicePageTemplate` for all 8 service pages.**
Each service page is ~15 lines: a slug constant, metadata, and a `notFound()` guard. All layout, CTA, and related-service logic lives in the template. Adding a new service requires no component work.

**JSON-LD structured data in the layout, not per-page.**
The `LocalBusinessSchema` component is rendered once in `(marketing)/layout.tsx` and applies to every marketing page. It doesn't need per-page customization for a local business site.

**Disallow estimator routes in robots.txt.**
Proposal data, client names, and estimator workflows should not appear in Google. The `robots.ts` file explicitly blocks all internal tool routes. The portal (`/portal/[share_token]`) is public but token-gated — indexed accidentally it exposes nothing useful.

---

# Status

✓ Public marketing site live at `/`

✓ Homepage with hero, services, testimonials, CTA

✓ 8 SEO-optimized service pages

✓ About, Portfolio, Service Areas, Contact pages

✓ Schema.org JSON-LD structured data

✓ `robots.txt` and `sitemap.xml` auto-generated

✓ `llms.txt` for AI assistant indexing

✓ Estimator tool fully functional at `/dashboard`

✓ Client portal fully functional at `/portal/[share_token]`

✓ No auth leak — marketing pages require zero authentication

✓ Build passing on Vercel

---

# Next Priorities

- Add real photos to `public/images/` (hero, services, portfolio)
- Wire `contact/page.tsx` form to a server action or form service (currently mailto)
- Add Google Analytics or Plausible to the marketing layout
- Add Facebook/Instagram links to `site.ts` social fields
- "Save current line item to library" button in line items table
- Change Orders module
