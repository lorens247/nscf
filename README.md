# NOUN Student Representatives Directory

A production-ready directory of student representatives for the National Open University of Nigeria.
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL via Drizzle ORM · Auth.js credentials sign-in.

## Features

**Public**
- Server-rendered directory with SQL-side search, six facets (faculty, department, position, study centre, state, session), sorting and pagination
- Academic session switcher, including historical sessions
- Profile pages with institution-wide privacy controls
- Share page with a QR code generated from the real request host
- Mobile-first chrome: bottom tab bar, sticky search, thumb-reachable contact actions
- SEO metadata, Open Graph, semantic landmarks, skip link, 16px form fields, 44px touch targets

**Administration** (`/admin`)
- Representatives: create, edit, archive, restore, permanent delete (admin only)
- Catalog: faculties, departments, programmes, study centres, sessions, positions, states — deletion is blocked while a record is in use
- CSV import with per-row validation and name→id resolution, plus a round-trippable CSV export
- Privacy controls, users and roles (admin / editor / viewer), audit log, institution settings and logo URL

## Stack decisions

- Server Components by default. Client components are limited to the admin nav, the bottom tab bar, copy/share actions and one form.
- Validation runs on the server through Zod (`src/lib/validators.ts`); forms are plain `<form>` submissions to typed server actions, so create/update/archive work with JS disabled.
- Institution identity is read from the database (`src/lib/institution.ts`), never hard-coded at the call sites.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes in production | Signs session JWTs. Without it a random per-process secret is used and sessions end on restart. Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical origin used for share links, QR codes and metadata |
| `AUTH_TRUST_HOST` | Optional | Already implied by `trustHost: true` in `src/auth.ts` |

## Development

```bash
npm install
cp -n .env.example .env        # then fill in the values above
npx drizzle-kit push           # apply the schema
npx tsx src/db/seed.ts         # demo institution, catalog, representatives
npm run dev
```

Sign in at `/admin/login` with the seeded account `admin@noun.edu.ng`. The seed writes the
password `admin123` as a bcrypt hash — **change it before any public deployment.**

## Deployment

```bash
npm run build
npm start
```

The build runs `next build`; `npm start` serves the production bundle. Point a reverse proxy at
port 3000, set `NEXT_PUBLIC_SITE_URL` to the public origin, and ensure `AUTH_SECRET` is set so
sessions survive restarts and work across instances.

Migrations are applied with `npx drizzle-kit push` (or generate migration files with
`npx drizzle-kit generate` for a reviewed, versioned history in CI).

## Health check

`GET /api/health` returns `200` when the database is reachable.

## Layout

```
src/
  app/                 routes (public directory, admin area, api)
  components/          shared UI, chrome, forms
  db/                  drizzle schema, client, seed
  lib/                 institution, authz roles, validation, csv, audit, privacy, lookups
  auth.ts              Auth.js configuration
```
