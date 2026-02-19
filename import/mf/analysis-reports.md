# Legacy FoxPro Reports & Listings - Comprehensive Analysis

## Overview

The legacy MiFix FoxPro system contains **14 report programs** (PRG files) that generate printed or on-screen reports for inventory management. All reports share a common output pattern: they can either print to a physical printer or generate a `.TXT` file for on-screen viewing. Reports use `.FRX` (FoxPro Report Format) files for layout definition.

### Common Architecture Pattern

All reports follow this structure:
1. **Parameter collection** - via SPR screen forms (`BAL_FISE.SPR`, `INTEROG.SPR`, `ECR_RAP8.SPR`)
2. **Table opening & indexing** - open required DBF tables with specific index orders
3. **Relation setup** - SET RELATION to link master-detail tables
4. **Data processing** - cursor creation, filtering, calculation
5. **Output** - REPORT FORM to printer or to TXT file via `SET PRINTER TO`

### Common Filter System (the `i[]` Array)

Many reports use a shared filter array `i[1..9]` populated by `INTEROG.SPR` (the interrogation/query screen):

| Index | Filter Parameter | Meaning | Value `-1` = "all" |
|-------|-----------------|---------|---------------------|
| `i(1)` | Account prefix string | Chart of accounts filter (partial match) | N/A |
| `i(2)` | `cod_den` | Material/item code | -1 = all items |
| `i(3)` | `cod_ges` | Warehouse/management unit code | -1 = all warehouses |
| `i(4)` | `c_stoc` | Stock/usage type (0=use, 1=warehouse, 2=stock) | -1 = all |
| `i(5)` | `sect` | Location/section code | -1 = all locations |
| `i(6)` | `cod_prov` | Provenance/origin code | -1 = all |
| `i(7)` | `cod_fin` | Financing source code (also checks `cod_cap1`, `cod_cap2`) | -1 = all |
| `i(8)` | `stare` | Item state (e.g., in use, scrapped) | -1 = all states |
| `i(9)` | Account prefix length | Number of leading chars to match on account | 0 = no account filter |

### Common Value Calculation Logic

Throughout reports, value is computed differently based on `unit_mas` (unit of measure):
- **If `unit_mas <> 6`**: `value = ROUND(cantit * pret, 2)` (quantity x unit price)
- **If `unit_mas = 6`**: `value = ROUND(pret_comp, 2)` (composite price, used for sets/lots)

Movement direction is determined by `c_adaug`:
- **`c_adaug = 2`**: Entry/addition (INTRARE/DEBIT)
- **`c_adaug = 1`**: Exit/removal (IESIRE/CREDIT)

---

## Report 1: ACTE_OP.PRG - Operated Acts Report

### Purpose
**"Actele Operate"** - Report of all document-based operations (movements) within a date range. Shows every transaction line grouped by the operation/document that triggered it.

### Input Parameters
- **Date range**: `M.datai` to `M.datas` (from `BAL_FISE.SPR` screen)
- **Print option**: Printer or screen

### Tables Used
| Alias | Table | Index | Purpose |
|-------|-------|-------|---------|
| TRANZACT | TRANZACT.DBF | PUN_OP | Main transactions (master) |
| OPERATII | OPERATII.DBF | ORD_ACT | Operations header, filtered by date range |
| MATERIAL | MATERIAL.DBF | COD | Material descriptions |
| ACTE | ACTE.DBF | COD | Document type names |
| GESTIUNI | GESTIUNI.DBF | COD | Warehouse names |
| CONTURI | CONTURI.DBF | COD_CONT | Account names |
| STOC_UZ | STOC_UZ.DBF | COD | Usage/stock type names |
| DISPUS | DISPUS.DBF | COD | Location names |
| UNIT_MAS | UNIT_MAS.DBF | COD_U | Unit of measure names |
| STARE | STARE.DBF | COD | Item state names |
| FINANTAT | FINANTAT.DBF | COD | Financing source names |
| PROVENIE | PROVENIE.DBF | COD | Provenance names |

### Relations
```
TRANZACT -> OPERATII (via c_operat)
TRANZACT -> MATERIAL (via cod_den)
OPERATII -> ACTE (via cod_doc)
TRANZACT -> GESTIUNI (via cod_ges)
TRANZACT -> CONTURI (via cont)
TRANZACT -> STOC_UZ (via c_stoc)
TRANZACT -> DISPUS (via sect)
TRANZACT -> UNIT_MAS (via unit_mas)
TRANZACT -> STARE (via stare)
TRANZACT -> FINANTAT (via cod_fin)
TRANZACT -> PROVENIE (via cod_prov)
```

