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
- Single-use representative access codes, with seven-day expiry and revocation

## Representative registration

Public pages show a registration link instead of admin sign-in. Staff can still sign in directly at `/admin/login`.

1. Sign in as an admin or editor. The dashboard at `/admin` includes a **Rep access code generator**. You can also open **Rep access codes** at `/admin/invitations`, or choose **Generate rep code** on the Representatives page.
2. Choose a quantity from 1 to 100 and generate a batch of 10-character codes. Copy individual codes, copy the whole batch, or download a CSV with invitation IDs, codes, registration URLs, and expiry dates. Share them privately with one representative. Only a hash of the code is stored, so the original code cannot be retrieved after leaving the page.
3. The representative opens `/representatives/join`, enters the code, and fills in their name, email, contact preferences, biography, and representation details.
4. They can upload an optional JPEG, PNG, or WebP photo up to 2 MB. Submission publishes their profile and consumes the code. Staff manage subsequent edits through the existing admin pages.

Photos are stored in PostgreSQL and shown on profiles and directory cards. Archived profiles' uploaded photos are unavailable publicly. Email is required for registration; contact details stay private unless the representative opts in. A failed validation or save does not consume the code. Duplicate emails within the institution are rejected, including different capitalization. Revoke unused codes from the admin page when needed.

Apply the schema with `npx drizzle-kit push` before using registration. The new tables are `representative_invite` and `representative_photo`. Server actions accept up to 4 MB to accommodate photo uploads; the app enforces the 2 MB photo limit. The PostgreSQL connection pool is capped at three connections per app process.

Registration checks:

```bash
node --import tsx --test src/lib/representative-registration.test.ts
RUN_DB_TESTS=1 node --import tsx --test src/db/registration.test.ts
```

The database integration test checks invalid, expired, and reused codes, photo persistence, and duplicate-email protection. It rolls back test records; PostgreSQL sequence counters can still advance. These commands require `tsx` to be installed locally.

## Stack decisions

- Server Components by default. Client components are limited to the admin nav, the bottom tab bar, copy/share actions and one form.
- Validation runs on the server through Zod (`src/lib/validators.ts`); forms are plain `<form>` submissions to typed server actions, so create/update/archive work with JS disabled.
- Institution identity is read from the database (`src/lib/institution.ts`), never hard-coded at the call sites.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes in production | Signs session JWTs. Without it a random per-process secret is used and sessions end on restart. Generate: `openssl rand -base64 32` |
| `SITE_URL` | Required for Docker | Public HTTPS origin used for share links, QR codes and metadata; read at runtime |
| `NEXT_PUBLIC_SITE_URL` | Optional legacy fallback | Used when `SITE_URL` is unset; Next.js freezes public variables at build time |
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
password `admin123` as a bcrypt hash for a new account; existing accounts are preserved. Rerunning the seed adds missing demo records without duplicating matching records or overwriting edits. It does not remove pre-existing duplicates. **Change the demo password before any public deployment.**

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

## Refactoring

Completed:

- Made demo seeding repeatable: reuse institution and catalog records, add only missing representatives, preserve existing records and admin passwords, and serialize concurrent seed runs within a transaction.
- Moved catalog field components out of render functions, preserving stable component identity and existing field defaults.
- Reset mobile admin navigation on route changes through a keyed sheet component.
- Shared Escape-key and scroll-lock handling between mobile navigation and directory filters, restoring the previous scroll setting on cleanup.
- Used Next.js links for directory navigation and unique IDs for desktop and mobile filter labels.

Proposed next steps, in priority order:

1. **Centralize environment validation.** Validate database and authentication settings at startup, require a stable production `AUTH_SECRET`, and share environment-loading rules between app and CLI tooling. Add a safe `.env.example` for the documented setup.
2. **Version database migrations.** Commit reviewed SQL migrations and use a migration command for deployments; reserve schema push for development.
3. **Extract directory query logic.** Share filter parsing, query construction, and pagination between directory pages and export routes so filtering stays consistent.
4. **Consolidate catalog operations.** Use a typed catalog definition for table mappings, field metadata, validation, and lookup relationships to reduce repeated switches in forms and server actions.
5. **Improve database error reporting.** Log actionable server-side causes without credentials and distinguish an empty institution table from a connection failure instead of silently using defaults.
6. **Complete sheet accessibility.** Add focus trapping, focus restoration, and background isolation to both mobile dialogs, then verify keyboard navigation.
7. **Add focused regression tests and CI.** Cover authorization, CSV validation, filter parsing, and seed reruns; run lint, TypeScript checks, and relevant tests on pull requests.

