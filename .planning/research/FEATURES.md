# Features Research: Fixed Assets Management for Romanian Hospital

**Domain:** Fixed Assets Management (Accounting Focus)
**Context:** Romanian hospital, internal tool replacing FoxPro
**Researched:** 2026-01-22
**Confidence:** MEDIUM-HIGH (verified against Romanian accounting regulations)

---

## Table Stakes (Must Have)

These features are non-negotiable. Without them, the system cannot function as a legal fixed assets register in Romania.

### Asset Registration & Core Data

- **Feature**: Asset Master Record (Fisa Mijlocului Fix)
  - **Why essential**: Legal requirement per OMFP 2634/2015 (form 14-2-2). Every fixed asset must have a card with: inventory number, description, acquisition date, entry value, depreciation method, useful life, location, responsible person
  - **Complexity**: Medium
  - **Dependencies**: None (foundation for everything)
  - **Romanian specifics**: Must capture classification code from Official Fixed Assets Catalogue (Catalogul privind clasificarea si duratele normale de functionare a mijloacelor fixe)

- **Feature**: Asset Classification per Romanian Catalogue
  - **Why essential**: Tax depreciation periods are legally mandated per asset category (HG 2139/2004)
  - **Complexity**: Low (static lookup table)
  - **Dependencies**: Asset Master Record
  - **Romanian specifics**: Categories like 2.1.1 (Buildings), 2.2.1 (Machinery), etc. with normal duration ranges

- **Feature**: Minimum Value Threshold Handling
  - **Why essential**: Per Fiscal Code Art. 28, fixed assets must have entry value >= 2,500 RON. Items below are "obiecte de inventar" (inventory items), not fixed assets
  - **Complexity**: Low
  - **Dependencies**: Asset Master Record

### Depreciation Management

- **Feature**: Linear (Straight-Line) Depreciation Calculation
  - **Why essential**: User requirement. Most common method for accounting depreciation. Monthly calculation required
  - **Complexity**: Low
  - **Dependencies**: Asset Master Record
  - **Formula**: Monthly depreciation = Entry Value / (Useful Life in Months)

- **Feature**: Monthly Depreciation Processing (Batch)
  - **Why essential**: Depreciation must be calculated and recorded monthly, not just annually
  - **Complexity**: Medium
  - **Dependencies**: Depreciation Calculation
  - **Notes**: Must handle partial first/last months for new acquisitions and disposals

- **Feature**: Accumulated Depreciation Tracking
  - **Why essential**: Core accounting requirement. Net book value = Entry value - Accumulated depreciation
  - **Complexity**: Low
  - **Dependencies**: Monthly Depreciation Processing

- **Feature**: Separation of Accounting vs Fiscal Depreciation
  - **Why essential**: Romanian law explicitly requires separate records for accounting depreciation (per OMFP 1802/2014) and fiscal depreciation (per Fiscal Code). They may differ
  - **Complexity**: High
  - **Dependencies**: Depreciation Calculation
  - **Romanian specifics**: Accounting depreciation is non-deductible expense; fiscal depreciation is CIT-deductible. Companies must maintain dual records

### Asset Lifecycle Operations

- **Feature**: Asset Acquisition Entry
  - **Why essential**: Recording new assets with all required data (date, value, supplier, invoice reference, classification)
  - **Complexity**: Low
  - **Dependencies**: Asset Master Record

- **Feature**: Asset Transfer Between Departments/Locations
  - **Why essential**: User requirement. Hospitals transfer equipment between departments constantly
  - **Complexity**: Medium
  - **Dependencies**: Asset Master Record, Location/Department setup
  - **Romanian document**: "Bon de miscare mijloace fixe" (form 14-2-3A) - transfer voucher

- **Feature**: Asset Disposal/Write-Off (Casare)
  - **Why essential**: Legal procedure for removing assets. Requires documentation per OMFP 2634/2015
  - **Complexity**: Medium
  - **Dependencies**: Asset Master Record, Depreciation records
  - **Romanian document**: "Proces verbal de scoatere din functiune a mijloacelor fixe" (form 14-2-3/aA)
  - **Notes**: Must record disposal reason, residual value, disposal method (scrapping vs sale)

### Required Reports

- **Feature**: Asset Card Report (Fisa Mijlocului Fix - printable)
  - **Why essential**: User requirement. Legal document format per OMFP 2634/2015
  - **Complexity**: Low
  - **Dependencies**: Asset Master Record, Depreciation records
  - **Content**: All asset details + depreciation schedule

