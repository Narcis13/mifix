---
phase: 05-amortizare
plan: 02
subsystem: depreciation-ui
tags: [ui, depreciation, history, table, react]
completed: 2026-01-24
duration: ~5m

dependency-graph:
  requires:
    - "05-01 (Amortizare API)"
  provides:
    - "AmortizariTable component"
    - "Per-asset depreciation history view"
  affects:
    - "Asset detail page"
    - "06-xx (Reports)"

tech-stack:
  added: []
  patterns:
    - "useEffect data fetching with loading/error states"
    - "Romanian locale formatting for money and dates"
    - "Card-based table component"

key-files:
  created:
    - packages/client/src/components/amortizare/AmortizariTable.tsx
  modified:
    - packages/client/src/pages/MijlocFixDetail.tsx
    - packages/client/src/lib/api.ts

decisions:
  - id: "05-02-D1"
    decision: "AmortizariTable as standalone card component"
    rationale: "Self-contained with own fetch, can be reused elsewhere"
  - id: "05-02-D2"
    decision: "Romanian month names array"
    rationale: "Display months in Romanian (Ianuarie, Februarie, etc.)"

metrics:
  tasks: 3/3
  files-created: 1
  files-modified: 2
  lines-added: ~150
---

# Phase 05 Plan 02: Depreciation History View Summary

**One-liner:** AmortizariTable component showing per-asset depreciation history with Romanian formatting, integrated into asset detail page.

## What Was Built

### 1. API Client Function (Task 1)
Added `getAmortizariIstoric()` function to fetch depreciation history for a specific asset. This function calls the `/api/amortizari/istoric/:id` endpoint created in plan 05-01.

Note: Additional API functions (`genereazaAmortizare`, `getAmortizariSumar`, `getAmortizariVerificare`) were added by linter/previous agent to support future UI needs.

### 2. AmortizariTable Component (Task 2)
Created a reusable table component (149 lines) that displays:
- Period column with Romanian month names (Ianuarie, Februarie, etc.)
- Monthly depreciation amount
- Cumulative depreciation amount
- Remaining value
- Remaining duration in months

Features:
- Loading state with spinner text
- Error state with error message display
- Empty state when no depreciation records exist
- Record count displayed in header
- Money values formatted in Romanian locale (1.234,56 RON)

### 3. Detail Page Integration (Task 3)
Integrated AmortizariTable into MijlocFixDetail page below the transaction history section. Component fetches data independently using the asset ID.

## Commits

| Hash | Message |
|------|---------|
| 4238aef | feat(05-02): create AmortizariTable component |
| 6cb09cb | feat(05-02): integrate AmortizariTable into asset detail page |

## Verification Results

- [x] AmortizariTable component renders without errors (149 lines, meets 60 min requirement)
- [x] Component shows loading state while fetching
- [x] Component shows empty state message when no records
- [x] Records display with correct formatting (Romanian month names, money format)
- [x] Table columns show: Perioada, Amortizare Lunara, Amortizare Cumulata, Valoare Ramasa, Durata Ramasa
- [x] Asset detail page includes AmortizariTable component (import confirmed)
- [x] TypeScript compiles without errors
- [x] Key link from AmortizariTable to API via getAmortizariIstoric
- [x] Key link from MijlocFixDetail to AmortizariTable via import

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 05-03:** AmortizariTable provides per-asset history view. Next plan will add depreciation generation UI.

**Dependencies satisfied:**
- Per-asset depreciation history display works
- Component integrated into asset detail page
- API client functions ready for generation dialog
