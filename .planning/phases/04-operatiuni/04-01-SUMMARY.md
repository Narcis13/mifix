---
phase: 04-operatiuni
plan: 01
subsystem: api
tags: [drizzle, transactions, hono, zod, money]

# Dependency graph
requires:
  - phase: 03-mijloace-fixe-core
    provides: MijloaceFixe CRUD API, database schema with mijloaceFixe and tranzactii tables
provides:
  - POST /api/operatiuni/transfer-gestiune endpoint with atomic transaction
  - POST /api/operatiuni/transfer-loc endpoint with atomic transaction
  - POST /api/operatiuni/casare endpoint with atomic transaction
  - POST /api/operatiuni/declasare endpoint with Money class precision
  - Zod validation schemas for all operation types
  - locFolosinta fields in tranzactii table for location tracking
affects: [05-amortizare, operatiuni-ui, reports]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "db.transaction() for atomic asset+tranzactie operations"
    - "Error message prefixes for type-safe error handling"
    - "Money class for decimal precision in declasare"

key-files:
  created:
    - packages/server/src/routes/operatiuni.ts
    - packages/server/src/validation/operatiuni-schemas.ts
  modified:
    - packages/server/src/db/schema.ts
    - packages/server/src/index.ts

key-decisions:
  - "Operations only allowed on assets with stare='activ'"
  - "Transfer-gestiune clears locFolosinta unless new loc provided"
  - "Transfer-loc only tracks loc changes (no gestiune in tranzactie)"
  - "Declasare uses Money class for value calculations"

patterns-established:
  - "Atomic transaction pattern: db.transaction() wrapping asset update + tranzactii insert"
  - "Operation endpoint pattern: validate -> fetch asset -> check stare -> update asset -> create tranzactie"

# Metrics
duration: 15min
completed: 2026-01-23
---

# Phase 4 Plan 1: Operatiuni API Summary

**Atomic operations API with db.transaction() for transfer-gestiune, transfer-loc, casare, declasare with audit trail in tranzactii table**

## Performance

- **Duration:** 15 min
- **Started:** 2026-01-23T21:50:00Z
- **Completed:** 2026-01-23T22:05:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Four POST endpoints for asset lifecycle operations
- All operations use db.transaction() for atomicity between asset state and transaction log
- Operations rejected for non-active assets with proper error messages
- Declasare validates reduction amount against valoareRamasa using Money class
- locFolosinta tracking added to tranzactii table for location-based transfers

## Task Commits

Each task was committed atomically:

1. **Task 1: Add locFolosinta fields to tranzactii schema** - `3f0c285` (feat)
2. **Task 2: Create Operatiuni validation schemas** - `431ec09` (feat)
3. **Task 3: Create Operatiuni API routes with atomic transactions** - `f5e3f0f` (feat)

## Files Created/Modified
- `packages/server/src/db/schema.ts` - Added locFolosintaSursaId, locFolosintaDestinatieId to tranzactii, updated relations
- `packages/server/src/validation/operatiuni-schemas.ts` - Zod schemas for all 4 operation types
- `packages/server/src/routes/operatiuni.ts` - 4 POST endpoints with transaction handling
- `packages/server/src/index.ts` - Registered operatiuniRoutes at /api/operatiuni

## Decisions Made
- Operations only allowed on assets with stare="activ" - prevents double casare/transfer on already processed assets
- Transfer-gestiune clears locFolosintaId unless destination loc is provided - logical since loc belongs to gestiune
- Transfer-loc records only locFolosinta changes in tranzactie (no gestiune fields) - distinguishes internal vs external transfers
- Casare sets stare to "casare" not "casat" - matches existing enum in schema
- All date fields passed as strings and converted to Date in route handlers - consistent with existing mijloace-fixe patterns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Port 3000 already in use during testing - server was already running, used existing instance
- Zod v4 doesn't support `invalid_type_error` parameter - kept simpler min(1) validation which still provides field path in error

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 4 operation endpoints ready for UI integration
- Transaction history can be queried from tranzactii table (OP-05 timeline)
- Ready for dialog-based operation forms in client
- Consider: recalculating cotaAmortizareLunara after declasare (Phase 5 consideration)

---
*Phase: 04-operatiuni*
*Completed: 2026-01-23*
