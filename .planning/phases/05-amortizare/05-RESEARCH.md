# Phase 5: Amortizare - Research

**Researched:** 2026-01-24
**Domain:** Monthly linear depreciation calculation and tracking for fixed assets
**Confidence:** HIGH

## Summary

This phase implements monthly depreciation (amortizare) for fixed assets: calculating linear depreciation (AMO-01), batch generation for all active assets (AMO-02), updating asset values (AMO-03), per-asset history view (AMO-04), monthly/yearly summary view (AMO-05), and preventing over-depreciation (AMO-06). The existing codebase already has foundational infrastructure in place.

Key findings:
- **Schema already exists**: The `amortizari` table is fully defined with all required fields (valoareLunara, valoareCumulata, valoareRamasa, an, luna, etc.)
- **Money class ready**: `Money.calculateMonthlyDepreciation()` already exists for linear depreciation calculation
- **Batch processing pattern**: Use Drizzle transactions with iterative inserts; single transaction for all assets ensures atomicity
- **Unique constraint needed**: Add composite index on (mijlocFixId, an, luna) to prevent duplicate depreciation entries
- **Final month handling**: Calculate remaining value for last month to avoid over-depreciation (AMO-06)

**Primary recommendation:** Implement a single batch endpoint POST /amortizari/genereaza that calculates depreciation for all eligible assets for a given month/year, using a database transaction to ensure atomicity. Use the existing Money class for all calculations to maintain decimal precision.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.x | Database ORM with transactions | Native transaction support, batch inserts |
| decimal.js (via Money) | current | Financial calculations | Already integrated, prevents precision loss |
| @hono/zod-validator | current | Request validation | Already used for all route validation |
| react-hook-form | 7.x | Form state management | Already used throughout project |
| zod | 3.x | Schema validation | Already used for form and API validation |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | current | Toast notifications | Success/error feedback for batch operations |
| shadcn/ui Dialog | current | Month/year selection form | Batch generation trigger |
| shadcn/ui Card | current | Summary displays | Monthly/yearly depreciation totals |
| shadcn/ui Table | current | Depreciation history display | Per-asset and summary views |
| lucide-react | current | Icons | Calculator, History, TrendingDown |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Iterative inserts in transaction | Drizzle batch API | Batch API not fully supported for MySQL with returning |
| Simple table for history | Virtual scrolling (tanstack-virtual) | Overkill for depreciation records (max 12*years entries) |
| Manual month calculation | date-fns | Additional dependency; native Date sufficient for month/year handling |

**Installation:**
```bash
# No new packages required - all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
packages/server/src/
  routes/
    amortizari.ts             # Depreciation endpoints (generate, history, summary)
  validation/
    amortizari-schemas.ts     # Zod schemas for batch generation request

packages/client/src/
  components/amortizare/
    GenereazaAmortizareDialog.tsx   # AMO-02: Month/year selection dialog
    AmortizariTable.tsx             # AMO-04: Per-asset depreciation history table
    AmortizariSummary.tsx           # AMO-05: Monthly/yearly summary component
  pages/
    Amortizare.tsx                  # Summary dashboard with batch generation trigger
```

### Pattern 1: Linear Depreciation Calculation with Final Month Protection
**What:** Calculate monthly depreciation as valoareInventar / durataNormala, but for final month use remaining value
**When to use:** AMO-01, AMO-06 - Every depreciation calculation
**Example:**
```typescript
// Source: Project pattern from shared/money.ts + accounting rules
function calculateDepreciation(
  valoareInventar: Money,
  valoareAmortizataCumulata: Money,
  durataNormala: number,
  durataRamasa: number
): Money {
  // Calculate standard monthly depreciation
  const cotaLunara = valoareInventar.dividedBy(durataNormala);

  // Calculate remaining value to depreciate
  const valoareRamasa = valoareInventar.minus(valoareAmortizataCumulata);

  // AMO-06: Final month protection - don't exceed remaining value
  if (durataRamasa === 1 || cotaLunara.greaterThan(valoareRamasa)) {
    return valoareRamasa; // Last month: depreciate only what remains
  }

  return cotaLunara;
}
```

