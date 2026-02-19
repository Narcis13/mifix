# MiFix - Comprehensive Legacy-to-Modern Migration Reference

**Generated:** 2026-02-19
**Source:** FoxPro v3.1 (Gestiune Obiecte de Inventar - Armata 4 "Transilvania")
**Target:** Bun + Hono + Drizzle ORM + MySQL + React (SaaS)

---

## 1. Executive Summary

MiFix is a migration of a **Romanian military inventory management system** (FoxPro v3.1, ~9,600 lines) into a modern SaaS application. The legacy system was developed for the **Ministry of National Defense, 4th Army "Transilvania"** by Lt. Col. Lazea Eugenia and Slt.Ing. Velea Ovidiu.

### What the Legacy System Does
- Tracks inventory objects (obiecte de inventar) through their full lifecycle
- Records all movements via documents (acts): entries, exits, transfers
- Maintains balances (SOLDURI) across 12 dimensions per item
- Generates 14 distinct reports (balances, sheets, inventories, centralizers)
- Manages reference data: accounts, warehouses, locations, funding sources, etc.

### Current Migration Status

| Category | Implemented | Partial | Missing | N/A |
|----------|:-----------:|:-------:|:-------:|:---:|
| Operations | 5 | 0 | 4 | 0 |
| Reports | 3 | 3 | 8 | 0 |
| Nomenclature CRUD | 6 | 0 | 3 | 0 |
| DB Maintenance | 0 | 0 | 1 | 6 |
| **New Features** | **8** | - | - | - |

**Overall: ~44% of legacy features implemented, plus 8 major new features not in legacy.**

### Paradigm Shift
The migration involves a fundamental **architectural shift**:
- **Legacy:** Transaction-centered. Items exist implicitly through their transactions. No "asset" entity.
- **Modern:** Asset-centered. Each fixed asset is a first-class entity with transactions linked to it.

---

## 2. Legacy System Overview

### 2.1 Application Structure

```
PROGRAM.MPR (main entry)
  |
  +-- Startup: SOLDURI empty? -> CC_SOLD (recalc) + VERIFIC (integrity check)
  |
  +-- MENU: OPERATIUNI (Operations)
  |     |-- LIST_INV.SPR ........... Initial inventory entry (cod_doc=1, entry-only)
  |     |-- OPER_ACT.PRG .......... Main operations entry (entry+exit)
  |     |-- ST_OPER.PRG ........... Delete entire operation
  |     |-- NUME_ACT.SPR .......... Modify act name/number
  |     |-- MD_MATER.SPR .......... Modify material sheet/name/duration
  |     |-- MOD_CONT/GEST/DISP.SPR  Mass transfers (account/warehouse/location)
  |     |-- ST_MATER.SPR .......... Delete unused material
  |     |-- DEN_ACT/GEST/LOC/UM.SPR  Reference data CRUD
  |     +-- Browse: FINANTAT, PROVENIE, GESTIUNI, DISPUS, UNIT_MAS
  |
  +-- MENU: LISTARE SITUATII (Reports)
  |     |-- LIS_ACTE.PRG .......... Single act report
  |     |-- ACTE_OP.PRG ........... Acts in period
  |     |-- CENTRAL.PRG ........... Centralized operations summary
  |     |-- FISA_MAT.PRG .......... Analytical material sheet
  |     |-- MISCARI.PRG ........... Movements-only sheet
  |     |-- SIT_OBIE.PRG .......... Inventory situation
  |     |-- TERMENE.PRG ........... Missing dates / exceeded duration
  |     |-- GEN_INVE.PRG .......... Inventory list generation
  |     |-- INV_GOL.PRG ........... Empty inventory list
  |     |-- BAL_MIJL.PRG .......... Analytical balance (per-item)
  |     |-- BALANTA.PRG ........... Synthetic balance (per-account)
  |     |-- LOCURI.PRG ............ Locations report
  |     |-- LIS_MATE.PRG .......... Material catalog listing
  |     |-- MAT_CONT.PRG .......... Material-account correspondence
  |     +-- PLAN_CON.PRG .......... Chart of accounts
  |
  +-- MENU: OPERATIUNI PE BAZA DE DATE (Maintenance)
  |     |-- CC_SOLD.PRG ........... Reindex + recalculate balances
  |     |-- VERIFIC.PRG ........... Data integrity checks (14 checks)
  |     +-- Orphan cleanup (gestiuni, locations, accounts, materials)
  |
  +-- MENU: IESIRE (Exit + Backup/Restore)
```

### 2.2 Key Business Concepts (Romanian -> English)

| Romanian | English | Description |
|----------|---------|-------------|
| Obiecte de inventar | Inventory objects | Low-value fixed assets |
| Mijloace fixe | Fixed assets | High-value capital assets |
| Gestiune | Warehouse/Custodian | Storage/responsibility area |
| Loc de dispunere | Location/Placement | Physical location within a gestiune |
| Act / Document | Act/Document | Legal document authorizing operations |
| Operatiune | Operation | A batch of transaction lines under one document |
| Tranzactie | Transaction | Single line item (entry or exit of material) |
| Solduri | Balances | Computed aggregate stock positions |
| Material / Denumire | Material/Item | An inventory item type |
| Fisa | Sheet/Card number | Unique identifier for a material |
| Cont | Account | Chart of accounts entry |
| Sursa de finantare | Funding source | Budget/funding classification |
| Sursa de provenienta | Provenance source | Origin of item |
| Unitate de masura | Unit of measure | How items are counted (buc, kg, complet) |
| Stare | State/Condition | Item condition (new, used, damaged) |
| Stoc/Uz | Stock/Usage type | In-use, in-warehouse, in-stock |
| Balanta analitica | Analytical balance | Per-item detailed balance |
| Balanta sintetica | Synthetic balance | Per-account summarized balance |
| Centralizator | Centralizer | Summary/aggregate report |
| Intrare | Entry/Debit | Item entering inventory (c_adaug=2) |
| Iesire | Exit/Credit | Item leaving inventory (c_adaug=1) |

