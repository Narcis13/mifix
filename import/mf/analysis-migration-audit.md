# MiFix - Complete Migration Audit
## Modern Codebase Analysis & Legacy Feature Mapping

**Generated:** 2026-02-19
**Scope:** Full audit of modern codebase + gap analysis against legacy FoxPro application

---

## 1. Architecture Overview

### Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Runtime** | Bun | Used for server execution, password hashing (argon2id) |
| **Server Framework** | Hono | Lightweight HTTP framework with middleware support |
| **Database** | MySQL | Via mysql2/promise connection pool |
| **ORM** | Drizzle ORM | Type-safe queries, relational schema, Zod integration |
| **Validation** | Zod + drizzle-zod | Schema-derived validation with custom refinements |
| **Auth** | JWT (HS256) | HttpOnly cookie-based, 24h expiration |
| **Client Framework** | React + React Router | SPA with client-side routing |
| **UI Components** | shadcn/ui (Radix + Tailwind) | DataTable, Dialog, Select, Card, etc. |
| **Table Library** | TanStack Table | Column definitions, sorting, pagination |
| **Shared Package** | TypeScript monorepo | Types + Money class shared between server/client |
| **Financial Math** | decimal.js (Money class) | Prevents floating-point precision errors |

### Monorepo Structure
```
packages/
  server/     - Hono API server (Bun runtime, port 3000)
  client/     - React SPA (Vite, proxied to server)
  shared/     - TypeScript types + Money utility class
```

### Key Patterns
- **API Response wrapper**: All endpoints return `ApiResponse<T>` with `success`, `data`, `message`, `errors`
- **Pagination**: `PaginatedResponse<T>` with `items`, `total`, `page`, `pageSize`, `totalPages`
- **Monetary values**: Always stored as `decimal(15,2)` in DB, transported as strings, computed with `Money` class
- **Validation**: Zod schemas derived from Drizzle schema via `drizzle-zod`, with custom refinements
- **Error handling**: Structured error codes in transactions (e.g., `NOT_FOUND:`, `INVALID_STATE:`)

---

## 2. Database Schema Audit

### Table: `clasificari` (HG 2139/2004 Classification Catalog)
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `cod` | varchar(10) | **PK** | Classification code (e.g., "1.1.1") |
| `denumire` | varchar(500) | NOT NULL | Description |
| `grupa` | varchar(5) | NOT NULL | Group: I, II, III |
| `durata_normala_min` | int | NOT NULL | Minimum useful life (years) |
| `durata_normala_max` | int | NOT NULL | Maximum useful life (years) |
| `cota_amortizare` | decimal(5,2) | nullable | Depreciation rate percentage |

**Seed data:** 60 entries across 3 groups (Constructii, Echipamente, Aparate)

### Table: `gestiuni` (Asset Custodians)
| Column | Type | Constraints |
|--------|------|------------|
| `id` | int | **PK**, auto-increment |
| `cod` | varchar(20) | NOT NULL, UNIQUE |
| `denumire` | varchar(200) | NOT NULL |
| `responsabil` | varchar(200) | nullable |
| `activ` | boolean | default true |
| `created_at` | timestamp | auto |
| `updated_at` | timestamp | auto-update |

### Table: `locuri_folosinta` (Usage Locations within Gestiuni)
| Column | Type | Constraints |
|--------|------|------------|
| `id` | int | **PK**, auto-increment |
| `gestiune_id` | int | NOT NULL, **FK** -> gestiuni.id |
| `cod` | varchar(20) | NOT NULL |
| `denumire` | varchar(200) | NOT NULL |
| `activ` | boolean | default true |

**Index:** `idx_locuri_folosinta_gestiune` on `gestiune_id`

### Table: `surse_finantare` (Funding Sources)
| Column | Type | Constraints |
|--------|------|------------|
| `id` | int | **PK**, auto-increment |
| `cod` | varchar(20) | NOT NULL, UNIQUE |
| `denumire` | varchar(200) | NOT NULL |
| `activ` | boolean | default true |

### Table: `conturi` (Chart of Accounts)
| Column | Type | Constraints |
|--------|------|------------|
| `id` | int | **PK**, auto-increment |
| `simbol` | varchar(20) | NOT NULL, UNIQUE |
| `denumire` | varchar(300) | NOT NULL |
| `tip` | enum('activ','pasiv','bifunctional') | NOT NULL |
| `amortizabil` | boolean | default false |
| `cont_amortizare` | varchar(20) | nullable |
| `activ` | boolean | default true |

### Table: `tipuri_document` (Document Types)
| Column | Type | Constraints |
|--------|------|------------|
| `id` | int | **PK**, auto-increment |
| `cod` | varchar(20) | NOT NULL, UNIQUE |
| `denumire` | varchar(100) | NOT NULL |
| `activ` | boolean | default true |

