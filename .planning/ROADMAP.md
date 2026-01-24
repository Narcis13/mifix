# Roadmap: MiFix

**Created:** 2026-01-22
**Depth:** standard
**Total Phases:** 6
**Total Requirements:** 34

## Milestone: v1.0

### Phase 1: Foundation & Setup

**Goal:** Development environment ready with database schema, financial calculation patterns, and shared types established.

**Requirements:**
- SETUP-01: Proiect initializat cu bhvr template (Bun, Hono, React, Vite)
- SETUP-02: Baza de date MySQL configurata cu Drizzle ORM
- SETUP-03: shadcn/ui instalat si configurat
- SETUP-04: Tipuri shared intre client si server
- SETUP-05: decimal.js integrat pentru calcule financiare

**Success Criteria:**
1. Developer can run `bun dev` and see React app in browser
2. Database migrations execute successfully and create all tables
3. API endpoint returns data from database with correct Decimal types (not strings)
4. Shared types are imported and used in both client and server code
5. Financial calculation utility correctly handles decimal precision (0.1 + 0.2 returns 0.3, not 0.30000...04)

**Dependencies:** None

**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Initialize project from bhvr template
- [x] 01-02-PLAN.md — Configure Drizzle ORM with MySQL schema
- [x] 01-03-PLAN.md — Setup shadcn/ui, shared types, Money utility
- [x] 01-04-PLAN.md — Integration test and verification

---

### Phase 2: Nomenclatoare

**Goal:** User can manage all reference data (gestiuni, locuri, surse finantare, conturi, clasificare) that assets depend on.

**Requirements:**
- NOM-01: CRUD gestiuni (cod, denumire, responsabil, activ)
- NOM-02: CRUD locuri de folosinta (in cadrul gestiunilor)
- NOM-03: CRUD surse de finantare (cod, denumire)
- NOM-04: CRUD plan de conturi (simbol, denumire, tip, cont amortizare)
- NOM-05: Clasificare MF conform HG 2139/2004 preincarcata (cod, denumire, grupa, durata normala)

**Success Criteria:**
1. User can create a new gestiune and see it in the list
2. User can create loc de folosinta within a specific gestiune (dependent select)
3. User can view HG 2139/2004 classification catalog and search by code or name
4. User can add/edit entries in plan de conturi with amortization account linking
5. All nomenclator forms validate required fields and show errors

**Dependencies:** Phase 1

**Plans:** 5 plans

Plans:
- [x] 02-01-PLAN.md — Dependencies, shadcn/ui components, routing, DataTable
- [x] 02-02-PLAN.md — Gestiuni CRUD (API + UI)
- [x] 02-03-PLAN.md — Surse Finantare CRUD + Clasificari read-only
- [x] 02-04-PLAN.md — Locuri de Folosinta CRUD with gestiune dependency
- [x] 02-05-PLAN.md — Conturi CRUD with conditional amortizare field

---

### Phase 3: Mijloace Fixe Core

**Goal:** User can register, list, view, and edit fixed assets with full data and validation.

**Requirements:**
- MF-01: Inregistrare mijloc fix cu toate campurile (nr. inventar, denumire, clasificare, gestiune, valoare, data achizitie, durata normala)
- MF-02: Listare mijloace fixe cu filtrare (gestiune, stare, cautare text)
- MF-03: Vizualizare detalii mijloc fix
- MF-04: Editare mijloc fix
- MF-05: Validare numar inventar unic
- MF-06: Selectare clasificare din catalogul HG 2139/2004

**Success Criteria:**
1. User can register a new asset with all required fields (nr. inventar, denumire, clasificare, gestiune, valoare, data achizitie, durata normala)
2. User sees validation error when entering duplicate inventory number
3. User can filter asset list by gestiune, status, and text search
4. User can view complete asset details including classification info from HG 2139/2004
5. User can edit existing asset and changes persist

**Dependencies:** Phase 2 (requires nomenclatoare for form dropdowns)

**Plans:** 6 plans

Plans:
- [x] 03-01-PLAN.md — Prerequisites: shadcn components + TipDocument nomenclator + schema updates
- [x] 03-02-PLAN.md — MijloaceFixe API (CRUD with filtering, pagination, joins)
- [x] 03-03-PLAN.md — Shared components: ClasificarePicker, StareBadge, MijlocFixFilters
- [x] 03-04-PLAN.md — Asset list page with DataTable and filtering
- [x] 03-05-PLAN.md — Asset form (create/edit) with multi-section layout
- [x] 03-06-PLAN.md — Asset detail page + final verification

---

### Phase 4: Operatiuni

**Goal:** User can perform asset lifecycle operations (transfers, disposal) with complete audit trail.

**Requirements:**
- OP-01: Transfer mijloc fix intre gestiuni cu documentare (gestiune sursa, destinatie, data, observatii)
- OP-02: Transfer mijloc fix intre locuri de folosinta in aceeasi gestiune
- OP-03: Casare mijloc fix (marcare ca scos din functiune)
- OP-04: Declasare mijloc fix (reducere valoare)
- OP-05: Istoric tranzactii per mijloc fix (toate operatiunile)