---

## 3. Data Model Migration

### 3.1 Legacy DBF Schema (Complete)

#### Core Tables

**TRANZACT.DBF** (Main fact table - all inventory movements)
| Field | Type | Purpose | Modern Mapping |
|-------|------|---------|---------------|
| c_operat | N(10) | Operation ID = YEAR*1M + nr_oper | `tranzactii.id` + `tranzactii.data_operare` |
| crt | N(3) | Line number within operation (1-999) | N/A (auto-increment) |
| c_adaug | N(1) | Direction: 1=exit, 2=entry | `tranzactii.tip` (intrare/iesire/transfer/casare/declasare) |
| cod_den | N(8) | FK -> MATERIAL.cod (item ID) | `tranzactii.mijloc_fix_id` |
| cantit | N(10,3) | Quantity | Absorbed into asset value tracking |
| pret | N(13,2) | Unit price | `mijloace_fixe.valoare_initiala` |
| unit_mas | N(2) | FK -> UNIT_MAS.cod_u | **NOT MAPPED** - needs migration |
| stare | N(1) | FK -> STARE.cod | `mijloace_fixe.stare` (enum) |
| cont | N(3) | FK -> CONTURI.cod_cont | `mijloace_fixe.cont_id` |
| cod_ges | N(2) | FK -> GESTIUNI.cod | `tranzactii.gestiune_sursa_id` / `gestiune_destinatie_id` |
| sect | N(2) | FK -> DISPUS.cod | `tranzactii.loc_folosinta_sursa_id` / `destinatie_id` |
| c_stoc | N(1) | FK -> STOC_UZ.cod | **NOT MAPPED** - needs migration |
| cod_fin | N(2) | FK -> FINANTAT.cod | `mijloace_fixe.sursa_finantare_id` |
| cod_prov | N(2) | FK -> PROVENIE.cod | **NOT MAPPED** - needs migration |
| data_intr | D | Date of entry into inventory | `mijloace_fixe.data_achizitie` |
| proc | N(10,3) | Depreciation % at transaction time | Computed from `amortizari` |
| seria | C(8) | Serial number (for COMPLET items) | **NOT MAPPED** |
| pret_comp | N(13,2) | Complete set value (unit_mas=6) | **NOT MAPPED** |
| nr_doc | C(10) | Document reference number | `tranzactii.document_numar` |

**OPERATII.DBF** (Operation headers)
| Field | Type | Purpose | Modern Mapping |
|-------|------|---------|---------------|
| nr_oper | N(6) | Operation sequence number per year | N/A (individual transactions) |
| c_data | D | Operation date | `tranzactii.data_operare` |
| cod_doc | N(2) | FK -> ACTE.cod | `mijloace_fixe.tip_document_id` |
| nr_doc | C(10) | Document number | `tranzactii.document_numar` |
| c_comanda | N | Command number | **NOT MAPPED** |
| c_an | N(4) | Year | Derived from `data_operare` |

**SOLDURI.DBF** (Computed balances)
| Field | Type | Purpose | Modern Mapping |
|-------|------|---------|---------------|
| Same 12 dimensions as TRANZACT | - | Grouped balance quantities | **NOT MAPPED** - modern computes on demand |
| cantit | N(10,3) | Net balance (entries - exits) | Derived from `amortizari` + `mijloace_fixe` |

**MATERIAL.DBF** (Item catalog)
| Field | Type | Purpose | Modern Mapping |
|-------|------|---------|---------------|
| cod | N(8) | Primary key (fisa/sheet number) | `mijloace_fixe.numar_inventar` |
| nume | C(40) | Item name | `mijloace_fixe.denumire` |
| cod_m | C(13) | Nomenclature classification code | `mijloace_fixe.clasificare_cod` |
| zile | N | Useful life in-use (days) | `mijloace_fixe.durata_normala` (months) |
| zile1 | N | Useful life in-warehouse (days) | **NOT MAPPED** - single duration in modern |
| zile2 | N | Useful life in-stock (days) | **NOT MAPPED** - single duration in modern |

#### Reference/Lookup Tables

| Legacy Table | Fields | Modern Table | Status |
|-------------|--------|--------------|--------|
| CONTURI.DBF | cod_cont, cont, denumire, titlu, val1-val3 | `conturi` | Partial - missing `titlu` hierarchy, `val1-val3` temp fields |
| GESTIUNI.DBF | cod, denumire | `gestiuni` | Mapped. Added: responsabil, activ, timestamps |
| DISPUS.DBF | cod, denumire | `locuri_folosinta` | Mapped. Added: gestiune_id FK (new relationship) |
| ACTE.DBF | cod, den, scurt | `tipuri_document` | Mapped. Missing: scurt abbreviation |
| FINANTAT.DBF | cod, den, cap, cod_cap1, cod_cap2 | `surse_finantare` | Partial - missing hierarchy (cap, cod_cap1, cod_cap2) |
| PROVENIE.DBF | cod, den | N/A | **NOT MAPPED** |
| STARE.DBF | cod, den, den_sc | N/A (enum) | Converted to enum: activ, casare, declasare, transfer |
| STOC_UZ.DBF | cod, den | N/A | **NOT MAPPED** |
| UNIT_MAS.DBF | cod_u, nume_u | N/A | **NOT MAPPED** |
| CLASIFIC.DBF | c_clas, durata, cod, denumire, cant, val1-3 | `clasificari` | Mapped (HG 2139/2004 catalog) |

