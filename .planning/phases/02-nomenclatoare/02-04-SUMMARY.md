---
phase: 02-nomenclatoare
plan: 04
status: complete
subsystem: nomenclatoare
tags: [locuri-folosinta, crud, dependent-select, gestiune-filter]

dependency-graph:
  requires: [02-02]
  provides: [NOM-02]
  affects: [03-01, 03-02]

tech-stack:
  added: []
  patterns: [dependent-select, gestiune-filter, leftJoin-relations]

files:
  key-files:
    created:
      - packages/server/src/routes/locuri.ts
    modified:
      - packages/client/src/pages/Locuri.tsx

decisions:
  - id: gestiune-filter-pattern
    choice: "Query param ?gestiuneId= for filtering"
    rationale: "Simple, RESTful approach for optional filtering"
  - id: active-gestiuni-in-form
    choice: "Filter only active gestiuni in form dropdown"
    rationale: "Prevent users from assigning locuri to inactive gestiuni"
  - id: all-gestiuni-in-list-filter
    choice: "Show all gestiuni in list filter dropdown"
    rationale: "Allow filtering to see locuri in any gestiune for administration"

metrics:
  duration: ~7min
  completed: 2026-01-23
---

# Phase 02 Plan 04: Locuri de Folosinta CRUD Summary

**One-liner:** CRUD for locuri de folosinta with gestiune dependency pattern - filter dropdown and dependent select in form.

## What Was Built

### Server (API)
- **GET /api/locuri** - List all locuri with optional `?gestiuneId=` filter
  - Returns locuri with gestiune data via leftJoin
  - Ordered by cod
- **GET /api/locuri/:id** - Get single loc with gestiune data
- **POST /api/locuri** - Create loc with gestiune validation
  - Verifies gestiuneId exists before insert
  - Returns created loc with gestiune
- **PUT /api/locuri/:id** - Update loc with gestiune validation
  - Verifies gestiuneId exists if being changed

### Client (UI)
- **LocuriPage** (183 lines)
  - DataTable with columns: cod, denumire, gestiune, stare, actiuni
  - Gestiune filter dropdown at top
  - "Adauga Loc" button and row edit buttons
  - Automatic refresh after create/edit
- **LocuriForm** (234 lines)
  - Dialog form for create/edit
  - Gestiune dropdown populated from API (active gestiuni only)
  - Fields: gestiuneId, cod, denumire, activ
  - Handles number type conversion for Select component

## Key Patterns Established

### Dependent Select Pattern
```typescript
// In form - fetch parent entity for dropdown
useEffect(() => {
  api.get<Gestiune[]>("/gestiuni").then((res) => {
    if (res.success && res.data) {
      setGestiuni(res.data.filter((g) => g.activ));
    }
  });
}, [open]);

// Select with number conversion
<Select
  value={field.value?.toString()}
  onValueChange={(v) => field.onChange(parseInt(v))}
>
```

### Gestiune Filter Pattern
```typescript
// In list page - filter by parent entity
const params = selectedGestiune ? `?gestiuneId=${selectedGestiune}` : "";
const response = await api.get<LocFolosinta[]>(`/locuri${params}`);
```

### API with leftJoin
```typescript
// Include related entity in response
.leftJoin(gestiuni, eq(locuriUilizare.gestiuneId, gestiuni.id))
```

## Commits

| Hash | Type | Message |
|------|------|---------|
| 0e395e8 | feat | add Locuri Folosinta API routes with gestiune filter |
| f4e0bf7 | feat | implement Locuri UI with gestiune filter and form |

## Deviations from Plan

### Unrelated Files in Commit
**Task 1 commit (0e395e8)** included files from a previous incomplete plan (02-05 Conturi):
- `packages/client/src/components/nomenclatoare/ConturiForm.tsx`
- `packages/client/src/pages/Conturi.tsx`

These files were already staged from a prior session. The locuri.ts file was created correctly.

### LocuriForm Already Existed
The LocuriForm component was partially created in a previous session. The Write operation overwrote it with the full implementation, and the linter auto-fixed the Zod schema.

## Verification

### Must-Have Truths
- [x] User can see list of locuri de folosinta in a table
- [x] User can filter locuri by gestiune
- [x] User can create loc de folosinta within a specific gestiune
- [x] User can edit an existing loc de folosinta
- [x] Form shows gestiune selector as dropdown populated from API

### Must-Have Artifacts
- [x] `packages/server/src/routes/locuri.ts` - exports `locuriRoutes`
- [x] `packages/client/src/pages/Locuri.tsx` - 183 lines (min: 90)
- [x] `packages/client/src/components/nomenclatoare/LocuriForm.tsx` - 234 lines (min: 80)

### Key Links
- [x] LocuriForm fetches from `/api/gestiuni` for dropdown (`api.get.*gestiuni`)
- [x] locuri.ts uses `leftJoin.*gestiuni` for related data

## Next Phase Readiness

Ready for:
- **02-05: Conturi CRUD** (already partially started)
- **Phase 3: Mijloace Fixe Core** - Will use the dependent select pattern established here for:
  - Gestiune selection
  - Loc folosinta selection (cascading from gestiune)
  - Sursa finantare selection
  - Clasificare selection
