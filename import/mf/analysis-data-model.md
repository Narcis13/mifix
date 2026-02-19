# FoxPro Legacy Data Model - Complete Analysis

## Overview

The FoxPro system manages **inventory items** (obiecte de inventar / mijloace fixe) for a public institution. The data model is centered around a **transactional architecture** where every item movement (in/out) is recorded in TRANZACT.DBF and aggregated into SOLDURI.DBF for balance tracking.

The system tracks items through documents (acts), operations, warehouses (gestiuni), locations (dispuneri), accounts (conturi), funding sources, provenance, states, and stock/usage categories.

---

## Tables

### 1. TRANZACT.DBF (Transactions - Main Fact Table)

**Role:** Core transaction table. Every item entry (INTRARE, c_adaug=2) and exit (IESIRE, c_adaug=1) creates a row here. This is the single source of truth for all inventory movements.

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| c_operat | INTEGER | N(10) | Operation ID = YEAR*1000000 + nr_oper. Composite key linking to OPERATII |
| cod_prov | INTEGER | N(2) | FK to PROVENIE.cod - provenance source |
| cod_fin | INTEGER | N(2) | FK to FINANTAT.cod - funding source |
| cod_ges | INTEGER | N(2) | FK to GESTIUNI.cod - warehouse |
| c_stoc | INTEGER | N(1) | FK to STOC_UZ.cod - stock/usage type (0=folosinta, 1=magazie, 2=stoc) |
| cont | INTEGER | N(3) | FK to CONTURI.cod_cont - account code |
| sect | INTEGER | N(2) | FK to DISPUS.cod - location/section |
| c_adaug | INTEGER | N(1) | Direction: 1=IESIRE (exit/decrease), 2=INTRARE (entry/increase) |
| cod_den | INTEGER | N(8) | FK to MATERIAL.cod - material/item ID ("fisa" number) |
| unit_mas | INTEGER | N(2) | FK to UNIT_MAS.cod_u - unit of measure. Special: 6=COMPLET (set/kit) |
| stare | INTEGER | N(1) | FK to STARE.cod - item state |
| cantit | REAL | N(10,3) | Quantity. Range 0-9999999.999 |
| pret | REAL | N(13,2) | Unit price. Range 0-9999999999.99 |
| data_intr | TEXT | D | Date of entry into inventory |
| proc | REAL | N(10,3) | Depreciation/wear percentage at transaction time |
| seria | TEXT | C(8) | Serial number / set identifier (used when unit_mas=6 for COMPLET items) |
| pret_comp | REAL | N(13,2) | Complete set value (used when unit_mas=6). Total value of the set |
| crt | INTEGER | N(3) | Line number within operation (1-999) |

**Indexes (CDX tags):**

| Tag Name | Expression (inferred from SEEK usage) | Direction | Purpose |
|----------|--------------------------------------|-----------|---------|
| PUN_OP | STR(c_operat,10) + STR(crt,3) | ASC/DESC | Primary composite key (operation + line) |
| ORD_SORT | STR(cod_den,8) + STR(unit_mas,2) + STR(stare,1) + STR(pret,13,2) + DTOS(data_intr) + STR(proc,10,3) + STR(cont,3) + STR(cod_ges,2) + STR(c_stoc,1) + STR(sect,2) + STR(cod_fin,2) + STR(cod_prov,2) | ASC/DESC | Full dimension sort for SOLDURI recalculation |
| ORD_FISA | STR(cod_den,8) + STR(unit_mas,2) + STR(stare,1) + STR(c_operat,10) + STR(crt,3) | ASC | Used in FISA_MAT (analytical card) reports |
| COD_DEN | cod_den (or STR(cod_den,8)) | ASC/DESC | Material lookup |
| CONT | cont | ASC | Account-based queries (for BALANTA) |
| PMP | STR(cod_den,8) + STR(unit_mas,2) + STR(c_operat,10) + STR(crt,3) | ASC | Material+operation lookup (delete verification, serial check) |

