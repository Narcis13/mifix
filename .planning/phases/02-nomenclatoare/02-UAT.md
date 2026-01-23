---
status: complete
phase: 02-nomenclatoare
source: [02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md]
started: 2026-01-23T09:15:00Z
updated: 2026-01-23T12:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Create Gestiune
expected: Navigate to /gestiuni, click "Adauga Gestiune", fill form, submit. New gestiune appears in table with Activ/Inactiv badge.
result: pass

### 2. Edit Gestiune
expected: Click edit button on an existing gestiune row. Dialog opens with fields prefilled. Make a change, submit. Table shows updated data.
result: pass

### 3. Create Sursa Finantare
expected: Navigate to /surse-finantare, click "Adauga Sursa", fill Cod and Denumire, submit. New sursa appears in table.
result: pass

### 4. Search Clasificari Catalog
expected: Navigate to /clasificari. Type in search box (e.g., "calculator"). Results filter as you type (with debounce). Search works on both cod and denumire.
result: pass

### 5. Filter Clasificari by Grupa
expected: On /clasificari, select a grupa from dropdown (I, II, or III). Table shows only clasificari from that grupa. Select "Toate" to clear filter.
result: pass

### 6. Clasificari Pagination
expected: On /clasificari, pagination controls visible. Click next/prev to navigate pages. Page indicator shows current page.
result: pass

### 7. Create Loc de Folosinta with Gestiune
expected: Navigate to /locuri. Click "Adauga Loc". Form has gestiune dropdown populated from API. Select gestiune, fill cod/denumire, submit. Loc appears in table with gestiune name column.
result: pass

### 8. Filter Locuri by Gestiune
expected: On /locuri, select a gestiune from filter dropdown. Table shows only locuri for that gestiune. Select "Toate gestiunile" to show all.
result: pass

### 9. Create Cont with Amortizare
expected: Navigate to /conturi. Click "Adauga Cont". Check "Amortizabil" checkbox - contAmortizare field appears. Fill simbol, denumire, select tip (Activ/Pasiv/Bifunctional), enter contAmortizare. Submit. Cont appears in table.
result: pass

### 10. Conditional contAmortizare Validation
expected: On /conturi form, check "Amortizabil" without filling contAmortizare. Submit shows validation error. Uncheck "Amortizabil" - contAmortizare field hides, form can submit.
result: pass

### 11. Form Validation Errors
expected: On any nomenclator form (e.g., /gestiuni), leave required fields empty and submit. Romanian error messages appear (e.g., "Cod obligatoriu", "Denumire obligatorie").
result: pass

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