### Filtering
- OPERATII filtered: `c_data >= M.datai AND c_data <= M.datas`
- TRANZACT filtered: `NOT EOF(2)` (only transactions with matching operations)

### Grouping & Totaling
- **Grouped by operation** (same `c_operat`)
- Running stock calculated per item (`stoc_cant`, `stoc_val`)
- Subtotals per operation: `op_int` (operation entries), `op_ies` (operation exits)
- Grand totals: `toti_val`/`tote_val` (total entry/exit values), `ti_val`/`te_val` (running totals)

### Output Columns (from TXT)
| Column | Meaning |
|--------|---------|
| Nr.crt | Row number |
| DENUMIREA MATERIALULUI | Material name |
| NUMAR FISA | File/sheet number |
| UNITATE MASURA | Unit of measure |
| STAREA | Item state |
| PRETUL UNITAR | Unit price |
| CANTITATIV: INTRARE | Quantity in |
| CANTITATIV: IESIRE | Quantity out |
| VALORIC: DEBIT | Value debit (entry) |
| VALORIC: CREDIT | Value credit (exit) |
| Cont | Account code |
| Uz/St | Usage/Stock type |
| Ge | Warehouse code |
| Locu | Location code |
| F | Financing source |
| P | Provenance |
| Data intr | Entry date |

### Report Format File
`ACTE_OP.FRX` -> output to `ACTE_OP.TXT`

### Calculated Fields
- `setare_st()`: For each transaction line, calculates entry/exit quantities and values, accumulates running stock and totals

---

## Report 2: BAL_MIJL.PRG - Analytical Balance of Objects

### Purpose
**"Balanta Analitica a Obiectelor de Inventar"** - Detailed per-item balance showing opening stock, entries, exits, and closing stock for a date period. This is the item-level (analytical) balance.

### Input Parameters
- **Date range**: `M.datai` to `M.datas` (from `BAL_FISE.SPR` then `INTEROG.SPR`)
- **Filter array `i[1..9]`**: Full filter system (account, material, warehouse, stock type, location, provenance, financing, state)
- **Print option**: Printer or screen

### Tables Used
| Alias | Table | Index | Purpose |
|-------|-------|-------|---------|
| TRANZACT | TRANZACT.DBF | (default) | Source for SQL query |
| TRANZACT_A | TRANZACT.DBF (AGAIN) | ORD_SORT | Sorted transaction access |
| UNIT_MAS | UNIT_MAS.DBF | COD_U | Unit of measure |
| MATERIAL | MATERIAL.DBF | COD | Material descriptions |
| CONTURI | CONTURI.DBF | COD_CONT | Account descriptions |
| OPERATII | OPERATII.DBF | ORD_ACT | Operations header |
| FINANTAT | FINANTAT.DBF | COD | Financing source |
| STARE | STARE.DBF | COD | Item state |

### Data Processing
1. **SQL CURSOR creation**: `SELECT DISTINCT cod_den, unit_mas, stare FROM TRANZACT WHERE c_operat <= M.ce_oper` with all filter conditions -> CURSOR QUERY
2. **Maximum operation number**: Calculated as `YEAR(datas)*1000000 + MAX(nr_oper)` for operations up to end date
3. For each unique (cod_den, unit_mas, stare) combination in QUERY:
   - **`prelucrez()`**: Scans TRANZACT_A seeking matching records
   - **`reev_sold()`**: Accumulates opening balance (transactions before `datai`)
   - **`reev_misc()`**: Accumulates movements (transactions between `datai` and `datas`)
4. **`salt()`**: Skips zero-balance items

### Grouping & Totaling
- **Per item**: `csold`/`vsold` (qty/value opening), `cintr`/`vintr` (qty/value entries), `ciesi`/`viesi` (qty/value exits)
- **Grand totals**: `tsold`, `tintr`, `tiesi`
- **Closing balance**: Derived as `sold + intrari - iesiri`

### Output Columns (from TXT)
| Column | Meaning |
|--------|---------|
| Crt. | Row number |
| FISA | File/sheet number |
| DENUMIREA MATERIALULUI | Material name |
| UNITATE DE MASURA | Unit of measure |
| STARE MATERIAL | Item state |
| STOC PREC. (cantitativ) | Opening quantity |
| INTRARI (cantitativ) | Entry quantity |
| IESIRI (cantitativ) | Exit quantity |
| STOC (cantitativ) | Closing quantity |
| SOLD INITIAL (valoric) | Opening value |
| DEBIT (valoric) | Debit value |
| CREDIT (valoric) | Credit value |
| SOLD (valoric) | Closing value |