**Relationships:**
- TRANZACT.c_operat -> OPERATII (via YEAR(c_data)*1000000+nr_oper)
- TRANZACT.cod_ges -> GESTIUNI.cod
- TRANZACT.sect -> DISPUS.cod
- TRANZACT.cont -> CONTURI.cod_cont
- TRANZACT.cod_den -> MATERIAL.cod
- TRANZACT.unit_mas -> UNIT_MAS.cod_u
- TRANZACT.stare -> STARE.cod
- TRANZACT.cod_fin -> FINANTAT.cod
- TRANZACT.cod_prov -> PROVENIE.cod
- TRANZACT.c_stoc -> STOC_UZ.cod

---

### 2. OPERATII.DBF (Operations / Document Headers)

**Role:** Stores the header info for each batch operation (document). Each operation can have many transaction lines in TRANZACT.

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| cod_doc | INTEGER | N(2) | FK to ACTE.cod - document type (1=INVENTAR, 13=specific, etc.) |
| nr_doc | TEXT | C(10) | Document number (external reference) |
| nr_oper | INTEGER | N(6) | Operation number within year (sequential) |
| c_data | TEXT | D | Date of the operation |
| c_comanda | INTEGER | N | Command/order number (used rarely) |
| c_an | INTEGER | N(4) | Year (sometimes used for filtering) |

**Indexes (CDX tags):**

| Tag Name | Expression (inferred) | Purpose |
|----------|--------------------------------------|---------|
| PUN_OPER | STR(YEAR(c_data),4) + STR(nr_oper,6) | Primary: year+operation number |
| ORD_ACT | STR(YEAR(c_data)*1000000+nr_oper,10) | c_operat equivalent for lookups from TRANZACT |

**Relationships:**
- OPERATII.cod_doc -> ACTE.cod
- OPERATII -> TRANZACT via (YEAR(c_data)*1000000+nr_oper = c_operat)

**Key logic:** The c_operat computed key = YEAR(c_data)*1000000+nr_oper. This is stored in TRANZACT.c_operat but computed from OPERATII fields.

---

### 3. SOLDURI.DBF (Balances - Computed Aggregate)

**Role:** Derived/materialized view. Stores current quantity balances per unique dimension combination. Rebuilt entirely from TRANZACT during recalculation (CC_SOLD.PRG:recalc). Balance = SUM(INTRARE quantities) - SUM(IESIRE quantities) for matching dimensions.

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| cod_prov | INTEGER | N(2) | FK to PROVENIE.cod |
| cod_fin | INTEGER | N(2) | FK to FINANTAT.cod |
| cod_ges | INTEGER | N(2) | FK to GESTIUNI.cod |
| c_stoc | INTEGER | N(1) | FK to STOC_UZ.cod |
| cont | INTEGER | N(3) | FK to CONTURI.cod_cont |
| sect | INTEGER | N(2) | FK to DISPUS.cod |
| cod_den | INTEGER | N(8) | FK to MATERIAL.cod |
| unit_mas | INTEGER | N(2) | FK to UNIT_MAS.cod_u |
| stare | INTEGER | N(1) | FK to STARE.cod |
| cantit | REAL | N(10,3) | Current balance quantity |
| pret | REAL | N(13,2) | Unit price (same as transaction price) |
| data_intr | TEXT | D | Entry date |
| proc | REAL | N(10,3) | Depreciation percentage |

**Note:** SOLDURI has the SAME dimension fields as TRANZACT (minus c_operat, crt, c_adaug, seria, pret_comp). It acts as a GROUP BY aggregation of TRANZACT.

**Indexes (CDX tags):**

| Tag Name | Expression (inferred) | Purpose |
|----------|--------------------------------------|---------|
| ORD_SOR | STR(cod_den,8) + STR(unit_mas,2) + STR(stare,1) + STR(pret,13,2) + DTOS(data_intr) + STR(proc,10,3) + STR(cont,3) + STR(cod_ges,2) + STR(c_stoc,1) + STR(sect,2) + STR(cod_fin,2) + STR(cod_prov,2) | Full dimension match (mirrors TRANZACT.ORD_SORT) |
| COD_DEN | cod_den (or STR(cod_den,8)) | Material lookup |
| PMP | STR(cod_den,8) | Simple material lookup for price defaults |