### Pattern 2: Batch Generation with Atomic Transaction
**What:** Generate depreciation for all eligible assets in a single database transaction
**When to use:** AMO-02 - Batch generation endpoint
**Example:**
```typescript
// Source: Drizzle ORM official docs + project patterns
app.post("/amortizari/genereaza", async (c) => {
  const { an, luna } = c.req.valid("json");

  const result = await db.transaction(async (tx) => {
    // 1. Get all eligible assets (active, depreciable, has remaining value)
    const assets = await tx
      .select()
      .from(mijloaceFixe)
      .where(
        and(
          eq(mijloaceFixe.stare, "activ"),
          eq(mijloaceFixe.eAmortizabil, true),
          gt(mijloaceFixe.valoareRamasa, 0)
        )
      );

    // 2. Check for existing entries for this month (prevent duplicates)
    const existing = await tx
      .select({ mijlocFixId: amortizari.mijlocFixId })
      .from(amortizari)
      .where(and(eq(amortizari.an, an), eq(amortizari.luna, luna)));
    const existingIds = new Set(existing.map((e) => e.mijlocFixId));

    // 3. Calculate and insert depreciation for each asset
    const toInsert = [];
    const toUpdate = [];

    for (const asset of assets) {
      if (existingIds.has(asset.id)) continue; // Skip already processed

      const valoareInventar = Money.fromDb(asset.valoareInventar);
      const valoareAmortizataCurenta = Money.fromDb(asset.valoareAmortizata);
      const valoareRamasaCurenta = Money.fromDb(asset.valoareRamasa);

      // Calculate monthly depreciation with final month protection
      const cotaLunara = valoareInventar.dividedBy(asset.durataNormala);
      const amortizareLunara = cotaLunara.greaterThan(valoareRamasaCurenta)
        ? valoareRamasaCurenta // Final month: take remaining only
        : cotaLunara;

      const nouaValoareAmortizata = valoareAmortizataCurenta.plus(amortizareLunara);
      const nouaValoareRamasa = valoareInventar.minus(nouaValoareAmortizata);

      toInsert.push({
        mijlocFixId: asset.id,
        an,
        luna,
        valoareLunara: amortizareLunara.toDbString(),
        valoareCumulata: nouaValoareAmortizata.toDbString(),
        valoareRamasa: nouaValoareRamasa.toDbString(),
        valoareInventar: asset.valoareInventar,
        durataRamasa: asset.durataRamasa - 1,
        calculat: true,
        dataCalcul: new Date(),
      });

      toUpdate.push({
        id: asset.id,
        valoareAmortizata: nouaValoareAmortizata.toDbString(),
        valoareRamasa: nouaValoareRamasa.toDbString(),
        durataRamasa: asset.durataRamasa - 1,
      });
    }

    // 4. Batch insert depreciation records
    if (toInsert.length > 0) {
      await tx.insert(amortizari).values(toInsert);
    }

    // 5. Update assets (use CASE statement for batch update)
    for (const update of toUpdate) {
      await tx
        .update(mijloaceFixe)
        .set({
          valoareAmortizata: update.valoareAmortizata,
          valoareRamasa: update.valoareRamasa,
          durataRamasa: update.durataRamasa,
        })
        .where(eq(mijloaceFixe.id, update.id));
    }

    return { processed: toInsert.length, skipped: existingIds.size };
  });

  return c.json({ success: true, data: result });
});
```

