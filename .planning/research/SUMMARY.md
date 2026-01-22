# Project Research Summary

**Project:** MiFix - Fixed Assets Management System
**Domain:** Romanian Hospital Accounting (Fixed Assets)
**Researched:** 2026-01-22
**Confidence:** HIGH

## Executive Summary

MiFix is a fixed assets management application for a Romanian hospital, replacing a legacy FoxPro system. This is a specialized accounting domain with strict Romanian regulatory requirements (OMFP 1802/2014, HG 2139/2004 classification catalog, SAF-T Declaration 406). The system must track asset lifecycle (acquisition, transfer, disposal), calculate dual depreciation tracks (accounting vs fiscal), and generate compliance reports.

The recommended approach uses a modern TypeScript monorepo with Bun/Hono backend and React/Vite frontend. Critical early decisions: use decimal.js for ALL financial calculations (JavaScript floating-point will cause audit failures), implement dual depreciation tracking from day one (Romanian law requires separate fiscal and accounting depreciation since 2004), and load HG 2139/2004 classification catalog as reference data before allowing asset entry. The architecture follows a layered pattern with isolated depreciation engine, transaction layer for audit trails, and reporting layer that aggregates from multiple sources.

Key risk: financial calculation precision. Depreciation errors compound over years and create balance sheet discrepancies. Mitigation: establish decimal.js patterns in Phase 1 before any business logic, use Drizzle custom types to prevent string-as-number bugs, and apply "plug the final period" approach to handle rounding accumulation. Second risk: Romanian compliance gaps - research found general regulations but hospital-specific rules may vary; validate with actual auditors during implementation.

## Key Findings

### Recommended Stack

The user pre-selected a modern, TypeScript-first stack optimized for developer productivity. Research confirms these are solid choices for this domain and identified four critical additions.

**Core technologies (user-specified, verified):**
- **Bun 1.3.5**: JavaScript runtime — faster than Node.js, built-in SQLite support
- **Hono 4.11.4**: Backend framework — TypeScript-first, works natively with Bun, cleaner API than Express
- **Drizzle ORM 0.45.1**: Database layer — SQL-like syntax, better performance than Prisma, excellent TypeScript inference
- **React 19.x + Vite 6.x/7.x**: Frontend — industry standard, fast dev experience
- **shadcn/ui + Tailwind 4.x**: UI components — customizable, tree-shakeable, owns the code
- **Zod 4.3.5**: Validation — shared between frontend/backend, TypeScript inference

**Critical additions identified:**
- **better-auth 1.4.15**: Authentication with native Hono/Drizzle integration (Lucia Auth is deprecated)
- **@tanstack/react-table 8.21.3**: Data tables with sorting/filtering (shadcn/ui has official integration)
- **date-fns 4.1.0**: Date utilities for depreciation period calculations (v4 adds timezone support)
- **decimal.js 10.6.0**: Arbitrary-precision decimals for financial math (prevents floating-point errors)

**Critical for reports:**
- **react-to-print 3.2.0**: Browser-based report printing (simplest solution for internal use)
- **@react-pdf/renderer 4.3.2**: Optional, only if programmatic PDF generation needed beyond print dialog

### Expected Features

Research identified must-have features based on Romanian accounting regulations and user requirements. System must support complete asset lifecycle with dual depreciation tracking.

**Must have (table stakes):**
- Asset Master Record with HG 2139/2004 classification code (required for SAF-T Declaration 406)
- Asset acquisition, transfer between departments, disposal/write-off (casare)
- Linear (straight-line) depreciation calculation with monthly processing
- Dual depreciation tracking: accounting (per OMFP 1802/2014) vs fiscal (per Fiscal Code)
- Department/Location setup for physical tracking
- Mandatory reports: Fisa Mijlocului Fix (form 14-2-2), Fixed Assets Balance, Operations Journal
- Minimum value threshold enforcement (2,500 RON per Fiscal Code Art. 28)
- User authentication for multi-user access and audit trails

**Should have (competitive):**
- Accumulated depreciation tracking with historical records
- Transfer voucher generation (form 14-2-3A)
- Disposal report generation (form 14-2-3/aA)
- Inventory Register for annual inventory compliance
- Statement of Fixed Assets (Code 40) for annual financial statements

**Defer (v2+):**
- Declining balance and accelerated depreciation methods (v1 uses linear only)
- Asset revaluation and impairment recording
- Barcode/QR code labeling for physical inventory
- Component depreciation (separate tracking of asset parts)
- Export to external accounting software