**Recalculation process (CC_SOLD.PRG:recalc):**
1. DELETE ALL from SOLDURI, PACK
2. Iterate TRANZACT sorted by ORD_SORT
3. For each unique dimension combination, sum quantities (c_adaug=2 adds, c_adaug=1 subtracts)
4. Write one SOLDURI row per unique combination

---

### 4. MATERIAL.DBF (Materials/Items Catalog)

**Role:** Master data for materials/inventory items. Each item type has one record with a unique "fisa" (card) number.

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| nume | TEXT | C(40) | Material/item name |
| cod | INTEGER | N(8) | Primary key - "fisa" (card) number. Auto-assigned |
| cod_m | TEXT | C(13) | External nomenclature code (classification code) |
| zile | INTEGER | N | Useful life in days (for c_stoc=0, "in folosinta"/in use) |
| zile1 | INTEGER | N | Useful life in days (for c_stoc=1, "in magazie"/in warehouse) |
| zile2 | INTEGER | N | Useful life in days (for c_stoc=2, "la stoc"/in stock) |

**Indexes (CDX tags):**

| Tag Name | Purpose |
|----------|---------|
| COD | Primary key lookup (by fisa number) |
| NUME | Name-based alphabetical sorting |
| COD_M | External nomenclature code lookup |

**Notes:**
- Duration fields (zile, zile1, zile2) store days, computed as: years*360 + months*30 + days
- Different durations apply depending on the stock/usage type (c_stoc value)
- Used for depreciation % calculation: proc = (days_elapsed * 100) / zile

---

### 5. CONTURI.DBF (Chart of Accounts)

**Role:** Chart of accounts. Supports hierarchical structure via "titlu" flag (titlu=.T. for parent/summary accounts, titlu=.F. for leaf/posting accounts).

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| cod_cont | INTEGER | N(3) | Internal numeric code (used as FK in TRANZACT/SOLDURI) |
| denumire | TEXT | C(50+) | Account name |
| titlu | INTEGER | L (Logical) | .T.=parent/title account, .F.=detail/posting account |
| cont | TEXT | C(20) | Account symbol/number (e.g. "302", "303.01") |
| val1 | REAL | N(15,2) | Computed: opening balance (used in BALANTA report) |
| val2 | REAL | N(15,2) | Computed: entries total (used in BALANTA report) |
| val3 | REAL | N(15,2) | Computed: exits total (used in BALANTA report) |

**Indexes (CDX tags):**

| Tag Name | Purpose |
|----------|---------|
| COD_CONT | By cod_cont numeric code (used as FK from TRANZACT.cont) |
| CONT | By cont symbol string (hierarchical sorting) |

**Hierarchical logic (BALANTA.PRG):**
- Leaf accounts (titlu=.F.) are posted directly
- Parent accounts (titlu=.T.) aggregate all children: SUM(val1/val2/val3) WHERE SUBSTR(child.cont, 1, LEN(parent.cont)) == parent.cont

---

### 6. ACTE.DBF (Document Types)

**Role:** Lookup table for document/act types.

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| cod | INTEGER | N(2) | Primary key. Special: 1=INVENTAR, 13=reserved, 40=ALTE ACTE |
| den | TEXT | C(50) | Full name of document type |
| scurt | TEXT | C(10) | Short/abbreviated name |

**Indexes (CDX tags):**

| Tag Name | Purpose |
|----------|---------|
| COD | By code (numeric lookup) |
| DEN | By name (for browsing/selection) |

**Business rules:**
- cod=1 (INVENTAR): forces c_adaug=2 (entry only)
- Document types with cod < 100 (max 99 types)
- Protected codes: 1 and 13 cannot be modified/deleted

---

### 7. GESTIUNI.DBF (Warehouses/Custodians)

**Role:** Warehouse/storage locations (gestiuni). Each gestiune represents a responsibility area.

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| cod | INTEGER | N(2) | Primary key. Range 1-99 |
| denumire | TEXT | C(20) | Warehouse name |

**Indexes (CDX tags):**

