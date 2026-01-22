# Architecture Research

**Domain:** Fixed Assets Management System (Hospital Accounting)
**Researched:** 2026-01-22
**Confidence:** HIGH (based on spec.md, industry patterns, and official documentation)

## Executive Summary

This architecture follows a layered monorepo pattern optimized for your tech stack (Bun/Hono/React/Drizzle). The system separates concerns into: reference data (nomenclators), core asset management, transaction processing, depreciation engine, and reporting. Key insight: Depreciation calculation should be isolated as a pure business logic module - it has complex rules that change rarely but must be testable independently.

---

## System Components

### 1. Reference Data Layer (Nomenclators)

**Purpose:** Manage lookup tables that define valid options for asset classification and organization.

**Boundaries:**
- Owns: `clasificari`, `gestiuni`, `locuri_folosinta`, `surse_finantare`, `conturi`
- Does NOT own: Asset data, transactions, depreciation records
- Data is relatively static (seeded once, rarely changed)

**Interfaces:**
- REST endpoints for CRUD operations
- Dropdown/select data providers for frontend forms
- Validation lookups for asset creation

**Tables:**
```
clasificari (cod PK) ─────────────────┐
gestiuni (id PK) ──┬── locuri_folosinta (gestiune_id FK)
surse_finantare (id PK) ──────────────┤
conturi (id PK) ──────────────────────┘───► mijloace_fixe
```

### 2. Asset Core Layer

**Purpose:** Central asset registry - the heart of the system. Manages asset master data and current state.

**Boundaries:**
- Owns: `mijloace_fixe` table, asset lifecycle states
- Does NOT own: Transaction history (references it), depreciation calculations (delegated)
- Maintains current snapshot of each asset (current location, current values)

**Interfaces:**
- CRUD operations for assets
- State machine for asset lifecycle (activ → conservare → casat)
- Accepts commands from Transaction Layer (update location, values)
- Provides asset data to Depreciation Engine and Reports

**Key State Machine:**
```
                    ┌─────────────┐
         ┌─────────►│  conservare │◄────┐
         │          └──────┬──────┘     │
         │                 │            │
    ┌────┴────┐      ┌─────▼─────┐   ┌──┴──┐
    │  activ  │◄────►│transferat │   │casat│
    └────┬────┘      └───────────┘   └──▲──┘
         │                              │
         └──────────────────────────────┘
```

### 3. Transaction Layer

**Purpose:** Record and execute business operations that change asset state or values.

**Boundaries:**
- Owns: `tranzactii` table, transaction validation rules
- Does NOT own: Asset master data (it updates it), nomenclator data
- Each transaction is immutable once recorded

**Interfaces:**
- Command handlers for: intrare, transfer, casare, declasare, reevaluare, modernizare, iesire
- Produces events that update Asset Core
- Provides audit trail for Reports

**Transaction Types:**
| Type | Effect on Asset | Required Fields |
|------|-----------------|-----------------|
| intrare | Creates asset | All asset fields |
| transfer | Changes gestiune/loc | destination gestiune, date, document |
| casare | Sets stare='casat' | date, motiv |
| declasare | Reduces value | new value, date |
| reevaluare | Adjusts value | new value, date |
| modernizare | Increases value | added value, date |
| iesire | Removes from active | date, reason |

### 4. Depreciation Engine

**Purpose:** Calculate and record monthly depreciation for all eligible assets.

**Boundaries:**
- Owns: `amortizari` table, depreciation calculation algorithms
- Does NOT own: Asset master data (reads it), account posting (future feature)
- Pure business logic - no HTTP, no database writes except to amortizari table

**Interfaces:**
- `generateMonthlyDepreciation(year, month)` - batch process
- `calculateAssetDepreciation(asset)` - single asset
- `getDepreciationSchedule(assetId)` - projection

**Calculation Methods (v1: linear only):**
```typescript
// Linear depreciation formula
monthlyDepreciation = inventoryValue / normalDurationMonths

// Constraints:
// - Cannot exceed remaining value
// - Only for assets where amortizabil = true
// - Only for assets with stare = 'activ'
// - Only for periods after dataStartAmortizare
```