Validation commands: `npm run lint` and `npm run typecheck`. Run `npm run build` with the required environment configured before deployment.

Verify seed reruns against the configured database with `RUN_DB_TESTS=1 npx tsx --test src/db/seed-demo.test.ts`. The integration test restores a missing representative, checks that reruns preserve every seeded table and the admin password, and rolls back all test record changes. PostgreSQL sequence counters may still advance.

## Layout

```
src/
  app/                 routes (public directory, admin area, api)
  components/          shared UI, chrome, forms
  db/                  drizzle schema, client, seed
  lib/                 institution, authz roles, validation, csv, audit, privacy, lookups
  auth.ts              Auth.js configuration
```

Demo portrait placeholders for Chidi, Amina, and Emeka are from [Random User Generator](https://randomuser.me/), saved in `public/demo-reps/`. They are sample images, not verified photos of the named representatives.

Programme choices represent degree types (BSc, BA, BEd, LLB, MSc, MA, MBA, MEd, PGD, and PhD), independent of departments. Department choices follow the selected faculty in representative forms and directory filters; changing faculty clears the department selection. Study centres and academic sessions have been cleared, and the demo seed no longer creates states, centres, or sessions. Empty location/session fields are hidden in representative forms.

## Coolify deployment

The admin sidebar groups Overview, Representatives, Academic catalog, Data tools, and Administration, with icons and active menu states. Menus follow the signed-in user's role. On phones and tablets, the menu button opens the same menus in a sidebar drawer.

Use the repository's `Dockerfile` build pack in Coolify. The final image runs Next.js standalone as a non-root user on `0.0.0.0:3000`. Environment files and local dependencies are excluded from the image build context.

1. Create a Git-based application, choose **Dockerfile**, use `/Dockerfile` in the repository root, and expose container port **3000**.
2. Set your HTTPS domain in Coolify. Add these **runtime** environment variables:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Your Supabase PostgreSQL connection string |
   | `AUTH_SECRET` | A stable secret generated with `openssl rand -base64 32` |
   | `SITE_URL` | Your public origin, e.g. `https://reps.example.com` |
   | `AUTH_TRUST_HOST` | `true` |

3. Apply database changes separately before deploying (the existing Supabase database already has the current tables). For a fresh database, review and apply `npx drizzle-kit push` from a trusted checkout with its environment configured. Do not seed demo data automatically in production.
4. Deploy. The image defines a health check against **GET `/api/health`**, including database connectivity. Use the image health check; keep the exposed port at 3000.
5. Verify `/api/health`, `/admin/login`, the code generator at `/admin/invitations`, and a registration with a photo. Change the demo admin password before making the site public.

`SITE_URL` is server-only and read at runtime, so changing domains does not require baking them into the image. Keep `AUTH_SECRET` stable across deployments and replicas. Database secrets are supplied only at runtime; the build uses a dummy local connection string without contacting Supabase. Photos persist in PostgreSQL, and bundled logos/demo images are copied into the image; no upload volume is needed.

Optional local Docker checks:

```bash
docker build -t nscf-directory .
docker run --rm --env-file .env -e SITE_URL=http://localhost:3000 -p 3000:3000 nscf-directory
```

A separate migration image can be built with `docker build --target migrations -t nscf-migrations .` and run interactively with `docker run --rm -it --env-file .env nscf-migrations`. Review proposed schema changes before accepting them. Migrations are not run by the application startup command.

References: [Coolify Dockerfile applications](https://coolify.io/docs/applications/builds/dockerfile), [Coolify health checks](https://coolify.io/docs/applications/configuration/health-checks), and [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables).

Admin navigation stays visible as a sidebar on tablet and desktop screens. On phones, the menu button opens a sidebar drawer. **Log out** is available in the admin header and pinned at the bottom of both sidebars; it clears the session and returns to `/admin/login`.

Rep codes now use 10 uppercase letters/digits with ambiguous characters omitted. Existing 24-character codes remain valid until used, revoked, or expired. Bulk generation is transactional, retries hash collisions, and records an audit entry for every code. Each code remains single-use with seven-day expiry.