| Tag Name | Purpose |
|----------|---------|
| COD | By code (FK lookup from TRANZACT.cod_ges) |
| DENUMIRE | By name (for browsing) |

---

### 8. DISPUS.DBF (Locations/Sections)

**Role:** Disposal/placement locations within the institution (where items are physically placed).

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| cod | INTEGER | N(2) | Primary key |
| denumire | TEXT | C(20) | Location name |

**Indexes (CDX tags):**

| Tag Name | Purpose |
|----------|---------|
| COD | By code (FK lookup from TRANZACT.sect) |
| DENUMIRE | By name (for browsing) |

---

### 9. UNIT_MAS.DBF (Units of Measure)

**Role:** Units of measure lookup table.

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| nume_u | TEXT | C(15) | Unit name (e.g., "buc", "kg", "complet") |
| cod_u | INTEGER | N(2) | Primary key. Special: 6=COMPLET (set/kit) |

**Indexes (CDX tags):**

| Tag Name | Purpose |
|----------|---------|
| COD_U | By code (FK lookup from TRANZACT.unit_mas) |
| NUME_U | By name (for browsing) |

**Special behavior:** When cod_u=6 (COMPLET), the system uses seria (serial number) and pret_comp (set value) instead of normal cantit*pret calculations.

---

### 10. FINANTAT.DBF (Funding Sources)

**Role:** Funding/financing sources. Supports a simple hierarchy via "cap" flag.

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| cod | INTEGER | N(2) | Primary key |
| den | TEXT | C(50) | Funding source name |
| cap | INTEGER | L (Logical) | .T.=chapter/parent level, .F.=detail level |
| cod_cap1 | INTEGER | N(2) | Parent chapter code 1 (for hierarchy) |
| cod_cap2 | INTEGER | N(2) | Parent chapter code 2 (for hierarchy) |

**Indexes (CDX tags):**

| Tag Name | Purpose |
|----------|---------|
| COD | By code (FK lookup from TRANZACT.cod_fin) |

**Hierarchy:** When filtering for reports, a parent chapter matches if i(7)=cod OR i(7)=cod_cap1 OR i(7)=cod_cap2. Only records with cap=.F. are used for transaction entry.

---

### 11. PROVENIE.DBF (Provenance Sources)

**Role:** Sources of provenance/origin for items.

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| cod | INTEGER | N(2) | Primary key |
| den | TEXT | C(50) | Provenance source name |

**Indexes (CDX tags):**

| Tag Name | Purpose |
|----------|---------|
| COD | By code (FK lookup from TRANZACT.cod_prov) |

---

### 12. STARE.DBF (States)

**Role:** State/condition of items.

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| cod | INTEGER | N(1) | Primary key |
| den | TEXT | C(25) | State full name |
| den_sc | TEXT | C(10) | State short/abbreviated name |

**Indexes (CDX tags):**

| Tag Name | Purpose |
|----------|---------|
| COD | By code (FK lookup from TRANZACT.stare) |

---

### 13. STOC_UZ.DBF (Stock/Usage Types)

**Role:** Stock/usage classification. Determines which "zile" field on MATERIAL to use for depreciation calculation.

**Fields (from SQLite + code analysis):**

| Field | SQLite Type | FoxPro Type (inferred) | Purpose |
|-------|-----------|----------------------|---------|
| cod | INTEGER | N(1) | Primary key. 0=in folosinta (in use), 1=in magazie (warehouse), 2=la stoc (stock) |
| den | TEXT | C(14) | Description |

**Indexes (CDX tags):**

| Tag Name | Purpose |
|----------|---------|
| COD | By code (FK lookup from TRANZACT.c_stoc) |

---

### 14. CLASIFIC.DBF (Classifications)

**Role:** Classification catalog (HG 2139/2004 or similar). Used in a separate Delphi application (Unit5.pas) for fixed assets classification. NOT actively used in the main FoxPro application.

**Fields (from SQLite):**

| Field | SQLite Type | Purpose |
|-------|-----------|---------|
| c_clas | TEXT | Classification code |
| durata | INTEGER | Normal duration |
| cod | TEXT | Item code |
| denumire | TEXT | Description |
| cant | REAL | Quantity |
| val1 | REAL | Value 1 |
| val2 | REAL | Value 2 |
| val3 | REAL | Value 3 |