### 5. Reporting Layer

**Purpose:** Aggregate and present data for accounting reports.

**Boundaries:**
- Owns: Report generation logic, query optimization
- Does NOT own: Source data (reads from all other layers)
- Read-only - never modifies data

**Interfaces:**
- Report generators for: fisa MF, balanta, jurnal, situatie amortizare, inventar
- Filter/parameter handlers
- Aggregation queries

**Report Dependencies:**
| Report | Reads From |
|--------|------------|
| Fisa MF | mijloace_fixe + tranzactii + amortizari |
| Balanta | mijloace_fixe + gestiuni + clasificari |
| Jurnal | tranzactii + mijloace_fixe |
| Situatie Amortizare | amortizari + mijloace_fixe |
| Inventar | mijloace_fixe + gestiuni + locuri_folosinta |

### 6. API Gateway Layer

**Purpose:** HTTP interface, validation, and routing.

**Boundaries:**
- Owns: Route definitions, request/response transformation, Zod schemas
- Does NOT own: Business logic (delegates to services)
- Thin layer - validation and delegation only

**Interfaces:**
- Hono routes organized by resource
- Zod validators for all inputs
- Consistent response format (ApiResponse<T>)
- Error handling middleware

### 7. Frontend Application Layer

**Purpose:** User interface for data entry, browsing, and reporting.

**Boundaries:**
- Owns: UI components, client-side state, form validation
- Does NOT own: Business logic (server-side), data persistence
- Communicates only via API calls

**Interfaces:**
- React components using shadcn/ui
- TanStack Query for server state
- React Router for navigation
- Form state with React Hook Form + Zod

---

## Data Model Patterns

### Core Entity Relationships

```
                                    ┌─────────────────┐
                                    │   clasificari   │
                                    │    (cod PK)     │
                                    └────────┬────────┘
                                             │ 1:N
┌─────────────────┐     ┌─────────────────┐  │  ┌─────────────────┐
│    gestiuni     │     │  surse_finantare│  │  │     conturi     │
│    (id PK)      │     │    (id PK)      │  │  │    (id PK)      │
└────────┬────────┘     └────────┬────────┘  │  └────────┬────────┘
         │ 1:N                   │ 1:N       │           │ 1:N
         │                       │           │           │
┌────────▼────────┐              │           │           │
│locuri_folosinta │              │           │           │
│gestiune_id (FK) │              │           │           │
└────────┬────────┘              │           │           │
         │ 1:N                   │           │           │
         │                       │           │           │
         │          ┌────────────┴───────────┴───────────┘
         │          │
         │    ┌─────▼─────────────────────────────────────────────┐
         └───►│                   mijloace_fixe                    │
              │  clasificare_cod (FK) ──► clasificari              │
              │  gestiune_id (FK) ──────► gestiuni                 │
              │  loc_folosinta_id (FK) ─► locuri_folosinta         │
              │  sursa_finantare_id (FK)► surse_finantare          │
              │  cont_id (FK) ──────────► conturi                  │
              └─────────────────────┬─────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │ 1:N           │ 1:N           │
              ┌─────▼─────┐   ┌─────▼─────┐   (future)
              │ tranzactii │   │ amortizari │
              │ mf_id (FK) │   │ mf_id (FK) │
              └───────────┘   └───────────┘
```

### Decimal Precision Pattern

For Romanian accounting compliance:
- Values: `DECIMAL(15, 2)` - supports up to 999 trillion RON with 2 decimal places
- Percentages: `DECIMAL(5, 2)` - supports 0.00% to 999.99%

### Audit Trail Pattern

All main tables include:
```typescript
{
  createdAt: datetime('created_at').defaultNow(),
  updatedAt: datetime('updated_at').defaultNow().onUpdateNow(),
}
```

Transactions table adds:
```typescript
{
  userId: int('user_id'), // who performed the operation
}
```

### Soft Delete Pattern