### Report Format File
`BAL_MAT.FRX` -> output to `BAL_MAT.TXT`

---

## Report 3: BALANTA.PRG - Synthetic Balance

### Purpose
**"Balanta Sintetica a Obiectelor de Inventar"** - Summarized balance by accounting code. Aggregates all item-level data up to account level, including hierarchical rollup to parent accounts.

### Input Parameters
- **Date range**: `M.datai` to `M.datas` (from `BAL_FISE.SPR` then `INTEROG.SPR`)
- **Filter array `i[1..9]`**: Full filter system
- **Print option**: Printer or screen

### Tables Used
| Alias | Table | Index | Purpose |
|-------|-------|-------|---------|
| TRANZACT | TRANZACT.DBF | CONT | Transactions ordered by account |
| OPERATII | OPERATII.DBF | ORD_ACT | Operations header |
| CONTURI | CONTURI.DBF | COD_CONT | Accounts (primary) |
| FINANTAT | FINANTAT.DBF | COD | Financing source |
| CONTURI_A | CONTURI.DBF (AGAIN) | COD_CONT | Accounts (secondary, for filtering) |

### Data Processing
1. **Phase 1 - Detail calculation**: Iterates through TRANZACT ordered by `cont`:
   - Groups transactions by account code (`M.cont`)
   - For each group: accumulates `sold` (opening), `intr` (entries), `iesi` (exits)
   - Writes results to CONTURI table fields: `val1` (opening), `val2` (entries), `val3` (exits)
2. **Phase 2 - Hierarchical rollup**: For each title-level account (`titlu = .T.`):
   - Sums all child accounts matching the prefix
   - `CALC FOR SUBSTR(B.cont, 1, l) == M.cont SUM val1, val2, val3`
   - Updates parent account with summed values
3. **Filtering**: Only shows accounts with non-zero values (`val1<>0 OR val2<>0 OR val3<>0`)

### Grouping & Totaling
- **Per account**: Opening balance, Debit, Credit, Closing balance
- **Hierarchical**: Parent accounts sum all child accounts
- **Grand totals**: `tsold`, `tintr`, `tiesi`

### Output Columns (from TXT)
| Column | Meaning |
|--------|---------|
| SIMBOL CONT | Account symbol (e.g., 213.01.00.02.25.10) |
| SOLD PRECEDENT | Opening balance |
| DEBIT | Total debits in period |
| CREDIT | Total credits in period |
| SOLD | Closing balance |

### Report Format File
`BALANTA.FRX` -> output to `BALANTA.TXT`

---

## Report 4: CENTRAL.PRG - Centralized Report of Operated Acts

### Purpose
**"Centralizator cu Actele Operate"** - Summary listing of all operations/documents in a date range with total debit and credit values per operation. This is a high-level overview of all movements.

### Input Parameters
- **Date range**: `M.datai` to `M.datas` (from `BAL_FISE.SPR` then `INTEROG.SPR`)
- **Filter array `i[1..9]`**: Full filter system
- **Print option**: Printer or screen

### Tables Used
| Alias | Table | Index | Purpose |
|-------|-------|-------|---------|
| TRANZACT | TRANZACT.DBF | PUN_OP | Transactions |
| FINANTAT | FINANTAT.DBF | COD | Financing source |
| CONTURI | CONTURI.DBF | COD_CONT | Accounts |
| OPERATII | OPERATII.DBF | ORD_ACT | Operations, filtered by date |
| ACTE | ACTE.DBF | COD | Document types |

### Data Processing
- **`calculez()`**: For each operation in OPERATII:
  1. Computes composite key: `YEAR(c_data)*1000000 + nr_oper`
  2. Seeks matching transactions in TRANZACT
  3. Sums entries (`intr`) and exits (`iesi`) applying `verific()` filters
- **`salt()`**: Skips operations with zero values

### Grouping & Totaling
- **Per operation**: Total debit, total credit
- **Grand totals**: `tintr` (total entries), `tiesi` (total exits)

### Output Columns (from TXT)
| Column | Meaning |
|--------|---------|
| Crt. | Row number |
| Nr.op. | Operation number |
| Data | Operation date |
| Tip act | Document type name |
| Nr.act | Document number |
| Debit | Total debit value |
| Credit | Total credit value |

### Report Format File
`CENTRAL.FRX` -> output to `CENTRAL.TXT`

---

## Report 5: FISA_MAT.PRG - Material/Object Analytical Sheet

### Purpose
**"Fisa de Cont Analitic pentru Obiecte de Inventar"** - Detailed analytical ledger card for individual items. Shows every transaction affecting an item with running balance, including opening balance computation.