### 3.2 Modern Drizzle Schema (Current)

```
clasificari ----< mijloace_fixe ----< tranzactii
                       |                    |
gestiuni ----< --------+                    +----> gestiuni (sursa/dest)
     |                 |                    +----> locuri_folosinta (sursa/dest)
     +----< locuri_folosinta---+
                       |
surse_finantare -------+
conturi ---------------+
tipuri_document -------+
                       |
                       +----< amortizari

users (standalone auth table)
```

### 3.3 Key Differences

| Aspect | Legacy | Modern |
|--------|--------|--------|
| **Primary entity** | Transaction lines (TRANZACT) | Fixed assets (mijloace_fixe) |
| **Item identity** | Implicit via material code | Explicit asset entity with ID |
| **Dimensions per transaction** | 12 FKs on every transaction row | FKs on asset, transactions track changes |
| **Balances** | Materialized table (SOLDURI) | Computed on-demand from asset + amortizari |
| **Depreciation** | On-the-fly % calc from date + lifetime | Monthly batch calculation in amortizari table |
| **Lifetimes** | 3 separate (use/warehouse/stock) in days | Single duration in months |
| **COMPLET items** | Special unit_mas=6 with seria/pret_comp | Not implemented |
| **Account hierarchy** | titlu flag + prefix matching | Flat (no hierarchy) |
| **Funding hierarchy** | cap + cod_cap1/cod_cap2 | Flat (no hierarchy) |
| **ID strategy** | Natural composite keys | Auto-increment surrogates |
| **Operation grouping** | Multiple lines per operation header | Individual transactions per asset |

### 3.4 Missing Schema Elements for Full Migration

These need to be added to the Drizzle schema for feature parity:

```typescript
// 1. Provenance sources (PROVENIE.DBF equivalent)
provenienta: {
  id, cod, denumire, activ
}

// 2. Stock/Usage types (STOC_UZ.DBF equivalent)
tipuriStoc: {
  id, cod, denumire  // 0=in use, 1=in warehouse, 2=in stock
}

// 3. Units of measure (UNIT_MAS.DBF equivalent)
unitatiMasura: {
  id, cod, denumire  // Special: 6=complet/set
}

// 4. Account hierarchy (CONTURI titlu flag)
conturi.titlu: boolean  // true = parent/summary, false = posting account
conturi.parentContId: FK  // or use prefix-matching logic

// 5. Funding source hierarchy (FINANTAT hierarchy)
surseFinantare.eCapitol: boolean
surseFinantare.capitolParinte1Id: FK
surseFinantare.capitolParinte2Id: FK

// 6. Operation headers (for batch operations)
operatiuni: {
  id, numarOperatie, dataOperatie, tipDocumentId, numarDocument,
  numarComanda, an
}
tranzactii.operatiuneId: FK -> operatiuni.id
```

---

## 4. Business Logic Migration

### 4.1 Core Operations (OPER_ACT.PRG -> Modern Routes)

#### Operation: Create/Enter Transaction
**Legacy:** OPER_ACT.PRG `salvare()` (1,406 lines total)
**Modern:** POST `/api/mijloace-fixe` + POST `/api/operatiuni/*`

| Legacy Step | Modern Equivalent | Notes |
|-------------|------------------|-------|
| Open all 12 lookup tables | Drizzle relations auto-join | N/A |
| Auto-increment operation number | Auto-increment ID | Different paradigm |
| Validate all required FKs | Zod schema validation | Add custom refinements |
| Create OPERATII header | N/A | No operation header concept yet |
| GATHER MEMVAR to TRANZACT | INSERT into tranzactii | Single insert |
| rec_sold() balance update | N/A | Balances computed on-demand |
| Special COMPLET handling | **NOT IMPLEMENTED** | Need serial tracking |
| Price rounding: ROUND(qty*price,2) | Money class precision | Already handled |

**Key business rules to preserve:**
1. Sequential operation numbering per year (c_operat = YEAR*1M + nr_oper)
2. Max 999 line items per operation
3. Direction toggle (entry/exit) with auto-fill from previous lines
4. Stock validation: cannot exit more than available quantity
5. COMPLET (set/kit) items: binary qty, serial tracking, pret_comp values

#### Operation: Delete Operation
**Legacy:** ST_OPER.PRG
**Modern:** **NOT IMPLEMENTED**

**Must implement:**
- `DELETE /api/operatiuni/:id` or `POST /api/operatiuni/reversal`
- Safety check: cannot delete if subsequent operations reference same materials
- Cascade: delete all transaction lines, reverse balance effects
- Temporal integrity: later operations with same material block deletion

#### Operation: Mass Transfer (Account/Warehouse/Location)
**Legacy:** MOD_CONT.SPR, MOD_GEST.SPR, MOD_DISP.SPR
**Modern:** Transfer gestiune and loc are implemented; transfer account is **NOT IMPLEMENTED**

**Must implement:**
- `POST /api/operatiuni/transfer-cont`
- Batch update of asset account assignment
- Transaction record for audit trail

### 4.2 Balance Calculation Logic

**Legacy pattern (LIBRARIE.PRG `rec_sold()`):**
```
For each unique 12-dimension combination in TRANZACT:
  balance = SUM(cantit WHERE c_adaug=2) - SUM(cantit WHERE c_adaug=1)
  -> Write to SOLDURI
```