### Table: `mijloace_fixe` (Fixed Assets - **Main Entity**)
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | int | **PK**, auto-increment | |
| `numar_inventar` | varchar(50) | NOT NULL, UNIQUE | Inventory number |
| `denumire` | varchar(255) | NOT NULL | Asset name |
| `descriere` | varchar(1000) | nullable | |
| `clasificare_cod` | varchar(10) | NOT NULL, **FK** -> clasificari.cod | |
| `gestiune_id` | int | NOT NULL, **FK** -> gestiuni.id | |
| `loc_folosinta_id` | int | nullable, **FK** -> locuri_folosinta.id | |
| `sursa_finantare_id` | int | nullable, **FK** -> surse_finantare.id | |
| `cont_id` | int | nullable, **FK** -> conturi.id | |
| `tip_document_id` | int | nullable, **FK** -> tipuri_document.id | |
| `data_achizitie` | date | NOT NULL | |
| `document_achizitie` | varchar(100) | nullable | |
| `furnizor` | varchar(200) | nullable | |
| `valoare_initiala` | decimal(15,2) | NOT NULL | |
| `valoare_inventar` | decimal(15,2) | NOT NULL | |
| `valoare_amortizata` | decimal(15,2) | NOT NULL, default "0.00" | |
| `valoare_ramasa` | decimal(15,2) | NOT NULL | |
| `durata_normala` | int | NOT NULL | In months |
| `durata_ramasa` | int | NOT NULL | In months |
| `cota_amortizare_lunara` | decimal(15,2) | NOT NULL | Auto-computed |
| `e_amortizabil` | boolean | default true | |
| `stare` | enum('activ','casare','declasare','transfer') | NOT NULL, default 'activ' | |
| `data_incepere_amortizare` | date | nullable | |
| `data_finalizare_amortizare` | date | nullable | |
| `data_iesire` | date | nullable | |
| `motiv_iesire` | varchar(500) | nullable | |
| `observatii` | varchar(1000) | nullable | |
| `created_at` | timestamp | auto | |
| `updated_at` | timestamp | auto-update | |

**Indexes:** `idx_mijloace_fixe_gestiune`, `idx_mijloace_fixe_clasificare`, `idx_mijloace_fixe_stare`, `idx_mijloace_fixe_data_achizitie`

### Table: `tranzactii` (Asset Transactions)
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | int | **PK**, auto-increment | |
| `mijloc_fix_id` | int | NOT NULL, **FK** -> mijloace_fixe.id | |
| `tip` | enum('intrare','transfer','casare','declasare','reevaluare','modernizare','iesire') | NOT NULL | |
| `data_operare` | date | NOT NULL | |
| `document_numar` | varchar(100) | nullable | |
| `document_data` | date | nullable | |
| `gestiune_sursa_id` | int | nullable, **FK** -> gestiuni.id | |
| `gestiune_destinatie_id` | int | nullable, **FK** -> gestiuni.id | |
| `loc_folosinta_sursa_id` | int | nullable | |
| `loc_folosinta_destinatie_id` | int | nullable | |
| `valoare_operatie` | decimal(15,2) | nullable | |
| `valoare_inainte` | decimal(15,2) | nullable | |
| `valoare_dupa` | decimal(15,2) | nullable | |
| `descriere` | varchar(500) | nullable | |
| `observatii` | varchar(1000) | nullable | |
| `created_at` | timestamp | auto | |

**Indexes:** `idx_tranzactii_mijloc_fix`, `idx_tranzactii_tip`, `idx_tranzactii_data_operare`

### Table: `amortizari` (Monthly Depreciation Records)
| Column | Type | Constraints |
|--------|------|------------|
| `id` | int | **PK**, auto-increment |
| `mijloc_fix_id` | int | NOT NULL, **FK** -> mijloace_fixe.id |
| `an` | int | NOT NULL |
| `luna` | int | NOT NULL |
| `valoare_lunara` | decimal(15,2) | NOT NULL |
| `valoare_cumulata` | decimal(15,2) | NOT NULL |
| `valoare_ramasa` | decimal(15,2) | NOT NULL |
| `valoare_inventar` | decimal(15,2) | NOT NULL |
| `durata_ramasa` | int | NOT NULL |
| `calculat` | boolean | default false |
| `data_calcul` | timestamp | nullable |
| `created_at` | timestamp | auto |

**Indexes:** `idx_amortizari_mijloc_fix_an_luna` (composite), `uniq_amortizari_mijloc_fix_an_luna` (unique constraint)

### Table: `users` (Application Users)
| Column | Type | Constraints |
|--------|------|------------|
| `id` | int | **PK**, auto-increment |
| `username` | varchar(100) | NOT NULL, UNIQUE |
| `password_hash` | varchar(255) | NOT NULL |
| `activ` | boolean | default true |
| `created_at` | timestamp | auto |
| `updated_at` | timestamp | auto-update |