For nomenclators (gestiuni, locuri, surse, conturi):
```typescript
{
  activ: boolean('activ').default(true), // soft delete flag
}
```

For assets, use `stare` enum instead (activ/conservare/casat/etc.)

---

## API Layer Design

### Route Organization (Hono Best Practice)

```
server/src/
├── routes/
│   ├── index.ts           # Main router, mounts all sub-routers
│   ├── clasificari.ts     # GET only (seeded data)
│   ├── gestiuni.ts        # Full CRUD
│   ├── locuri-folosinta.ts
│   ├── surse-finantare.ts
│   ├── conturi.ts
│   ├── mijloace-fixe.ts   # CRUD + business operations
│   ├── tranzactii.ts      # GET only (created via MF operations)
│   ├── amortizare.ts      # Generation + queries
│   └── rapoarte.ts        # All reports
├── services/              # Business logic
│   ├── mijloace-fixe.service.ts
│   ├── tranzactii.service.ts
│   ├── amortizare.service.ts
│   └── rapoarte.service.ts
├── schemas/               # Zod validation schemas
│   ├── mijloc-fix.schema.ts
│   ├── tranzactie.schema.ts
│   └── common.schema.ts
└── db/
    ├── schema.ts          # Drizzle schema definitions
    ├── relations.ts       # Drizzle relations
    └── index.ts           # Database connection
```

### Validation Pattern

Use Zod schemas as single source of truth:
```typescript
// schemas/mijloc-fix.schema.ts
export const createMijlocFixSchema = z.object({
  numarInventar: z.string().min(1).max(50),
  // ... rest of fields
});

// routes/mijloace-fixe.ts
app.post('/', zValidator('json', createMijlocFixSchema), async (c) => {
  const data = c.req.valid('json'); // Fully typed!
  // ...
});
```

### Error Handling Pattern

```typescript
// Consistent error responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Error middleware
app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json({ success: false, errors: formatZodErrors(err) }, 400);
  }
  if (err instanceof BusinessError) {
    return c.json({ success: false, message: err.message }, 400);
  }
  return c.json({ success: false, message: 'Internal server error' }, 500);
});
```

### Pagination Pattern

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Usage in queries
const offset = (page - 1) * pageSize;
const items = await db.select().from(table).limit(pageSize).offset(offset);
const [{ count }] = await db.select({ count: sql`count(*)` }).from(table);
```

---

## Frontend Organization

### Page Structure

```
client/src/
├── pages/
│   ├── Dashboard.tsx
│   ├── mijloace-fixe/
│   │   ├── MijloaceFixeList.tsx      # Data table with filters
│   │   ├── MijlocFixForm.tsx         # Create/Edit form
│   │   ├── MijlocFixDetail.tsx       # Detail view with tabs
│   │   └── FisaMijlocFix.tsx         # Print-friendly report
│   ├── nomenclatoare/
│   │   ├── GestiuniPage.tsx
│   │   ├── LocuriFolosintaPage.tsx
│   │   ├── SurseFinantarePage.tsx
│   │   └── ConturiPage.tsx
│   ├── tranzactii/
│   │   ├── TranzactiiList.tsx
│   │   ├── TransferForm.tsx
│   │   └── CasareForm.tsx
│   ├── amortizare/
│   │   ├── AmortizarePage.tsx
│   │   └── GenereazaAmortizare.tsx
│   └── rapoarte/
│       ├── RapoarteIndex.tsx
│       ├── BalantaRaport.tsx
│       └── JurnalRaport.tsx
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── forms/                        # Reusable form components
│   │   ├── GestiuneSelect.tsx
│   │   ├── ClasificareCombobox.tsx
│   │   └── DatePicker.tsx
│   ├── tables/                       # Data table components
│   │   ├── DataTable.tsx
│   │   ├── ColumnHeader.tsx
│   │   └── Pagination.tsx
│   └── layout/
│       ├── AppLayout.tsx
│       ├── Sidebar.tsx
│       └── Header.tsx
├── hooks/
│   ├── useMijloaceFixe.ts           # TanStack Query hooks
│   ├── useGestiuni.ts
│   └── useAmortizare.ts
├── services/
│   └── api.ts                        # Hono RPC client
└── lib/
    ├── utils.ts                      # Formatting, helpers
    └── types.ts                      # Re-export shared types
