# MiFix - Fixed Asset Management System

## Project Context
Romanian fixed asset management app migrated from FoxPro v3.1 to modern SaaS stack.
Legacy system: ~9,600 lines FoxPro, 14 reports, 12 active tables.
Modern stack: Bun + Hono + Drizzle ORM + MySQL + React + shadcn/ui.

## Session Bootstrap Protocol
**EVERY SESSION MUST START BY:**
1. Read `.claude/MIGRATION-STATE.md` to know current phase and completed tasks
2. Check git status and current branch
3. Identify the next uncompleted task from the state tracker
4. Announce: "Resuming migration at Phase X, Task X.Y: [description]"

## Tech Stack
- **Runtime:** Bun (NOT Node.js)
- **Server:** Hono framework, port 3000
- **DB:** MySQL via mysql2/promise + Drizzle ORM
- **Validation:** Zod (v4) + drizzle-zod
- **Client:** React 19 + React Router 7 + Vite
- **UI:** shadcn/ui (Radix + Tailwind CSS 4)
- **Tables:** TanStack Table
- **Finance:** decimal.js via shared Money class
- **Auth:** JWT HS256 in HttpOnly cookies
- **Monorepo:** Turbo + Bun workspaces

## File Structure
```
packages/server/src/
  index.ts              -- Hono app + middleware
  db/schema.ts          -- ALL Drizzle table definitions
  db/index.ts           -- DB connection pool
  db/seeds/             -- Seed scripts
  middleware/auth.ts     -- JWT middleware
  routes/*.ts           -- Route handlers
  validation/schemas.ts -- Zod schemas

packages/client/src/
  pages/*.tsx            -- Route pages
  components/**/*.tsx    -- Feature components

packages/shared/src/
  money.ts              -- Financial math (ALWAYS use for money)
  types/index.ts         -- Shared TypeScript interfaces
  types/rapoarte.ts      -- Report types
```

## Critical Conventions
- ALL monetary values: `decimal(15,2)` in DB, strings in API, `Money` class for math
- API responses: `ApiResponse<T>` wrapper with `success`, `data`, `message`, `errors`
- Pagination: `PaginatedResponse<T>` with `items`, `total`, `page`, `pageSize`, `totalPages`
- Drizzle migrations: `bun run db:generate` then `bun run db:push`
- DB connection: env vars `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Run dev: `bun run dev` from root (turbo runs both server + client)
- DB seed: `bun run --cwd packages/server db:seed`

## Legacy Reference
Full legacy analysis in `import/mf/analysis-*.md` and `MIGRATION.md`.
Key: Legacy is transaction-centered; modern is asset-centered.

## Session Context Limits
Keep sessions under 60% context window. Strategy:
- One phase per session (Phase 1 = schema, Phase 2 = migration script, etc.)
- Use subagents for research/exploration
- Update MIGRATION-STATE.md at end of each session
- Commit after each completed task