### Input Parameters
- **Date range**: `M.datai` to `M.datas` (from `BAL_FISE.SPR` then `INTEROG.SPR`)
- **Filter array `i[1..9]`**: Full filter system
- **Print option**: Printer or screen

### Tables Used
| Alias | Table | Index | Purpose |
|-------|-------|-------|---------|
| TRANZACT | TRANZACT.DBF | ord_fisa | Source transactions |
| MANEVRA | MANEVRA.DBF (temp copy) | composite index | Working copy for report |
| UNIT_MAS | UNIT_MAS.DBF | COD_U | Units of measure |
| MATERIAL | MATERIAL.DBF | COD | Material descriptions |
| CONTURI | CONTURI.DBF | COD_CONT | Account descriptions |
| OPERATII | OPERATII.DBF | ORD_ACT | Operations header |
| FINANTAT | FINANTAT.DBF | COD | Financing source |
| STARE | STARE.DBF | COD | Item state |
| ACTE | ACTE.DBF | COD | Document types |

### Data Processing (Most Complex Report)
1. **Creates MANEVRA.DBF** as temporary working copy (structure copied from TRANZACT)
2. **Index**: `STR(cod_den,8) + STR(unit_mas,2) + STR(stare,1) + STR(c_operat,10) + STR(crt,3)`
3. **Phase 1 - Opening balance**: Scans all transactions before `datai`:
   - Groups by (cod_den, unit_mas, stare)
   - `det_sold()` -> `reev_sold()` calculates net position
   - If non-zero, inserts a synthetic record into MANEVRA with `c_operat=0` (representing opening balance)
4. **Phase 2 - Period movements**: Copies all verified transactions between `datai` and `datas` into MANEVRA
5. **Report generation**: Uses MANEVRA as data source with `RAPORT1.FRX`
6. **Cleanup**: Deletes MANEVRA.DBF and MANEVRA.IDX

### Calculated Fields
- **`reev_misc()`**: Computes entry/exit values and running stock per transaction line
- **`calc_proc()`**: Calculates current usage percentage:
  - `proc = proc + ROUND((datas - data_intr) * 100 / material.zile, 3)`
  - Uses `zile` (days for usage type 0), `zile1` (type 1), or `zile2` (type 2)
  - Returns -1 if no useful life defined

### Grouping & Totaling
- **Per item (cod_den + unit_mas + stare)**: Opening balance, individual transactions, running stock
- **Grand totals**: `toti_cant`/`toti_val` (total entries), `tote_cant`/`tote_val` (total exits)

### Output Columns (from TXT)
| Column | Meaning |
|--------|---------|
| DATA (zz/ll/aaaa) | Transaction date |
| Operatie | Operation number |
| Nr. crt. | Row number within operation |
| Nume act | Document type name |
| Nr. act | Document number |
| Intrare (cantitativ) | Entry quantity |
| Iesire (cantitativ) | Exit quantity |
| Stoc material | Running stock quantity |
| Pretul | Unit price |
| Debit (valoric) | Debit value |
| Credit (valoric) | Credit value |
| Sold (valoric) | Running balance value |
| DATA INTRARII | Original entry date |
| PR.ACTUAL DE FOLOSI. | Current usage percentage |

### Report Format File
`RAPORT1.FRX` -> output to `FISA_MAT.TXT`

---

## Report 6: GEN_INVE.PRG - Generate Inventory List

### Purpose
**"Lista de Inventariere"** - Generates a formal inventory list at a specific date showing items with their book quantities and values, to be used during physical inventory counting.

### Input Parameters
- **Inventory date**: `M.datas` (single date, prompted directly: "LISTA DE INVENTARIERE LA DATA DE")
- **Filter array `i[1..9]`**: Full filter system via `INTEROG.SPR`
- **Print option**: Printer or screen

### Tables Used
| Alias | Table | Index | Purpose |
|-------|-------|-------|---------|
| TRANZACT | TRANZACT.DBF | (default) | Source for SQL query |
| TRANZACT_A | TRANZACT.DBF (AGAIN) | ORD_SORT | Sorted access |
| UNIT_MAS | UNIT_MAS.DBF | COD_U | Units of measure |
| MATERIAL | MATERIAL.DBF | COD | Material descriptions |
| CONTURI | CONTURI.DBF | COD_CONT | Account descriptions |
| OPERATII | OPERATII.DBF | ORD_ACT | Operations header |
| FINANTAT | FINANTAT.DBF | COD | Financing source |
| STARE | STARE.DBF | COD | Item state |