### Relationships Summary
```
clasificari (1) ----< (N) mijloace_fixe
gestiuni (1) ----< (N) locuri_folosinta
gestiuni (1) ----< (N) mijloace_fixe
locuri_folosinta (1) ----< (N) mijloace_fixe
surse_finantare (1) ----< (N) mijloace_fixe
conturi (1) ----< (N) mijloace_fixe
tipuri_document (1) ----< (N) mijloace_fixe
mijloace_fixe (1) ----< (N) tranzactii
mijloace_fixe (1) ----< (N) amortizari
tranzactii (N) >---- (1) gestiuni (sursa)
tranzactii (N) >---- (1) gestiuni (destinatie)
tranzactii (N) >---- (1) locuri_folosinta (sursa)
tranzactii (N) >---- (1) locuri_folosinta (destinatie)
```

---

## 3. API Routes Audit

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Authenticate with username/password, returns JWT in HttpOnly cookie |
| POST | `/api/auth/logout` | No | Clears JWT cookie |
| GET | `/api/auth/me` | Yes | Returns current user from JWT payload |

### Health Routes (`/api/health`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Basic health check |
| GET | `/api/health/decimal-test` | No | Validates Money class precision |

### Nomenclature Routes (CRUD patterns)

All nomenclature routes follow the same CRUD pattern with Zod validation:

#### Gestiuni (`/api/gestiuni`)
| Method | Endpoint | Validation | Description |
|--------|----------|-----------|-------------|
| GET | `/` | - | List all, ordered by cod |
| GET | `/:id` | id: int | Get by ID |
| POST | `/` | insertGestiuneSchema | Create new |
| PUT | `/:id` | updateGestiuneSchema | Update existing |

#### Surse Finantare (`/api/surse-finantare`)
| Method | Endpoint | Validation | Description |
|--------|----------|-----------|-------------|
| GET | `/` | - | List all, ordered by cod |
| GET | `/:id` | id: int | Get by ID |
| POST | `/` | insertSursaFinantareSchema | Create new |
| PUT | `/:id` | updateSursaFinantareSchema | Update existing |

#### Conturi (`/api/conturi`)
| Method | Endpoint | Validation | Description |
|--------|----------|-----------|-------------|
| GET | `/` | - | List all, ordered by simbol |
| GET | `/:id` | id: int | Get by ID |
| POST | `/` | insertContSchema | Create new (validates amortizabil + contAmortizare dependency) |
| PUT | `/:id` | updateContSchema | Update existing |

#### Locuri Folosinta (`/api/locuri`)
| Method | Endpoint | Validation | Description |
|--------|----------|-----------|-------------|
| GET | `/` | ?gestiuneId=N | List all, filterable by gestiuneId, joined with gestiune data |
| GET | `/:id` | id: int | Get by ID with gestiune |
| POST | `/` | insertLocFolosintaSchema | Create new (validates gestiune exists) |
| PUT | `/:id` | updateLocFolosintaSchema | Update (validates new gestiune exists if changed) |

#### Tipuri Document (`/api/tipuri-document`)
| Method | Endpoint | Validation | Description |
|--------|----------|-----------|-------------|
| GET | `/` | - | List all, ordered by cod |
| GET | `/:id` | id: int | Get by ID |
| POST | `/` | insertTipDocumentSchema | Create new |
| PUT | `/:id` | updateTipDocumentSchema | Update existing |