**Modern equivalent:**
- No SOLDURI table. Balances derived from:
  - `mijloace_fixe.valoare_ramasa` (current remaining value)
  - `amortizari` (depreciation history)
  - `tranzactii` (operation history)
- For reports requiring period balances, use SQL window functions or CTEs

### 4.3 Depreciation Calculation

**Legacy formula:**
```
proc = base_proc + ROUND((current_date - entry_date) * 100 / lifetime_days, 3)
lifetime_days = material.zile   (if c_stoc=0, in-use)
              = material.zile1  (if c_stoc=1, in-warehouse)
              = material.zile2  (if c_stoc=2, in-stock)
Lifetimes stored in days (year=360, month=30)
```

**Modern calculation:**
```typescript
cotaAmortizareLunara = valoareInventar / durataNormala  (linear monthly)
amortizare.valoare_lunara = cotaAmortizareLunara
amortizare.valoare_cumulata = previous_cumulata + valoare_lunara
amortizare.valoare_ramasa = valoare_inventar - valoare_cumulata
```

**Differences:**
- Legacy: percentage-based, 3 separate lifetimes, computed per-transaction
- Modern: monthly linear, single lifetime, batch-computed per month
- Modern adds: final-month protection, batch generation, verification

### 4.4 Data Integrity Checks (VERIFIC.PRG)

Legacy performs 14 integrity checks. Modern equivalents:

| # | Legacy Check | Modern Handling |
|---|-------------|----------------|
| 1 | Material without valid warehouse | MySQL FK constraint |
| 2 | Material without valid location | MySQL FK constraint |
| 3 | Material without valid stock type | **NOT APPLICABLE** (no stock type) |
| 4 | Material without valid account | MySQL FK constraint (nullable) |
| 5 | Material without valid funding source | MySQL FK constraint (nullable) |
| 6 | Material without valid provenance | **NOT APPLICABLE** (no provenance) |
| 7 | Material without valid unit of measure | **NOT APPLICABLE** |
| 8 | Material without valid state | Enum constraint |
| 9 | Operation without valid document type | MySQL FK constraint |
| 10 | Invalid COMPLET items | **NOT APPLICABLE** (no COMPLET) |
| 11 | Negative balances | **NEEDS IMPLEMENTATION** |
| 12 | Missing entry dates | Required field in schema |
| 13 | Orphaned transactions | MySQL FK constraint (CASCADE) |
| 14 | Duplicate records | MySQL UNIQUE constraints |

**Recommendation:** Add a `/api/admin/integrity-check` endpoint that validates:
- No negative remaining values
- All FK references valid
- Amortizari consistency (cumulative values match)
- No orphaned records

---

## 5. Reports Migration

### 5.1 Report Architecture

**Legacy pattern:** Each report follows:
1. Parameter collection (SPR dialog forms)
2. Table opens with index orders
3. SET RELATION for joins
4. Cursor creation with SQL SELECT
5. REPORT FORM to printer or TXT file

**Modern pattern:** Each report needs:
1. API endpoint with query parameters
2. SQL query with Drizzle joins/aggregates
3. JSON response with typed data
4. React component with PrintLayout wrapper

### 5.2 Universal Filter System

Legacy uses a shared `i[1..9]` filter array (from INTEROG.SPR):

| Index | Filter | Modern Query Param |
|-------|--------|-------------------|
| i(1) | Account (prefix match) | `?contSimbol=303` (prefix) |
| i(2) | Material code | `?materialId=N` |
| i(3) | Warehouse code | `?gestiuneId=N` |
| i(4) | Stock/usage type | `?tipStoc=N` (needs schema) |
| i(5) | Location code | `?locFolosintaId=N` |
| i(6) | Provenance code | `?provenientaId=N` (needs schema) |
| i(7) | Funding source | `?sursaFinantareId=N` |
| i(8) | State | `?stare=activ` |
| i(9) | Account prefix length | Derived from contSimbol length |

**Recommendation:** Create a shared `buildReportFilter()` utility that constructs WHERE clauses from these parameters.

### 5.3 Individual Report Migration Status

#### IMPLEMENTED Reports

| Report | Legacy | Modern Endpoint | Modern UI |
|--------|--------|----------------|-----------|
| **Fisa Analitica** | FISA_MAT.PRG | GET `/api/rapoarte/fisa/:id` | `FisaMijlocFix.tsx` |
| **Balanta Sintetica** | BALANTA.PRG | GET `/api/rapoarte/balanta` | `BalantaVerificare.tsx` |
| **Jurnal Acte** | ACTE_OP.PRG | GET `/api/rapoarte/jurnal` | `JurnalActe.tsx` |
| **Situatie Amortizare** | N/A (new) | GET `/api/rapoarte/amortizare` | `SituatieAmortizare.tsx` |

#### NOT IMPLEMENTED Reports (Must Build)

| # | Report | Legacy | Priority | Complexity |
|---|--------|--------|----------|------------|
| 1 | **Centralizator Acte** | CENTRAL.PRG | HIGH | Medium |
| 2 | **Balanta Analitica** | BAL_MIJL.PRG | HIGH | High |
| 3 | **Lista Inventariere** | GEN_INVE.PRG | HIGH | High |
| 4 | **Lista Inventariere Goala** | INV_GOL.PRG | MEDIUM | Low |
| 5 | **Situatia Obiectelor** | SIT_OBIE.PRG | MEDIUM | Medium |
| 6 | **Obiecte Fara Data** | TERMENE(1) | LOW | Low |
| 7 | **Obiecte Durata Depasita** | TERMENE(2) | MEDIUM | Medium |
| 8 | **Locuri cu Obiecte** | LOCURI.PRG | LOW | Low |
| 9 | **Corespondenta Material-Cont** | MAT_CONT.PRG | LOW | Low |
| 10 | **Lista Materiale** | LIS_MATE.PRG | LOW | Low |
| 11 | **Raport Act Singular** | LIS_ACTE.PRG | MEDIUM | Medium |

