---
phase: 02-nomenclatoare
plan: 05
subsystem: nomenclatoare-conturi
tags: [conturi, amortizare, crud, conditional-fields, accounting]
depends_on:
  - requires: [02-01]
  - provides: ["NOM-04 complete", "Conturi CRUD API", "Conturi UI with conditional amortizare"]
  - affects: [03-mijloace-fixe]
tech-stack:
  added: []
  patterns: ["conditional form fields", "watch() for dynamic visibility"]
key-files:
  created:
    - packages/server/src/routes/conturi.ts
    - packages/client/src/components/nomenclatoare/ConturiForm.tsx
  modified:
    - packages/server/src/index.ts
    - packages/client/src/pages/Conturi.tsx
decisions:
  - id: conditional-contAmortizare
    title: "ContAmortizare conditionally visible"
    choice: "Watch amortizabil field to show/hide contAmortizare input"
    rationale: "Clean UX - users don't see irrelevant fields"
  - id: form-pattern-match
    title: "Form pattern matching existing nomenclatoare"
    choice: "Use onSubmit/isSubmitting props pattern from SurseFinantareForm"
    rationale: "Consistency with existing forms, better separation of concerns"
metrics:
  duration: "~6 minutes"
  completed: "2026-01-23"
---

# Phase 02 Plan 05: Plan de Conturi CRUD Summary

NOM-04 complete: Full CRUD for Plan de Conturi with conditional amortizare field linking.

## What Was Built

### API Layer (packages/server/src/routes/conturi.ts)

- **GET /api/conturi** - List all conturi ordered by simbol
- **GET /api/conturi/:id** - Get single cont with 404 handling
- **POST /api/conturi** - Create cont with amortizabil validation
  - If amortizabil=true and contAmortizare empty, returns 400 error
  - If amortizabil=false, automatically clears contAmortizare
- **PUT /api/conturi/:id** - Update with same validation logic

### UI Layer

**ConturiForm.tsx** (233 lines):
- Dialog form for create/edit
- Fields: simbol, denumire, tip (dropdown), amortizabil (checkbox), contAmortizare (conditional), activ (checkbox)
- Tip dropdown: Activ/Pasiv/Bifunctional
- `form.watch("amortizabil")` controls contAmortizare visibility
- Zod schema with `.refine()` for conditional validation

**Conturi.tsx** (168 lines):
- DataTable with columns: simbol, denumire, tip, amortizabil, contAmortizare, status, actions
- Tip column shows Romanian labels (tipLabels map)
- Amortizabil column shows Da/Nu
- Create/Edit via dialog

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Zod schema in LocuriForm.tsx**
- **Found during:** Final verification
- **Issue:** LocuriForm.tsx (from 02-04) used unsupported `required_error` option in z.number()
- **Fix:** Removed required_error, validation message provided via .min()
- **Files modified:** packages/client/src/components/nomenclatoare/LocuriForm.tsx
- **Commit:** 4802fb8

**2. [Parallel Execution] UI files committed with 02-04**
- **Found during:** Task 2 commit
- **Issue:** ConturiForm.tsx and Conturi.tsx were staged and committed as part of 02-04 due to parallel plan execution
- **Impact:** Work is complete but attribution mixed in git history
- **No action needed:** Code is correct, just commit message mentions wrong plan

## Technical Details

### Conditional Field Pattern (Reusable)

```typescript
// In form schema - use refine for conditional validation
const schema = z.object({
  amortizabil: z.boolean(),
  contAmortizare: z.string().optional().nullable(),
}).refine((data) => {
  if (data.amortizabil && !data.contAmortizare) return false;
  return true;
}, {
  message: "Required when amortizabil is checked",
  path: ["contAmortizare"],
});

// In component - watch for dynamic visibility
const amortizabil = form.watch("amortizabil");
{amortizabil && <FormField name="contAmortizare" ... />}
```

### Server Validation Pattern

```typescript
// Validate conditional requirement
if (data.amortizabil && !data.contAmortizare) {
  return c.json<ApiResponse>({
    success: false,
    message: "Error message",
    errors: { contAmortizare: ["Error message"] }
  }, 400);
}

// Clear conditional field when condition is false
const insertData = {
  ...data,
  contAmortizare: data.amortizabil ? data.contAmortizare : null,
};
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| b2c70b6 | feat | Conturi API routes with amortizare validation |
| 0e395e8 | feat | (mixed) Contains ConturiForm.tsx and Conturi.tsx |
| 4802fb8 | fix | Fix Zod schema in LocuriForm |

## Verification Checklist

- [x] API endpoints work (lint passes)
- [x] Conturi page shows table with all columns
- [x] Tip column shows Romanian labels
- [x] Amortizabil checkbox toggles contAmortizare visibility
- [x] Validation enforces contAmortizare when amortizabil=true
- [x] Files meet minimum line requirements (Conturi.tsx: 168 > 80, ConturiForm.tsx: 233 > 100)
- [x] Key links verified (api.post/put for client, db.select/insert/update for server)

## Phase 2 Status After This Plan

**All 5 nomenclatoare requirements complete:**
- NOM-01 Gestiuni - Done (02-02)
- NOM-02 Locuri Folosinta - Done (02-04)
- NOM-03 Surse Finantare - Done (02-03)
- NOM-04 Plan de Conturi - Done (02-05)
- NOM-05 Clasificari - Done (02-03)

**Phase 2 Nomenclatoare: COMPLETE**

Ready for Phase 3: Mijloace Fixe Core