**Success Criteria:**
1. User can transfer asset between gestiuni with documented reason and date
2. User can transfer asset between locations within same gestiune
3. User can mark asset as disposed (casat) with reason and date
4. User can perform declasare (value reduction) on asset with documented justification
5. User can view complete transaction history for any asset showing all operations chronologically

**Dependencies:** Phase 3 (requires assets to exist)

**Plans:** 4 plans

Plans:
- [x] 04-01-PLAN.md — Schema migration + Operatiuni API routes (transfer, casare, declasare)
- [x] 04-02-PLAN.md — Transfer dialogs (TransferGestiune + TransferLoc)
- [x] 04-03-PLAN.md — Casare + Declasare dialogs
- [x] 04-04-PLAN.md — Transaction history timeline + Detail page integration

---

### Phase 5: Amortizare

**Goal:** User can calculate and track monthly depreciation for all active assets correctly.

**Requirements:**
- AMO-01: Calcul amortizare liniara (valoare inventar / durata normala in luni)
- AMO-02: Generare amortizare lunara batch (pentru toate MF active si amortizabile)
- AMO-03: Actualizare valoare amortizata si valoare ramasa pe MF
- AMO-04: Vizualizare istoric amortizari per MF
- AMO-05: Vizualizare amortizari pe luna/an (toate MF-urile)
- AMO-06: Nu depaseste valoarea de amortizat (ultima luna = rest)

**Success Criteria:**
1. User can run monthly depreciation calculation for all active assets
2. System calculates correct linear depreciation (value / months)
3. Final month depreciation equals remaining value (no over-depreciation)
4. User can view depreciation history for individual asset showing each monthly calculation
5. User can view depreciation summary by month/year across all assets

**Dependencies:** Phase 3 (requires assets with values and durations)

**Plans:** 3 plans

Plans:
- [x] 05-01-PLAN.md — Schema unique constraint + Amortizari API routes (batch generation, history, summary)
- [x] 05-02-PLAN.md — Per-asset depreciation history (AmortizariTable + detail page integration)
- [x] 05-03-PLAN.md — Amortizare page with generation dialog + summary view

---

### Phase 6: Rapoarte & Autentificare

**Goal:** User can generate compliance reports and access is secured with authentication.

**Requirements:**
- RAP-01: Fisa mijlocului fix (date complete + istoric tranzactii + istoric amortizare)
- RAP-02: Balanta de verificare cantitativ-valorica (pe gestiuni, cu totaluri)
- RAP-03: Jurnal acte operate (istoric tranzactii pe perioada)
- RAP-04: Situatie amortizare lunara (amortizari calculate pe luna)
- RAP-05: Filtrare rapoarte pe perioada, gestiune, clasificare
- AUTH-01: Login cu user si parola
- AUTH-02: Sesiune persistenta (ramane logat intre refresh-uri)
- AUTH-03: Logout

**Success Criteria:**
1. User can generate Fisa Mijlocului Fix showing complete asset data, transaction history, and depreciation history
2. User can generate Balanta de Verificare grouped by gestiune with totals
3. User can generate Jurnal Acte Operate filtered by date range
4. User can filter all reports by period, gestiune, and classification
5. User must login with username/password to access the application
6. User session persists across browser refreshes
7. User can logout and is redirected to login page

**Dependencies:** Phase 4 (transactions), Phase 5 (depreciation data)

**Plans:** 4 plans

Plans:
- [x] 06-01-PLAN.md — Auth schema + API (users table, login/logout/me endpoints, JWT middleware)
- [x] 06-02-PLAN.md — Auth UI + Route protection (AuthContext, LoginForm, ProtectedRoute)
- [x] 06-03-PLAN.md — Reports API (fisa, balanta, jurnal, amortizare endpoints)
- [x] 06-04-PLAN.md — Reports UI + printing (dashboard, 4 report views, react-to-print)

---

## Progress

| Phase | Name | Status | Requirements |
|-------|------|--------|--------------|
| 1 | Foundation & Setup | Complete | 5/5 |
| 2 | Nomenclatoare | Complete | 5/5 |
| 3 | Mijloace Fixe Core | Complete | 6/6 |
| 4 | Operatiuni | Complete | 5/5 |
| 5 | Amortizare | Complete | 6/6 |
| 6 | Rapoarte & Autentificare | Complete | 8/8 |

**Total:** 34/34 requirements complete ✓

---
*Roadmap created: 2026-01-22*
*Phase 1 planned: 2026-01-22*
*Phase 1 complete: 2026-01-23*
*Phase 2 planned: 2026-01-23*
*Phase 2 complete: 2026-01-23*
*Phase 3 planned: 2026-01-23*
*Phase 3 complete: 2026-01-23*
*Phase 4 planned: 2026-01-23*
*Phase 4 complete: 2026-01-24*
*Phase 5 planned: 2026-01-24*
*Phase 5 complete: 2026-01-24*
*Phase 6 planned: 2026-01-24*
*Phase 6 complete: 2026-01-24*
*Milestone v1.0 complete: 2026-01-24*