### Pattern 3: History Query with Aggregation
**What:** Query depreciation history with monthly totals and cumulative values
**When to use:** AMO-04, AMO-05 - History views
**Example:**
```typescript
// Source: Drizzle ORM docs - aggregation patterns
// Per-asset history (AMO-04)
const perAssetHistory = await db
  .select()
  .from(amortizari)
  .where(eq(amortizari.mijlocFixId, mijlocFixId))
  .orderBy(desc(amortizari.an), desc(amortizari.luna));

// Monthly summary across all assets (AMO-05)
const monthlySummary = await db
  .select({
    an: amortizari.an,
    luna: amortizari.luna,
    totalLunar: sql<string>`sum(${amortizari.valoareLunara})`,
    numarActive: sql<number>`count(distinct ${amortizari.mijlocFixId})`,
  })
  .from(amortizari)
  .groupBy(amortizari.an, amortizari.luna)
  .orderBy(desc(amortizari.an), desc(amortizari.luna));
```

### Anti-Patterns to Avoid
- **Generating depreciation outside transaction:** All inserts + asset updates MUST be in single transaction
- **JavaScript arithmetic for money:** Always use Money class for all calculations
- **Allowing duplicate entries:** Check existing entries for month/year before generating
- **Ignoring final month:** Must use remaining value, not standard rate, for last month
- **Updating assets without history:** Every value change must have corresponding amortizari record

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal division | `value / months` | `Money.dividedBy()` | Floating point errors accumulate over depreciation lifecycle |
| Month/year selection | Custom date inputs | Two simple number selects | No need for full date picker, just month (1-12) and year |
| Duplicate prevention | Application logic only | DB unique constraint + check | Database-level protection more reliable |
| Batch update many rows | Loop with individual updates | CASE statement or transaction batch | Much faster, fewer round trips |

**Key insight:** Linear depreciation is mathematically simple but precision is critical. The Money class already handles decimal.js integration - use it for every calculation.

## Common Pitfalls

### Pitfall 1: Floating Point Accumulation Errors
**What goes wrong:** After 60 months of depreciation, cumulative value doesn't match expected
**Why it happens:** Using JavaScript numbers instead of decimal.js
**How to avoid:** All calculations through Money class, never use Number for intermediate steps
**Warning signs:** valoareAmortizata + valoareRamasa !== valoareInventar after many months

### Pitfall 2: Over-Depreciation in Final Month
**What goes wrong:** Asset has negative remaining value
**Why it happens:** Applying standard monthly rate when remaining is less than rate
**How to avoid:** Always check: if (cotaLunara > valoareRamasa) use valoareRamasa instead
**Warning signs:** valoareRamasa becomes negative, or valoareAmortizata > valoareInventar

### Pitfall 3: Duplicate Depreciation Entries
**What goes wrong:** Same asset has two entries for same month/year
**Why it happens:** Batch generation run twice for same period
**How to avoid:** Check existing entries before insert, add DB unique constraint on (mijlocFixId, an, luna)
**Warning signs:** Double depreciation values in history, accounting discrepancies

### Pitfall 4: Race Condition in Batch Generation
**What goes wrong:** Two simultaneous batch runs create duplicate entries
**Why it happens:** Check-then-insert not atomic
**How to avoid:** Use database unique constraint; transaction will fail if duplicate attempted
**Warning signs:** Sporadic duplicate key errors in logs

### Pitfall 5: Forgetting to Update Asset After Depreciation
**What goes wrong:** amortizari records created but mijloaceFixe values unchanged
**Why it happens:** Insert without corresponding update in same transaction
**How to avoid:** Both operations in same transaction, verify both complete
**Warning signs:** Asset valoareRamasa doesn't decrease after batch generation

### Pitfall 6: Depreciation on Non-Eligible Assets
**What goes wrong:** Depreciation calculated for casat or non-amortizable assets
**Why it happens:** Insufficient filtering in batch query
**How to avoid:** Filter: stare = 'activ' AND eAmortizabil = true AND valoareRamasa > 0
**Warning signs:** Depreciation entries for assets with stare !== 'activ'