#### Clasificari (`/api/clasificari`) - Read-only
| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/` | ?search=, ?grupa=, ?page=, ?pageSize= | Paginated list with search and filter |
| GET | `/:cod` | cod: string | Get by cod (PK) |

### Mijloace Fixe Routes (`/api/mijloace-fixe`)

| Method | Endpoint | Validation | Description |
|--------|----------|-----------|-------------|
| GET | `/` | ?search=, ?gestiuneId=, ?locFolosintaId=, ?stare=, ?grupa=, ?page=, ?pageSize= | Paginated list with full joins, multiple filters |
| GET | `/:id` | id: int | Get by ID with all 6 related entities joined |
| POST | `/` | insertMijlocFixSchema | Create new asset (auto-computes: valoareAmortizata=0, durataRamasa=durataNormala, cotaAmortizareLunara) |
| PUT | `/:id` | updateMijlocFixSchema | Update asset (recalculates cotaAmortizareLunara if values change, checks numarInventar uniqueness) |

### Operatiuni Routes (`/api/operatiuni`)

| Method | Endpoint | Validation | Business Logic |
|--------|----------|-----------|----------------|
| GET | `/istoric/:mijlocFixId` | id: int | Get transaction history with aliased joins for source/dest gestiuni and locuri |
| POST | `/transfer-gestiune` | transferGestiuneSchema | **OP-01**: Transfer between gestiuni. DB transaction: validates active state, destination exists, different from source, locFolosinta belongs to dest. Updates asset + creates tranzactie record |
| POST | `/transfer-loc` | transferLocSchema | **OP-02**: Transfer within same gestiune. DB transaction: validates active state, locFolosinta belongs to same gestiune, different from current |
| POST | `/casare` | casareSchema | **OP-03**: Dispose of asset. DB transaction: validates active state, sets stare='casare', dataIesire, motivIesire |
| POST | `/declasare` | declasareSchema | **OP-04**: Reduce asset value. DB transaction: validates active state, uses Money class for precise calculation, checks reduction <= remaining value |

### Amortizari Routes (`/api/amortizari`)

| Method | Endpoint | Validation | Description |
|--------|----------|-----------|-------------|
| POST | `/genereaza` | genereazaAmortizareSchema | **AMO-01/02/03/06**: Batch generate monthly depreciation. DB transaction: finds all eligible assets (active, depreciable, remaining>0), skips already-processed, calculates linear depreciation, handles final-month protection, updates asset values |
| GET | `/istoric/:mijlocFixId` | id: int | **AMO-04**: Per-asset depreciation history |
| GET | `/sumar` | ?an=N | **AMO-05**: Monthly/yearly aggregate summary across all assets |
| GET | `/verificare` | ?an=N | Shows which months (1-12) are already processed for a given year |

### Rapoarte Routes (`/api/rapoarte`)

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | `/fisa/:id` | id: int | **RAP-01**: Complete asset card with transactions and depreciation history. Uses raw SQL joins with aliases for gestiune source/dest |
| GET | `/balanta` | ?stare=, ?clasificareCod= | **RAP-02**: Trial balance grouped by gestiune with sum aggregates. Totals computed server-side with Money class |
| GET | `/jurnal` | ?dataStart=, ?dataEnd=, ?gestiuneId=, ?tip= | **RAP-03**: Operations journal for date range. Required params: dataStart, dataEnd |
| GET | `/amortizare` | ?an=, ?luna=, ?gestiuneId=, ?clasificareCod= | **RAP-04**: Monthly depreciation report. Required params: an, luna |

---

## 4. UI Pages & Components Audit

### Navigation Structure (App.tsx)
```
/ ......................... Acasa (Home dashboard)
/mijloace-fixe ............ Mijloace Fixe (asset list)
/mijloace-fixe/:id ........ Detail view
/mijloace-fixe/:id/edit ... Edit form
/mijloace-fixe/nou ........ Create form
/amortizare ............... Amortizare (depreciation management)
/rapoarte ................. Rapoarte hub
/rapoarte/fisa ............ Fisa Mijloc Fix report
/rapoarte/balanta ......... Balanta de Verificare report
/rapoarte/jurnal .......... Jurnal Acte Operate report
/rapoarte/amortizare ...... Situatie Amortizare report
/gestiuni ................. Gestiuni CRUD
/surse-finantare .......... Surse Finantare CRUD
/locuri ................... Locuri Folosinta CRUD
/conturi .................. Plan Conturi CRUD
/clasificari .............. Clasificari HG 2139/2004 (read-only)
/login .................... Login page
```

### Pages

| Page | File | Features |
|------|------|----------|
| **Home** | `Home.tsx` | Dashboard with 3 info cards (Nomenclatoare, Mijloace Fixe, Amortizare) |
| **Login** | `Login.tsx` | Login form wrapped in LoginForm component |
| **MijloaceFixe** | `MijloaceFixe.tsx` | Paginated table with filters (search, gestiune, stare), URL-synced params, debounced search, row click navigation |
| **MijlocFixDetail** | `MijlocFixDetail.tsx` | Full asset detail with 6 card sections (Identificare, Clasificare, Document Intrare, Date Contabile, Amortizare, Istoric Tranzactii). Operations dropdown menu (Transfer Gestiune, Transfer Loc, Declasare, Casare). AmortizariTable inline. |
| **MijlocFixEdit** | `MijlocFixEdit.tsx` | Create/edit form wrapper using MijlocFixForm component |
| **Amortizare** | `Amortizare.tsx` | Stats cards (total, months processed, average), summary table filterable by year, "Genereaza Amortizare" dialog |
| **Rapoarte** | `Rapoarte.tsx` | Hub page with 4 report cards linking to sub-reports |
| **Gestiuni** | `Gestiuni.tsx` | DataTable with CRUD dialog (GestiuniForm) |
| **SurseFinantare** | `SurseFinantare.tsx` | DataTable with CRUD dialog (SurseFinantareForm) |
| **Locuri** | `Locuri.tsx` | DataTable with gestiune filter dropdown, CRUD dialog (LocuriForm) |
| **Conturi** | `Conturi.tsx` | DataTable with CRUD dialog (ConturiForm), amortizabil/contAmortizare logic |
| **Clasificari** | `Clasificari.tsx` | Read-only paginated table with search and grupa filter |

### Key Components

| Component | Directory | Purpose |
|-----------|-----------|---------|
| **MijlocFixForm** | `mijloace-fixe/` | Full create/edit form with all fields, clasificare picker, gestiune/loc cascading selects |
| **MijlocFixColumns** | `mijloace-fixe/` | Column definitions for asset list table |
| **MijlocFixFilters** | `mijloace-fixe/` | Search, gestiune, stare filter bar |
| **ClasificarePicker** | `mijloace-fixe/` | Searchable clasificare selector (combobox) |
| **StareBadge** | `mijloace-fixe/` | Color-coded status badge |
| **TransferGestiuneDialog** | `operatiuni/` | Dialog form for OP-01 transfer between gestiuni |
| **TransferLocDialog** | `operatiuni/` | Dialog form for OP-02 transfer within gestiune |
| **CasareDialog** | `operatiuni/` | Dialog form for OP-03 asset disposal |
| **DeclasareDialog** | `operatiuni/` | Dialog form for OP-04 value reduction |
| **TranzactiiTimeline** | `operatiuni/` | Timeline view of asset transaction history |
| **GenereazaAmortizareDialog** | `amortizare/` | Month/year selector for batch depreciation |
| **AmortizariSummary** | `amortizare/` | Monthly summary table |
| **AmortizariTable** | `amortizare/` | Per-asset depreciation history table |
| **FisaMijlocFix** | `rapoarte/` | Fixed asset card report component |
| **BalantaVerificare** | `rapoarte/` | Trial balance report component |
| **JurnalActe** | `rapoarte/` | Operations journal report component |
| **SituatieAmortizare** | `rapoarte/` | Monthly depreciation report component |
| **PrintLayout** | `rapoarte/` | Print-optimized layout wrapper |
| **ReportFilters** | `rapoarte/` | Shared filter component for reports |
| **AuthContext** | `auth/` | React context for auth state management |
| **LoginForm** | `auth/` | Login form with username/password |
| **ProtectedRoute** | `auth/` | Route guard redirecting to /login |
| **DataTable** | `data-table/` | Reusable table component using TanStack Table |
| **Nomenclature Forms** | `nomenclatoare/` | GestiuniForm, SurseFinantareForm, ConturiForm, LocuriForm |

---

## 5. Authentication System

### Flow
1. **Login**: POST `/api/auth/login` with username/password
2. **Password verification**: `Bun.password.verify()` against argon2id hash
3. **Token creation**: JWT signed with HS256, payload: `{ sub: userId, username, iat, exp }`
4. **Cookie**: Set as HttpOnly, SameSite=Lax, Secure in production, maxAge=24h
5. **Middleware**: `authMiddleware` on all `/api/*` routes, skips login/logout/health
6. **Session check**: Client calls `/api/auth/me` on mount to restore session
7. **Client protection**: `ProtectedRoute` component redirects to `/login` if no user
8. **Logout**: POST `/api/auth/logout` deletes cookie, clears client state

### Security Notes
- JWT secret defaults to `"dev-secret-change-in-production"` (env var override)
- No role-based access control (single admin role implied)
- No rate limiting on login attempts
- No CSRF protection beyond SameSite cookie
- Default seed user: admin/admin123

---

## 6. Legacy FoxPro Menu -> Modern Feature Mapping

### MENU 1: OPERATIUNI (Operations)

| # | Legacy Menu Item | Legacy Program | Modern Equivalent | Status |
|---|-----------------|----------------|-------------------|--------|
| 1 | LISTA DE INVENTARIERE | LIST_INV.SPR | Not directly mapped | **NOT IMPLEMENTED** |
| 2 | OPERARE ACT | oper_act | POST `/api/mijloace-fixe` (create), POST `/api/operatiuni/*` | **IMPLEMENTED** (Create + Transfer + Casare + Declasare) |
| 3 | STERGERE OPERATIUNE | ST_OPER.PRG | No delete endpoint | **NOT IMPLEMENTED** |
| 4 | INCARCARE PLAN DE CONTURI | (reindex CONTURI) | GET/POST `/api/conturi` | **IMPLEMENTED** (manual CRUD, no bulk import) |
| 5 | MODIFICARE DENUMIRE, NUMAR ACT | NUME_ACT.SPR | PUT `/api/mijloace-fixe/:id` | **IMPLEMENTED** |
| 6 | MODIFICARE NR. FISA, DENUMIRE, DURATA | MD_MATER.SPR | PUT `/api/mijloace-fixe/:id` | **IMPLEMENTED** |
| 7 | MUTARE MATERIALE > IN ALT CONT | MOD_CONT.SPR | Not directly mapped | **NOT IMPLEMENTED** (no "move to different account" operation) |
| 7 | MUTARE MATERIALE > IN ALTA GESTIUNE | MOD_GEST.SPR | POST `/api/operatiuni/transfer-gestiune` | **IMPLEMENTED** |
| 7 | MUTARE MATERIALE > IN ALT LOC DE DISPUNERE | MOD_DISP.SPR | POST `/api/operatiuni/transfer-loc` | **IMPLEMENTED** |
| 8 | STERGERE DENUMIRE DE MATERIAL | ST_MATER.SPR | No delete endpoint | **NOT IMPLEMENTED** |
| 9 | (separator) | - | - | - |
| 10 | INTRODUCERE NOU TIP DE ACT | DEN_ACT.SPR | POST `/api/tipuri-document` | **IMPLEMENTED** |
| 11 | INTRODUCERE GESTIUNE NOUA | DEN_GEST.SPR | POST `/api/gestiuni` | **IMPLEMENTED** |
| 12 | INTRODUCERE LOC DE DISPUNERE | DEN_LOC.SPR | POST `/api/locuri` | **IMPLEMENTED** |
| 13 | INTRODUCERE UNITATE DE MASURA | DEN_UM.SPR | Not mapped | **NOT IMPLEMENTED** (no unit-of-measure concept in modern) |
| 14 | VIZUALIZARE SURSE DE FINANTARE | (BROWSE FINANTAT) | GET `/api/surse-finantare` + UI page | **IMPLEMENTED** |
| 15 | VIZUALIZARE SURSE DE PROVENIENTA | (BROWSE PROVENIE) | Not mapped | **NOT IMPLEMENTED** (no "provenienta" concept in modern) |
| 16 | VIZUALIZARE GESTIUNI | (BROWSE GESTIUNI) | GET `/api/gestiuni` + UI page | **IMPLEMENTED** |
| 17 | VIZUALIZARE LOCURI DE DISPUNERE | (BROWSE DISPUS) | GET `/api/locuri` + UI page | **IMPLEMENTED** |
| 18 | VIZUALIZARE UNITATI DE MASURA | (BROWSE UNIT_MAS) | Not mapped | **NOT IMPLEMENTED** |

### MENU 2: LISTARE SITUATII (Reports/Listings)

| # | Legacy Menu Item | Legacy Program | Modern Equivalent | Status |
|---|-----------------|----------------|-------------------|--------|
| 1 | ACT OPERAT | lis_acte | GET `/api/rapoarte/jurnal` (single act) | **PARTIALLY** (journal shows all acts, no single-act view) |
| 2 | ACTE OPERATE INTR-O PERIOADA | acte_op | GET `/api/rapoarte/jurnal?dataStart=&dataEnd=` | **IMPLEMENTED** |
| 3 | CENTRALIZATORUL ACTELOR OPERATE | central | Not directly mapped | **NOT IMPLEMENTED** (centralized/aggregated view) |
| 4 | (separator) | - | - | - |
| 5 | FISA ANALITICA A OBIECTULUI | fisa_mat | GET `/api/rapoarte/fisa/:id` | **IMPLEMENTED** |
| 6 | FISA ANALITICA DOAR PENTRU MISCARI | miscari | GET `/api/operatiuni/istoric/:id` + TranzactiiTimeline | **IMPLEMENTED** (shown on detail page) |
| 7 | SITUATIA OBIECTELOR DE INVENTAR | sit_obie | GET `/api/mijloace-fixe?...` (filtered list) | **PARTIALLY** (list page, but not a dedicated report format) |
| 8 | SITUATIA OBIECTELOR FARA DATA INTRARII | termene (situatia=1) | Not mapped | **NOT IMPLEMENTED** |
| 9 | SITUATIA OBIECTELOR CU DURATA DEPASITA | termene (situatia=2) | Not mapped | **NOT IMPLEMENTED** |
| 10 | GENERARE LISTA DE INVENTARIERE | gen_inve | Not mapped | **NOT IMPLEMENTED** |
| 11 | LISTA DE INVENTARIERE GOALA | inv_gol | Not mapped | **NOT IMPLEMENTED** |
| 12 | (separator) | - | - | - |
| 13 | BALANTA ANALITICA A OBIECTELOR | bal_mijl | Not directly mapped | **NOT IMPLEMENTED** (analytical balance per-object) |
| 14 | BALANTA SINTETICA A OBIECTELOR | balanta | GET `/api/rapoarte/balanta` | **IMPLEMENTED** (synthetic balance by gestiune) |
| 15 | (separator) | - | - | - |
| 16 | LOCURILE UNDE SE AFLA OBIECTE | locuri | Not mapped | **NOT IMPLEMENTED** (locations-with-assets report) |
| 17 | (separator) | - | - | - |
| 18 | DENUMIRILE OBIECTELOR > DUPA DENUMIRE | lis_mate (optiune=1) | GET `/api/mijloace-fixe?search=` | **PARTIALLY** (search on list page) |
| 18 | DENUMIRILE OBIECTELOR > DUPA NR FISA | lis_mate (optiune=2) | GET `/api/mijloace-fixe?search=` | **PARTIALLY** |
| 18 | DENUMIRILE OBIECTELOR > DUPA COD NOMENCLATOR | lis_mate (optiune=3) | GET `/api/clasificari?search=` | **PARTIALLY** |
| 19 | CORESPONDENTA MATERIAL-CONT | mat_cont | Not mapped | **NOT IMPLEMENTED** |
| 20 | (separator) | - | - | - |
| 21 | PLANUL DE CONTURI | plan_con | GET `/api/conturi` + UI page | **IMPLEMENTED** |

### MENU 3: OPERATIUNI PE BAZA DE DATE (Database Operations)

| # | Legacy Menu Item | Legacy Program | Modern Equivalent | Status |
|---|-----------------|----------------|-------------------|--------|
| 1 | REINDEXARE SI RECALCULARE SOLDURI | cc_sold | Not needed (MySQL auto-indexes) | **NOT APPLICABLE** |
| 3 | VERIFICARE INTEGRITATE DATE | verific | Not mapped | **NOT IMPLEMENTED** (data integrity checks) |
| 5 | RENUMEROTARE NUMERE CURENTE | ren_crt() | Not needed (auto-increment IDs) | **NOT APPLICABLE** |
| 7 | STERGERE GESTIUNE FARA CORESPONDENT | (inline PRG) | Not mapped | **NOT IMPLEMENTED** (orphan cleanup) |
| 9 | STERGERE LOC DE DISPUNERE FARA CORESPONDENT | (inline PRG) | Not mapped | **NOT IMPLEMENTED** |
| 11 | STERGERE CONTURI FARA CORESPONDENT | (inline PRG) | Not mapped | **NOT IMPLEMENTED** |
| 13 | STERGERE MATERIAL FARA CORESPONDENT | (inline PRG) | Not mapped | **NOT IMPLEMENTED** |

### MENU 4: IESIRE PROGRAM (Exit)

| # | Legacy Menu Item | Modern Equivalent | Status |
|---|-----------------|-------------------|--------|
| 1 | IESIRE IN SISTEMUL DE OPERARE | POST `/api/auth/logout` | **IMPLEMENTED** |
| 2 | IESIRE IN MEDIUL DE PROGRAMARE | N/A | **NOT APPLICABLE** |
| 3 | SALVARE DATE PE DISCHETA | Not mapped | **NOT APPLICABLE** (modern backup strategies) |
| 4 | INCARCARE DATE DE PE DISCHETA | Not mapped | **NOT APPLICABLE** |

---

## 7. Gap Analysis - Missing Legacy Functionality

### Critical Gaps (Business-Required)

1. **STERGERE OPERATIUNE** (Delete/Reverse Operation)
   - Legacy: `ST_OPER.PRG` - allows reversing a previously entered operation
   - Modern: No reversal capability exists. Transactions are write-only.
   - **Impact:** Users cannot correct mistakes in entered operations

2. **MUTARE IN ALT CONT** (Move to Different Account)
   - Legacy: `MOD_CONT.SPR` - reassigns an asset to a different accounting account
   - Modern: No dedicated operation. Could be done via PUT on mijloc fix, but no transaction record created.
   - **Impact:** Account changes not tracked in history

3. **STERGERE DENUMIRE DE MATERIAL** (Delete Asset Entry)
   - Legacy: `ST_MATER.SPR` - removes an asset denomination
   - Modern: No DELETE endpoint for mijloace_fixe
   - **Impact:** Cannot remove erroneously entered assets

4. **CENTRALIZATORUL ACTELOR OPERATE** (Operations Centralizer)
   - Legacy: `central` - aggregated view of all operations
   - Modern: Jurnal shows individual operations but lacks centralized aggregation
   - **Impact:** Missing summary report for audit compliance

5. **LISTA DE INVENTARIERE** (Inventory List Generation)
   - Legacy: `LIST_INV.SPR` / `gen_inve` / `inv_gol` - generates formal inventory lists
   - Modern: Not implemented
   - **Impact:** Required for annual inventory procedures

6. **BALANTA ANALITICA** (Analytical Balance)
   - Legacy: `bal_mijl` - per-object analytical balance
   - Modern: Only synthetic balance (by gestiune) exists
   - **Impact:** Missing detailed per-object balance sheet

### Medium Gaps

7. **SITUATIA OBIECTELOR FARA DATA INTRARII** (Assets Without Entry Date)
   - Legacy: `termene` with situatia=1
   - Modern: Not implemented (though data_achizitie is required in modern schema, so this may be less relevant)

8. **SITUATIA OBIECTELOR CU DURATA DEPASITA** (Assets With Exceeded Duration)
   - Legacy: `termene` with situatia=2
   - Modern: Not implemented. Could be a simple filter query.

9. **CORESPONDENTA MATERIAL-CONT** (Asset-Account Correspondence)
   - Legacy: `mat_cont` - shows which assets are assigned to which accounts
   - Modern: Data exists in schema (contId on mijloace_fixe) but no dedicated report

10. **LOCURILE UNDE SE AFLA OBIECTE** (Locations With Assets)
    - Legacy: `locuri` - report showing which locations have assets
    - Modern: Data exists but no report

11. **VERIFICARE INTEGRITATE DATE** (Data Integrity Verification)
    - Legacy: `verific` - checks data consistency
    - Modern: Relational integrity handled by MySQL, but no application-level verification tool

### Low Gaps (Legacy-Specific, Less Relevant)

12. **UNITATE DE MASURA** (Unit of Measure) - legacy concept not in modern data model
13. **SURSE DE PROVENIENTA** (Source of Origin) - legacy concept not in modern data model
14. **Database Maintenance** (reindex, renumber, orphan cleanup) - handled by MySQL automatically
15. **Floppy Disk Backup/Restore** - obsolete

---

## 8. New Features in Modern (Not in Legacy)

### Features Present in Modern but Absent from Legacy

1. **Amortizare (Depreciation) Module**
   - Full automated monthly depreciation calculation
   - Batch generation for all eligible assets
   - Per-asset depreciation history
   - Monthly/yearly summary aggregation
   - Month verification (which months are processed)
   - Final-month protection (prevents over-depreciation)
   - **Note:** The legacy system had no depreciation calculation at all

2. **HG 2139/2004 Classification Catalog**
   - Structured classification system with groups (I, II, III)
   - 60 pre-seeded entries with official duration ranges and depreciation rates
   - Searchable, paginated catalog browser
   - Classification linked to each asset
   - **Note:** Legacy had `MATERIAL.DBF` as a flat nomenclature without standardized classification

3. **Authentication System**
   - JWT-based authentication with HttpOnly cookies
   - User management with hashed passwords (argon2id)
   - Protected routes on both server and client
   - Session persistence across page reloads
   - **Note:** Legacy FoxPro had no authentication

4. **Declasare Operation (Value Reduction)**
   - Dedicated operation type for partial asset write-off
   - Precise Money calculations to prevent floating-point errors
   - Transaction record with before/after values
   - **Note:** Legacy had casare but no explicit declasare

5. **Report System with Print Support**
   - 4 structured reports (Fisa, Balanta, Jurnal, Situatie Amortizare)
   - PrintLayout wrapper for print-optimized output
   - Server-side totals with Money precision
   - Filter parameters for each report
   - **Note:** Legacy reports were hardcoded print routines

6. **Document Type Management**
   - Dedicated tipuri_document nomenclature
   - Linked to asset acquisition records
   - **Note:** Legacy had `DEN_ACT.SPR` for document type names but simpler structure

7. **Decimal Precision (Money Class)**
   - Shared Money class using decimal.js
   - Prevents all floating-point errors in financial calculations
   - Consistent toDbString/toDisplay formatting
   - **Note:** Legacy FoxPro used native numeric types

8. **Modern UI/UX**
   - Responsive SPA with React + Tailwind
   - Real-time search with debouncing
   - URL-synced filters and pagination
   - Modal dialogs for operations
   - Toast notifications
   - Loading states and error handling

---

## 9. Shared Package Analysis

### Money Class (`packages/shared/src/money.ts`)
- Wraps `decimal.js` with precision=20, ROUND_HALF_UP
- Immutable arithmetic: `plus`, `minus`, `times`, `dividedBy`
- Output: `toDbString()` (2 decimals for DB), `toDisplay()` (formatted)
- Comparisons: `equals`, `greaterThan`, `lessThan`, etc.
- Static: `fromDb()`, `zero()`, `calculateMonthlyDepreciation()`

### Type Definitions (`packages/shared/src/types/`)
- **Enums:** MetodaAmortizare, StareMijlocFix, TipTranzactie, TipCont
- **Entity interfaces:** Clasificare, Gestiune, LocFolosinta, SursaFinantare, Cont, TipDocument, MijlocFix, Tranzactie, Amortizare
- **API types:** ApiResponse, PaginatedResponse, GenereazaAmortizareResult, AmortizareSumar, AmortizareVerificare
- **Report types:** FisaMijlocFix, TranzactieRaport, AmortizareRaport, BalantaRow/Response, JurnalActRow/Response, SituatieAmortizareRow/Response, ReportFilters

---

## 10. Summary Statistics

| Metric | Count |
|--------|-------|
| Database tables | 9 |
| API endpoints | ~35 |
| Client pages | 12 |
| Client components | ~35 |
| Shared types | ~25 interfaces |
| Zod validation schemas | 14 |
| Legacy menu items | ~50 |
| Legacy items IMPLEMENTED | ~22 (44%) |
| Legacy items NOT IMPLEMENTED | ~15 (30%) |
| Legacy items PARTIALLY implemented | ~6 (12%) |
| Legacy items NOT APPLICABLE | ~7 (14%) |
| New features (not in legacy) | 8 major features |