---

### 15. MAXIM.DBF (Sequences)

**Role:** Appears to store a single maximum value for sequence generation. Not actively referenced in FoxPro PRG code - may be used by the Delphi companion app.

**Fields (from SQLite):**

| Field | SQLite Type | Purpose |
|-------|-----------|---------|
| maxim | INTEGER | Maximum/sequence counter value |

---

### 16. FGEST.DBF (Gestiuni Extended)

**Role:** Extended warehouse information, likely used by the Delphi companion application for reporting (fixed assets management / FMF_INV).

**Fields (from SQLite):**

| Field | SQLite Type | Purpose |
|-------|-----------|---------|
| codgest | INTEGER | FK to GESTIUNI.cod |
| numegest | TEXT | Warehouse name |
| nrr | INTEGER | Number of rows/records |
| nrnt | INTEGER | Number field |
| tipg | INTEGER | Warehouse type |
| mcr1 | TEXT | Committee member 1 |
| mcr2 | TEXT | Committee member 2 |
| mcr3 | TEXT | Committee member 3 |
| mcr4 | TEXT | Committee member 4 |
| mct1 | TEXT | Committee technician 1 |
| mct2 | TEXT | Committee technician 2 |

---

### 17. FMF_INV.DBF (Fixed Assets Inventory Detail)

**Role:** Detailed fixed assets inventory records. Used by the Delphi companion app for fixed assets management (evidenta mijloacelor fixe).

**Fields (from SQLite):**

| Field | SQLite Type | Purpose |
|-------|-----------|---------|
| lu | INTEGER | Month |
| an | INTEGER | Year |
| codg | INTEGER | FK to GESTIUNI.cod |
| codgr | INTEGER | Group code |
| nrinv | INTEGER | Inventory number |
| cclas | TEXT | Classification code |
| nume1 | TEXT | Name part 1 |
| nume2 | TEXT | Name part 2 |
| dsn | INTEGER | Normal service duration (total months) |
| dsnl | INTEGER | Normal service duration remaining (months) |
| dfc | INTEGER | Commissioning date factor |
| dfr | INTEGER | Remaining date factor |
| datai | TEXT | Entry date |
| datai1 | TEXT | Alternative/secondary date |
| valinv | INTEGER | Inventory value |
| grutil | REAL | Utility grade |
| valcons | INTEGER | Consumed/depreciated value |
| valram | INTEGER | Remaining value |
| indact | REAL | Actualization index |
| valact | INTEGER | Actualized value |
| difreev | INTEGER | Reevaluation difference |
| ajust | INTEGER | Adjustment |
| difreevf | INTEGER | Final reevaluation difference |
| difreevc | INTEGER | Current reevaluation difference |
| difreevr | INTEGER | Remaining reevaluation difference |
| valamort | INTEGER | Amortization value |

---

### 18. Auxiliary/Reporting Tables

#### A4A.DBF, ANEXA4A.DBF, A6A.DBF, ANEXA5.DBF, XXX.DBF

These are **reporting/output tables** used by the Delphi companion application for generating standardized government reports (Anexa 4a, Anexa 5, Anexa 6a). They contain computed data for official forms.

#### FOXUSER.DBF

Standard FoxPro resource file storing user preferences, window positions, etc. Not application data.

---

## Key Computed Fields and Business Logic

### c_operat (Operation ID)
```
c_operat = YEAR(c_data) * 1000000 + nr_oper
```
Example: Year 2024, operation 15 -> c_operat = 2024000015

### Value Calculation
```
For regular items (unit_mas <> 6):
  value = ROUND(cantit * pret, 2)

For COMPLET items (unit_mas = 6):
  value = ROUND(pret_comp, 2)
  cantit is always 0 or 1
```

### Depreciation Percentage
```
proc_actual = proc + (days_elapsed * 100) / material.zile[X]
where X depends on c_stoc (0, 1, or 2)
```