### Data Processing
- SQL CURSOR: `SELECT DISTINCT cod_den, unit_mas, stare, pret FROM TRANZACT` with filter conditions -> CURSOR QUERY
- **Key difference from BAL_MIJL**: Groups also by `pret` (unit price), so items at different prices appear as separate lines
- `prelucrez()` and `salt()` compute opening balance and movements up to inventory date
- `datai` is set equal to `datas` (snapshot at a single date)

### Grouping & Totaling
- **Per item + price**: Quantity and value at inventory date
- **Grand totals**: `tsold`, `tintr`, `tiesi`

### Output Columns (from TXT)
| Column | Meaning |
|--------|---------|
| Crt. | Row number |
| DENUMIREA MATERIALULUI | Material name |
| FISA | File/sheet number |
| UNITATE DE MASURA | Unit of measure |
| STARE MATERIAL | Item state |
| Stocuri Faptice (cantitativ) | Physical count (blank - to fill in) |
| Stocuri Scriptice (cantitativ) | Book quantity |
| Diferente Plus/Minus | Differences (blank - to fill in) |
| Pretul unitar | Unit price |
| Valoare | Book value |
| Diferente Plus/Minus (valoric) | Value differences (blank) |
| Valoarea de inventar | Inventory value (blank) |
| Deprecierea / Motivul | Depreciation and reason (blank) |

### Report Format File
`GEN_INVE.FRX` -> output to `GEN_INVE.TXT`

---

## Report 7: INV_GOL.PRG - Empty Inventory List

### Purpose
**"Lista de Inventariere (Goala)"** - Generates an empty inventory checklist with just item names and file numbers. Used as a blank form for physical inventory counting without pre-filling quantities.

### Input Parameters
- **Inventory date**: `M.datas` (single date)
- **Filter array `i[1..9]`**: Full filter system via `INTEROG.SPR`
- **Print option**: Printer or screen

### Tables Used
| Alias | Table | Index | Purpose |
|-------|-------|-------|---------|
| TRANZACT | TRANZACT.DBF | (default) | Source for SQL query |
| MATERIAL | MATERIAL.DBF | COD | Material descriptions |

### Data Processing
- Simple SQL CURSOR: `SELECT DISTINCT cod_den FROM TRANZACT` with filter conditions -> CURSOR QUERY
- No balance calculations - just lists items that exist in the system

### Output Columns (from TXT)
| Column | Meaning |
|--------|---------|
| Nr. crt. | Row number |
| Numar fisa | File/sheet number |
| DENUMIRE MATERIAL | Material name |
| INVENTAR FAPTIC | Physical count (blank - to fill in) |

### Report Format File
`INV_GOL.FRX` -> output to `INV_GOL.TXT`

---

## Report 8: LIS_ACTE.PRG - List Acts/Documents

### Purpose
**"Lista Actelor"** - Detailed report for a specific operation or document, showing all transaction lines with full context including account movements.

### Input Parameters
- **Year**: `M.anul` (from `ECR_RAP8.SPR` screen)
- **Operation number**: `M.operat` (specific operation number, or 0 to search by document)
- **Document number**: `M.actul` (if `operat` is 0, searches by document number)
- **Print option**: Printer or screen

### Tables Used
Same 12 tables as ACTE_OP.PRG (TRANZACT, OPERATII, MATERIAL, ACTE, GESTIUNI, CONTURI, STOC_UZ, DISPUS, UNIT_MAS, STARE, FINANTAT, PROVENIE)

### Data Processing
- **Search by operation**: `SEEK STR(M.anul, 4) + STR(M.operat, 6)` in OPERATII
- **Search by document**: `COUNT FOR ALLTRIM(nr_doc) == ALLTRIM(M.actul) AND YEAR(c_data) = M.anul`
- **`ce_conturi()`**: Determines the debit/credit account context for the operation by scanning all transactions in the same operation and building descriptive strings like "IESIRE DIN CONTUL 42=2131.02.24.04 ECHIPAMENTE TEHNICE..." and "INTRARE IN CONTUL..."
- Same `setare_st()` and `resetari()` functions as ACTE_OP

### Grouping & Totaling
- Same structure as ACTE_OP but filtered to a single operation/document

### Output Columns
Same as ACTE_OP plus the account context descriptions (entry/exit account details)

### Report Format File
`RAP_ACT.FRX` -> output to `RAP_ACT.TXT`

---

## Report 9: LIS_MATE.PRG - List Materials

### Purpose
**"Lista cu Denumirea si Duratele Obiectelor de Inventar"** - Catalog listing of all materials in a selected warehouse showing their useful life durations.

### Input Parameters
- **Warehouse selection**: `M.arma` - selected from a popup list of GESTIUNI (warehouses)
- **Sort option**: `optiune` variable controls sort order:
  - 1 = by name (`NUME` index)
  - 2 = by code (`COD` index)
  - 3 = by material code (`COD_M` index)
