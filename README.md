# Portfolio

A Next.js portfolio with MongoDB-backed publishing and a private GitHub-authenticated admin. Public content comes exclusively from MongoDB; there is no demo dataset or hardcoded personal content in the application.

## Local setup

Use Node.js 22.12 or newer (verified with Node 24).

```sh
npm ci
npm run dev
```

Use `http://localhost:3000` consistently for OAuth. Copy `.env.example` into `.env.local`, or keep your existing ignored `.env`. If both exist, Next.js gives `.env.local` precedence.

- `MONGODB_URI`: connection string for your database user.
- `MONGODB_DB`: database name, default `portfolio`. Give the database user read/write access and permit your machine's public IP through your provider's network rules.
- `AUTH_URL`: explicit OAuth origin, locally `http://localhost:3000`. Set this to your HTTPS site origin in production. `NEXT_PUBLIC_SITE_URL` does not configure Auth.js host trust.
- `AUTH_SECRET`: generate locally with `openssl rand -base64 32`.
- `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`: GitHub OAuth app credentials.
- `ADMIN_GITHUB_ID`: the owner's immutable numeric GitHub user ID, not their username or OAuth client ID.
- `NEXT_PUBLIC_SITE_URL`: canonical site URL, locally `http://localhost:3000`.

The local OAuth app callback is `http://localhost:3000/api/auth/callback/github`. It requests only `read:user`; admin access is checked on every read and mutation. Use a separate OAuth app for production with your deployed callback URL. Secrets remain server-side and must never be committed.

Restart the server after changing credentials. On this development machine, GitHub requests need Node to honor the existing proxy environment. With Node 24, start locally using `npm run dev:proxy` (equivalent to `NODE_USE_ENV_PROXY=1 npm run dev`). This keeps TLS verification enabled; do not copy machine-specific proxy credentials into the repository or deployment configuration. An unconfigured or empty database displays a neutral empty site. An unavailable database displays an error; it never substitutes demo content. OAuth sign-in itself does not require a database connection.

For an OAuth-only check without opening a database connection, run `MONGODB_URI= npm run dev:proxy`. This overrides the URI only for that process; your environment files stay unchanged. Successful sign-in displays an authorized-session confirmation with a Sign out button even when the database is disconnected or unavailable. Test at `http://localhost:3000/admin`, reload to verify the session persists, and sign out to verify access is cleared. Account rejection is shown separately from general OAuth/configuration failures. Do not share raw callback URLs, tokens, or secrets when inspecting server logs.

### Testing the production server locally

`npm run dev` implicitly trusts the local host; `npm start` runs in production mode and requires an explicit OAuth origin. Keep `AUTH_URL=http://localhost:3000` in `.env.local`, then use:

```sh
npm run build
npm run start:proxy
```

Use `npm start` when an outbound proxy is unnecessary. Stop the previous server before starting another on port 3000. Restart after changing `AUTH_URL`; a missing value can produce `UntrustedHost` before GitHub is contacted. Keep the GitHub callback set to `http://localhost:3000/api/auth/callback/github`. For an OAuth-only production check without database access, use `MONGODB_URI= npm run start:proxy`.

## Populate your database

The approved 21-entry dataset is saved locally at `.local-content/approved-content.json`. This directory is ignored by Git and is **not included in a fresh clone**. Copy it privately if migrating from another machine. It contains portfolio content, not credentials. Generic migration code lives in `scripts/`; the application never reads the migration file.

Run from the project root:

```sh
# Validate all 21 entries without connecting to MongoDB.
npm run content:migrate -- --validate-only

# Read-only database dry run: lists creates, publications, and conflicts.
npm run content:migrate

# Create matching missing entries as drafts, without publishing.
npm run content:migrate -- --apply

# After reviewing drafts at /admin/preview, publish the matching entries.
npm run content:migrate -- --apply --publish
```

To import and publish the already-approved dataset in one run, use the final command directly. To use a different file, append `--input /absolute/path/content.json`.

The input format is `{ "version": 1, "entries": [{ "id": "stable-id", "order": 0, "content": { ... } }] }`. Content is validated with the same Zod schemas as the admin. Presentation fields include profile `brandMark`, experience `organizationMark`, and project `visualVariant` / `homepageCaseStudy`.

A dry run performs no writes or index creation. Every apply run creates a private local backup and manifest in `.local-content/migrations/<run-id>/` before writing or creating indexes. Existing matching records are preserved. Different drafts, live snapshots, ordering, archived records, reserved slugs, or an existing profile with a different ID stop the migration rather than being overwritten. Resolve such differences deliberately through the admin, or adjust the input file after review.

The script can be rerun safely after interruption. It records successfully created/published IDs and the input hash in the manifest. A failed run may have created or published some entries; rerun a dry run to determine the current state. To reverse publication, unpublish the affected entries through the admin; retain backups for manual recovery. The script never deletes data or automatically rolls back unrelated changes.

After publishing, reload the website. Database reads are deduplicated within a request, without a persistent content cache, so script writes and published edits appear on the next request. Existing browser tabs may need refreshing. No database writes were performed against the configured remote database during preparation; it was unreachable from the development network.

## Admin workflow

Visit `/admin` and sign in with the allowed GitHub account. Create or edit a profile, experience, project, or skill group; save a draft, preview it, then publish the saved version.

Draft edits and display order remain private until publication. Unpublish retains the draft. Archive removes public content and preserves its draft; restore returns it unpublished. Both draft and published project slugs remain reserved, including archived draft slugs. Concurrent stale edits are rejected.

Experience descriptions, profile introduction/supporting line, marks, image URLs, and résumé URLs are optional. Media URLs must use HTTPS. Text supports constrained Markdown; raw HTML is rendered as text. Missing marks derive initials from names.

For projects, an image overrides the selected illustration (`generic`, `pipeline`, `webpage`, `summary`). The first project in display order marked for the homepage case study and containing case-study sections supplies the How I think section. Generic UI labels and illustration templates remain in code.

Each `content` document holds its kind, draft, published snapshot, draft/live order, revision, archived state and timestamps. Projects also have application-managed slug reservations. There is one profile, and no password or OAuth-token collection. The system stores the current draft and current publication, not a full revision history.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

Tests use generic fixtures and disposable local MongoDB instances, never the configured database. The first run downloads the official MongoDB test binary. Coverage includes migration dry runs, import/publish/rerun behavior, conflict protection and backups, validation, authorization, draft isolation, slug uniqueness, ordering, and archive/restore.

`tests/qa-server.mjs` optionally starts an isolated production server on port 3107 with a disposable database and a temporary test session. It never uses your OAuth app or database. Build first, then run `node tests/qa-server.mjs`; Ctrl-C cleans up. It is not part of the deployed app.

## Deployment

Deploy as a Next.js project on Vercel and configure server-side environment variables, the production canonical URL, database network access, and the production GitHub OAuth callback. No deployment is performed by the migration script. Verify real OAuth and database connectivity in the target environment before publishing the site.

## Motion and scrolling

Public pages and previews share Motion effects around server-rendered content. CSS supplies first-paint entrance states, with a timed reveal if animation loading fails. Reduced-motion and JavaScript-disabled views remain readable. A navbar progress line replaces the native scrollbar only when mounted; normal scrolling controls remain available. Admin editing controls stay static.