### 5.4 Report Detail: Balanta Analitica (BAL_MIJL.PRG)

**What it does:** Per-item balance showing opening stock, entries, exits, and closing stock for a date period. This is the detailed (analytical) complement to the synthetic balance.

**Legacy columns:**
| Column | Meaning |
|--------|---------|
| FISA | Sheet number |
| DENUMIREA MATERIALULUI | Material name |
| UNITATE DE MASURA | Unit of measure |
| STARE MATERIAL | Item state |
| STOC PREC. (cantitativ) | Opening quantity |
| INTRARI (cantitativ) | Entry quantity in period |
| IESIRI (cantitativ) | Exit quantity in period |
| STOC (cantitativ) | Closing quantity |
| SOLD INITIAL (valoric) | Opening value |
| DEBIT (valoric) | Debit value in period |
| CREDIT (valoric) | Credit value in period |
| SOLD (valoric) | Closing value |

**Modern implementation plan:**
```typescript
GET /api/rapoarte/balanta-analitica?dataStart=&dataEnd=&gestiuneId=&contSimbol=&stare=

// SQL approach:
// 1. Opening balance: SUM(values) from tranzactii WHERE data < dataStart
// 2. Period movements: SUM(values) from tranzactii WHERE data BETWEEN start AND end
// 3. GROUP BY mijloc_fix_id
// 4. JOIN mijloace_fixe for names, conturi for accounts
```

### 5.5 Report Detail: Centralizator Acte (CENTRAL.PRG)

**What it does:** Summary of all operations in a period with total debit/credit per operation.

**Legacy columns:**
| Column | Meaning |
|--------|---------|
| Nr.op. | Operation number |
| Data | Operation date |
| Tip act | Document type |
| Nr.act | Document number |
| Debit | Total debit value |
| Credit | Total credit value |

**Modern implementation plan:**
```typescript
GET /api/rapoarte/centralizator?dataStart=&dataEnd=&gestiuneId=

// SQL: GROUP BY tranzactii grouped by document, SUM valoare_operatie
// Split by tip (intrare=debit, iesire=credit)
```

### 5.6 Report Detail: Lista de Inventariere (GEN_INVE.PRG)

**What it does:** Formal inventory list at a specific date showing book quantities and values, with blank columns for physical count during annual inventory.

**Legacy columns:**
| Column | Meaning |
|--------|---------|
| DENUMIREA MATERIALULUI | Material name |
| FISA | Sheet number |
| UNITATE DE MASURA | Unit of measure |
| STARE MATERIAL | Item state |
| Stocuri Faptice (cantitativ) | Physical count (blank - to fill) |
| Stocuri Scriptice (cantitativ) | Book quantity |
| Diferente Plus/Minus | Differences (blank) |
| Pretul unitar | Unit price |
| Valoare | Book value |

**Modern implementation plan:**
```typescript
GET /api/rapoarte/inventar?data=&gestiuneId=&contSimbol=

// List all active assets as of date with current values
// Include blank columns for physical count in printable format
```

---

## 6. Migration Status - Detailed Feature Matrix

### 6.1 Operations

| Feature | Legacy | Modern | Status | Priority |
|---------|--------|--------|--------|----------|
| Initial inventory entry | LIST_INV.SPR | N/A | **MISSING** | HIGH |
| Create operation (entry+exit) | OPER_ACT.PRG | POST /mijloace-fixe + /operatiuni | **DONE** | - |
| Delete operation | ST_OPER.PRG | N/A | **MISSING** | HIGH |
| Modify act name/number | NUME_ACT.SPR | PUT /mijloace-fixe/:id | **DONE** | - |
| Modify material sheet/name/duration | MD_MATER.SPR | PUT /mijloace-fixe/:id | **DONE** | - |
| Transfer to different account | MOD_CONT.SPR | N/A | **MISSING** | HIGH |
| Transfer to different warehouse | MOD_GEST.SPR | POST /operatiuni/transfer-gestiune | **DONE** | - |
| Transfer to different location | MOD_DISP.SPR | POST /operatiuni/transfer-loc | **DONE** | - |
| Delete unused material | ST_MATER.SPR | N/A | **MISSING** | MEDIUM |
| CRUD: Document types | DEN_ACT.SPR | /api/tipuri-document | **DONE** | - |
| CRUD: Warehouses | DEN_GEST.SPR | /api/gestiuni | **DONE** | - |
| CRUD: Locations | DEN_LOC.SPR | /api/locuri | **DONE** | - |
| CRUD: Units of measure | DEN_UM.SPR | N/A | **MISSING** | LOW |
| View: Funding sources | BROWSE | /api/surse-finantare | **DONE** | - |
| View: Provenance sources | BROWSE | N/A | **MISSING** | LOW |

### 6.2 Reports

