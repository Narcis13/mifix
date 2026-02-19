# FoxPro Inventory Management System - Comprehensive Business Logic Analysis

## System Overview

This is a **Romanian military inventory management system** (Version 3.1) developed for the **Ministry of National Defense, 4th Army "Transilvania"**. It tracks **inventory objects** (obiecte de inventar) - low-value fixed assets used in military units. The system manages the full lifecycle: receiving items into inventory, tracking their location/warehouse/condition, calculating depreciation percentages, and disposing of items.

**Authors**: Lt. Col. Lazea Eugenia, Slt.Ing. Velea Ovidiu
**Coordinator**: Col. Codrea Gheorghe

---

## 1. Database Schema (DBF Tables)

### Core Transaction Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **TRANZACT.DBF** | All transaction line items (the journal) | c_operat, crt, cod_den, cantit, pret, c_adaug, unit_mas, stare, cont, cod_ges, sect, c_stoc, cod_fin, cod_prov, data_intr, proc, seria, pret_comp, nr_doc |
| **OPERATII.DBF** | Operation headers (one per document) | nr_oper, c_data, cod_doc, nr_doc, c_operat, c_comanda, c_an |
| **SOLDURI.DBF** | Current balance/stock snapshot | cod_den, cantit, unit_mas, stare, pret, cont, cod_ges, sect, c_stoc, cod_fin, cod_prov, data_intr, proc |
| **MATERIAL.DBF** | Material/item master data | cod, nume, cod_m, zile, zile1, zile2 |

### Reference/Lookup Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **CONTURI.DBF** | Chart of accounts | cod_cont, cont (string), denumire, titlu (bool: is section header) |
| **GESTIUNI.DBF** | Warehouses/storage units | cod, denumire |
| **DISPUS.DBF** | Disposition locations | cod, denumire |
| **FINANTAT.DBF** | Funding sources | cod, den, cap (bool: is chapter header), cod_cap1, cod_cap2 |
| **PROVENIE.DBF** | Origin/provenance sources | cod, den |
| **STOC_UZ.DBF** | Stock/usage type (in-use, in-warehouse, in-stock) | cod, den |
| **STARE.DBF** | Condition/state | cod, den, den_sc (short name) |
| **UNIT_MAS.DBF** | Units of measure | cod_u, nume_u |
| **ACTE.DBF** | Document types | cod, den, scurt (abbreviated name) |

### Key Index Tags

| Table | Index Name | Expression | Notes |
|-------|-----------|------------|-------|
| TRANZACT | pun_op | STR(c_operat,10)+STR(crt,3) | Primary: operation + line number |
| TRANZACT | ord_sort | STR(cod_den,8)+STR(unit_mas,2)+STR(stare,1)+STR(pret,13,2)+DTOS(data_intr)+STR(proc,10,3)+STR(cont,3)+STR(cod_ges,2)+STR(c_stoc,1)+STR(sect,2)+STR(cod_fin,2)+STR(cod_prov,2) | Full composite sort for balance calculation |
| TRANZACT | pmp | STR(cod_den,8)+STR(unit_mas,2)+STR(c_operat,10)+STR(crt,3) | Material+operation lookup |
| TRANZACT | ord_fisa | STR(cod_den,8)+STR(unit_mas,2)+STR(stare,1) | Material sheet ordering |
| TRANZACT | cod_den | cod_den | Material code lookup |
| TRANZACT | cont | cont | Account lookup |
| SOLDURI | ord_sor | STR(cod_den,8)+STR(unit_mas,2)+STR(stare,1)+STR(pret,13,2)+DTOS(data_intr)+STR(proc,10,3)+STR(cont,3)+STR(cod_ges,2)+STR(c_stoc,1)+STR(sect,2)+STR(cod_fin,2)+STR(cod_prov,2) | Matches tranzact.ord_sort exactly |
| SOLDURI | pmp | STR(cod_den,8) | Quick material lookup |
| SOLDURI | cod_den | cod_den | Material code |
| OPERATII | pun_oper | STR(YEAR(c_data),4)+STR(nr_oper,6) | Year+operation number |
| OPERATII | ord_act | STR(YEAR(c_data)*1000000+nr_oper,10) | Composite operation ID |
| MATERIAL | cod | cod | Material sheet number |
| MATERIAL | nume | nume | Material name |
| CONTURI | cont | cont | Account string |
| CONTURI | cod_cont | cod_cont | Account code |