```

### Component Hierarchy

```
AppLayout
├── Sidebar (navigation)
├── Header (breadcrumbs, user)
└── Main Content
    └── Page Component
        ├── Page Header (title, actions)
        ├── Filters/Search (if list page)
        ├── Data Table / Form / Report
        └── Pagination (if list page)
```

### State Management Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    TanStack Query                           │
│  (server state: assets, nomenclators, transactions)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Context                            │
│  (UI state: sidebar open, theme, current user)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Component Local State                        │
│  (form inputs, dialog open, selected rows)                  │
└─────────────────────────────────────────────────────────────┘
```

### Form Pattern with React Hook Form + Zod

```tsx
// Reuse Zod schemas from shared package
import { createMijlocFixSchema } from 'shared/schemas';

const form = useForm<z.infer<typeof createMijlocFixSchema>>({
  resolver: zodResolver(createMijlocFixSchema),
  defaultValues: { ... }
});

// Form submission
const mutation = useMutation({
  mutationFn: (data) => api.mijloaceFixe.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['mijloace-fixe'] });
    navigate('/mijloace-fixe');
  }
});
```

---

## Build Order

Based on dependencies between components, here is the recommended implementation sequence:

### Phase 1: Foundation (Week 1)

**1. Database Schema & Migrations**
- Set up Drizzle ORM configuration
- Define all table schemas from spec.md
- Define Drizzle relations
- Create initial migrations
- **Why first:** Everything depends on the data model

**2. Seed Data (Clasificari + Conturi)**
- Seed HG 2139/2004 classification catalog
- Seed standard Romanian chart of accounts
- **Why second:** Assets cannot be created without classification codes

**3. Shared Types**
- Export TypeScript interfaces from schema
- Define DTOs and API response types
- **Why third:** Frontend and backend need shared contracts

### Phase 2: Reference Data CRUD (Week 2)

**4. Gestiuni CRUD (Full Stack)**
- API routes + service
- Frontend list + form
- **Why first in this phase:** Assets require a gestiune

**5. Locuri Folosinta CRUD**
- API routes + service
- Frontend with gestiune filter
- **Why after gestiuni:** Depends on gestiune selection

**6. Surse Finantare CRUD**
- API routes + service
- Frontend list + form
- **Why here:** Independent, needed for asset creation

**7. Conturi CRUD (view/edit only)**
- API routes for listing and updates
- Frontend for viewing chart of accounts
- **Why last in phase:** Seeded data, rarely modified

### Phase 3: Asset Core (Week 3-4)

**8. Asset List View**
- API endpoint with filtering/pagination
- Frontend data table with search
- **Why first:** Core feature, enables testing

**9. Asset Creation Form**
- API endpoint with validation
- Frontend multi-section form
- Combobox for clasificare selection
- Dependent selects (gestiune → loc folosinta)
- **Why after list:** List provides context for created assets

**10. Asset Detail & Edit**
- API endpoint for single asset with relations
- Frontend detail view with tabs
- Edit form with validation
- **Why after create:** Extends create functionality

### Phase 4: Transactions (Week 4-5)

**11. Transfer Operation**
- API endpoint with validation
- Transaction record creation
- Asset update (gestiune change)
- Frontend transfer form
- **Why first in transactions:** Most common operation

**12. Casare Operation**
- API endpoint with validation
- Transaction record creation
- Asset state change (stare = 'casat')
- Frontend casare form
- **Why after transfer:** Similar pattern, simpler logic

**13. Transaction History**
- API endpoint with filters
- Frontend list view
- Link from asset detail
- **Why last in transactions:** Depends on transactions existing

### Phase 5: Depreciation (Week 5-6)