| Report | Legacy | Modern | Status | Priority |
|--------|--------|--------|--------|----------|
| Single act report | LIS_ACTE.PRG | Partial (jurnal) | **PARTIAL** | MEDIUM |
| Acts in period | ACTE_OP.PRG | GET /rapoarte/jurnal | **DONE** | - |
| Centralized operations | CENTRAL.PRG | N/A | **MISSING** | HIGH |
| Analytical material sheet | FISA_MAT.PRG | GET /rapoarte/fisa/:id | **DONE** | - |
| Movements-only sheet | MISCARI.PRG | GET /operatiuni/istoric/:id | **DONE** | - |
| Inventory objects situation | SIT_OBIE.PRG | Partial (list page) | **PARTIAL** | MEDIUM |
| Objects without entry date | TERMENE(1) | N/A | **MISSING** | LOW |
| Objects with exceeded duration | TERMENE(2) | N/A | **MISSING** | MEDIUM |
| Generate inventory list | GEN_INVE.PRG | N/A | **MISSING** | HIGH |
| Empty inventory list | INV_GOL.PRG | N/A | **MISSING** | MEDIUM |
| Analytical balance (per-item) | BAL_MIJL.PRG | N/A | **MISSING** | HIGH |
| Synthetic balance (per-account) | BALANTA.PRG | GET /rapoarte/balanta | **DONE** | - |
| Locations with objects | LOCURI.PRG | N/A | **MISSING** | LOW |
| Material catalog listing | LIS_MATE.PRG | Partial (list page) | **PARTIAL** | LOW |
| Material-account correspondence | MAT_CONT.PRG | N/A | **MISSING** | LOW |
| Chart of accounts | PLAN_CON.PRG | /conturi page | **DONE** | - |

### 6.3 Database Maintenance

| Feature | Legacy | Modern | Status |
|---------|--------|--------|--------|
| Reindex all tables | CC_SOLD.PRG | N/A (MySQL auto) | **NOT NEEDED** |
| Recalculate all balances | CC_SOLD.PRG recalc() | N/A (computed) | **NOT NEEDED** |
| Data integrity verification | VERIFIC.PRG (14 checks) | N/A | **SHOULD ADD** |
| Renumber line items | CC_SOLD.PRG ren_crt() | N/A (auto-increment) | **NOT NEEDED** |
| Orphan cleanup | Inline PRG | MySQL cascades | **NOT NEEDED** |
| Backup/restore | SLV_DISK/INC_DISK | Standard DB backup | **NOT NEEDED** |

### 6.4 New Features (Modern Only)

| Feature | Description |
|---------|-------------|
| **Authentication** | JWT + HttpOnly cookies, user management, argon2id |
| **Amortizare module** | Monthly depreciation batch calc, history, summary, verification |
| **HG 2139/2004 classification** | 60-entry standardized catalog with duration ranges |
| **Declasare operation** | Partial asset write-off with precise Money calculations |
| **Money class** | decimal.js wrapper for financial precision |
| **Modern UI/UX** | React SPA, Tailwind, shadcn/ui, TanStack Table, responsive |
| **Print support** | PrintLayout wrapper for report output |
| **RESTful API** | Structured endpoints with Zod validation |

---

## 7. Remaining Work - Task Breakdown

### Phase 1: Schema Completions (HIGH priority)

**Task 1.1: Add missing reference tables**
- Add `provenienta` table (cod, denumire, activ)
- Add `tipuri_stoc` table (cod, denumire)
- Add `unitati_masura` table (cod, denumire)
- Add Drizzle schema + seed data
- Add CRUD routes + UI pages

**Task 1.2: Add account hierarchy support**
- Add `titlu` boolean field to `conturi`
- Add `parent_cont_id` or implement prefix-matching logic
- Update BALANTA report to support hierarchical rollup

**Task 1.3: Add funding source hierarchy**
- Add `este_capitol` boolean to `surse_finantare`
- Add `capitol_parinte_1_id`, `capitol_parinte_2_id` FKs
- Update report filters

### Phase 2: Missing Operations (HIGH priority)

**Task 2.1: Operation reversal/deletion**
- Add `POST /api/operatiuni/anulare` endpoint
- Safety check: no subsequent operations reference same asset
- Create reversal transaction record
- Update asset values accordingly

**Task 2.2: Transfer to different account**
- Add `POST /api/operatiuni/transfer-cont` endpoint
- Validate source/destination accounts exist
- Create transaction record with old/new account
- Update `mijloace_fixe.cont_id`

**Task 2.3: Delete asset (unused)**
- Add `DELETE /api/mijloace-fixe/:id` endpoint
- Only allow if no transactions exist
- Hard delete from database

### Phase 3: Critical Reports (HIGH priority)

**Task 3.1: Balanta Analitica (per-item analytical balance)**
- API: `GET /api/rapoarte/balanta-analitica`
- Params: dataStart, dataEnd, gestiuneId, contSimbol, stare
- Compute: opening balance, period movements, closing balance per asset
- UI: `BalantaAnalitica.tsx` with PrintLayout

**Task 3.2: Centralizator Acte (operations centralizer)**
- API: `GET /api/rapoarte/centralizator`
- Params: dataStart, dataEnd, gestiuneId
- Aggregate: total debit/credit per operation
- UI: `CentralizatorActe.tsx` with PrintLayout

**Task 3.3: Lista de Inventariere (inventory list)**
- API: `GET /api/rapoarte/inventar`
- Params: data (snapshot date), gestiuneId, contSimbol
- List all active assets with book values at date
- UI: `ListaInventariere.tsx` with print-optimized layout (blank columns for counts)

### Phase 4: Secondary Reports (MEDIUM priority)

**Task 4.1: Single act report view**
- Extend jurnal to support filtering by single operation/document

**Task 4.2: Situatia Obiectelor (inventory situation)**
- Dedicated report format with all asset details + depreciation %

**Task 4.3: Objects with exceeded duration**
- Filter assets where `durata_ramasa <= 0` or `valoare_ramasa = 0`

**Task 4.4: Empty inventory list**
- Print-formatted list of asset names with blank columns

### Phase 5: Low Priority Completions

