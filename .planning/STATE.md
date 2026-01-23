# Project State: MiFix

**Current Phase:** 4 of 6 (Operatiuni)
**Phase Status:** In Progress
**Last Updated:** 2026-01-23

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-22)

**Core value:** Contabilitatea poate genera amortizarea lunara corect si la timp pentru toate mijloacele fixe active
**Current focus:** Phase 4 - Operatiuni (asset lifecycle operations)

## Current Position

Phase: 4 of 6 (Operatiuni)
Plan: 1 of ? in current phase
Status: In progress
Last activity: 2026-01-23 - Completed 04-01-PLAN.md (Operatiuni API)

Progress: [██████░░░░] ~55% (Phase 4 started)

## Progress

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Foundation & Setup | Complete | 4/4 |
| 2 | Nomenclatoare | Complete | 5/5 |
| 3 | Mijloace Fixe Core | Complete | 6/6 |
| 4 | Operatiuni | In Progress | 1/? |
| 5 | Amortizare | Not Started | 0/? |
| 6 | Rapoarte & Autentificare | Not Started | 0/? |

**Requirements:** 16/34 complete
- SETUP-01 through SETUP-05 - Done (Phase 1)
- NOM-01 through NOM-05 - Done (Phase 2)
- MF-01 through MF-06 - Done (Phase 3)
- OP-01 through OP-04 - API Done (Phase 4, Plan 1)

## Session Context

### Key Decisions

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 01-01 | Manual scaffold instead of bhvr template | Template CLI failed, equivalent structure created manually |
| 01-01 | Added packageManager field | Turbo 2.7.x requires it for workspace resolution |
| 01-03 | shadcn/ui New York style with Neutral base | Cleaner, more professional look |
| 01-03 | Tailwind v4 with @import syntax | Modern approach, better CSS organization |
| 01-03 | Immutable Money class | All arithmetic returns new instances, preventing mutation bugs |
| 01-03 | Monetary values as strings in types | Preserves decimal precision throughout the stack |
| 02-01 | Zod validation messages in Romanian | User-facing error messages should be in Romanian |
| 02-01 | DataTable with isLoading/emptyMessage props | Consistent UX across all data tables |
| 02-01 | API client returns ApiResponse wrapper | Standardized response structure for all endpoints |
| 02-02 | Dialog-based form for create/edit | Single component handles both modes with useEffect reset |
| 02-02 | Actions column in DataTable | Edit button per row, no delete (use deactivation instead) |
| 02-03 | Clasificari read-only API | HG 2139/2004 data is preloaded, no user edits allowed |
| 02-03 | 300ms debounce for search | Balance responsiveness with API efficiency |
| 02-03 | PaginatedResponse pattern | Standard structure for paginated endpoints |
| 02-04 | Locuri filtered by gestiune | GET /api/locuri?gestiuneId=X for gestiune-specific locations |
| 02-05 | Conditional contAmortizare field | Watch amortizabil to show/hide contAmortizare input |
| 02-05 | Form pattern with onSubmit/isSubmitting | Consistent with SurseFinantareForm for better separation |
| 03-01 | TipDocument CRUD follows nomenclator pattern | Consistency with Phase 2 routes |
| 03-01 | eAmortizabil field for per-asset override | Allows non-amortizable assets to be marked at entry time |
| 03-02 | Date string coercion in Zod schemas | JSON sends dates as strings, transform to Date objects |
| 03-02 | Money class for computed depreciation | Ensures decimal precision for cotaAmortizareLunara |
| 03-03 | StareBadge uses actual StareMijlocFix enum | Type safety with shared types (activ, conservare, casat, transferat, vandut) |
| 03-03 | MijlocFixFilters exports state type | Parent components can use MijlocFixFiltersState for typing |
| 03-04 | DataTable onRowClick prop for row navigation | Reusable pattern for any table requiring row click navigation |
| 03-04 | URL params sync with filter state | Shareable/bookmarkable filtered views, browser back/forward works |
| 03-05 | Zod v4 uses nullable() for optional numbers | required_error option not supported, use min(1) pattern |
| 03-05 | Multi-section Card form layout | Logical grouping for complex forms (Identificare, Document, Contabile, Amortizare) |
| 03-05 | useWatch for dependent dropdown | Gestiune selection dynamically filters LocFolosinta options |
| 03-06 | valoareInitiala must be sent in form payload | Server schema requires it, same as valoareInventar for new assets |
| 04-01 | Operations only on stare='activ' assets | Prevents double operations on already processed assets |
| 04-01 | db.transaction() for atomic operations | Asset update + tranzactie insert in single atomic transaction |
| 04-01 | Money class for declasare calculations | Ensures decimal precision for value reductions |
| 04-01 | Transfer-gestiune clears locFolosinta | Logical since loc belongs to gestiune |

### Blockers

(None)

### TODOs

(None)

### Notes

- Project initialized 2026-01-22
- Roadmap created with 6 phases covering 34 v1 requirements
- **Phase 1 COMPLETE** - Foundation with Bun, Hono, React, Vite, Drizzle, shadcn/ui
- **Phase 2 COMPLETE** - All 5 nomenclatoare (Gestiuni, Locuri, Surse, Conturi, Clasificari)
- **Phase 3 COMPLETE** - Full asset CRUD with filtering, classification picker, validation
  - 03-01: shadcn components + TipDocument nomenclator
  - 03-02: MijloaceFixe API (610 lines, 7-table joins)
  - 03-03: Reusable components (ClasificarePicker, StareBadge, Filters)
  - 03-04: List page with filtering and pagination
  - 03-05: Multi-section form (669 lines)
  - 03-06: Detail page + human verification passed
- **Phase 4 IN PROGRESS** - Operatiuni API complete
  - 04-01: API endpoints for transfer-gestiune, transfer-loc, casare, declasare
  - Next: UI dialogs for operations, transaction history timeline

---
*Last session: 2026-01-23*
*Stopped at: Completed 04-01-PLAN.md*
*Resume file: None*