- **Print option**: Printer or screen

### Tables Used
| Alias | Table | Index | Purpose |
|-------|-------|-------|---------|
| SOLDURI | SOLDURI.DBF | COD_DEN | Current stock positions |
| MATERIAL | MATERIAL.DBF | varies by optiune | Material catalog |

### Data Processing
- Joins MATERIAL with SOLDURI filtered by selected warehouse
- Only shows materials that have stock records in the selected warehouse
- No date range - current state only

### Output Columns (from TXT)
| Column | Meaning |
|--------|---------|
| NUMAR CURENT | Row number |
| NUMARUL FISEI | File/sheet number |
| CODUL MATERIALULUI | Material code |
| DENUMIREA MATERIALULUI | Material name |
| DURATA - FOLOSINT | Useful life in use (years, months, days) |
| DURATA - MAGAZIE | Useful life in warehouse |
| DURATA - STOC | Useful life in stock |

### Report Format File
`RAPORT6.FRX` -> output to `LIS_MATE.TXT`

---

## Report 10: LOCURI.PRG - Locations Report

### Purpose
**"Situatia cu Locurile de Dispunere unde se afla Obiecte de Inventar"** - Lists all locations where inventory items are currently held, showing the combination of warehouse, usage type, and location.

### Input Parameters
- **None** (no date range, no filters)
- **Print option**: Printer or screen

### Tables Used
| Alias | Table | Index | Purpose |
|-------|-------|-------|---------|
| SOLDURI | SOLDURI.DBF | (default) | Current stock |
| GESTIUNI | GESTIUNI.DBF | COD | Warehouse names |
| STOC_UZ | STOC_UZ.DBF | COD | Usage/stock type names |
| DISPUS | DISPUS.DBF | COD | Location names |

### Data Processing
- SQL CURSOR: `SELECT DISTINCT cod_ges, c_stoc, sect FROM SOLDURI WHERE cantit > 0` ordered by (cod_ges, c_stoc, sect) -> CURSOR QUERY
- Simple lookup report - no calculations

### Output Columns (from TXT)
| Column | Meaning |
|--------|---------|
| Crt. | Row number |
| GESTIUNEA | Warehouse name |
| UZ/ST. | Usage/Stock type abbreviation |
| LOCUL DE DISPUNERE | Location name |
| OBSERVATII | Notes (blank) |

### Report Format File
`LOCURI.FRX` -> output to `LOCURI.TXT`

---

## Report 11: MAT_CONT.PRG - Material-Account Correspondence

### Purpose
**"Lista cu Corespondenta Material-Cont"** - Cross-reference listing showing which accounting code is assigned to each material item in a specific warehouse.

### Input Parameters
- **Warehouse selection**: `M.arma` - selected from popup list of GESTIUNI
- **Print option**: Printer or screen

### Tables Used
| Alias | Table | Index | Purpose |
|-------|-------|-------|---------|
| SOLDURI | SOLDURI.DBF | (default) | Current stock |
| CONTURI | CONTURI.DBF | COD_CONT | Account descriptions |
| MATERIAL | MATERIAL.DBF | COD | Material descriptions |

### Data Processing
- SQL CURSOR: `SELECT DISTINCT cod_den, cont FROM SOLDURI WHERE cod_ges = M.arma` ordered by (cod_den, cont) -> CURSOR QUERY
- Lookups into MATERIAL for name and CONTURI for account name

### Output Columns (from TXT)
| Column | Meaning |
|--------|---------|
| NUMARUL FISEI | File/sheet number |
| CONTUL AFERENT | Associated accounting code |
| DENUMIREA MATERIALULUI | Material name |
| DENUMIREA CONTULUI | Account name |

### Report Format File
`MAT_CONT.FRX` -> output to `MAT_CONT.TXT`

---

## Report 12: PLAN_CON.PRG - Chart of Accounts Report

### Purpose
**"Planul de Conturi pentru Gestiunea Obiectelor de Inventar"** - Lists the entire chart of accounts used for inventory management.

### Input Parameters
- **None** (no filters, no date range)
- **Print option**: Printer or screen

### Tables Used
| Alias | Table | Index | Purpose |
|-------|-------|-------|---------|
| CONTURI | CONTURI.DBF | CONT | Chart of accounts |

### Data Processing
- Simple direct listing from CONTURI table, ordered by account code
- No joins, no calculations