**Task 5.1: Data integrity checker**
- Admin endpoint for consistency verification
- Check FK validity, negative values, amortizari consistency

**Task 5.2: Material-account correspondence report**
**Task 5.3: Locations-with-assets report**
**Task 5.4: Material catalog listing**
**Task 5.5: COMPLET/set item support** (if needed)

---

## 8. Data Migration Strategy

### 8.1 Source Data

Legacy data exists in two forms:
1. **DBF files** in `/import/mf/` (original FoxPro binary format)
2. **SQLite database** at `/import/mf/legacy_data.sqlite` (already converted)

### 8.2 Migration Approach

```
legacy_data.sqlite -> Transform Script (Bun/TypeScript) -> MySQL (Drizzle)
```

**Step 1: Extract from SQLite**
```typescript
import Database from 'bun:sqlite';
const legacy = new Database('import/mf/legacy_data.sqlite');

// Read all legacy tables
const materials = legacy.query('SELECT * FROM material').all();
const tranzact = legacy.query('SELECT * FROM tranzact').all();
const operatii = legacy.query('SELECT * FROM operatii').all();
// ... etc
```

**Step 2: Transform reference data**
```typescript
// Direct mapping:
// GESTIUNI -> gestiuni (add id, responsabil, activ, timestamps)
// DISPUS -> locuri_folosinta (add gestiune_id - may need manual assignment)
// FINANTAT -> surse_finantare (flatten hierarchy)
// CONTURI -> conturi (map cont -> simbol, add tip/amortizabil)
// ACTE -> tipuri_document (map den -> denumire)

// New tables from legacy:
// PROVENIE -> provenienta
// STOC_UZ -> tipuri_stoc
// UNIT_MAS -> unitati_masura
```

**Step 3: Transform materials to assets**

This is the critical transformation - converting the transaction-centric model to asset-centric:

```typescript
// For each unique MATERIAL entry:
// 1. Create mijloace_fixe record:
//    - numar_inventar = MATERIAL.cod (converted to string)
//    - denumire = MATERIAL.nume
//    - clasificare_cod = MATERIAL.cod_m (map to clasificari catalog)
//    - gestiune_id = most recent TRANZACT.cod_ges for this material
//    - data_achizitie = earliest TRANZACT.data_intr
//    - valoare_initiala = computed from first entry transaction
//    - durata_normala = MATERIAL.zile / 30 (convert days to months)
//    - stare = derived from latest transaction type

// 2. Create tranzactii records from TRANZACT/OPERATII join:
//    - Map c_adaug to tip enum
//    - Map c_operat/crt to individual transactions
//    - Preserve chronological order
```

**Step 4: Verify migration**
```typescript
// Cross-check:
// - COUNT of materials matches COUNT of mijloace_fixe
// - SUM of SOLDURI values matches SUM of asset values
// - All FK references resolve
// - Date ranges preserved
```

### 8.3 Data Volume Estimates

| Legacy Table | Expected Records | Notes |
|-------------|-----------------|-------|
| MATERIAL | ~500-2000 | Depends on unit |
| TRANZACT | ~5000-50000 | All historical movements |
| OPERATII | ~500-5000 | One per document |
| SOLDURI | ~1000-10000 | Unique dimension combos |
| Reference tables | 10-100 each | Small lookup tables |

---

## 9. Architecture Notes

### 9.1 How Legacy Patterns Map to Modern Stack

| Legacy Pattern | Modern Equivalent |
|---------------|-------------------|
| USE table + SET ORDER | Drizzle `from(table).where()` + `.orderBy()` |
| SET RELATION TO | Drizzle `relations()` + `with:` in queries |
| SEEK / LOCATE FOR | `.where(eq())` / `.where(like())` |
| SCATTER / GATHER MEMVAR | Object spread / Drizzle `.set()` |
| APPEND BLANK + REPLACE | Drizzle `.insert().values()` |
| SELECT SQL INTO CURSOR | Drizzle `db.select().from()` (subqueries) |
| REPORT FORM to printer | React component + PrintLayout + `@media print` |
| INTEROG.SPR filter dialog | ReportFilters component + URL query params |
| FER1/FER2.SPR popup windows | Dialog components (shadcn/ui) |
| AVERTIZ warnings | Toast notifications (sonner) |
| DO procedure | Service functions / route handlers |
| PUBL M.variable | React state / route context |
| .FRX report layout | React table/grid components with CSS |
| MANEVRA.DBF temp table | SQL CTEs / window functions / in-memory arrays |

### 9.2 Server Architecture Recommendations

```
packages/server/src/
  index.ts              -- Hono app setup + middleware
  db/
    schema.ts           -- Drizzle schema (all tables)
    index.ts            -- DB connection pool
    seeds/              -- Seed data scripts
  middleware/
    auth.ts             -- JWT auth middleware
  routes/
    auth.ts
    gestiuni.ts
    locuri.ts
    conturi.ts
    surse-finantare.ts
    tipuri-document.ts
    clasificari.ts
    mijloace-fixe.ts
    operatiuni.ts       -- All operation types
    amortizari.ts
    rapoarte.ts         -- All report endpoints
    admin.ts            -- Data integrity, maintenance
  services/             -- NEW: Extract business logic
    balance.service.ts  -- Balance calculations
    report-filter.ts    -- Shared report filter builder
    depreciation.ts     -- Depreciation calculations
    migration.ts        -- Data migration scripts
  validation/
    schemas.ts          -- Zod schemas
    operatiuni-schemas.ts
    amortizari-schemas.ts
    rapoarte-schemas.ts -- NEW: Report parameter validation
```

### 9.3 Client Architecture Recommendations