---

## 2. Core Concepts and Business Rules

### 2.1 Operation ID (c_operat)

The operation ID is a **composite numeric key**: `YEAR(date) * 1000000 + operation_number`. For example, operation #5 in year 2024 = `2024000005`. This allows sorting by year and sequence within year.

- Operation numbers are auto-incremented per year
- Maximum 999 line items per operation (crt ranges 1-999)
- Operations cannot skip numbers within a year

### 2.2 Transaction Types (c_adaug)

| Value | Meaning | English |
|-------|---------|---------|
| 1 | IESIRE (Output/Exit) | Item leaving inventory (disposal, transfer out) |
| 2 | INTRARE (Input/Entry) | Item entering inventory (receiving, initial stock) |

### 2.3 Unit of Measure Special Case: "Complet" (code 6)

When `unit_mas = 6`, the item is a "complet" (complete set/kit). Special rules apply:
- Quantity is always 0 or 1 (you have the complete or you don't)
- Value is stored in `pret_comp` field instead of `cantit * pret`
- Each complete has a `seria` (serial/series name) that must be unique
- When creating a new complete on output, seria = 'CPL.NOU' (new complete)
- Validation: cannot have multiple completes with the same series name

### 2.4 Depreciation/Usage Percentage (proc)

The system tracks usage percentage based on time and expected lifetime:
- Each material has 3 lifetime values in days:
  - `zile` = lifetime in use (c_stoc=0)
  - `zile1` = lifetime in warehouse/magazine (c_stoc=1)
  - `zile2` = lifetime in stock (c_stoc=2)
- Lifetimes are stored in total days but displayed as years/months/days (360 days/year, 30 days/month)
- Formula: `proc_at_operation = base_proc + ((operation_date - entry_date) * 100 / lifetime_days)`
- Rounded to 3 decimal places

### 2.5 Value Calculation

For regular items (unit_mas != 6):
- `value = ROUND(quantity * price, 2)`
- Price rounding: `value = ROUND(price * quantity, 2)`, then if `value != quantity * price`, re-derive `price = ROUND(value / quantity, 2)`

For completes (unit_mas = 6):
- `value = ROUND(pret_comp, 2)` (the complete's current value)

### 2.6 Document Types (cod_doc)

| Code | Meaning | Special Behavior |
|------|---------|-----------------|
| 1 | Lista de inventariere (Inventory list) | Initial inventory: only entries (c_adaug=2), no exits allowed |
| 13 | (Reserved) | Cannot be deleted in DEN_ACT |
| Other | Various document types | Normal entry/exit operations |

---

## 3. Core Programs - Detailed Analysis

### 3.1 OPER_ACT.PRG - Main Operations Entry (Entry + Exit for regular acts)

**Purpose**: Primary data entry form for recording inventory transactions where items both enter and exit. This handles document types OTHER than inventory lists (cod_doc != 1).

**Tables Used**: tranzact (work area 1), conturi (2), material (3), solduri (4), operatii (5), plus lookups: finantat (7), provenie, stoc_uz, gestiuni, dispus, unit_mas, stare, acte

**Initialization Flow**:
1. Opens all lookup tables and loads them into arrays (sir_cont, sir_fin, sir_pro, sir_uz, sir_ges, sir_loc, sir_um, sir_stare, sir_act)
2. Validates that warehouses and locations exist (shows AVERTIZ7 warning if not)
3. Initializes operation number for current year
4. Displays the main data entry form

**Key Business Logic**:

- **`data_max()`**: Finds the latest operation date and number - used to prevent entering operations out of sequence
- **`init_op()`**: Auto-generates next operation number for current year
- **`val_oper()`**: When user enters operation number + date, either loads existing operation or initializes new one. If existing, loads all line items and positions to the next available line. If new, validates sequential numbering.
- **`salvare()`** (Save):
  1. Validates all required fields via `ver_salvar()`
  2. If first line item, creates operation header in OPERATII table
  3. Seeks existing transaction line; if updating, first reverses the old balance
  4. Saves (GATHER MEMVAR) to TRANZACT
  5. Calls `rec_sold()` in LIBRARIE to recalculate balances in SOLDURI
  6. Advances to next line number
- **`sterge()`** (Delete):
  1. Reverses value totals
  2. Marks transaction record as deleted
  3. Calls `ren_crt()` to renumber remaining line items
  4. Recalculates balances via `rec_sold()`
  5. Packs deleted records
  6. If all lines deleted, also deletes the operation header
- **`iesire()`** (Exit): Packs all three main tables (TRANZACT, SOLDURI, OPERATII) to remove deleted records
- **`wen_adaug()`** (Entry/Exit toggle):
  - For EXIT (c_adaug=1): Inherits account, warehouse, stock type, and location from a previous exit line in the same operation
  - For ENTRY (c_adaug=2): When switching to entry and exits exist, pre-fills material details from exit lines (including recalculated depreciation)
- **`ies_mat()`** (Material exit - regular items):
  1. Filters SOLDURI for matching material in same location/warehouse/stock-type with positive quantity
  2. If multiple balance records exist, shows browse window for user to select
  3. Sets max quantity from selected balance, prevents exceeding available stock
- **`ies_cpl()`** (Complete set exit):
  1. Builds virtual balance from all TRANZACT records (adds entries, subtracts exits)
  2. Creates temporary MANEVRA.DBF table for display
  3. If creating a new complete entry, adds row with seria='CPL.NOU'
  4. Shows browse for selection if multiple options
- **`ver_salvar()`** (Validation): Requires: cod_den > 0, cantit > 0 (unless complete), pret > 0, cod_fin > 0, cod_prov > 0, stare > 0, sect > 0, cod_ges > 0. For completes: pret_comp > 0 and seria not empty.

### 3.2 LIST_INV.SPR - Inventory List Entry (Initial Inventory)

**Purpose**: Entry form specifically for the **initial inventory list** (Lista de inventariere, cod_doc=1). This is used to enter all items found during initial inventory count. Only ENTRY transactions (c_adaug=2) are allowed.

**Prerequisite Check**: Verifies no non-inventory-list operations exist. If they do, shows AVERTIZ3 warning and blocks entry (must use "Nota explicativa" instead).

**Differences from OPER_ACT.PRG**:
- Only act type with cod=1 (inventory list) is available in the dropdown
- No ENTRY/EXIT toggle - always ENTRY (c_adaug=2)
- Funding source and provenance are always editable (not conditional on direction)
- Data entry date is always editable
- Depreciation percentage is direct entry (not auto-calculated)
- Quantity for completes (unit_mas=6) is forced to 1.000
- Total shows only entries (no separate entry/exit totals)
- `val_crt()`: Checks if existing record can be edited via `ver_stg()` - disables save/delete if subsequent operations reference this material
- Value calculation: `ROUND(pret * cantit, 0)` (rounded to integer for inventory list) vs `ROUND(pret * cantit, 2)` in OPER_ACT

### 3.3 ST_OPER.PRG - Delete Operation

**Purpose**: Deletes an entire operation (all its transaction lines) with safety checks.

**Flow**:
1. Confirms deletion with user ("SIGUR DORITI STERGEREA UNEI OPERATIUNI?")
2. Launches STERG_OP.SPR dialog to get operation number and year
3. Computes c_operat from year * 1000000 + operation number
4. Opens TRANZACT (twice - in two work areas for cross-referencing), SOLDURI, OPERATII

**Safety Check (`verific()`)**: For each transaction line being deleted:
- Looks for later transactions with the **same material, same properties, but opposite direction** (c_adaug different)
- If found in a **different operation**, deletion is BLOCKED and AVERTIZ2 warning is shown ("Cannot delete because this material was used in a subsequent operation")
- This prevents orphaning exit records that depend on entries from this operation

**Deletion Process**:
1. Deletes operation header from OPERATII
2. Loops through all transaction lines: deletes each line, calls `rec_sold()` to reverse balance
3. PACKs TRANZACT, SOLDURI, OPERATII tables
4. Calls `st_nr_oper()` to clean up orphaned operation headers

### 3.4 CC_SOLD.PRG - Balance Recalculation and Reindex

**Purpose**: Complete system maintenance - reindexes all tables and recalculates all balances from scratch.

**Key Procedures**:

- **`pun_fis()`**: If TRANZACT.DBF does not exist, copies empty database structure from INDEXI\ directory
- **`st_acte()`**: Cleans up "ALTE ACTE" (Other acts, code 40) if not used in any operation
- **`regindex()`**: Copies fresh index files from INDEXI\ directory, then reindexes ALL 13 tables
- **`recalc()`**: **Full balance recalculation**:
  1. Deletes ALL records from SOLDURI
  2. Sorts TRANZACT by ord_sort (descending)
  3. Groups consecutive matching records (same material, unit, state, price, date, percent, account, warehouse, stock type, location, funding, provenance)
  4. Sums quantities: entries (+) and exits (-)
  5. Creates one SOLDURI record per unique combination with net quantity
- **`ren_crt()`**: Renumbers all line items (crt) within each operation sequentially starting from 1
- **`st_nr_oper()`**: Deletes orphaned OPERATII records that have no corresponding TRANZACT records

**Also performs**: Trims material names, converts unit names to lowercase.

### 3.5 VERIFIC.PRG - Data Integrity Verification

**Purpose**: Comprehensive data integrity check across all tables.

**Checks Performed** (each shows a browse window of violations):

1. **`mat_gest()`** - Materials without valid warehouse (TRANZACT.cod_ges not in GESTIUNI)
2. **`mat_loc()`** - Materials without valid location (TRANZACT.sect not in DISPUS)
3. **`mat_stoc()`** - Materials without valid stock/usage type (TRANZACT.c_stoc not in STOC_UZ)
4. **`mat_cont()`** - Materials without valid account (TRANZACT.cont not in CONTURI)
5. **`mat_fin()`** - Materials without valid funding source (TRANZACT.cod_fin not in FINANTAT)
6. **`mat_pro()`** - Materials without valid provenance (TRANZACT.cod_prov not in PROVENIE)
7. **`mat_um()`** - Materials without valid unit of measure (TRANZACT.unit_mas not in UNIT_MAS)
8. **`mat_stare()`** - Materials without valid state (TRANZACT.stare not in STARE)
9. **`mat_docume()`** - Operations without valid document type (OPERATII.cod_doc not in ACTE)
10. **`ver_cpl()`** - Completes with invalid quantity (not 0 or 1) or missing series name
11. **`ver_sold()`** - Negative balance quantities in SOLDURI
12. **`ver_data()`** - Transactions without entry date (data_intr is empty)
13. **`mat_oper()`** - Orphaned transactions (TRANZACT records without matching OPERATII)
14. **Duplicate detection** - Duplicate (c_operat, crt) combinations in TRANZACT; duplicate (nr_oper, year) in OPERATII
15. **Orphan cleanup** - Deletes OPERATII records without TRANZACT and auto-fixes duplicate OPERATII

### 3.6 MISCARI.PRG - Material Movements/Transfers Report (Fisa Analitica doar pentru miscari)

**Purpose**: Generates the analytical material sheet report showing movements (entries/exits) within a date range, with opening and closing balances.

**Flow**:
1. Calls BAL_FISE.SPR for date range input (start date, end date)
2. Calls INTEROG.SPR for filter criteria (account, material, warehouse, etc.)
3. Creates temporary MANEVRA.DBF with TRANZACT structure
4. **Phase 1 - Opening Balance**: Scans all transactions up to start date, calculates net stock per material/unit/state combination. Stores as pseudo-transaction with c_operat=0.
5. **Phase 2 - Filter Verification**: Removes opening balance records that don't have matching transactions in the reporting period.
6. **Phase 3 - Period Transactions**: Copies matching transactions from the period into MANEVRA.
7. Generates report using RAPORT1.FRX format, either to printer or to FISA_MAT.TXT file viewer.

**`verific()` filter function**: Applies all 8 filter criteria from INTEROG dialog. Special handling for funding source (checks hierarchical chapters: cod, cod_cap1, cod_cap2). Account matching uses prefix comparison (e.g., "303" matches "3031", "3032", etc.).

**`calc_proc()`**: Calculates depreciation percentage at report end-date (M.datas) based on stock type.

**Report Calculated Fields**:
- `resetari()` - Zeros all accumulators
- `reev_sold()` - Recalculates running balance from transactions
- `reev_misc()` - Calculates per-movement values (entry qty/value, exit qty/value, running stock)
- `det_sold()` - Determines opening balance for a material/unit/state group

### 3.7 LIBRARIE.PRG - Utility Library

**Purpose**: Shared functions used across multiple programs.

**Key Functions**:

- **`ver_stg()`** - Checks if a transaction line can be edited/deleted. Looks for later transactions of the same material with opposite direction (exit following an entry). Returns .F. if found (shows AVERTIZ5 warning). Exit transactions (c_adaug=1) can always be edited.

- **`ver_ins()`** - Validates insertion: similar to ver_stg but checks before inserting.

- **`ren_crt()`** - Renumbers line items (crt) within an operation after a deletion. Walks through all transactions for the operation and assigns sequential numbers starting from 1.

- **`rec_sold()`** - **Critical balance recalculation function**:
  1. Builds composite key from all 12 fields (same as ord_sort index)
  2. Seeks matching group in TRANZACT
  3. Sums all matching transactions: entries (+), exits (-)
  4. Seeks or creates matching record in SOLDURI
  5. Updates SOLDURI.cantit with net quantity
  6. If no matching TRANZACT found, seeks and deletes the SOLDURI record

- **`get_materi()`** - Material picker:
  1. For exits (c_adaug=1): Filters SOLDURI for items with positive quantity in the selected warehouse/stock/account/location
  2. For entries (c_adaug=2): Filters by warehouse only
  3. Shows browse window of matching materials from MATERIAL table
  4. Returns selected material code

- **`set_print()`** - Printer setup: prompts for lines per page (default 66) and starting page number.

### 3.8 DENOM.PRG - Price Denomination

**Purpose**: One-time utility to convert prices after currency denomination (Romanian lei redenomination: divides all prices by 10,000).

```
REPLACE ALL pret WITH ROUND(pret/10000, 2)
REPLACE ALL pret WITH 0.01 FOR pret=0
```

### 3.9 TITLU.PRG - Title Screen

**Purpose**: Displays the application title screen with ASCII art logo, version number (3.1), and credits for the Ministry of National Defense / 4th Army "Transilvania".

### 3.10 INC_DISK.PRG / SLV_DISK.PRG - Load/Save from Floppy Disk

**Purpose**: Backup/restore to floppy disk using ARJ compression.

- **INC_DISK**: Extracts `A:\OBIECTE.000` to working directory, then reindexes all tables
- **SLV_DISK**: Compresses all DBF files to `A:\OBIECTE.000` (password: "DUPA_CODIFICARE")

---

## 4. Form/Dialog Files - Detailed Analysis

### 4.1 INTEROG.SPR - Report Filter/Query Dialog

**Purpose**: Universal filter dialog used by all reports. Allows filtering by any combination of:
- Account (all or specific, with prefix matching)
- Material sheet number (all or specific)
- Warehouse (all or specific)
- Stock/Usage type (all or specific)
- Location (all or specific)
- Provenance (all or specific)
- Funding source (all or specific, with hierarchical chapter matching)
- State/condition (all or specific)

**Output**: Populates arrays `i[9]` and `den[8]` with selected filter values. Value of -1 means "all" for that dimension. `i[9]` stores the length of the account prefix for partial matching.

### 4.2 MOD_CONT.SPR - Modify Account

**Purpose**: Mass-transfer materials from one account to another.

**Business Rules**:
- Enter sheet number (-1 for all sheets at the old account)
- Select old account (populated from distinct accounts in SOLDURI)
- Select new account (from full account list)
- Updates both TRANZACT.cont and SOLDURI.cont for all matching records
- Triggers full balance recalculation (DO cc_sold) after saving

### 4.3 MOD_GEST.SPR - Modify Warehouse

**Purpose**: Mass-transfer materials from one warehouse to another.

**Business Rules**: Same pattern as MOD_CONT - select sheet number (-1 for all), old warehouse, new warehouse. Updates cod_ges in both TRANZACT and SOLDURI. Triggers recalculation.

### 4.4 MOD_DISP.SPR - Modify Location

**Purpose**: Mass-transfer materials from one location to another.

**Business Rules**: Same pattern - select sheet number (-1 for all), old location, new location. Updates sect in both TRANZACT and SOLDURI. Triggers recalculation.

### 4.5 DEN_ACT.SPR - Add/Modify Act Type

**Purpose**: CRUD for document/act types.

**Business Rules**:
- Add: Requires name and abbreviated name. Auto-generates code as MAX(cod)+1. Maximum code is 99.
- Modify/Delete: Browse window showing all types except cod=1 (inventory list) and cod=13 (reserved). Deletion is protected: if an operation uses the act type, the deletion is rolled back (RECALL).

### 4.6 DEN_GEST.SPR - Add/Modify Warehouse

**Purpose**: CRUD for warehouse entries.

**Business Rules**:
- Duplicate name check (case-insensitive)
- Code uniqueness validation (range 1-99)
- Name stored in uppercase
- Browse for modification (read-only code, editable name)
- No deletion of warehouses in use (handled at menu level)

### 4.7 DEN_LOC.SPR - Add/Modify Location

**Purpose**: CRUD for disposition locations. Same pattern as DEN_GEST.

### 4.8 DEN_UM.SPR - Add/Modify Unit of Measure

**Purpose**: CRUD for units of measure.

**Business Rules**: Same CRUD pattern. Browse excludes cod_u=6 ("complet") from modification.

### 4.9 STERG_OP.SPR - Delete Operation Dialog

**Purpose**: Input dialog for ST_OPER.PRG. Collects operation number and year.

**Validation**: Operation number > 0, year >= 1997.

### 4.10 NUME_ACT.SPR - Modify Act Name/Number

**Purpose**: Modifies operation header details (document type, number, date, command number).

**Flow**:
1. Enter operation number and year
2. If found, loads current data and enables editing
3. Can change: date, act type, document number, command number, command year
4. Validates year consistency (date year must match entered year)
5. Saves directly to OPERATII (GATHER MEMVAR)

### 4.11 ST_MATER.SPR - Delete Material

**Purpose**: Deletes materials that have no transactions.

**Business Rules**:
- Enter sheet number
- Validates material exists in MATERIAL table
- Checks TRANZACT for any transactions with this cod_den
- If transactions exist, deletion is BLOCKED
- If no transactions, deletes from MATERIAL and PACKs

### 4.12 MD_MATER.SPR - Modify Material Sheet/Name/Duration

**Purpose**: Comprehensive material modification - rename, renumber, change lifetime durations.

**Business Rules**:
- Enter old sheet number to load current data
- Displays: name, code, material code, and three lifetime durations (in-use, in-warehouse, in-stock)
- Lifetime displayed as years/months/days (converted from total days: 360 days/year, 30 days/month)
- Can change: sheet number, name, material code, all three lifetimes
- If sheet number changes to an EXISTING material:
  - Deletes the target material record
  - Updates the source material record with new values
  - Updates all TRANZACT and SOLDURI records (cod_den) to point to new sheet number
- If sheet number stays the same: simple update of name/code/lifetimes
- Triggers balance recalculation if sheet number changed

### 4.13 ECR_RAP8.SPR - Report Print Dialog

**Purpose**: Input dialog for listing/printing an act (document).

**Inputs**: Year, operation number OR act number. Used by `lis_acte` program.

### 4.14 BAL_FISE.SPR - Balance Sheet Date Range Dialog

**Purpose**: Input dialog for date range selection.

**Inputs**: Start date (default: January 1 of current year), End date (default: today). Validates end date > start date.

### 4.15 FER1.SPR - New Material Entry Dialog

**Purpose**: Popup window for adding a new material when the entered sheet number doesn't exist.

**Fields**: Sheet number (read-only), name (with exact-match duplicate check), material code, three lifetime durations (in-use/in-warehouse/in-stock).

**Behavior**: If name matches an existing material, auto-fills all fields and disables editing (reuses existing material). Otherwise creates new MATERIAL record.

### 4.16 FER2.SPR - Duration Entry Dialog

**Purpose**: Prompts for material lifetime durations when missing for the current stock type.

**Logic**: Only shows if the material's lifetime for the selected stock type (c_stoc) is 0 (not yet set). Pre-fills existing values. Saves directly to MATERIAL record.

### 4.17 Warning Dialogs

| Dialog | Code | Message |
|--------|------|---------|
| **AVERTIZ1.SPR** | Max lines | "You have entered 999 records for current operation. Exit and start new operation." |
| **AVERTIZ2.SPR** | Delete blocked | "Cannot delete this operation because a material was used in a subsequent operation." Shows the blocking operation/line details. |
| **AVERTIZ3.SPR** | Inventory locked | "You have already entered acts. Cannot modify inventory list. Use 'Nota explicativa' instead." |
| **AVERTIZ5.SPR** | Edit blocked | "Cannot modify this material because changes were made in a later operation with higher date/number." Shows the blocking operation details. |
| **AVERTIZ7.SPR** | No warehouses | "No warehouses or locations defined. Enter warehouse or location first." |

---

## 5. Main Menu Structure (PROGRAM.MPR)

### Menu: OPERATIUNI (Operations)
| Item | Action |
|------|--------|
| Lista de inventariere | DO LIST_INV.SPR |
| Operare act | DO oper_act |
| Stergere operatiune | DO ST_OPER.PRG |
| Incarcare plan de conturi | COPY INDEXI\CONTURI.* then REINDEX |
| Modificare denumire, numar act | DO NUME_ACT.SPR |
| Modificare nr. fisa, denumire, durata | DO MD_MATER.SPR |
| Mutare materiale > In alt cont | DO MOD_CONT.SPR |
| Mutare materiale > In alta gestiune | DO MOD_GEST.SPR |
| Mutare materiale > In alt loc de dispunere | DO MOD_DISP.SPR |
| Stergere denumire de material | DO ST_MATER.SPR |
| Introducere nou tip de act | DO DEN_ACT.SPR |
| Introducere gestiune noua | DO DEN_GEST.SPR |
| Introducere loc de dispunere | DO DEN_LOC.SPR |
| Introducere unitate de masura | DO DEN_UM.SPR |
| Vizualizare surse de finantare | BROWSE FINANTAT |
| Vizualizare surse de provenienta | BROWSE PROVENIE |
| Vizualizare gestiuni | BROWSE GESTIUNI |
| Vizualizare locuri de dispunere | BROWSE DISPUS |
| Vizualizare unitati de masura | BROWSE UNIT_MAS |

### Menu: LISTARE SITUATII (Reports/Listings)
| Item | Action |
|------|--------|
| Act operat | DO lis_acte |
| Acte operate intr-o perioada | DO acte_op |
| Centralizatorul actelor operate | DO central |
| Fisa analitica a obiectului | DO fisa_mat |
| Fisa analitica doar pentru miscari | DO miscari |
| Situatia obiectelor de inventar | DO sit_obie |
| Situatia obiectelor fara data intrarii | DO termene (situatia=1) |
| Situatia obiectelor cu durata depasita | DO termene (situatia=2) |
| Generare lista de inventariere | DO gen_inve |
| Lista de inventariere goala | DO inv_gol |
| Balanta analitica a obiectelor | DO bal_mijl |
| Balanta sintetica a obiectelor | DO balanta |
| Locurile unde se afla obiecte | DO locuri |
| Denumirile obiectelor > Dupa denumire | DO lis_mate (optiune=1) |
| Denumirile obiectelor > Dupa nr. fisa | DO lis_mate (optiune=2) |
| Denumirile obiectelor > Dupa cod nomenclator | DO lis_mate (optiune=3) |
| Corespondenta material-cont | DO mat_cont |
| Planul de conturi | DO plan_con |

### Menu: OPERATIUNI PE BAZA DE DATE (Database Operations)
| Item | Action |
|------|--------|
| Reindexare si recalculare solduri | DO cc_sold |
| Verificare integritate date | DO verific |
| Renumerotare numere curente | cc_sold.ren_crt() |
| Stergere gestiune fara corespondent | Delete GESTIUNI not in TRANZACT |
| Stergere loc de dispunere fara corespondent | Delete DISPUS not in TRANZACT |
| Stergere conturi fara corespondent | Delete CONTURI not in TRANZACT (preserves hierarchy) |
| Stergere material fara corespondent | Delete MATERIAL not in TRANZACT |

### Menu: IESIRE PROGRAM (Exit)
| Item | Action |
|------|--------|
| Iesire in sistemul de operare | QUIT |
| Iesire in mediul FoxPro | CANCEL |
| Salvare date pe discheta | DO SLV_DISK |
| Incarcare date de pe discheta | DO INC_DISK |

**Startup behavior**: On first run (SOLDURI is empty), automatically runs CC_SOLD (full recalculation) and VERIFIC (integrity check).

---

## 6. Transaction Patterns

### Pattern 1: Save Transaction Line (OPER_ACT/LIST_INV)

```
1. incarc_var()          -- Copy UI selections to memory variables
2. ver_salvar()          -- Validate all required fields
3. IF first_line:
     OPERATII: APPEND BLANK + GATHER  -- Create operation header
4. TRANZACT: SEEK existing line
5. IF updating:
     Reverse old value from totals
     SOLDURI: Find and subtract old quantity (delete if zero)
6. TRANZACT: GATHER MEMVAR           -- Save/update transaction
7. Update value totals
8. rec_sold()                         -- Recalculate SOLDURI for this material
9. Advance to next line number
```

### Pattern 2: Delete Transaction Line (OPER_ACT/LIST_INV)

```
1. TRANZACT: SEEK by c_operat + crt
2. Reverse value from totals
3. TRANZACT: DELETE (mark as deleted)
4. ren_crt()             -- Renumber remaining lines
5. rec_sold()            -- Recalculate SOLDURI balance
6. TRANZACT: PACK       -- Physical delete
7. SOLDURI: PACK
8. IF no lines remain:
     OPERATII: DELETE operation header
```

### Pattern 3: Delete Entire Operation (ST_OPER)

```
1. Get operation number + year from user
2. verific()             -- Check no downstream dependencies
3. OPERATII: DELETE header
4. FOR EACH line in TRANZACT:
     SCATTER to variables
     DELETE line
     rec_sold()          -- Reverse balance for each line
5. PACK all three tables
6. st_nr_oper()          -- Clean orphaned operation headers
```

### Pattern 4: Mass Transfer (MOD_CONT/MOD_GEST/MOD_DISP)

```
1. Select sheet number (-1 for all)
2. Select old value (from distinct values in SOLDURI)
3. Select new value (from full reference list)
4. TRANZACT: REPLACE ALL matching records
5. SOLDURI: REPLACE ALL matching records
6. DO cc_sold            -- Full balance recalculation
```

### Pattern 5: Balance Recalculation (rec_sold in LIBRARIE)

```
1. Build 12-field composite key from current transaction
2. TRANZACT: SEEK by ord_sort index
3. Walk through all matching records:
   - c_adaug=2 (entry): add quantity
   - c_adaug=1 (exit): subtract quantity
4. SOLDURI: SEEK by ord_sor index
5. IF not found: APPEND BLANK
6. GATHER MEMVAR + REPLACE cantit WITH net_quantity
```

---

## 7. Key Business Rules Summary

1. **Sequential Operations**: Operations must be numbered sequentially within each year. No gaps allowed.
2. **Temporal Integrity**: Cannot modify/delete a transaction if a later operation references the same material with opposite direction.
3. **Inventory List Lock**: Once non-inventory operations exist, the inventory list form is locked. Changes must go through regular operations.
4. **Balance Consistency**: SOLDURI is always kept in sync with TRANZACT through `rec_sold()`. Full recalculation (`recalc()`) can rebuild from scratch.
5. **Stock Type Affects Depreciation**: Three separate lifetimes (in-use, in-warehouse, in-stock) determine depreciation rate.
6. **Complete Sets**: Special unit of measure (code 6) has binary quantity (0 or 1), tracked by serial number, valued by pret_comp instead of quantity*price.
7. **Account Hierarchy**: Accounts have parent/child relationships through prefix matching. Title accounts (titlu=.T.) are section headers, not usable for transactions.
8. **Funding Source Hierarchy**: Funding sources have chapter grouping (cap flag, cod_cap1, cod_cap2 for parent codes).
9. **999-Line Limit**: Each operation can have at most 999 line items. User is warned at limit and must start a new operation.
10. **Price Rounding**: Values are always ROUND(qty * price, 2). If rounding creates a discrepancy, price is back-calculated from rounded value.

---

## 8. Programs Referenced in Menu but Not in Analyzed Files

These programs are called from PROGRAM.MPR but were not provided for analysis:

| Program | Purpose (inferred from menu) |
|---------|------------------------------|
| lis_acte | List/print a single operated act |
| acte_op | List acts operated in a period |
| central | Centralizer of operated acts |
| fisa_mat | Analytical material sheet (uses MISCARI.PRG-like flow) |
| sit_obie | Inventory objects situation report |
| termene | Objects without entry date (situatia=1) / Objects with exceeded duration (situatia=2) |
| gen_inve | Generate inventory list |
| inv_gol | Empty inventory list template |
| bal_mijl | Analytical balance of objects |
| balanta | Synthetic balance of objects |
| locuri | Locations where objects exist |
| lis_mate | Material names list (sorted by name/sheet/code) |
| mat_cont | Material-account correspondence |
| plan_con | Chart of accounts listing |
