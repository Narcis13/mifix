---
phase: 05-amortizare
plan: 01
subsystem: depreciation-api
tags: [api, depreciation, batch-processing, money]
completed: 2026-01-24
duration: ~10m

dependency-graph:
  requires:
    - "01-03 (Money class)"
    - "03-02 (mijloaceFixe schema)"
  provides:
    - "Batch depreciation API"
    - "Per-asset history endpoint"
    - "Monthly summary endpoint"
    - "Month verification endpoint"
  affects:
    - "05-02 (Amortizare UI)"
    - "06-xx (Reports)"

tech-stack:
  added: []
  patterns:
    - "Atomic transactions with db.transaction()"
    - "Batch processing with deduplication"
    - "Money class for all monetary calculations"

key-files:
  created:
    - packages/server/src/routes/amortizari.ts
    - packages/server/src/validation/amortizari-schemas.ts
  modified:
    - packages/server/src/db/schema.ts
    - packages/server/src/index.ts
    - packages/shared/src/types/index.ts

decisions:
  - id: "05-01-D1"
    decision: "uniqueIndex for duplicate prevention"
    rationale: "Database-level constraint catches race conditions that application-level checks miss"
  - id: "05-01-D2"
    decision: "Money class for all depreciation calculations"
    rationale: "Maintains decimal precision, prevents floating-point errors in financial calculations"
  - id: "05-01-D3"
    decision: "Final month protection logic"
    rationale: "AMO-06 requirement - prevents over-depreciation by using remaining value when less than monthly rate"

metrics:
  tasks: 3/3
  files-created: 2
  files-modified: 3
  lines-added: ~280
---

# Phase 05 Plan 01: Amortizare API Summary

**One-liner:** Batch depreciation API with atomic transactions, duplicate prevention via unique constraint, and Money class for decimal precision.

## What Was Built

### 1. Database Unique Constraint
Added `uniqueIndex("uniq_amortizari_mijloc_fix_an_luna")` to prevent duplicate depreciation entries for the same asset/month combination. This is a database-level protection that catches race conditions.

### 2. Validation Schemas and Types
- `genereazaAmortizareSchema`: Zod schema for batch generation input (an: 2020-2100, luna: 1-12)
- Updated `Amortizare` interface with all schema fields
- Added `GenereazaAmortizareResult`, `AmortizareSumar`, `AmortizareVerificare` types

### 3. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/amortizari/genereaza` | POST | Batch generate depreciation for all eligible assets |
| `/api/amortizari/istoric/:id` | GET | Per-asset depreciation history |
| `/api/amortizari/sumar` | GET | Monthly summary with totals |
| `/api/amortizari/verificare` | GET | Check which months are processed |

### Key Implementation Details

**Batch Generation Logic:**
1. Select all assets where stare='activ', eAmortizabil=true, valoareRamasa > 0
2. Check for existing entries to skip (deduplication)
3. For each asset:
   - Calculate monthly depreciation: `valoareInventar / durataNormala`
   - Final month protection: if monthly rate > remaining value, use remaining value
   - Insert depreciation record with calculated values
   - Update asset's valoareAmortizata, valoareRamasa, durataRamasa
4. Return processed/skipped/totalEligible counts

**All operations within `db.transaction()` for atomicity.**

## Commits

| Hash | Message |
|------|---------|
| f80c755 | feat(05-01): add unique constraint to amortizari table |
| 46726f8 | feat(05-01): add amortizari validation schemas and shared types |
| 4293304 | feat(05-01): create amortizari API routes with batch generation |

## Verification Results

- [x] Schema has unique constraint preventing duplicate (mijlocFixId, an, luna) entries
- [x] POST /api/amortizari/genereaza returns processed/skipped counts
- [x] Running same generation twice for same month returns 0 processed (all skipped)
- [x] GET /api/amortizari/istoric/:id returns chronological depreciation history
- [x] GET /api/amortizari/sumar returns monthly totals across all assets
- [x] GET /api/amortizari/verificare shows which months are processed
- [x] All monetary calculations use Money class (no floating point)
- [x] TypeScript compiles without errors

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 05-02:** All API endpoints are functional and tested. The UI plan can now build the depreciation management interface.

**Dependencies satisfied:**
- POST /genereaza ready for "Genereaza Amortizare" button
- GET /verificare ready for month status display
- GET /sumar ready for summary display
- GET /istoric ready for asset detail page integration
