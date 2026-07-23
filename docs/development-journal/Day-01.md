# Schmidt Construction
## Development Journal
### Day 1

Date: July 1, 2026

---

# Objective

Build the initial production-ready estimating platform for Schmidt Construction.

The goal was to replace traditional Word/PDF estimates with a modern proposal management system supporting version history, negotiation, electronic acceptance, and a client portal.

---

# Major Features Completed

## Core Data Model

Designed and implemented the initial database architecture.

Tables include:

- clients
- projects
- proposals
- proposal_versions
- proposal_line_items
- negotiation_events

Supabase Row Level Security (RLS) policies were created for estimator access while protecting client-facing data.

---

## Proposal Builder

Implemented:

- proposal editor
- line items
- quantity
- unit pricing
- markup
- optional upgrades
- automatic totals
- taxes
- discounts
- proposal statuses

---

## Proposal Versioning

Implemented immutable proposal versions.

Instead of editing existing estimates:

Version 1

↓

Version 2

↓

Version 3

Every proposal revision preserves history.

---

## Client Portal

Created:

/portal/[share_token]

Features include:

- public proposal access
- secure share tokens
- optional upgrade selection
- live total calculation
- proposal comments
- typed electronic signature
- acceptance timestamps

Internal estimator notes are never exposed.

---

## Dashboard

Implemented:

- active proposals
- accepted proposals
- recent activity
- pipeline overview

---

## Authentication

Added:

- estimator login
- protected internal routes
- public portal
- Demo Mode fallback

---

## Local Database Adapter

Created hybrid storage layer.

Supports:

Supabase

↓

or

↓

LocalStorage Demo Mode

This allows development without requiring a live backend.

---

## PDF Generation

Implemented:

- client proposal PDFs
- printable proposal sheets
- multi-page support
- client-only printable content

---

# Architecture

Framework

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend

- Supabase

Deployment

- Vercel

---

# Result

A fully functioning contractor estimating application capable of replacing traditional PDF proposals while preserving proposal history and supporting client negotiation.