## Code Examples

Verified patterns from official sources and project codebase:

### Money Class for Depreciation Calculation
```typescript
// Source: Project pattern from shared/money.ts
const valoareInventar = Money.fromDb(asset.valoareInventar);
const valoareAmortizataCurenta = Money.fromDb(asset.valoareAmortizata);
const valoareRamasaCurenta = Money.fromDb(asset.valoareRamasa);

// Calculate monthly depreciation (already exists in Money class)
const cotaLunara = Money.calculateMonthlyDepreciation(valoareInventar, asset.durataNormala);

// AMO-06: Final month protection
const amortizareLunara = cotaLunara.greaterThan(valoareRamasaCurenta)
  ? valoareRamasaCurenta
  : cotaLunara;

// Calculate new values
const nouaValoareAmortizata = valoareAmortizataCurenta.plus(amortizareLunara);
const nouaValoareRamasa = valoareRamasaCurenta.minus(amortizareLunara);

// Output for database
const dbValues = {
  valoareLunara: amortizareLunara.toDbString(),
  valoareCumulata: nouaValoareAmortizata.toDbString(),
  valoareRamasa: nouaValoareRamasa.toDbString(),
};
```

### Batch Insert in Transaction
```typescript
// Source: Drizzle ORM docs - transactions + batch insert
await db.transaction(async (tx) => {
  // Prepare all depreciation records
  const records = assets.map((asset) => ({
    mijlocFixId: asset.id,
    an,
    luna,
    valoareLunara: calculateDepreciation(asset).toDbString(),
    valoareCumulata: newCumulativeValue(asset).toDbString(),
    valoareRamasa: newRemainingValue(asset).toDbString(),
    valoareInventar: asset.valoareInventar,
    durataRamasa: asset.durataRamasa - 1,
    calculat: true,
    dataCalcul: new Date(),
  }));

  // Single batch insert
  if (records.length > 0) {
    await tx.insert(amortizari).values(records);
  }

  // Update all assets
  for (const record of records) {
    await tx
      .update(mijloaceFixe)
      .set({
        valoareAmortizata: record.valoareCumulata,
        valoareRamasa: record.valoareRamasa,
        durataRamasa: record.durataRamasa,
      })
      .where(eq(mijloaceFixe.id, record.mijlocFixId));
  }
});
```

### Aggregation Query for Summary View
```typescript
// Source: Drizzle ORM docs - groupBy with aggregation
const yearlySummary = await db
  .select({
    an: amortizari.an,
    totalAnual: sql<string>`cast(sum(${amortizari.valoareLunara}) as decimal(15,2))`,
    numarActive: sql<number>`count(distinct ${amortizari.mijlocFixId})`,
    numarInregistrari: sql<number>`count(*)`,
  })
  .from(amortizari)
  .groupBy(amortizari.an)
  .orderBy(desc(amortizari.an));
```