### Balance (SOLDURI) recalculation
```
For each unique dimension combination:
  balance = SUM(cantit WHERE c_adaug=2) - SUM(cantit WHERE c_adaug=1)
```

---

## Index Summary (All CDX Tags)

### TRANZACT.CDX
| Tag | Key Expression |
|-----|---------------|
| PUN_OP | STR(c_operat,10)+STR(crt,3) |
| ORD_SORT | STR(cod_den,8)+STR(unit_mas,2)+STR(stare,1)+STR(pret,13,2)+DTOS(data_intr)+STR(proc,10,3)+STR(cont,3)+STR(cod_ges,2)+STR(c_stoc,1)+STR(sect,2)+STR(cod_fin,2)+STR(cod_prov,2) |
| ORD_FISA | STR(cod_den,8)+STR(unit_mas,2)+STR(stare,1)+STR(c_operat,10)+STR(crt,3) |
| COD_DEN | STR(cod_den,8) or cod_den |
| CONT | cont |
| PMP | STR(cod_den,8)+STR(unit_mas,2)+STR(c_operat,10)+STR(crt,3) |

### SOLDURI.CDX
| Tag | Key Expression |
|-----|---------------|
| ORD_SOR | STR(cod_den,8)+STR(unit_mas,2)+STR(stare,1)+STR(pret,13,2)+DTOS(data_intr)+STR(proc,10,3)+STR(cont,3)+STR(cod_ges,2)+STR(c_stoc,1)+STR(sect,2)+STR(cod_fin,2)+STR(cod_prov,2) |
| COD_DEN | STR(cod_den,8) or cod_den |
| PMP | STR(cod_den,8) |

### OPERATII.CDX
| Tag | Key Expression |
|-----|---------------|
| PUN_OPER | STR(YEAR(c_data),4)+STR(nr_oper,6) |
| ORD_ACT | STR(YEAR(c_data)*1000000+nr_oper,10) |

### MATERIAL.CDX
| Tag | Key Expression |
|-----|---------------|
| COD | cod |
| NUME | nume |
| COD_M | cod_m |

### CONTURI.CDX
| Tag | Key Expression |
|-----|---------------|
| COD_CONT | cod_cont |
| CONT | cont |

### Simple Lookup Tables (single COD index)
| Table | Tag | Key |
|-------|-----|-----|
| GESTIUNI | COD | cod |
| GESTIUNI | DENUMIRE | denumire |
| DISPUS | COD | cod |
| DISPUS | DENUMIRE | denumire |
| FINANTAT | COD | cod |
| PROVENIE | COD | cod |
| STARE | COD | cod |
| STOC_UZ | COD | cod |
| UNIT_MAS | COD_U | cod_u |
| UNIT_MAS | NUME_U | nume_u |
| ACTE | COD | cod |
| ACTE | DEN | den |

---

## Entity-Relationship Diagram (Text)

```
OPERATII (header)
  |
  | 1:N (via c_operat = YEAR*1M+nr_oper)
  |
TRANZACT (lines) ----> MATERIAL (items catalog)
  |                      |
  |-- cod_ges ----------> GESTIUNI (warehouses)
  |-- sect -------------> DISPUS (locations)
  |-- cont -------------> CONTURI (accounts, hierarchical)
  |-- cod_fin ----------> FINANTAT (funding, hierarchical)
  |-- cod_prov ---------> PROVENIE (provenance)
  |-- c_stoc -----------> STOC_UZ (stock/usage type)
  |-- unit_mas ---------> UNIT_MAS (units of measure)
  |-- stare ------------> STARE (item state)
  |
  | Aggregated into:
  |
SOLDURI (balances per dimension)
  |-- Same FKs as TRANZACT (minus c_operat, crt, c_adaug, seria, pret_comp)

OPERATII.cod_doc -----> ACTE (document types)
```

---

## Comparison with Modern Drizzle Schema

### What the Modern Schema Covers