**14. Depreciation Calculation Service**
- Pure TypeScript module
- Linear depreciation formula
- Edge case handling (remaining value, completed assets)
- Unit tests for calculations
- **Why first:** Core business logic, must be correct

**15. Monthly Depreciation Generation**
- Batch processing endpoint
- Database transaction handling
- Progress tracking
- Frontend generation trigger
- **Why after calculation:** Uses calculation service

**16. Depreciation History View**
- API endpoint for depreciation records
- Frontend table per asset
- Aggregate views
- **Why last:** Depends on generated data

### Phase 6: Reporting (Week 6-7)

**17. Fisa Mijlocului Fix**
- Aggregation query
- Formatted report component
- Print styles
- **Why first:** Most useful, tests data completeness

**18. Balanta de Verificare**
- Complex aggregation with grouping
- Filter parameters
- Totals by gestiune/clasificare
- **Why second:** Core accounting report

**19. Jurnal Acte Operate**
- Transaction listing with filters
- Date range parameters
- **Why third:** Simpler aggregation

### Phase 7: Polish (Week 7-8)

**20. Authentication**
- Simple user/password login
- Session management
- Protected routes
- **Why here:** Functional app first, then secure it

**21. Error Handling & Edge Cases**
- API error standardization
- Frontend error boundaries
- Empty states
- Loading states
- **Why last:** Refinement after core features work

---

## Data Flow Diagram

### Asset Creation Flow

```
┌──────────────┐    POST /api/mijloace-fixe    ┌───────────────┐
│   Frontend   │ ─────────────────────────────►│  API Gateway  │
│  (Form)      │   CreateMijlocFixDTO          │  (Hono)       │
└──────────────┘                               └───────┬───────┘
                                                       │
                                               ┌───────▼───────┐
                                               │ Zod Validator │
                                               └───────┬───────┘
                                                       │
                                               ┌───────▼───────┐
                                               │    Service    │
                                               │  - Validate   │
                                               │  - Insert     │
                                               │  - Create txn │
                                               └───────┬───────┘
                                                       │
                         ┌─────────────────────────────┴────────────────┐
                         │                                              │
                 ┌───────▼───────┐                              ┌───────▼───────┐
                 │ mijloace_fixe │                              │  tranzactii   │
                 │   (INSERT)    │                              │  tip=intrare  │
                 └───────────────┘                              └───────────────┘
```

### Depreciation Generation Flow

```
┌──────────────┐   POST /api/amortizare/genereaza   ┌───────────────┐
│   Frontend   │ ──────────────────────────────────►│  API Gateway  │
│  (Button)    │   { luna: 1, an: 2026 }           └───────┬───────┘
└──────────────┘                                           │
                                                   ┌───────▼───────┐
                                                   │  Amortizare   │
                                                   │   Service     │
                                                   └───────┬───────┘
                                                           │
                    1. SELECT active, depreciable assets   │
                    ┌──────────────────────────────────────┘
                    │
            ┌───────▼───────┐
            │ mijloace_fixe │  WHERE stare='activ' AND amortizabil=true
            │   (SELECT)    │  AND valoareAmortizata < valoareInventar
            └───────┬───────┘
                    │
                    │  For each asset:
                    │
            ┌───────▼────────────────────────────────┐
            │         Depreciation Engine            │
            │  - Calculate monthly amount            │
            │  - Check remaining value               │
            │  - Apply business rules                │
            └───────┬────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼───────┐       ┌───────▼───────┐
│  amortizari   │       │ mijloace_fixe │
│   (INSERT)    │       │   (UPDATE)    │
│ luna/an/value │       │ valAmortizata │
└───────────────┘       └───────────────┘
```

### Report Generation Flow