### Dialog for Month/Year Selection
```typescript
// Source: Project pattern from existing dialogs
interface GenereazaAmortizareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const formSchema = z.object({
  an: z.number().min(2020).max(currentYear + 1),
  luna: z.number().min(1).max(12),
});

// Form with two simple selects for month and year
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stored procedures for batch | Application-level transaction | Current | More portable, easier to debug |
| Cron-based auto-generation | Manual trigger with confirmation | Current | User control, prevents accidental runs |
| Individual record updates | Batch operations in transaction | 2024 | Performance, atomicity |

**Deprecated/outdated:**
- None relevant - linear depreciation calculation is stable accounting domain

## Open Questions

Things that couldn't be fully resolved:

1. **Retroactive Depreciation**
   - What we know: User can select any month/year for generation
   - What's unclear: Should system allow generating for past months that were skipped?
   - Recommendation: Allow it - user may need to catch up; validate order isn't important for linear method

2. **Asset Acquired Mid-Month**
   - What we know: dataAchizitie has full date, but depreciation is monthly
   - What's unclear: Should first month be prorated?
   - Recommendation: Start depreciation from month following acquisition (common Romanian accounting practice)

3. **Reevaluare Impact on Depreciation**
   - What we know: Reevaluare changes valoareInventar
   - What's unclear: How does this affect ongoing depreciation calculations?
   - Recommendation: Recalculate cotaLunara based on new value and remaining months; defer to future phase

4. **Viewing Already-Processed Months**
   - What we know: Check prevents duplicate generation
   - What's unclear: How to show user which months are already processed?
   - Recommendation: Add "already processed" indicator in month selection UI

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM Transactions](https://context7.com/drizzle-team/drizzle-orm-docs) - Transaction API, batch insert, groupBy aggregation
- Project codebase analysis - schema.ts (amortizari table), money.ts (calculateMonthlyDepreciation), operatiuni.ts (transaction patterns)
- Romanian accounting standards for linear depreciation (amortizare liniara)

### Secondary (MEDIUM confidence)
- [Drizzle ORM Batch Operations](https://context7.com/drizzle-team/drizzle-orm-docs) - Batch insert with values array
- Phase 4 research patterns - Dialog-based operations, atomic transactions

### Tertiary (LOW confidence)
- None - domain is well-understood from codebase and accounting standards

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project and verified
- Architecture: HIGH - Follows established project patterns (transactions, Money class, dialogs)
- Pitfalls: HIGH - Based on accounting domain knowledge and codebase analysis

**Research date:** 2026-01-24
**Valid until:** 60 days (stable domain, mathematical formula doesn't change)

## Schema Validation

**CONFIRMED:** The `amortizari` table already exists with all required fields:

```typescript
// packages/server/src/db/schema.ts - Already present
export const amortizari = mysqlTable("amortizari", {
  id: int("id").primaryKey().autoincrement(),
  mijlocFixId: int("mijloc_fix_id").notNull(),
  an: int("an").notNull(),
  luna: int("luna").notNull(),
  valoareLunara: decimal("valoare_lunara", { precision: 15, scale: 2 }).notNull(),
  valoareCumulata: decimal("valoare_cumulata", { precision: 15, scale: 2 }).notNull(),
  valoareRamasa: decimal("valoare_ramasa", { precision: 15, scale: 2 }).notNull(),
  valoareInventar: decimal("valoare_inventar", { precision: 15, scale: 2 }).notNull(),
  durataRamasa: int("durata_ramasa").notNull(),
  calculat: boolean("calculat").default(false),
  dataCalcul: timestamp("data_calcul"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_amortizari_mijloc_fix_an_luna").on(table.mijlocFixId, table.an, table.luna),
]);
```

**RECOMMENDATION:** Add unique constraint to prevent duplicates:
```typescript
// Add to table definition
uniqueIndex("uniq_amortizari_mijloc_fix_an_luna").on(table.mijlocFixId, table.an, table.luna),
```

## API Endpoints Required

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/amortizari/genereaza` | POST | Batch generate depreciation | `{ an: number, luna: number }` | `{ processed: number, skipped: number }` |
| `/amortizari/istoric/:mijlocFixId` | GET | Per-asset depreciation history | - | `Amortizare[]` |
| `/amortizari/sumar` | GET | Monthly/yearly summary | `?an=2026` (optional) | Summary data |
| `/amortizari/verificare` | GET | Check which months are processed | `?an=2026` | `{ luna: number, procesat: boolean }[]` |

## UI Components Required

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| GenereazaAmortizareDialog | Trigger batch generation | Month/year selects, confirmation, loading state |
| AmortizariTable | Display depreciation history | Sortable, shows monthly values, running totals |
| AmortizariSummary | Dashboard summary cards | Total by year, total by month, count of assets |
| AmortizarePage | Main depreciation management page | Generation trigger, summary view, navigation to details |