- **Feature**: Fixed Assets Balance (Balanta Mijloacelor Fixe)
  - **Why essential**: User requirement. Summary report showing opening balance, movements (acquisitions, disposals, transfers), closing balance by category
  - **Complexity**: Medium
  - **Dependencies**: All asset operations
  - **Period**: Monthly/Quarterly/Annual

- **Feature**: Operations Journal (Jurnal Operatiuni)
  - **Why essential**: User requirement. Chronological list of all operations on fixed assets (acquisitions, depreciation, transfers, disposals)
  - **Complexity**: Medium
  - **Dependencies**: All asset operations

- **Feature**: Inventory Register (Registru Inventar)
  - **Why essential**: Legal requirement per Accounting Law 82/1991. Annual inventory is mandatory
  - **Complexity**: Medium
  - **Dependencies**: Asset Master Record
  - **Romanian specifics**: Penalty 400-5,000 RON for non-compliance

- **Feature**: Statement of Fixed Assets (Situatia Activelor Imobilizate - Code 40)
  - **Why essential**: Required attachment to annual financial statements per OMFP 1802/2014
  - **Complexity**: Medium
  - **Dependencies**: All depreciation records

### Basic Administrative

- **Feature**: Department/Cost Center Setup
  - **Why essential**: Assets must be assigned to departments (sectii/compartimente) for accountability and reporting
  - **Complexity**: Low
  - **Dependencies**: None

- **Feature**: Location Setup (Buildings, Rooms)
  - **Why essential**: Physical location tracking is essential for hospital asset management (where is the CT scanner?)
  - **Complexity**: Low
  - **Dependencies**: None

- **Feature**: User Authentication
  - **Why essential**: Multi-user environment, audit trail requirements
  - **Complexity**: Low (can be simple for internal tool)
  - **Dependencies**: None

---

## Nice-to-Have (v2+)

Features that add value but are not required for MVP. Consider after core functionality is stable.

### Enhanced Depreciation Methods

- **Feature**: Declining Balance Depreciation (Amortizare Degresiva)
  - **Why valuable**: Alternative method allowed by Romanian law for certain assets. Coefficients: 1.5 (2-5 years), 2.0 (>5-10 years), 2.5 (>10 years)
  - **Complexity**: Medium
  - **When to add**: If accounting department requests it

- **Feature**: Accelerated Depreciation
  - **Why valuable**: Fiscal Code allows 50% first-year depreciation for machinery, computers, patents
  - **Complexity**: Medium
  - **When to add**: If fiscal optimization becomes a priority

### Asset Valuation

- **Feature**: Asset Revaluation
  - **Why valuable**: Romanian law allows revaluation by authorized experts. Updates carrying amount to fair value
  - **Complexity**: High
  - **When to add**: Likely never needed for internal hospital tool
  - **Note**: Must revalue entire class, not cherry-pick individual assets

- **Feature**: Impairment Recording
  - **Why valuable**: Required at year-end if asset value drops below book value
  - **Complexity**: Medium
  - **When to add**: If auditors specifically request it

### Inventory & Tracking

- **Feature**: Barcode/QR Code Labeling
  - **Why valuable**: Speeds up physical inventory. Reduces errors
  - **Complexity**: Medium (hardware + software)
  - **When to add**: If physical inventory is a major pain point

- **Feature**: Physical Inventory Module with Reconciliation
  - **Why valuable**: Automated comparison between physical count and book records
  - **Complexity**: Medium-High
  - **When to add**: After basic system is stable

- **Feature**: Asset Photo Attachments
  - **Why valuable**: Visual identification, condition documentation
  - **Complexity**: Low
  - **When to add**: If users request it

### Enhanced Reporting

- **Feature**: Depreciation Forecast
  - **Why valuable**: Project future depreciation for budgeting
  - **Complexity**: Medium
  - **When to add**: If finance department needs it for planning

- **Feature**: Asset Utilization Reports
  - **Why valuable**: Identify underutilized equipment
  - **Complexity**: Medium
  - **When to add**: Not typical for accounting-focused tool

- **Feature**: Custom Report Builder
  - **Why valuable**: Ad-hoc queries without developer involvement
  - **Complexity**: High
  - **When to add**: Probably never (build specific reports as needed)

### Integration

- **Feature**: Export to Accounting Software
  - **Why valuable**: Automatic journal entries for depreciation
  - **Complexity**: Medium (depends on target system)
  - **When to add**: If manual entry becomes a burden