### Output Columns (from TXT)
| Column | Meaning |
|--------|---------|
| Cod | Internal code |
| SIMBOLUL CONTULUI | Account symbol (e.g., 602.04.02.05.25.00.02) |
| (asterisk column) | `*` marks leaf/detail accounts (vs. title/summary accounts) |
| DENUMIREA CONTULUI | Account description |

### Report Format File
`PLAN_CON.FRX` -> output to `CONTURI.TXT`

---

## Report 13: SIT_OBIE.PRG - Objects Situation Report

### Purpose
**"Situatia Obiectelor de Inventar"** - Comprehensive snapshot of all inventory items at the current date, showing quantities, values, and usage percentages. This is the primary inventory status report.

### Input Parameters
- **Filter array `i[1..9]`**: Full filter system via `INTEROG.SPR`
- **Print option**: Printer or screen
- **Date**: Uses current date (`DATE()`)

### Tables Used
| Alias | Table | Index | Purpose |
|-------|-------|-------|---------|
| SOLDURI | SOLDURI.DBF | (default) | Current stock positions (SQL source) |
| TRANZACT | TRANZACT.DBF | ORD_SORT | Transactions for composite items |
| GESTIUNI | GESTIUNI.DBF | COD | Warehouse names |
| CONTURI | CONTURI.DBF | COD_CONT | Account descriptions |
| STOC_UZ | STOC_UZ.DBF | COD | Usage type |
| DISPUS | DISPUS.DBF | COD | Location names |
| UNIT_MAS | UNIT_MAS.DBF | COD_U | Units of measure |
| STARE | STARE.DBF | COD | Item state |
| FINANTAT | FINANTAT.DBF | COD | Financing source |
| PROVENIE | PROVENIE.DBF | COD | Provenance |
| MATERIAL | MATERIAL.DBF | COD | Material descriptions |

### Data Processing
1. SQL CURSOR from SOLDURI: selects all columns including `cantit, pret, data_intr, proc` with full filter conditions, `cantit <> 0`
2. **For regular items** (`unit_mas <> 6`): `value = quantity * price`
3. **For composite items** (`unit_mas = 6`): Looks up original transactions in TRANZACT by matching all 12 fields to reconstruct the composite value from `pret_comp`
4. **`calc_proc()`**: Usage percentage calculation based on entry date and useful life
5. **`salt()`**: Skips zero items

### Grouping & Totaling
- **Per item row**: Quantity, value, usage percentage
- **Grand totals**: `tcsold` (total quantity), `tvsold` (total value)

### Output Columns (from TXT)
| Column | Meaning |
|--------|---------|
| Nr. crt | Row number |
| DENUMIREA MATERIALULUI | Material name |
| NUMAR FISA | File/sheet number |
| UNITATE MASURA | Unit of measure |
| STAREA | Item state |
| PRETUL UNITAR | Unit price |
| CANTITATE | Quantity |
| VALOARE | Value |
| Cont | Account code |
| Uz/St | Usage/Stock type |
| Ge | Warehouse |
| Locu | Location |
| F | Financing |
| P | Provenance |
| Data intr | Entry date |
| Procent actual de folosire | Current usage percentage |

### Report Format File
`SIT_OBIE.FRX` -> output to `SIT_OBIE.TXT`

---

## Report 14: TERMENE.PRG - Deadlines/Expired Duration Report

### Purpose
**"Situatia Obiectelor de Inventar cu Termene"** - Two sub-reports for identifying items with issues:
1. **Mode 1** (`M.situatia=1`): Items **without entry date** ("fara data intrarii")
2. **Mode 2** (`M.situatia=2`): Items with **exceeded useful life** ("termenul depasit") - where usage >= 100%

### Input Parameters
- **Report mode**: `M.situatia` (1 = no entry date, 2 = expired)
- **For mode 2**: `M.datas` - reference date for expiry calculation
- **Filter array `i[1..9]`**: Full filter system via `INTEROG.SPR`
- **Print option**: Printer or screen

### Tables Used
Same 11 tables as SIT_OBIE.PRG

### Data Processing
1. SQL CURSOR from SOLDURI:
   - **Mode 1**: `WHERE cantit <> 0 AND data_intr = {}` (empty date)
   - **Mode 2**: `WHERE cantit <> 0 AND data_intr <> {}` (has date, then checked for expiry)
2. Same `prelucrez()` and value calculation as SIT_OBIE
3. **`salt()` with expiry check** (Mode 2): After computing quantity/value, calls `calc_proc()`. If `proc >= 100.000`, the item is included; otherwise it is skipped (resets to zero and continues)
4. **`calc_proc()`**: Same formula: `proc + ROUND((datas - data_intr) * 100 / material.zile, 3)`

### Grouping & Totaling
- Same structure as SIT_OBIE
- Grand totals: `tcsold`, `tvsold`

