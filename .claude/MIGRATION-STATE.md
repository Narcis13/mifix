# MiFix Migration State Tracker
<!-- This file is read at the start of every session to restore context -->
<!-- Update after completing each phase/task -->

## Current Phase: 7D (COMPLETE)
## Current Task: Done - all D.1-D.7 tasks completed
## Last Session: 2026-02-24
## Branch: ajustare
## Plan detaliat: `.claude/PLAN-OPERATIUNI.md`

> **Phases 0-6: MIGRARE LEGACY (COMPLETE)**
> **Phases 7A-7E: OPERATIUNI DOCUMENT-CONTAINER (IN PROGRESS)**

---

## Phase Completion Status

### Phase 0: Foundation & State Management
- [x] Create .claude/ directory structure
- [x] Create migration skill
- [x] Create MIGRATION-STATE.md tracker
- [x] Create CLAUDE.md project context
- [x] Verify dev environment works (bun dev, db connection)

### Phase 1: Schema Completions (Missing Reference Tables)
- [x] 1.1 Add `provenienta` table (14 records from legacy)
- [x] 1.2 Add `tipuri_stoc` table (3 records from legacy)
- [x] 1.3 Add `unitati_masura` table (16 records from legacy)
- [x] 1.4 Add `titlu` boolean to `conturi` (account hierarchy)
- [x] 1.5 Add funding source hierarchy fields to `surse_finantare`
- [x] 1.6 Add `operatiuni` table (operation headers for batch grouping)
- [x] 1.7 Generate + run migrations
- [x] 1.8 Add CRUD routes + validation for new tables
- [x] 1.9 Add UI pages for new nomenclature tables

### Phase 2: Legacy Data Migration Script
- [x] 2.1 Create migration script skeleton (TypeScript, reads SQLite)
- [x] 2.2 Migrate reference tables (gestiuni, dispus, conturi, acte, finantat, provenie, stoc_uz, unit_mas, stare)
- [x] 2.3 Migrate materials -> mijloace_fixe (complex transform)
- [x] 2.4 Migrate tranzact + operatii -> tranzactii (with operation headers)
- [x] 2.5 Compute initial solduri/balances
- [x] 2.6 Verification: cross-check record counts and totals
- [x] 2.7 Create seed script from migration output

### Phase 3: Missing Operations
- [x] 3.1 Operation reversal/deletion (ST_OPER equivalent)
- [x] 3.2 Transfer to different account (MOD_CONT equivalent)
- [x] 3.3 Delete unused asset (ST_MATER equivalent)
- [x] 3.4 Mass transfer operations (batch update)
- [x] 3.5 UI dialogs for new operations

### Phase 4: Critical Reports
- [x] 4.1 Balanta Analitica (per-item analytical balance)
- [x] 4.2 Centralizator Acte (operations centralizer)
- [x] 4.3 Lista de Inventariere (inventory list generation)
- [x] 4.4 Extend report filters (shared filter builder)

### Phase 5: Secondary Reports
- [x] 5.1 Single act report (extend jurnal)
- [x] 5.2 Situatia Obiectelor (inventory situation report)
- [x] 5.3 Obiecte cu durata depasita (exceeded duration)
- [x] 5.4 Lista de inventariere goala (empty inventory list)
- [x] 5.5 Locuri cu obiecte (locations with assets report)
- [x] 5.6 Corespondenta material-cont
- [x] 5.7 Lista materiale (catalog listing)

### Phase 6: Data Integrity & Polish
- [x] 6.1 Data integrity verification endpoint
- [x] 6.2 Negative balance checks
- [x] 6.3 Amortizari consistency validation
- [x] 6.4 Print/export improvements for all reports
- [x] 6.5 Final end-to-end testing

---

### Phase 7A: Schema + Backend Operatiuni Container
- [x] A.1 Extindere schema `operatiuni` (tipOperatie, stare)
- [x] A.2 Extindere shared types (TipOperatie, StareOperatie, Operatiune updated)
- [x] A.3 Validation schemas operatiuni-header
- [x] A.4 Helper auto-numerotare operatiuni
- [x] A.5 Route-uri CRUD operatiuni-acte (lista, detaliu, creare, finalizare, anulare)
- [x] A.6 Modificare operatii existente (OP-01..OP-10) sa creeze header operatiune
- [x] A.7 Test manual + verificare