**Anti-features (explicitly don't build):**
- Real-time location tracking (RFID/GPS) — overkill for accounting tool
- Lease management (IFRS 16) — different domain, separate system needed
- Multi-tenant support — single hospital, adds unnecessary complexity
- Work order/maintenance ticket system — CMMS functionality, not accounting
- Mobile app — desktop users, responsive web sufficient

### Architecture Approach

The system follows a layered monorepo pattern optimized for the Bun/Hono/React/Drizzle stack. Key insight: isolate depreciation calculation as pure business logic module with complex rules that change rarely but must be independently testable.

**Major components:**
1. **Reference Data Layer** — manages nomenclators (HG 2139/2004 classification catalog, chart of accounts, departments, locations). Static data seeded once, provides validation lookups
2. **Asset Core Layer** — central asset registry maintaining current state snapshot. Owns mijloace_fixe table, implements state machine (activ → conservare → casat)
3. **Transaction Layer** — records immutable business operations (intrare, transfer, casare). Produces events that update Asset Core, provides complete audit trail
4. **Depreciation Engine** — pure business logic module for calculating monthly depreciation. No HTTP or database access except writing to amortizari table. Supports multiple methods (v1: linear only)
5. **Reporting Layer** — read-only aggregation queries across all layers. Generates compliance reports (Fisa MF, Balanta, Jurnal)
6. **API Gateway** — thin Hono routing layer with Zod validation. Delegates to services, no business logic
7. **Frontend Application** — React/shadcn/ui components. TanStack Query for server state, React Hook Form + Zod for forms

**Critical patterns:**
- Use Drizzle custom type to convert numeric columns to Decimal objects (prevent string-as-number bugs)
- Wrap batch operations in database transactions (monthly depreciation must be atomic)
- Store individual period calculations, never recalculate from formulas (prevents rounding errors)
- Apply "plug the final period" approach: calculate all periods except last, then final = remaining value

### Critical Pitfalls

1. **Floating-Point Arithmetic for Financial Calculations** — JavaScript's 0.1 + 0.2 = 0.30000000000000004 will cause depreciation errors that compound over years. NEVER use Number for money. Always use decimal.js for calculations, store as DECIMAL(15,2) in database, use Drizzle custom type to convert strings to Decimal objects on read. Address in Phase 1 before any business logic.

2. **Fiscal vs Accounting Depreciation Confusion** — Romanian law explicitly requires separate tracking since 2004. Design data model with TWO depreciation tracks from day one. Fiscal follows HG 2139/2004 catalog, accounting may use different method per OMFP 1802/2014. Generate SAF-T Declaration 406 from fiscal track. Address in Phase 1 schema design.

3. **Depreciation Period Rounding Accumulation** — 1000 lei / 36 months = 27.78 lei/month. 36 × 27.78 = 1000.08 lei (8 bani error). Over hundreds of assets this compounds. Solution: store individual period calculations, apply "plug the final period" approach (all periods except last calculated, final period = remaining value). Address in Phase 2 depreciation engine.

4. **HG 2139/2004 Catalog Classification Mismatch** — Incorrect classification leads to wrong depreciation periods causing tax audit failures. Must store catalog code with each asset (required for SAF-T). Validate useful life is within catalog min/max range. Import full catalog as reference data before asset entry. Address in Phase 1 reference data.

5. **Drizzle ORM Numeric Type Returns Strings** — Drizzle returns PostgreSQL NUMERIC as strings for precision. Causes silent bugs if expecting numbers ("100" + "50" = "10050"). Create custom Drizzle type that converts to Decimal on read, establish pattern before any database code. Address in Phase 1 foundation.

## Implications for Roadmap

Based on research findings, suggested phase structure prioritizes financial precision foundation, then builds asset management layer by layer, avoiding critical pitfalls.

### Phase 1: Foundation & Reference Data
**Rationale:** Everything depends on correct data model and financial calculation patterns. Must establish decimal.js usage, Drizzle custom types, and load HG 2139/2004 catalog before any business logic.

**Delivers:**
- Database schema with dual depreciation fields (accounting + fiscal)
- Drizzle custom type for Decimal conversion
- HG 2139/2004 classification catalog seeded
- Romanian chart of accounts seeded
- Shared TypeScript types and Zod schemas
- Financial calculation utilities established

**Avoids:**
- Pitfall #1: Floating-point errors (establish decimal.js patterns)
- Pitfall #2: Dual depreciation confusion (schema supports both tracks)
- Pitfall #4: Classification mismatch (catalog loaded first)
- Pitfall #5: Drizzle string types (custom type established)

**Technical Foundation:**
- Uses: Drizzle ORM, Zod, decimal.js
- Implements: Database schema, seed data, shared types

### Phase 2: Nomenclator CRUD (Reference Data Management)
**Rationale:** Assets require gestiuni (departments), locuri folosinta (locations), surse finantare (funding sources), and conturi (chart of accounts). Build reference data management before asset entry.

**Delivers:**
- Gestiuni (departments) CRUD with soft delete
- Locuri Folosinta (locations) CRUD with gestiune dependency
- Surse Finantare (funding sources) CRUD
- Conturi (chart of accounts) view/edit
- API routes + frontend forms for all nomenclators

**Dependencies:**
- Phase 1: Requires schema and seed data

**Technical Stack:**
- Uses: Hono routes, shadcn/ui forms, TanStack Query
- Implements: Reference Data Layer from architecture

### Phase 3: Asset Core & Management
**Rationale:** Central asset registry is foundation for all operations. Build asset CRUD with full validation before transactions and depreciation.

**Delivers:**
- Asset Master Record form with all required fields
- Asset list view with filtering/pagination (shadcn DataTable + TanStack Table)
- Asset detail view with tabs (overview, history, depreciation)
- Asset acquisition entry with validation
- Clasificare combobox with HG 2139/2004 catalog search
- Dependent selects (gestiune → loc folosinta)

**Addresses:**
- Features: Asset Master Record, Clasificare, Minimum Value Threshold
- Avoids: Pitfall #9 (use TanStack Virtual for table performance from start)

**Dependencies:**
- Phase 2: Requires nomenclators for form dropdowns

**Technical Stack:**
- Uses: @tanstack/react-table, shadcn/ui, React Hook Form + Zod
- Implements: Asset Core Layer from architecture

### Phase 4: Transaction Operations
**Rationale:** Asset lifecycle operations must maintain complete audit trail. Build transaction layer that records immutable operations and updates Asset Core.

**Delivers:**
- Asset transfer between departments/locations
- Asset disposal/write-off (casare) with reason tracking
- Transaction history view per asset
- Transaction journal (chronological list of all operations)
- Generated documents: Transfer voucher (14-2-3A), Disposal report (14-2-3/aA)

**Addresses:**
- Features: Asset Transfer, Asset Disposal, Operations Journal
- Avoids: Pitfall #6 (transfer preserves depreciation history)
- Avoids: Pitfall #7 (disposal triggers final depreciation first)

**Dependencies:**
- Phase 3: Requires assets to exist

**Technical Stack:**
- Implements: Transaction Layer from architecture
- Uses: Database transactions for atomicity

### Phase 5: Depreciation Engine
**Rationale:** Core financial calculation logic. Must be correct before reports. Isolated pure business logic module with comprehensive testing.

**Delivers:**
- Depreciation calculation service (pure TypeScript module)
- Linear (straight-line) depreciation formula
- Monthly batch processing endpoint
- Edge case handling: partial months, leap years, completed assets
- Dual track support: accounting vs fiscal depreciation
- Unit tests for all calculation scenarios

**Addresses:**
- Features: Linear Depreciation, Monthly Processing, Accumulated Depreciation
- Avoids: Pitfall #1 (uses decimal.js)
- Avoids: Pitfall #3 (plug the final period approach)
- Avoids: Pitfall #8 (handles date boundary edge cases)

**Dependencies:**
- Phase 3: Requires asset data
- Phase 1: Uses decimal.js patterns

**Technical Stack:**
- Uses: decimal.js, date-fns for period calculations
- Implements: Depreciation Engine from architecture

**Research Flag:** SKIP RESEARCH — depreciation formulas are well-documented, straight-line is trivial. Focus on testing edge cases.

### Phase 6: Reporting & Compliance
**Rationale:** Compliance reports aggregate data from all layers. Build after core data exists.

**Delivers:**
- Fisa Mijlocului Fix (Asset Card) — form 14-2-2
- Fixed Assets Balance (Balanta) — summary by category/department
- Operations Journal (already built in Phase 4)
- Depreciation Schedule per asset
- Print-friendly report layouts (react-to-print)

**Addresses:**
- Features: All required reports
- Romanian compliance: OMFP 2634/2015 forms

**Dependencies:**
- Phase 5: Requires depreciation data
- Phase 4: Requires transaction history

**Technical Stack:**
- Uses: react-to-print for browser printing
- Implements: Reporting Layer from architecture

**Research Flag:** SKIP RESEARCH — report structures defined by Romanian regulations (forms 14-2-2, 14-2-3A, etc.)

### Phase 7: Authentication & Polish
**Rationale:** Secure functional system, then refine UX. Authentication not needed during development.

**Delivers:**
- User authentication with better-auth
- Protected routes and session management
- Error handling standardization
- Loading states and empty states
- Error boundaries

**Addresses:**
- Features: User Authentication
- Technical: Production-ready error handling

**Dependencies:**
- All previous phases

**Technical Stack:**
- Uses: better-auth with Hono integration

**Research Flag:** SKIP RESEARCH — better-auth has official Hono guide, straightforward implementation.

### Phase 8: Data Migration (Optional)
**Rationale:** One-time migration from legacy FoxPro system. Deferred until core system is stable.

**Delivers:**
- FoxPro DBF import script
- Data validation and quality checks
- Character encoding handling (Romanian diacritics)
- Staging validation before activation

**Addresses:**
- Migration from legacy system
- Avoids: Pitfall #10 (data quality validation, encoding issues)

**Dependencies:**
- All core phases complete

**Research Flag:** NEEDS RESEARCH — FoxPro DBF format specifics, character encoding for Romanian characters (ș, ț, ă, î, â).

### Phase Ordering Rationale

- **Foundation first**: Financial precision and data model correctness are non-negotiable. Establishing decimal.js patterns and dual depreciation schema in Phase 1 prevents rewrites.
- **Reference data before assets**: Assets cannot be created without valid gestiuni, locations, and classification codes. Phase 2 builds these lookups.
- **Core before operations**: Asset CRUD must exist before transfers and disposals can reference them. Phase 3 establishes central registry.
- **Transactions before depreciation**: Depreciation needs acquisition dates and values from transactions. Phase 4 creates audit trail.
- **Depreciation before reports**: Reports aggregate depreciation data. Phase 5 generates this data.
- **Authentication last**: Functional system first, then secure it. Phase 7 adds auth when everything else works.
- **Migration deferred**: Core system must be stable and validated before importing production data. Phase 8 is optional if starting fresh.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 8 (Migration):** FoxPro DBF file format, Romanian character encoding specifics, data quality patterns

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Database schema and decimal.js patterns are well-documented
- **Phase 2 (Nomenclators):** Standard CRUD operations, no novel patterns
- **Phase 3 (Asset Core):** Standard CRUD with validation, shadcn/ui has official table examples
- **Phase 4 (Transactions):** Audit trail patterns well-established
- **Phase 5 (Depreciation):** Linear depreciation formula is trivial, focus on testing
- **Phase 6 (Reporting):** Report structures defined by Romanian regulations
- **Phase 7 (Authentication):** better-auth has official Hono integration guide

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified with official sources (npm, GitHub releases, docs). better-auth confirmed as Lucia Auth successor. |
| Features | HIGH | Table stakes verified against Romanian regulations (OMFP 2634/2015, HG 2139/2004). User requirements clear. |
| Architecture | HIGH | Layered pattern matches Hono best practices. Drizzle relations verified with official docs. SAP/Oracle asset management patterns reviewed. |
| Pitfalls | MEDIUM-HIGH | Financial calculation issues well-documented. Romanian compliance researched with multiple sources (PWC, Accace, Forvis Mazars). Hospital-specific rules may vary. |

**Overall confidence:** HIGH

### Gaps to Address

- **Hospital-specific accounting rules:** Research found general Romanian regulations but specific hospital accounting procedures may have additional requirements. Validate with actual auditors/accountants during implementation.

- **FoxPro migration specifics:** General FoxPro migration guidance found, but specific data structure and quality of legacy system unknown. Will need to inspect actual FoxPro database during Phase 8.

- **SAF-T Declaration 406 exact format:** Research confirmed SAF-T requires HG 2139/2004 classification codes and individual asset reporting, but exact XML schema not verified. May need official ANAF documentation during reporting phase.

- **Depreciation start policy:** Romanian regulations specify monthly prorata, but exact policy for mid-month acquisitions needs confirmation (month of acquisition or following month). Document decision in Phase 1.

- **Capitalization threshold enforcement:** Fiscal Code specifies 2,500 RON minimum, but hospital may have internal policy for lower-value tracking. Clarify with stakeholders during Phase 3.

## Sources

### Primary (HIGH confidence)

**Stack verification:**
- [Bun GitHub Releases](https://github.com/oven-sh/bun/releases) — version 1.3.5 confirmed
- [Hono Official Documentation](https://hono.dev/) — version 4.11.4, best practices, Hono factory pattern
- [Drizzle ORM Documentation](https://orm.drizzle.team/) — version 0.45.1, relations guide
- [Vite Documentation](https://vite.dev/releases) — version 6.x/7.x confirmed
- [better-auth Official Docs](https://www.better-auth.com/) — Hono integration, Drizzle adapter
- [TanStack Table Documentation](https://tanstack.com/table/latest) — version 8.21.3
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table) — official integration with TanStack Table
- [date-fns v4 Release Blog](https://blog.date-fns.org/v40-with-time-zone-support/) — timezone support
- [decimal.js GitHub](https://github.com/MikeMcl/decimal.js) — version 10.6.0, precision arithmetic

**Romanian accounting regulations:**
- [PWC Romania: Corporate Deductions](https://taxsummaries.pwc.com/romania/corporate/deductions) — fiscal depreciation rules, asset thresholds
- [Forvis Mazars Romania: Tax vs Accounting Depreciation](https://www.forvismazars.com/ro/en/insights/blog/business-insights/tax-depreciation-versus-accounting-depreciation) — dual depreciation requirement
- [Accace: Accounting in Romania](https://accace.com/accounting-in-romania/) — general accounting framework
- [Business Review: SAF-T Asset Reporting](https://business-review.eu/profiles1/opinions/electronic-saf-t-reporting-what-changes-are-needed-in-accounting-systems-for-asset-reporting-250726) — Declaration 406 requirements

### Secondary (MEDIUM confidence)

**Asset management patterns:**
- [SAP FI-AA Tables](https://www.se80.co.uk/sapmodules/f/fi-a/fi-aa-tables-all.htm) — enterprise asset data model
- [Oracle Fixed Assets Tables](https://docs.oracle.com/cd/E16582_01/doc.91/e15107/set_up_fixed_assets_sys.htm) — lifecycle management patterns
- [NetSuite: Healthcare Asset Management](https://www.netsuite.com/portal/resource/articles/accounting/healthcare-asset-management.shtml) — healthcare-specific considerations
- [Microsoft Dynamics: Depreciation Methods](https://learn.microsoft.com/en-us/dynamics365/business-central/fa-depreciation-methods) — depreciation conventions

**Financial calculations:**
- [JavaScript Rounding Errors (Robin Wieruch)](https://www.robinwieruch.de/javascript-rounding-errors/) — floating-point issues
- [Depreciation Guru: Rounding Errors](https://www.depreciationguru.com/2009/11/depreciation-rounding-errors-its-time-to-solve-them/) — plug-the-final-period approach
- [Wanago: Storing Money with Drizzle ORM](https://wanago.io/2024/11/04/api-nestjs-drizzle-orm-postgresql-money/) — custom Decimal type
- [Drizzle ORM Issue #1042](https://github.com/drizzle-team/drizzle-orm/issues/1042) — numeric as string behavior

**Romanian forms and compliance:**
- [Contabilul Manager: Fisa Mijlocului Fix](https://contabilul.manager.ro/a/28153/fisa-mijlocului-fix-model-ce-este-si-la-ce-serveste.html) — form 14-2-2
- [TheExperts: Proces Verbal Scoatere din Functiune](https://www.theexperts.ro/formulare-mijloace-fixe/proces-verbal-de-casare-a-mijloacelor-fixe) — form 14-2-3/aA
- [Portal Contabilitate: Registrul Inventar](https://www.portalcontabilitate.ro/tags/registrul-inventar/) — inventory register requirements

### Tertiary (LOW confidence, needs validation)

**Migration:**
- [ModLogix: VFP Migration Guide](https://modlogix.com/blog/visual-foxpro-to-net-migration-guide/) — general FoxPro migration approach
- Hospital-specific FoxPro schema unknown — requires inspection during Phase 8

**SAF-T specifics:**
- SAF-T Declaration 406 exact XML format not verified — may need official ANAF documentation

---
*Research completed: 2026-01-22*
*Ready for roadmap: yes*