- **Feature**: Import from Legacy FoxPro System
  - **Why valuable**: Migration of existing data
  - **Complexity**: Medium-High (depends on data quality)
  - **When to add**: MVP (one-time migration tool, not ongoing feature)

### Maintenance Tracking

- **Feature**: Preventive Maintenance Scheduling
  - **Why valuable**: Medical equipment requires calibration and maintenance
  - **Complexity**: Medium
  - **When to add**: If hospital wants to combine asset management with maintenance management
  - **Note**: This is more typical of CMMS (Computerized Maintenance Management System), not accounting system

---

## Anti-Features (Don't Build)

Features to explicitly NOT build. Either out of scope, wrong for context, or actively harmful.

### Out of Scope for Accounting Tool

- **Feature**: Real-Time Location Tracking (RFID/GPS)
  - **Why not**: Overkill for internal hospital accounting tool. This is for operations/logistics, not accounting. Expensive hardware, complex integration
  - **What to do instead**: Simple location field (building/room) updated manually during transfers

- **Feature**: Lease Management (IFRS 16)
  - **Why not**: Different accounting treatment entirely. Leased assets have different rules. Public hospitals typically own their assets
  - **What to do instead**: If needed, use separate system or module

- **Feature**: Multi-Tenant Support
  - **Why not**: User requirement specifies single hospital, internal use only. Multi-tenancy adds complexity for zero benefit
  - **What to do instead**: Single-tenant architecture, simpler codebase

- **Feature**: Work Order / Maintenance Ticket System
  - **Why not**: This is CMMS functionality, not fixed asset accounting. Different user base (technicians vs accountants)
  - **What to do instead**: Track maintenance-related costs as asset improvements if they increase value/life

### Complexity Not Justified

- **Feature**: Component Depreciation (Depreciating parts separately)
  - **Why not**: Romanian accounting allows this (15% threshold for movables, 1% for immovables), but adds significant complexity. Rarely needed for hospital equipment
  - **What to do instead**: Treat assets as single units unless explicitly required by auditors

- **Feature**: Multiple Depreciation Books
  - **Why not**: Overkill for single hospital. Useful for multinational corporations with multiple reporting standards
  - **What to do instead**: Dual track for accounting vs fiscal depreciation is sufficient

- **Feature**: Workflow Approval System
  - **Why not**: Internal tool with trusted users. Complex workflow adds friction
  - **What to do instead**: Simple role-based permissions (viewer, editor, admin)

- **Feature**: Mobile App
  - **Why not**: Accounting staff work at desks. Physical inventory happens rarely (annually). Desktop web app is sufficient
  - **What to do instead**: Responsive web design for occasional tablet use during inventory

### Wrong Approach

- **Feature**: AI-Powered Depreciation Optimization
  - **Why not**: Depreciation is rule-based, not AI territory. Legal methods are defined by law
  - **What to do instead**: Correctly implement the three legal methods

- **Feature**: Blockchain-Based Asset Registry
  - **Why not**: No benefit for internal tool. Adds complexity for buzzword compliance
  - **What to do instead**: Simple relational database with audit log

- **Feature**: Automatic Asset Recognition from Invoices
  - **Why not**: OCR accuracy insufficient, manual verification still needed. Low volume of acquisitions doesn't justify complexity
  - **What to do instead**: Manual entry with good UX (autocomplete, templates)

---

## Romanian Compliance Requirements

Specific legal/accounting requirements that shape the system design.

### Regulatory Framework

| Regulation | What It Governs |
|------------|-----------------|
| Accounting Law 82/1991 | General accounting obligations, mandatory annual inventory |
| OMFP 1802/2014 | Accounting regulations per EU directives, financial statements structure |
| OMFP 2634/2015 | Standardized accounting forms (asset card, transfer voucher, disposal report) |
| Fiscal Code (Art. 28) | Definition of fixed assets, depreciation methods for tax purposes |
| HG 2139/2004 | Official Fixed Assets Catalogue (Catalog durate normale de functionare) |

### Mandatory Documents (Forms)

| Form Code | Name | Purpose | When Generated |
|-----------|------|---------|----------------|
| 14-2-2 | Fisa Mijlocului Fix | Asset card | One per asset, updated continuously |
| 14-2-3A | Bon de Miscare Mijloace Fixe | Transfer voucher | Each transfer between locations/departments |
| 14-2-3/aA | Proces Verbal Scoatere din Functiune | Disposal report | Each disposal/write-off |

