# Shit Shop — Project Roadmap

## Project Overview

Shit Shop is a minimalist ecommerce website built with:

- Next.js 16 (App Router)
- TypeScript
- Stripe Checkout
- Supabase
- Docker
- Vercel deployment

The project currently supports:

- User authentication
- Stripe payments
- Order persistence
- Admin dashboard
- Maintenance mode
- Order tracking
- Shipping/customer data collection

---

# IMPORTANT GLOBAL RULES

## Language Policy

The entire website MUST be English-only.

Everything currently written in Italian must be translated and replaced.

This includes:

- UI labels
- Buttons
- Admin pages
- Checkout labels
- Order pages
- Status labels
- Error messages
- Email templates
- Metadata
- Maintenance page
- Stripe custom field labels

No Italian text should remain anywhere in the project.

---

# Current Architecture

## Frontend

Framework:
- Next.js 16 App Router

Main routes:
- `/`
- `/login`
- `/checkout`
- `/orders`
- `/orders/[id]`
- `/admin`
- `/admin/login`
- `/admin/orders`
- `/admin/orders/[id]`
- `/maintenance`

---

## Backend

Main APIs:
- `/api/checkout`
- `/api/orders`
- `/api/logout`
- `/api/admin-auth/login`
- `/api/admin-auth/logout`
- `/api/admin/orders/update-status`
- `/api/admin/settings/toggle-maintenance`
- `/api/stripe/webhook`

---

# Stripe Integration

## Current Status

Stripe Checkout is fully working.

Implemented features:
- Product line items
- Shipping address collection
- Phone collection
- Custom fields
- Metadata persistence
- Webhook order persistence

---

## Important Fix Already Completed

Previously:
- Guest users could access checkout
- Orders could be created with `user_id = null`

Now fixed:
- Only authenticated users can access checkout
- Every order is linked to a valid authenticated user

Database now enforces:

```sql
alter table public.orders
alter column user_id set not null;
```

This is a critical security/business rule.

---

# Supabase

## Current Tables

### `orders`

Important fields:

- `id`
- `user_id`
- `status`
- `order_id`
- `stripe_session_id`
- `stripe_payment_intent_id`
- `customer_email`
- `customer_name`
- `customer_phone`
- `shipping_line1`
- `shipping_line2`
- `shipping_city`
- `shipping_state`
- `shipping_postal_code`
- `shipping_country`
- `tax_code`
- `order_note`
- `currency`
- `amount_subtotal`
- `amount_total`
- `items_json`
- `stripe_payload_json`
- `created_at`

---

### `app_settings`

Currently used for:
- maintenance mode

Key:
- `maintenance_mode`

---

# Authentication

## User Auth

Implemented with Supabase Auth.

Users can:
- login
- access own orders
- access order detail page

RLS logic:
- users can only see their own orders

---

## Admin Auth

Admin auth currently uses:
- cookie-based admin session

Cookie:
- `shit_shop_admin_session`

Admin pages:
- `/admin`
- `/admin/orders`
- `/admin/orders/[id]`

---

# Order System

## Working Features

### User Side
- user order list
- order detail page
- protected routes
- ownership validation

### Admin Side
- full order list
- status updates
- order detail view
- maintenance toggle

---

# Maintenance Mode

## Current Status

Maintenance mode now works correctly.

Previous issue:
- hardcoded middleware flag permanently enabled maintenance

Fixed by removing:

```ts
const MAINTENANCE_MODE = true;
```

Maintenance status now comes only from database state.

---

# Docker

## Current Status

Docker is working.

Previous issue:
- missing `nodemailer` dependency inside container

Resolved by:
- installing dependency
- committing updated package files
- rebuilding container

---

# Git / GitHub

## Current Status

Git push/authentication now works.

Previous issue:
- expired GitHub authentication token

Resolved by:
- regenerating GitHub Personal Access Token
- reconnecting GitHub Desktop auth

---

# Security Improvements Already Completed

## Completed

- authenticated checkout only
- orders linked to users
- protected order pages
- admin-only admin pages
- Stripe webhook verification
- unique Stripe session protection
- maintenance bypass for admin routes
- validated order totals
- protected order ownership

---

# Remaining High Priority Tasks

## 1. Full English Migration

Replace all Italian text across the entire project.

Priority: VERY HIGH

Must include:
- frontend
- admin dashboard
- Stripe labels
- maintenance page
- errors
- buttons
- placeholders
- order statuses

---

## 2. Email System

Current status:
- `nodemailer` installed
- email system not fully implemented

Need:
- order confirmation emails
- shipping emails
- admin notifications

Potential providers:
- Resend
- Postmark
- SMTP

---

## 3. Admin Improvements

Needed:
- dashboard stats
- revenue overview
- search improvements
- pagination
- order export
- customer history

---

## 4. Product Management System

Currently:
- products are hardcoded

Need:
- Supabase products table
- variants table
- stock management
- admin CRUD
- image uploads

---

## 5. Inventory System

Need:
- stock tracking
- sold out logic
- quantity validation
- admin inventory updates

---

## 6. Shipping Improvements

Need:
- shipping cost logic
- shipment tracking
- tracking email
- carrier integration

---

## 7. Stripe Improvements

Potential improvements:
- automatic tax support
- coupons
- discount codes
- abandoned cart recovery
- invoices
- refunds dashboard

---

## 8. UI / UX Improvements

Need:
- responsive refinements
- loading states
- toast notifications
- better admin design
- product gallery
- animations
- accessibility improvements

---

## 9. SEO

Need:
- metadata optimization
- sitemap
- robots.txt
- OpenGraph tags
- structured data

---

## 10. Analytics

Need:
- Plausible or PostHog
- conversion tracking
- Stripe analytics
- funnel analysis

---

# Technical Debt

## Areas to Refactor

### Middleware / Proxy

Current logic should eventually:
- read maintenance state dynamically
- avoid hardcoded bypass lists

---

### Admin Auth

Current admin auth is simplistic.

Eventually replace with:
- proper role-based auth
- Supabase admin roles

---

### Webhook User Lookup

Current implementation:
- scans users by email using admin API

Eventually improve with:
- indexed lookup strategy
- cached mapping
- direct relational auth linkage

---

# Current Stable State

The system is now stable enough for:

- authenticated purchases
- admin order management
- Stripe production payments
- Supabase order persistence
- Docker local development
- Vercel deployment

Core ecommerce flow is functioning correctly.

---

# Immediate Next Recommended Step

Recommended next implementation order:

1. Full English migration
2. Email system
3. Product database
4. Inventory management
5. Admin dashboard improvements
6. Shipping workflow
7. Analytics
8. SEO optimization

---

# Notes For Future AI Sessions

Important architectural facts:

- Checkout must require authentication
- `orders.user_id` is mandatory
- Stripe webhook writes orders
- Admin session uses cookie auth
- Maintenance mode is database-driven
- Products are currently hardcoded
- Entire project must become English-only
- Docker environment is already working
- Production deployment exists on Vercel

Always preserve these rules when modifying the project.