| Legacy Table | Modern Equivalent | Notes |
|-------------|-------------------|-------|
| GESTIUNI | gestiuni | Mapped. Added: id (autoincrement), responsabil, activ, timestamps |
| DISPUS | locuriUilizare (locuri_folosinta) | Mapped. Added: gestiuneId (FK), activ. Legacy has no gestiune relationship |
| FINANTAT | surseFinantare | Partially mapped. Lost: cap, cod_cap1, cod_cap2 hierarchy |
| CONTURI | conturi | Partially mapped. Lost: titlu hierarchy flag, val1/val2/val3 computed fields. Added: tip, amortizabil, contAmortizare |
| ACTE | tipuriDocument | Mapped as tipuri_document. Lost: scurt abbreviation |
| MATERIAL | N/A (absorbed into mijloaceFixe) | NOT directly mapped. Material catalog merged into fixed asset records |
| TRANZACT | tranzactii | Significantly changed. Modern is asset-centric (per mijlocFixId), legacy is line-item-per-operation |
| SOLDURI | N/A (not needed?) | No direct equivalent. Modern calculates from amortizari table |
| OPERATII | N/A | No direct equivalent. Operations concept replaced by individual transactions |
| PROVENIE | N/A | **MISSING** - not mapped |
| STARE | N/A (enum in mijloaceFixe) | Converted to enum: activ, casare, declasare, transfer |
| STOC_UZ | N/A | **MISSING** - not mapped |
| UNIT_MAS | N/A | **MISSING** - not mapped |
| CLASIFIC | clasificari | Mapped. Used for HG 2139/2004 classification |

### What the Modern Schema Adds (Not in Legacy)

| Modern Table | Purpose |
|-------------|---------|
| mijloaceFixe | Central fixed asset entity (no direct legacy equivalent - legacy is transaction-based, not asset-based) |
| amortizari | Monthly depreciation records (legacy calculates on-the-fly) |
| users | Authentication (legacy had none) |

### Key Architectural Differences

1. **Data Model Paradigm:**
   - Legacy: Transaction-centered. Items exist implicitly through their transactions. No "asset" master record.
   - Modern: Asset-centered. Each fixed asset is a first-class entity with transactions linked to it.

2. **Balance Tracking:**
   - Legacy: SOLDURI is a materialized aggregate table, rebuilt from TRANZACT.
   - Modern: No equivalent. Calculated from amortizari records or computed on demand.

3. **Dimension Model:**
   - Legacy: Every transaction carries ALL dimension FKs (gestiune, location, account, funding, provenance, stock type, state, unit of measure). Extremely denormalized.
   - Modern: Dimensions stored on the asset record. Transactions record changes (transfers between gestiuni/locations).

4. **Missing Legacy Concepts:**
   - PROVENIE (provenance) - not in modern schema
   - STOC_UZ (stock/usage type with different depreciation rates)
   - UNIT_MAS (units of measure, especially COMPLET=6 concept)
   - FINANTAT hierarchy (cap, cod_cap1, cod_cap2)
   - CONTURI hierarchy (titlu flag for parent/child accounts)
   - seria/pret_comp (serial-tracked set/kit items)
   - proc (wear percentage tracking)
   - OPERATII (batch document header concept)

5. **ID Strategy:**
   - Legacy: Natural keys (cod fields, typically small integers)
   - Modern: Auto-increment surrogate keys with natural key as unique constraint

---

## Data Volume Estimates (from SQLite)

The SQLite tables contain the actual migrated data. Key table sizes can be checked with:
```sql
SELECT COUNT(*) FROM tranzact;
SELECT COUNT(*) FROM solduri;
SELECT COUNT(*) FROM material;
SELECT COUNT(*) FROM operatii;
```

---

## Summary

The legacy FoxPro system is a **transaction-based inventory management system** with:
- 18 tables (12 active in FoxPro, 6 auxiliary/Delphi)
- TRANZACT as the central fact table with 18 fields
- 10 dimension/lookup tables
- Complex composite index keys for performance
- Computed SOLDURI balances from transaction summation
- Hierarchical accounts (CONTURI) and funding sources (FINANTAT)
- Special handling for "COMPLET" (set/kit) items via unit_mas=6

The modern Drizzle schema represents a fundamental **paradigm shift** from transaction-based to asset-based tracking, with several legacy concepts not yet mapped.