### Key Thresholds and Limits

| Parameter | Value | Source |
|-----------|-------|--------|
| Minimum fixed asset value | 2,500 RON | Fiscal Code Art. 28 |
| Vehicle depreciation limit | 1,500 RON/month/vehicle | Fiscal Code (for vehicles with <=9 seats, not exclusive business use) |
| Component depreciation threshold (movables) | 15% of total cost | OMFP 1802/2014 |
| Component depreciation threshold (immovables) | 1% of total cost | OMFP 1802/2014 |
| Inventory penalty for non-compliance | 400-5,000 RON | Accounting Law 82/1991 |

### Depreciation Methods per Romanian Law

| Method | Accounting | Fiscal | Applicable To |
|--------|------------|--------|---------------|
| Straight-line (Linear) | Yes | Yes | All fixed assets |
| Declining balance | Yes | Yes | All except buildings |
| Accelerated | No | Yes | Machinery, computers, patents (max 50% first year) |
| Units of production | Yes | No | Special cases |

### Record Retention

Per Romanian law, accounting records must be retained for minimum 5 years. Fixed asset cards should be retained for asset life plus retention period.

---

## Feature Dependencies

```
[Department/Location Setup]
         |
         v
[Asset Master Record] <-- [Asset Classification Catalogue]
         |
         +---> [Asset Acquisition Entry]
         |
         +---> [Monthly Depreciation Processing] --> [Depreciation Reports]
         |            |
         |            v
         |     [Accumulated Depreciation Tracking]
         |
         +---> [Asset Transfer] --> [Transfer Voucher (14-2-3A)]
         |
         +---> [Asset Disposal] --> [Disposal Report (14-2-3/aA)]
         |
         v
[All Reports: Asset Card, Balance, Journal, Inventory Register, Statement Code 40]
```

---

## MVP Feature Set Recommendation

For v1, implement:

**Must Have:**
1. Asset Master Record with Romanian catalogue classification
2. Department and Location setup
3. Asset Acquisition Entry
4. Linear depreciation calculation (monthly batch)
5. Accumulated depreciation tracking
6. Asset Transfer between departments/locations
7. Asset Disposal/Write-off
8. Asset Card Report (Fisa Mijlocului Fix)
9. Fixed Assets Balance Report
10. Operations Journal
11. Basic user authentication

**Can Defer:**
- Fiscal vs Accounting depreciation separation (implement if auditors require)
- Declining balance/Accelerated depreciation methods
- Inventory Register with reconciliation
- Statement of Fixed Assets (Code 40)
- Barcode scanning
- Data import from FoxPro (do as one-time migration, not ongoing feature)

---

## Sources

### Romanian Regulations
- [PWC Romania - Corporate Deductions](https://taxsummaries.pwc.com/romania/corporate/deductions)
- [Accace - Accounting in Romania](https://accace.com/accounting-in-romania/)
- [Romanian Depreciation Method Description](https://lvexpertisex3.com/x3help/ENG/FCT/GES_DPM_RUM.htm)
- [LPG Roumanie - Amortization/Depreciation](https://www.lpg-roumanie.ro/en/publications/corporate-taxation/amortization-depreciation-of-fixed-assets)
- [Contabilul Manager - Fisa Mijlocului Fix](https://contabilul.manager.ro/a/28153/fisa-mijlocului-fix-model-ce-este-si-la-ce-serveste.html)
- [TheExperts - Proces Verbal Scoatere din Functiune](https://www.theexperts.ro/formulare-mijloace-fixe/proces-verbal-de-casare-a-mijloacelor-fixe)
- [Portal Contabilitate - Registrul Inventar](https://www.portalcontabilitate.ro/tags/registrul-inventar/)

### Fixed Asset Management General
- [Capterra - Fixed Asset Management Software](https://www.capterra.com/fixed-asset-management-software/)
- [NetSuite - Healthcare Asset Management](https://www.netsuite.com/portal/resource/articles/accounting/healthcare-asset-management.shtml)
- [Asset Cues - Fixed Asset Audit](https://www.assetcues.com/blog/how-to-conduct-fixed-asset-audit/)
- [GoCodes - Fixed Asset Management Mistakes](https://gocodes.com/fixed-asset-management-mistakes/)
- [CPCON - Fixed Asset Policy Best Practices](https://cpcongroup.com/fixed-asset-policy-best-practices/)
