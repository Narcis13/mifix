# Phase 3: Mijloace Fixe Core - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

User can register, list, view, and edit fixed assets with full data and validation. This phase covers CRUD operations for mijloace fixe including: registration form, asset list with filtering, detail view, and editing. Does NOT include: transfers, disposal operations, depreciation calculations (those are Phase 4-5).

</domain>

<decisions>
## Implementation Decisions

### Registration Form

- **Form serves dual purpose:** Same form will be used for future acquisition workflows
- **Document fields required:** Tip document, Numar document, Data document
- **Tip document:** Configurable list in nomenclatoare (NIR, PV, Donatie, etc.) — requires new nomenclator
- **eAmortizabil field:** New boolean field on schema — allows marking asset as non-depreciable even if account implies depreciation
- **Classification picker:** Modal with search (click to open, search by cod/denumire, select from results)
- **Durata normala:** Auto-fills from HG 2139 classification, but user can edit
- **Form layout:** Sections with headers (Date identificare, Document intrare, Date contabile, Amortizare)

### Asset List Display

- **Columns:** Configurable — user can show/hide columns from available fields
- **Default sort:** Denumire alphabetic
- **Status indicator:** Badge/chip — green for Activ, gray for Casat
- **Row interaction:** Click anywhere on row navigates to asset detail page

### Search & Filtering

- **Available filters:** Gestiune, Loc folosinta, Stare (activ/casat), Clasificare (grupa), Data achizitie range, Text search
- **Filter placement:** Above table, inline — always visible
- **Text search scope:** Nr. inventar + Denumire only

### Asset Detail View

- **Layout:** Sections on one page (scrollable, no tabs)
- **Edit access:** Edit button in header, top right
- **Edit mode:** Navigates to separate edit form page
- **Related data:** Show full HG 2139 classification details (grupa, durata min/max)

### Claude's Discretion

- Filter state in URL (sync to params or session-only)
- Exact section ordering in forms and detail view
- Loading states and skeleton designs
- Empty state messaging
- Error handling patterns

</decisions>

<specifics>
## Specific Ideas

- Form should work for both initial registration AND future acquisition documents (NIR, PV, etc.)
- eAmortizabil flag gives flexibility to mark assets as non-depreciable regardless of accounting rules
- Classification modal should feel familiar — similar to how clasificari search works in Phase 2

</specifics>

<deferred>
## Deferred Ideas

- **Tip Document nomenclator:** New nomenclator needed for document types (NIR, PV, Donatie, Achizitie) — could be added to Phase 2 backlog or handled as part of Phase 3 implementation

</deferred>

---

*Phase: 03-mijloace-fixe-core*
*Context gathered: 2026-01-23*
