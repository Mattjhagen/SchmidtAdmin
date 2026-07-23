# Schmidt Construction
## Development Journal
### Day 2

Date: July 2, 2026

---

# Objective

Transition the MVP toward production readiness by implementing branded email delivery, improving security, migrating development into WSL, and preparing the project for deployment.

---

# Email System

Integrated Resend.

Implemented:

- sendProposalEmail()
- branded HTML emails
- proposal links
- expiration dates
- proposal summaries
- Reply-To support

Created:

```
src/lib/email.ts
```

---

## Email API

Created server-side API:

```
/api/proposals/send
```

Responsibilities:

- authenticate estimator
- load proposal
- load client
- load project
- build secure portal URL
- send email
- write audit log

All email delivery occurs server-side.

No API keys are exposed to the browser.

---

## Test Email System

Created:

```
/api/proposals/test-email
```

Added Settings page.

Displays:

- provider
- verified domain
- from address
- reply-to
- email override
- send test email

---

## Email Override

Implemented:

```
EMAIL_OVERRIDE_TO
```

Allows all outbound email to be redirected to a single testing inbox.

Example:

```
purepulseone@pm.me
```

This prevents accidental delivery to real clients during development.

---

## Branding

Integrated Schmidt Construction branding.

Added logo to:

- Login
- Dashboard
- Navigation
- Client Portal
- Printable Proposal
- Email Template

Replaced amber accent colors with Schmidt blue.

---

## Client Portal

Updated printable proposal.

Added:

- branded header
- improved styling
- cleaner proposal presentation

---

## API Debugging

Resolved:

Proposal not found

Root cause:

The API authenticated the user but created a second anonymous Supabase client.

All database queries were therefore blocked by RLS.

Fixed by reusing the authenticated client.

---

## Resend

Encountered sandbox limitation.

Testing addresses are restricted until a verified domain exists.

Solution:

Created

```
schmidt.pacmacmobile.com
```

Configured:

```
PROPOSAL_FROM_EMAIL
```

Verified successful email delivery.

---

## WSL Migration

Migrated project from:

```
/mnt/c/Users/...
```

to

```
/root/Projects/SchmidtConstruction
```

Benefits:

- significantly faster file watching
- better Node performance
- better Git performance
- recommended Next.js workflow

---

## Git

Initialized new repository.

Recovered missing:

```
supabase/
```

directory after migration.

Created migration branch instead of overwriting main.

---

## Issues Remaining

Demo Mode detection still incorrectly activates despite valid environment variables.

Result:

The Settings page disables "Send Test Email".

This is the highest priority bug entering Day 3.

---

# Production Readiness

Completed:

✓ Branded email templates

✓ Server-side email delivery

✓ Reply-To support

✓ Email override

✓ Secure portal links

✓ Audit logging

✓ Logo integration

✓ WSL migration

---

# Next Priorities

1. Resolve Demo Mode detection.
2. Finish production email workflow.
3. Build Catalog system.
4. Implement measurement calculators.
5. Begin AI-assisted estimate generation.