```
┌──────────────┐   GET /api/rapoarte/balanta?params   ┌───────────────┐
│   Frontend   │ ────────────────────────────────────►│  API Gateway  │
│  (Request)   │                                      └───────┬───────┘
└──────────────┘                                              │
       ▲                                              ┌───────▼───────┐
       │                                              │    Rapoarte   │
       │                                              │    Service    │
       │                                              └───────┬───────┘
       │                                                      │
       │                           Complex JOIN + GROUP BY    │
       │                    ┌─────────────────────────────────┘
       │                    │
       │            ┌───────▼───────────────────────────────────────┐
       │            │                    JOIN                        │
       │            │ mijloace_fixe + gestiuni + clasificari + etc   │
       │            └───────────────────────────────────────────────┘
       │                    │
       │                    │  Aggregate by gestiune, clasificare
       │                    │
       │            ┌───────▼───────┐
       │            │   Formatted   │
       │            │    Report     │
       │            │     JSON      │
       └────────────┴───────────────┘
```

---

## Anti-Patterns to Avoid

### 1. Fat Controllers

**Bad:** Business logic in route handlers
```typescript
// DON'T DO THIS
app.post('/transfer', async (c) => {
  const asset = await db.select()...
  if (asset.stare !== 'activ') throw new Error(...);
  // 50 more lines of business logic
});
```

**Good:** Thin routes, logic in services
```typescript
// DO THIS
app.post('/transfer', zValidator('json', transferSchema), async (c) => {
  const data = c.req.valid('json');
  const result = await TransferService.execute(data);
  return c.json({ success: true, data: result });
});
```

### 2. Direct Database Access from Frontend

**Bad:** Embedding queries in React components
**Good:** All data access through API endpoints

### 3. Hardcoded Depreciation Logic

**Bad:** Depreciation formulas scattered across codebase
**Good:** Single `DepreciationEngine` module with all calculation logic

### 4. Missing Transactions for Batch Operations

**Bad:** Monthly depreciation updates without database transaction
```typescript
// DON'T: Individual updates can leave inconsistent state
for (const asset of assets) {
  await db.insert(amortizari)...
  await db.update(mijloaceFixe)...  // What if this fails?
}
```

**Good:** Wrap in transaction
```typescript
// DO: All or nothing
await db.transaction(async (tx) => {
  for (const asset of assets) {
    await tx.insert(amortizari)...
    await tx.update(mijloaceFixe)...
  }
});
```

### 5. Premature Optimization

**Bad:** Adding caching, virtualization before measuring
**Good:** Build simple first, optimize when you have real performance data

---

## Technology Decisions

| Decision | Rationale |
|----------|-----------|
| Drizzle relations over raw JOINs | Type-safe nested queries, cleaner API |
| Zod for validation | Shared between frontend/backend, TypeScript inference |
| TanStack Query for server state | Caching, refetching, optimistic updates built-in |
| shadcn/ui over full component library | Customizable, owns the code, tree-shakeable |
| Services layer over repositories | Simpler for this app size, Drizzle already abstracts DB |

---

## Sources

**Official Documentation (HIGH confidence):**
- [Hono Best Practices](https://hono.dev/docs/guides/best-practices) - Route organization, handler patterns
- [Drizzle ORM Relations](https://orm.drizzle.team/docs/relations) - Relation definitions, query patterns
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table) - Table component patterns

**Industry Patterns (MEDIUM confidence):**
- [SAP FI-AA Tables](https://www.se80.co.uk/sapmodules/f/fi-a/fi-aa-tables-all.htm) - Enterprise asset accounting data model
- [Oracle Fixed Assets Tables](https://docs.oracle.com/cd/E16582_01/doc.91/e15107/set_up_fixed_assets_sys.htm) - Asset lifecycle management
- [Healthcare Asset Management Guide](https://www.netsuite.com/portal/resource/articles/accounting/healthcare-asset-management.shtml) - Healthcare-specific considerations

**Romanian Accounting (MEDIUM confidence):**
- [Romania Corporate Deductions - PWC](https://taxsummaries.pwc.com/romania/corporate/deductions) - Fiscal vs accounting depreciation rules
- [Accounting in Romania - Accace](https://accace.com/accounting-in-romania/) - Romanian accounting standards overview

---

*Research completed: 2026-01-22*
*Confidence: HIGH for architecture patterns, MEDIUM for Romania-specific compliance details*