### Phase 7B: Workflow Document-Centric (Intrare/Iesire)
- [x] B.1 Endpoint linie-intrare (creare MF nou prin operatiune)
- [x] B.2 Endpoint linie-iesire (casare/declasare prin operatiune)
- [x] B.3 Endpoint linie-transfer (transfer prin operatiune)
- [x] B.4 Endpoint sterge linie din operatiune deschisa
- [x] B.5 Cautare rapida MF pentru adaugare in operatiune

### Phase 7C: Stoc Bazat pe Tranzactii
- [x] C.1 Query helper "stoc la data" (getStocLaData)
- [x] C.2 Raport "Fisa pe Gestiune" (miscari intrare/iesire)
- [x] C.3 Raport "Situatia Stocului pe Gestiuni" (snapshot la data)
- [x] C.4 Adauga filtru dataSnapshot la Lista Inventariere existenta

### Phase 7D: UI Operatiuni
- [x] D.1 Pagina "Lista Operatiuni" (tabel + filtre)
- [x] D.2 Dialog "Creare Operatiune" (header)
- [x] D.3 Pagina "Detaliu Operatiune" (header + tabel linii + actiuni)
- [x] D.4 Dialog "Adauga Linie - Intrare" (formular creare MF)
- [x] D.5 Dialog "Adauga Linie - Transfer" (autocomplete + destinatie)
- [x] D.6 Dialog "Adauga Linie - Iesire" (autocomplete + motiv)
- [x] D.7 Integrare navigatie (App.tsx routes + nav)

### Phase 7E: Backfill + Integrare Finala
- [ ] E.1 Script backfill tranzactii orfane (operatiuneId = NULL)
- [ ] E.2 Decizie + refactor unificare flux operatiuni
- [ ] E.3 Integrare link operatiune in MijlocFixDetail
- [ ] E.4 Extindere raport Centralizator Acte (tipOperatie, stare)
- [ ] E.5 Verificari integritate noi (tranzactii orfane, operatiuni vechi)

---

## Session Log
<!-- Append entries as sessions complete -->

