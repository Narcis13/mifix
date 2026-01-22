# Pitfalls Research: Fixed Assets Management System

**Domain:** Fixed asset management for Romanian hospital
**Researched:** 2026-01-22
**Confidence:** MEDIUM (verified with multiple authoritative sources)

---

## Critical Pitfalls

These mistakes cause rewrites or major issues. Address early or face significant rework.

### 1. Floating-Point Arithmetic for Financial Calculations

**Problem:** JavaScript uses IEEE 754 floating-point numbers. `0.1 + 0.2 = 0.30000000000000004`. Monthly depreciation calculations will accumulate errors, causing balance sheet discrepancies over years.

**Warning signs:**
- Calculated depreciation totals do not match expected values
- Asset book value becomes negative or shows fractions of bani
- Accumulated depreciation exceeds original cost
- Rounding differences between reports

**Prevention:**
- Use `decimal.js` or `dinero.js` library for ALL financial math
- Store amounts as integers (bani, not lei) in the database
- Use PostgreSQL `NUMERIC(18,2)` type via Drizzle's `numeric()` column
- Never use JavaScript `Number` for money - always use library types
- Round only at display time, never during intermediate calculations

**Address in phase:** Phase 1 (Foundation) - establish financial calculation patterns before any asset logic

**Sources:**
- [JavaScript Rounding Errors](https://www.robinwieruch.de/javascript-rounding-errors/)
- [Depreciation Guru: Rounding Errors](https://www.depreciationguru.com/2009/11/depreciation-rounding-errors-its-time-to-solve-them/)
- [Dinero.js Documentation](https://v2.dinerojs.com/docs)

---

### 2. Depreciation Period Rounding Accumulation

**Problem:** When dividing asset cost across months, rounding creates leftover amounts. Example: 1000 lei / 36 months = 27.78 lei/month. 36 x 27.78 = 1000.08 lei (8 bani discrepancy). Over hundreds of assets, this compounds.

**Warning signs:**
- Total depreciation for period does not match expected amounts
- Final period depreciation is wildly different from previous periods
- "Pennies" accumulating or disappearing in reconciliation

**Prevention:**
- Store individual period calculations, do not recalculate from formulas
- Apply "plug the final period" approach: calculate all periods except last, then final period = remaining value
- Use banker's rounding (round half to even) for fairness
- Maintain separate running totals for verification

**Address in phase:** Phase 2 (Depreciation Engine) - core calculation logic must handle this from the start

**Sources:**
- [Depreciation Guru: Solving Rounding Errors](https://www.depreciationguru.com/2009/11/depreciation-rounding-errors-its-time-to-solve-them/)
- [Microsoft Dynamics: Depreciation Methods](https://learn.microsoft.com/en-us/dynamics365/business-central/fa-depreciation-methods)

---

### 3. Fiscal vs Accounting Depreciation Confusion

**Problem:** Romanian law explicitly separates fiscal depreciation (tax-deductible) from accounting depreciation. Since 2004, these are tracked independently. Building a system that only tracks one will fail compliance.

**Warning signs:**
- No separate fields for fiscal and accounting depreciation
- Tax reports show same values as accounting reports
- Confusion when generating SAF-T Declaration 406

**Prevention:**
- Design data model with TWO depreciation tracks from day one
- Fiscal depreciation: follows HG 2139/2004 catalog useful lives
- Accounting depreciation: may use different method/rate per OMFP 1802/2014
- Generate reports from each track separately
- Document which track each report uses

**Address in phase:** Phase 1 (Data Model) - schema must support dual depreciation before any calculation code

**Sources:**
- [PWC Romania: Corporate Deductions](https://taxsummaries.pwc.com/romania/corporate/deductions)
- [Forvis Mazars: Tax vs Accounting Depreciation](https://www.forvismazars.com/ro/en/insights/blog/business-insights/tax-depreciation-versus-accounting-depreciation)
- [Accace: Accounting in Romania](https://accace.com/accounting-in-romania/)

---

### 4. Drizzle ORM Numeric Type Returns Strings

**Problem:** Drizzle ORM returns PostgreSQL `NUMERIC` columns as JavaScript strings, not numbers. This is intentional for precision but causes silent bugs if you expect numbers.

**Warning signs:**
- Arithmetic operations produce `NaN` or string concatenation (`"100" + "50" = "10050"`)
- Type errors in TypeScript that are ignored
- Comparisons fail (`"100" > "9"` is false because string comparison)

**Prevention:**
- Create a custom Drizzle type that converts to `Decimal` objects on read:
```typescript
import { customType } from "drizzle-orm/pg-core";
import Decimal from "decimal.js";

export const money = customType<{ data: Decimal; driverData: string }>({
  dataType() { return "numeric(18, 2)"; },
  fromDriver(value: string): Decimal { return new Decimal(value); },
  toDriver(value: Decimal): string { return value.toString(); }
});
```
- Never use raw query results for math without conversion
- Add TypeScript strict checks for numeric operations

**Address in phase:** Phase 1 (Foundation) - establish this pattern before any database code

**Sources:**
- [Drizzle ORM Issue #1042: Numeric as String](https://github.com/drizzle-team/drizzle-orm/issues/1042)
- [Wanago: Storing Money with Drizzle](https://wanago.io/2024/11/04/api-nestjs-drizzle-orm-postgresql-money/)

---

### 5. HG 2139/2004 Catalog Classification Mismatch

**Problem:** The official Romanian fixed assets catalog defines asset categories with min/max useful life ranges. Incorrect classification leads to wrong depreciation periods, causing tax audit failures. The catalog has specific codes required for SAF-T reporting.

**Warning signs:**
- Assets categorized by generic description instead of catalog codes
- Useful life outside the legal min/max range for that category
- SAF-T export missing classification codes
- Inconsistent categorization of similar assets

**Prevention:**
- Import the full HG 2139/2004 catalog as reference data
- Store catalog code with each asset (required for SAF-T Declaration 406)
- Validate useful life is within catalog min/max range
- Provide lookup/search by catalog code and description
- Flag assets with no catalog code during data entry

**Address in phase:** Phase 1 (Reference Data) - load catalog before asset data entry is possible

**Sources:**
- [Business Review: SAF-T Asset Reporting](https://business-review.eu/profiles1/opinions/electronic-saf-t-reporting-what-changes-are-needed-in-accounting-systems-for-asset-reporting-250726)
- [PWC Romania: Deductions](https://taxsummaries.pwc.com/romania/corporate/deductions)

---

## Moderate Pitfalls

These cause delays or technical debt. Plan for them but they are recoverable.

### 6. Asset Transfer Without Depreciation Continuity

**Problem:** When transferring assets between hospital departments, depreciation history and accumulated depreciation must follow. Common mistake: resetting depreciation or losing history on transfer.

**Warning signs:**
- Transferred assets show wrong accumulated depreciation
- Department reports do not reconcile with total asset register
- Historical reports change after transfers

**Prevention:**
- Transfers are MOVEMENTS, not new acquisitions - preserve all history
- Track transfer date, from/to department, person authorizing
- Accumulated depreciation transfers with the asset
- Future depreciation posts to new department
- Maintain audit trail showing complete transfer history

**Address in phase:** Phase 3 (Transfers) - but data model must support it from Phase 1

**Sources:**
- [AICO: Transfer Entry](https://aico.ai/glossary/transfer-entry)
- [NAIHC: Accounting for Transfer of Assets](https://naihc.net/wp-content/uploads/2021/04/IFM-SEC-6-ACCOUNTING-FOR-TRANSFER-OF-ASSETS.pdf)

---

### 7. Disposal Without Final Depreciation

**Problem:** When disposing/scrapping an asset, depreciation must be calculated up to the disposal date before recording the disposal. Skipping this understates expenses and misstates gain/loss.

**Warning signs:**
- Gain/loss on disposal seems incorrect
- Disposed assets still show in depreciation runs
- Accumulated depreciation does not match disposal calculations

**Prevention:**
- Disposal workflow MUST run final depreciation first
- Calculate depreciation from last run date to disposal date
- Then remove asset from active register
- Journal entry: DR Accumulated Depreciation, DR Loss (or CR Gain), CR Asset Cost
- For Romanian accounting: prorata by months, not days

**Address in phase:** Phase 4 (Disposals) - but the depreciation engine must support partial-period runs

**Sources:**
- [AccountingTools: Fixed Asset Disposal](https://www.accountingtools.com/articles/fixed-asset-disposal-accounting)
- [FitSmallBusiness: Disposal Journal Entry](https://fitsmallbusiness.com/journal-entry-disposal-of-fixed-assets/)

---

### 8. Date/Period Boundary Edge Cases

**Problem:** Monthly depreciation calculation has edge cases: What happens when an asset is acquired on the 31st? On February 29th in leap year? Mid-month? Different accounting policies handle these differently.

**Warning signs:**
- Different totals when running depreciation on different days
- Leap year causing calculation inconsistencies
- Confusion about which month an asset's depreciation starts

**Prevention:**
- Define clear policy: Romanian standard uses prorata by months (not days)
- Document when depreciation starts: month of acquisition or following month
- Store period boundaries explicitly, do not derive from dates
- Test edge cases: month-end acquisitions, leap year, year-end

**Address in phase:** Phase 2 (Depreciation Engine) - define and test all edge cases

**Sources:**
- [Microsoft: Depreciation Conventions](https://learn.microsoft.com/en-us/dynamics365/finance/fixed-assets/depreciation-methods-conventions)
- [AccountingCoach: Mid-Month Convention](https://www.accountingcoach.com/blog/depreciation-mid-month-convention)

---

### 9. shadcn/ui Table Performance with Large Asset Lists

**Problem:** Hospital may have thousands of assets. Default shadcn DataTable renders all rows, causing slow UI at 100+ items, unusable at 1000+.

**Warning signs:**
- Table scrolling becomes laggy
- Initial page load takes seconds
- Browser memory usage spikes
- Filtering/sorting causes freezes

**Prevention:**
- Implement virtualization from the start using TanStack Virtual
- Use server-side pagination for large datasets
- Limit initial fetch to 50-100 items
- Implement search/filter on server, not client
- Consider using existing virtualized implementation: [shipurjan/shadcnui-virtualized-data-table](https://github.com/shipurjan/shadcnui-virtualized-data-table)

**Address in phase:** Phase 1 (UI Foundation) - build table component with virtualization support

**Sources:**
- [shadcn-ui Discussion: Virtualized Data Table](https://github.com/shadcn-ui/ui/discussions/3048)
- [DEV.to: Virtualized Table with TanStack](https://dev.to/ainayeem/building-an-efficient-virtualized-table-with-tanstack-virtual-and-react-query-with-shadcn-2hhl)

---

### 10. FoxPro Data Migration Pitfalls

**Problem:** Migrating from legacy FoxPro system has specific challenges: DBF file format, character encoding (Romanian characters), inconsistent data quality from decades of manual entry.

**Warning signs:**
- Romanian diacritics corrupted (ș, ț, ă, î, â)
- Missing or inconsistent data (blank useful lives, wrong categories)
- Duplicate asset records
- Historical depreciation does not match expected totals

**Prevention:**
- Plan dedicated migration phase with data validation
- Create mapping document: old field -> new field
- Build validation rules to catch data quality issues
- Import with "staging" status, validate before activation
- Keep backup of original FoxPro data
- Test migration with production data copy, not just samples

**Address in phase:** Phase 5 (Migration) - but design schema to accommodate legacy data quirks

**Sources:**
- [ModLogix: VFP Migration Guide](https://modlogix.com/blog/visual-foxpro-to-net-migration-guide/)
- [CPCON: Fixed Asset Migration](https://cpcongroup.com/insights/sap-migration-lsmw-implementation-for-fixed-asset-management/)

---

## Minor Pitfalls

Annoying but fixable. Be aware but do not over-engineer.

### 11. Hono Type Inference in Controllers

**Problem:** Hono framework has type inference issues when creating controller-style handler separation. Path parameters and context types do not infer correctly.

**Warning signs:**
- TypeScript errors about missing path parameter types
- Having to write complex generics for simple handlers
- Type safety lost in separated handler files

**Prevention:**
- Write handlers inline after route definitions (Hono's recommended pattern)
- If separation needed, use `factory.createHandlers()` from hono/factory
- Do not try to replicate Express/Rails controller patterns

**Address in phase:** Phase 1 (API Setup) - establish patterns early

**Sources:**
- [Hono Best Practices](https://hono.dev/docs/guides/best-practices)
- [GitHub Issue: Enterprise Application Structure](https://github.com/honojs/hono/issues/4121)

---

### 12. Bun SQLite Concurrency (if using SQLite)

**Problem:** If using SQLite instead of PostgreSQL, Bun's SQLite is synchronous and only supports one writer at a time. Heavy concurrent writes will block.

**Warning signs:**
- "Database is locked" errors
- Slow response times during batch operations
- Application hangs during large imports

**Prevention:**
- Enable WAL mode: `db.run('PRAGMA journal_mode = WAL')`
- Keep transactions short
- For single-user hospital app, this is likely not a real issue
- Consider PostgreSQL if multi-user access is needed later

**Address in phase:** Phase 1 (Database Setup) - enable WAL immediately

**Sources:**
- [Bun SQLite Documentation](https://bun.com/docs/runtime/sqlite)
- [SQLite Concurrency Blog](https://oldmoe.blog/2024/07/08/the-write-stuff-concurrent-write-transactions-in-sqlite/)

---

### 13. Incorrect Asset Capitalization Thresholds

**Problem:** Not defining a capitalization threshold leads to tracking trivial items as fixed assets, cluttering the register.

**Warning signs:**
- Stapler worth 50 lei tracked as fixed asset
- Asset register has thousands of low-value items
- Disproportionate time spent on trivial asset management

**Prevention:**
- Define minimum capitalization threshold (Romanian regulations may specify)
- Items below threshold are expenses, not assets
- Make threshold configurable in system settings
- Validate on asset entry

**Address in phase:** Phase 1 (Business Rules) - define in configuration

**Sources:**
- [CPCON: Fixed Asset Policy](https://cpcongroup.com/fixed-asset-policy-best-practices/)

---

## Romanian Compliance Risks

### Dual Depreciation Tracking

Romanian law requires separate tracking of fiscal and accounting depreciation since 2004. The system must:
- Store both depreciation methods/amounts
- Generate separate reports for each
- Support SAF-T Declaration 406 with fiscal values
- Allow different useful lives for fiscal vs accounting

### SAF-T Declaration 406 Requirements

The asset subsection of SAF-T requires:
- Asset name and inventory number (unique identifier)
- HG 2139/2004 classification code
- Initial value and annual depreciation
- Additions, modernizations, transfers
- Each asset reported individually

### Depreciation Method Restrictions

- Buildings: straight-line only
- Technology/equipment: straight-line, declining balance, or accelerated
- Other assets: straight-line or declining balance
- Accelerated: up to 50% in year one, then straight-line

---

## Technical Gotchas Summary

| Issue | Impact | Solution |
|-------|--------|----------|
| JS floating-point | Calculation errors | Use decimal.js |
| Drizzle numeric -> string | Silent type bugs | Custom column type |
| shadcn table performance | UI freezes | TanStack Virtual |
| Hono type inference | Developer friction | Inline handlers |
| Period rounding | Balance mismatches | Plug final period |

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| 1. Foundation | Floating-point math, Drizzle string types | Establish money patterns first |
| 2. Depreciation | Period rounding, edge cases | Test all scenarios before moving on |
| 3. Transfers | History loss, balance breaks | Preserve full audit trail |
| 4. Disposals | Missing final depreciation | Enforce workflow order |
| 5. Migration | Data quality, encoding | Staging validation phase |
| 6. Reporting | SAF-T compliance | Verify against sample export |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Financial calculations | HIGH | IEEE 754 issues well-documented |
| Romanian compliance | MEDIUM | General regulations found, specific hospital rules may vary |
| Tech stack issues | MEDIUM | Verified with official docs and GitHub issues |
| Migration | MEDIUM | General FoxPro guidance, specific to your data |

---

## Sources

### Financial Calculations
- [JavaScript Rounding Errors (Robin Wieruch)](https://www.robinwieruch.de/javascript-rounding-errors/)
- [Depreciation Guru: Rounding Errors](https://www.depreciationguru.com/2009/11/depreciation-rounding-errors-its-time-to-solve-them/)
- [Dinero.js v2 Documentation](https://v2.dinerojs.com/docs)
- [DEV.to: Financial Precision in JavaScript](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc)

### Romanian Regulations
- [PWC Romania: Corporate Deductions](https://taxsummaries.pwc.com/romania/corporate/deductions)
- [Forvis Mazars Romania: Tax vs Accounting Depreciation](https://www.forvismazars.com/ro/en/insights/blog/business-insights/tax-depreciation-versus-accounting-depreciation)
- [Business Review: SAF-T Asset Reporting](https://business-review.eu/profiles1/opinions/electronic-saf-t-reporting-what-changes-are-needed-in-accounting-systems-for-asset-reporting-250726)
- [Accace: Accounting in Romania](https://accace.com/accounting-in-romania/)

### Technical Stack
- [Drizzle ORM Issue #1042: Numeric Type](https://github.com/drizzle-team/drizzle-orm/issues/1042)
- [Wanago: Storing Money with Drizzle ORM](https://wanago.io/2024/11/04/api-nestjs-drizzle-orm-postgresql-money/)
- [shadcn-ui Discussion: Virtualized Table](https://github.com/shadcn-ui/ui/discussions/3048)
- [Hono Best Practices](https://hono.dev/docs/guides/best-practices)
- [Bun SQLite Documentation](https://bun.com/docs/runtime/sqlite)

### Asset Management
- [AccountingTools: Fixed Asset Disposal](https://www.accountingtools.com/articles/fixed-asset-disposal-accounting)
- [Microsoft: Depreciation Methods](https://learn.microsoft.com/en-us/dynamics365/business-central/fa-depreciation-methods)
- [CPCON: Fixed Asset Policy](https://cpcongroup.com/fixed-asset-policy-best-practices/)