### Output
- Uses the same `SIT_OBIE.FRX` report format
- Title changes based on mode:
  - Mode 1: "SITUATIA OBIECTELOR DE INVENTAR CARE NU AU DATA INTRARII"
  - Mode 2: "SITUATIA OBIECTELOR DE INVENTAR CU TERMENUL DEPASIT LA DATA DE dd/mm/yyyy"

### Report Format File
`SIT_OBIE.FRX` -> output to `SIT_OBIE.TXT`

---

## Summary: Report-to-Table Dependencies

| Report | TRANZACT | OPERATII | SOLDURI | MATERIAL | CONTURI | GESTIUNI | ACTE | STOC_UZ | DISPUS | UNIT_MAS | STARE | FINANTAT | PROVENIE |
|--------|:--------:|:--------:|:-------:|:--------:|:-------:|:--------:|:----:|:-------:|:------:|:--------:|:-----:|:--------:|:--------:|
| ACTE_OP | X | X | | X | X | X | X | X | X | X | X | X | X |
| BAL_MIJL | X | X | | X | X | | | | | X | X | X | |
| BALANTA | X | X | | | X | | | | | | | X | |
| CENTRAL | X | X | | | X | | X | | | | | X | |
| FISA_MAT | X | X | | X | X | | X | | | X | X | X | |
| GEN_INVE | X | X | | X | X | | | | | X | X | X | |
| INV_GOL | X | | | X | | | | | | | | | |
| LIS_ACTE | X | X | | X | X | X | X | X | X | X | X | X | X |
| LIS_MATE | | | X | X | | | | | | | | | |
| LOCURI | | | X | | | X | X | X | | | | | |
| MAT_CONT | | | X | X | X | | | | | | | | |
| PLAN_CON | | | | | X | | | | | | | | |
| SIT_OBIE | X | | X | X | X | X | | X | X | X | X | X | X |
| TERMENE | X | | X | X | X | X | | X | X | X | X | X | X |

## Summary: Report Input Parameters

| Report | Date Range | Single Date | Filter Array i[] | Warehouse Select | Operation/Document | Report Mode |
|--------|:----------:|:-----------:|:-----------------:|:----------------:|:-----------------:|:-----------:|
| ACTE_OP | X | | | | | |
| BAL_MIJL | X | | X | | | |
| BALANTA | X | | X | | | |
| CENTRAL | X | | X | | | |
| FISA_MAT | X | | X | | | |
| GEN_INVE | | X | X | | | |
| INV_GOL | | X | X | | | |
| LIS_ACTE | | | | | X (year + op/doc) | |
| LIS_MATE | | | | X | | |
| LOCURI | | | | | | |
| MAT_CONT | | | | X | | |
| PLAN_CON | | | | | | |
| SIT_OBIE | | | X | | | |
| TERMENE | | X (mode 2) | X | | | X (1 or 2) |

## Key Observations for Migration

1. **Report Format Files (.FRX)**: The actual column layout, positioning, and formatting is in FRX binary files. The PRG files handle data preparation, while FRX files handle presentation. In the modern system, this translates to separate API endpoints (data) and frontend templates (presentation).

2. **Complex Composite Items**: Items with `unit_mas = 6` (sets/lots) require special value calculation using `pret_comp` from individual transactions rather than `cantit * pret`. This must be preserved in any modern implementation.

3. **Usage Percentage Calculation**: The `calc_proc()` function computes wear/depreciation based on `(current_date - entry_date) * 100 / useful_life_days`. This uses three different useful life fields (`zile`, `zile1`, `zile2`) depending on the stock type (`c_stoc`).

4. **Hierarchical Account Rollup**: The BALANTA (synthetic balance) report performs a bottom-up aggregation where parent account totals are computed as the sum of all child accounts matching the prefix. This is a critical accounting feature.

5. **MANEVRA Temp Table Pattern**: FISA_MAT creates a temporary working table (MANEVRA.DBF) to denormalize data for reporting. This pattern would translate to a materialized view or temporary table/CTE in SQL.

6. **Opening Balance Computation**: Multiple reports (BAL_MIJL, GEN_INVE, FISA_MAT) compute opening balance by scanning ALL transactions before the start date. This is expensive and would benefit from periodic snapshots or materialized balance tables in the modern system.

7. **Shared `verific()` Filter Function**: Nearly all reports use the same multi-condition filter logic checking i[1..9]. This should become a single shared filter/query builder in the modern system.

8. **Print vs. Screen Pattern**: All reports can output to printer or TXT file. In the modern system, this maps to PDF generation or screen display with export capability.