```
packages/client/src/
  pages/
    Rapoarte.tsx                -- Report hub
    rapoarte/
      BalantaAnalitica.tsx      -- NEW
      CentralizatorActe.tsx     -- NEW
      ListaInventariere.tsx     -- NEW
      SituatiaObiectelor.tsx    -- NEW
      ... (existing reports)
  components/
    rapoarte/
      ReportFilters.tsx         -- Extend with all filter dimensions
      PrintLayout.tsx           -- Existing print wrapper
      BalantaAnaliticaTable.tsx  -- NEW
      ...
```

### 9.4 Key Implementation Principles

1. **Preserve all business rules** from legacy code even if the data model changed
2. **Use Money class** for ALL financial calculations (already implemented)
3. **Maintain audit trail** - never hard-delete transactions, use reversal records
4. **Report filters should be composable** - build shared filter utility
5. **Support both screen and print** for all reports (existing PrintLayout pattern)
6. **Opening balance computation** is expensive - consider materialized views or caching
7. **Account hierarchy** for synthetic balance uses prefix-matching (e.g., "303" matches "303.01")

---

## 10. Quick Reference: Legacy File -> Modern File Mapping

| Legacy File | Purpose | Modern Files |
|-------------|---------|-------------|
| PROGRAM.MPR | Main menu/entry | `App.tsx` (router), `index.ts` (server) |
| OPER_ACT.PRG | Main operations | `routes/operatiuni.ts`, `routes/mijloace-fixe.ts` |
| LIST_INV.SPR | Initial inventory | **TODO** |
| ST_OPER.PRG | Delete operation | **TODO** |
| CC_SOLD.PRG | Reindex/recalc | N/A (MySQL handles) |
| VERIFIC.PRG | Integrity checks | **TODO**: `routes/admin.ts` |
| MISCARI.PRG | Movements report | `routes/rapoarte.ts` (jurnal) |
| LIBRARIE.PRG | Utility library | `services/*.ts` |
| BALANTA.PRG | Synthetic balance | `routes/rapoarte.ts`, `BalantaVerificare.tsx` |
| BAL_MIJL.PRG | Analytical balance | **TODO** |
| CENTRAL.PRG | Operations centralizer | **TODO** |
| FISA_MAT.PRG | Material sheet | `routes/rapoarte.ts`, `FisaMijlocFix.tsx` |
| GEN_INVE.PRG | Inventory list | **TODO** |
| SIT_OBIE.PRG | Objects situation | **TODO** |
| TERMENE.PRG | Duration/date checks | **TODO** |
| ACTE_OP.PRG | Acts in period | `routes/rapoarte.ts`, `JurnalActe.tsx` |
| LIS_ACTE.PRG | Single act report | **TODO** (extend jurnal) |
| LIS_MATE.PRG | Material listing | Partial (`MijloaceFixe.tsx` list) |
| LOCURI.PRG | Locations report | **TODO** |
| MAT_CONT.PRG | Material-account map | **TODO** |
| PLAN_CON.PRG | Chart of accounts | `Conturi.tsx` |
| INV_GOL.PRG | Empty inventory list | **TODO** |
| TITLU.PRG | Title screen | `Home.tsx` |
| MOD_CONT.SPR | Transfer account | **TODO** |
| MOD_GEST.SPR | Transfer warehouse | `TransferGestiuneDialog.tsx` |
| MOD_DISP.SPR | Transfer location | `TransferLocDialog.tsx` |
| MD_MATER.SPR | Modify material | `MijlocFixEdit.tsx` |
| ST_MATER.SPR | Delete material | **TODO** |
| INTEROG.SPR | Report filters | `ReportFilters.tsx` |
| DEN_*.SPR | Reference CRUD | `nomenclatoare/*.tsx` |
| AVERTIZ*.SPR | Warning dialogs | Toast notifications (sonner) |
| FER1/FER2.SPR | Input dialogs | Dialog components (shadcn/ui) |

---

## Appendix A: Legacy Data Model ER Diagram

```
                    ACTE (doc types)
                      |
                      | cod_doc
                      v
OPERATII ============ HEADER
  nr_oper    ---+
  c_data        |    c_operat = YEAR*1M + nr_oper
  cod_doc       |
  nr_doc     ---+
                |
                | 1:N
                v
TRANZACT ============ LINES (main fact table)
  c_operat -----------> OPERATII
  crt
  c_adaug          (1=exit, 2=entry)
  cod_den -----------> MATERIAL.cod
  cantit
  pret
  unit_mas ----------> UNIT_MAS.cod_u  (6=COMPLET)
  stare ------------> STARE.cod
  cont -------------> CONTURI.cod_cont
  cod_ges ----------> GESTIUNI.cod
  sect -------------> DISPUS.cod
  c_stoc -----------> STOC_UZ.cod
  cod_fin ----------> FINANTAT.cod
  cod_prov ---------> PROVENIE.cod
  data_intr
  proc
  seria
  pret_comp
  nr_doc
                |
                | Aggregated (SUM entries - SUM exits)
                v
SOLDURI ============= BALANCES
  (same 12 dimension fields)
  cantit = net balance
```

## Appendix B: Key Computed Fields Reference

```
Operation ID:    c_operat = YEAR(date) * 1,000,000 + sequential_number
Value (regular): ROUND(cantit * pret, 2)
Value (complet): ROUND(pret_comp, 2)
Depreciation %:  base_proc + ROUND((current_date - entry_date) * 100 / lifetime_days, 3)
Lifetime days:   years * 360 + months * 30 + days
Balance:         SUM(qty WHERE c_adaug=2) - SUM(qty WHERE c_adaug=1) per unique 12-dimension combo
```