| Session | Date | Phase | Tasks Completed | Notes |
|---------|------|-------|-----------------|-------|
| 0 | 2026-02-19 | Planning | Phase 0 setup | Created skill, state tracker, CLAUDE.md |
| 1 | 2026-02-19 | Phase 1 | Tasks 1.1-1.8 | Schema + routes for provenienta, tipuriStoc, unitatiMasura, operatiuni; titlu on conturi; hierarchy on surseFinantare; FKs on mijloaceFixe + tranzactii |
| 2 | 2026-02-20 | Phase 2 | Tasks 2.1-2.4, 2.6 | Full migration script: 2037/2228 materials, 7936/7936 transactions, value sum EXACT MATCH (257.8M). 191 dead catalog entries skipped. Schema fix: conturi.simbol varchar(20)->30 |
| 3 | 2026-02-20 | Phase 3 | Tasks 3.1-3.5 | All missing operations: delete/reverse transaction (ST_OPER), transfer cont (MOD_CONT), delete unused asset (ST_MATER), mass transfer gestiune/loc (MOD_GEST/MOD_DISP), UI dialogs + OperatiuniMasa page |
| 4 | 2026-02-20 | Phase 4 | Tasks 4.3-4.4 | Lista de Inventariere report (GEN_INVE.PRG equiv): single-date snapshot, book values. Extended ReportFilters with showSingleDate + showCont (account filter). Added contId filter to BalantaAnalitica, Centralizator, ListaInventariere. |
| 5 | 2026-02-20 | Phase 5 | Tasks 5.1-5.7 | All 7 secondary reports: Raport Act (LIS_ACTE), Situatie Obiecte (SIT_OBIE), Durata Depasita (TERMENE), Lista Inventariere Goala (INV_GOL), Locuri cu Obiecte (LOCURI), Corespondenta Material-Cont (MAT_CONT), Lista Materiale (LIS_MATE). Added clickable rows in Centralizator to navigate to act detail. |
| 6 | 2026-02-20 | Phase 6 | Tasks 6.1-6.5 | Data integrity verification endpoint (18 checks across 3 categories: integritate, balante, amortizari - VERIFIC.PRG equivalent). CSV export added to all 11 tabular reports. E2E testing: all CRUD, reports, operations, verification working. Found 3 real legacy data issues (50 invalid clasificari refs, 1 negative balance, 1 over-depreciated). |
| 7 | 2026-02-23 | Phase 7A | Tasks A.1-A.7 | Operatiuni container: added tipOperatie+stare columns to operatiuni schema, shared types (TipOperatie, StareOperatie), validation schemas, auto-numerotare helper, CRUD routes for /api/operatiuni-acte (list+detail+create+finalize+cancel), wired all existing operations (OP-01..OP-10) to create operatiune headers. 1614 legacy operatiuni updated to finalizata. |
| 8 | 2026-02-24 | Phase 7B | Tasks B.1-B.5 | Document-centric workflow: linie-intrare (create new MF via operatiune), linie-iesire (casare/declasare/iesire via operatiune), linie-transfer (gestiune/loc/cont transfer via operatiune), delete linie (reverse+delete from open operatiune), cautare rapida MF endpoint (/api/mijloace-fixe/cautare). |
| 9 | 2026-02-24 | Phase 7C | Tasks C.1-C.4 | Stoc bazat pe tranzactii: getStocLaData/getStocCurent helpers (reconstruct asset location at historical date from transactions), Fisa pe Gestiune report (movements in/out with sold initial/final), Situatia Stocului pe Gestiuni report (snapshot per gestiune at date), dataSnapshot filter on Lista Inventariere (historical gestiune-based stock filtering). |
| 10 | 2026-02-24 | Phase 7D | Tasks D.1-D.7 | UI Operatiuni: Lista Operatiuni page (paginated table with filters: an, tipOperatie, stare, date range), Creare Operatiune dialog (tipOperatie, data, document, descriere), Detaliu Operatiune page (header card + linii table + finalizare/anulare/sterge linie actions), AddLinieIntrare dialog (full MF creation form), AddLinieTransfer dialog (MF search autocomplete + gestiune/loc/cont destinatie), AddLinieIesire dialog (MF search + casare/declasare/iesire), navigation integrated in App.tsx + main.tsx routes. |

---

## Known Issues
<!-- Track blockers and issues found during migration -->

1. **191 materials with no INTRARE transactions**: These are dead catalog entries in the legacy MATERIAL table - they exist in the catalog but were never actually entered into inventory. Correctly excluded from migration.
2. **9 gestiuni with empty names**: Legacy codes 5,6,7,11,12,13,14,16,17 had blank `denumire`. Migrated with placeholder names as inactive.

---

## Architecture Decisions
<!-- Record key decisions made during migration -->

1. **Asset-centered model preserved**: Modern app uses mijloace_fixe as primary entity (not transaction-centered like legacy)
2. **Operation headers added**: New `operatiuni` table bridges legacy batch-operation concept
3. **Single duration model**: Legacy had 3 durations (use/warehouse/stock); modern uses single `durata_normala`
4. **Enum for states**: Legacy STARE table -> modern enum (activ, casare, declasare, transfer)
5. **Balances computed on-demand**: No SOLDURI equivalent; balances derived from transactions + amortizari

---

## Data Volume Reference (Legacy)
| Table | Records |
|-------|---------|
| tranzact | 7,936 |
| operatii | 1,614 |
| solduri | 4,396 |
| material | 2,228 |
| conturi | 47 |
| gestiuni | 20 |
| dispus | 99 |
| finantat | 20 |
| provenie | 14 |
| stoc_uz | 3 |
| unit_mas | 16 |
| stare | 5 |
| acte | 23 |
