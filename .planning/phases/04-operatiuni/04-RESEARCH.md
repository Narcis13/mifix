# Phase 4: Operatiuni - Research

**Researched:** 2026-01-23
**Domain:** Asset lifecycle operations (transfers, disposal, value reduction) with audit trail
**Confidence:** HIGH

## Summary

This phase implements core asset lifecycle operations: transfers between gestiuni (OP-01), transfers within same gestiune between locuri folosinta (OP-02), casare/disposal (OP-03), declasare/value reduction (OP-04), and transaction history display (OP-05). The research confirms the existing tech stack is well-suited for these operations.

Key findings:
- **Database schema needs migration**: The `tranzactii` table is missing `loc_folosinta_sursa_id` and `loc_folosinta_destinatie_id` columns needed for OP-02
- **Drizzle transactions**: Use `db.transaction()` for atomic operations that update both `mijloace_fixe` and create `tranzactii` records
- **Dialog-based forms**: Follow existing project pattern with operation-specific dialogs (TransferDialog, CasareDialog, DeclasareDialog)
- **Timeline component**: Use shadcn-timeline or simple vertical timeline for transaction history on asset detail page

**Primary recommendation:** Implement each operation type as a dedicated dialog component with a corresponding POST endpoint, using Drizzle transactions to ensure atomicity between asset state changes and transaction logging.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.38+ | Database ORM with transactions | Native transaction support, type-safe queries |
| @hono/zod-validator | current | Request validation | Already used for all route validation |
| react-hook-form | 7.x | Form state management | Already used throughout project |
| zod | 3.x | Schema validation | Already used for form and API validation |
| decimal.js (via Money) | current | Financial calculations | Already in shared package for precision |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Dialog | current | Operation forms | All operation dialogs |
| shadcn/ui Card | current | Transaction history display | History timeline items |
| lucide-react | current | Icons for operation types | ArrowRightLeft, Ban, TrendingDown, History |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom timeline | shadcn-timeline (npm) | Additional dependency; simple div-based timeline sufficient for MVP |
| Discriminated union schemas | Separate schemas per operation | Discriminated union more maintainable for similar operation types |

**Installation:**
```bash
# No new packages required - all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
packages/server/src/
  routes/
    operatiuni.ts            # All operation endpoints (transfer, casare, declasare)
  validation/
    operatiuni-schemas.ts    # Zod schemas for each operation type

packages/client/src/
  components/operatiuni/
    TransferGestiuneDialog.tsx    # OP-01: Transfer between gestiuni
    TransferLocDialog.tsx         # OP-02: Transfer within gestiune
    CasareDialog.tsx              # OP-03: Disposal
    DeclasareDialog.tsx           # OP-04: Value reduction
    TranzactiiTimeline.tsx        # OP-05: Transaction history component
  pages/
    MijlocFixDetail.tsx           # Extend with operations section + history tab
```

### Pattern 1: Atomic Operation with Transaction
**What:** Every asset operation must atomically update both the asset state and create an audit record
**When to use:** All operation endpoints (transfer, casare, declasare)
**Example:**
```typescript
// Source: Drizzle ORM official docs - https://orm.drizzle.team/docs/transactions
app.post("/operatiuni/transfer", async (c) => {
  const data = c.req.valid("json");

  await db.transaction(async (tx) => {
    // 1. Validate asset exists and is in valid state
    const [asset] = await tx.select().from(mijloaceFixe).where(eq(mijloaceFixe.id, data.mijlocFixId));
    if (!asset || asset.stare !== "activ") {
      tx.rollback();
    }

    // 2. Update asset (gestiune, locFolosinta, stare)
    await tx.update(mijloaceFixe)
      .set({
        gestiuneId: data.gestiuneDestinatieId,
        locFolosintaId: data.locFolosintaDestinatieId,
        // stare remains "activ" for transfer
      })
      .where(eq(mijloaceFixe.id, data.mijlocFixId));

    // 3. Create transaction record
    await tx.insert(tranzactii).values({
      mijlocFixId: data.mijlocFixId,
      tip: "transfer",
      dataOperare: data.dataOperare,
      gestiuneSursaId: asset.gestiuneId,
      gestiuneDestinatieId: data.gestiuneDestinatieId,
      locFolosintaSursaId: asset.locFolosintaId,
      locFolosintaDestinatieId: data.locFolosintaDestinatieId,
      descriere: data.observatii,
    });
  });

  return c.json({ success: true });
});
```

### Pattern 2: Operation-Specific Dialog
**What:** Each operation type gets its own dialog with relevant fields only
**When to use:** UI for all operations
**Example:**
```typescript
// Source: Project pattern from GestiuniForm.tsx
interface TransferGestiuneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mijlocFix: MijlocFix;
  onSuccess: () => void;
}

export function TransferGestiuneDialog({ open, onOpenChange, mijlocFix, onSuccess }: TransferGestiuneDialogProps) {
  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferGestiuneSchema),
    defaultValues: {
      gestiuneDestinatieId: 0,
      locFolosintaDestinatieId: null,
      dataOperare: new Date().toISOString().split("T")[0],
      observatii: "",
    },
  });

  // Watch gestiuneDestinatie to load locuri
  const gestiuneDestinatieId = useWatch({ control: form.control, name: "gestiuneDestinatieId" });

  // ... load locuri for destination gestiune
  // ... form submission with api.post("/operatiuni/transfer", payload)
}
```

### Pattern 3: Conditional Field Validation with Zod superRefine
**What:** Different operations require different fields; use superRefine for cross-field validation
**When to use:** When validation depends on operation type or other field values
**Example:**
```typescript
// Source: Zod docs - https://zod.dev/api
const transferSchema = z.object({
  mijlocFixId: z.number().min(1),
  tipTransfer: z.enum(["gestiune", "loc"]),
  gestiuneDestinatieId: z.number().optional(),
  locFolosintaDestinatieId: z.number().optional(),
  dataOperare: z.string().min(1, "Data obligatorie"),
  observatii: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.tipTransfer === "gestiune" && !data.gestiuneDestinatieId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Gestiune destinatie obligatorie pentru transfer intre gestiuni",
      path: ["gestiuneDestinatieId"],
    });
  }
  if (data.tipTransfer === "loc" && !data.locFolosintaDestinatieId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Loc folosinta destinatie obligatoriu pentru transfer intern",
      path: ["locFolosintaDestinatieId"],
    });
  }
});
```

### Anti-Patterns to Avoid
- **Direct asset update without transaction log:** Every state change MUST create a tranzactie record
- **Allowing operations on non-active assets:** Validate asset.stare before any operation
- **Mixing operation types in single endpoint:** Keep separate endpoints for clarity and validation
- **Cascading UI state:** Don't update UI optimistically; always wait for server confirmation

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Transaction atomicity | Manual try/catch rollback | Drizzle `db.transaction()` | Automatic rollback on error, proper MySQL transaction handling |
| Decimal precision for declasare | JavaScript arithmetic | Money class (decimal.js) | Floating point errors in value reduction calculations |
| Form state with dependent fields | Manual useState orchestration | useWatch from react-hook-form | Already used in project, handles re-renders efficiently |
| Date formatting | Manual string manipulation | date.toISOString().split("T")[0] | Consistent pattern already in project |

**Key insight:** The project already has established patterns for all complex scenarios. Follow existing patterns rather than inventing new approaches.

## Common Pitfalls

### Pitfall 1: Stale Asset State in UI
**What goes wrong:** User sees outdated asset info after operation completes
**Why it happens:** UI doesn't refresh after successful operation
**How to avoid:** Call `onSuccess()` callback that triggers data refetch in parent component
**Warning signs:** Asset detail page shows old gestiune after transfer

### Pitfall 2: Missing Transaction Record on Error
**What goes wrong:** Asset is updated but transaction record fails, losing audit trail
**Why it happens:** Operations not wrapped in database transaction
**How to avoid:** Always use `db.transaction()` for any operation that modifies both asset and creates log
**Warning signs:** Discrepancy between asset state and transaction history

### Pitfall 3: Operating on Invalid Asset State
**What goes wrong:** User casare's an already-casat asset, or transfers a casat asset
**Why it happens:** No server-side state validation before operation
**How to avoid:** Check asset.stare === "activ" before allowing transfer/declasare; only allow casare on "activ" assets
**Warning signs:** Duplicate transactions for same asset, inconsistent states

### Pitfall 4: Incorrect Decimal Handling in Declasare
**What goes wrong:** Value reduction introduces rounding errors
**Why it happens:** Using JavaScript numbers instead of Money class
**How to avoid:** All monetary calculations through Money class: `currentValue.minus(reductionAmount)`
**Warning signs:** valoareRamasa doesn't match expected value after declasare

### Pitfall 5: Missing locFolosinta Fields in Schema
**What goes wrong:** OP-02 (transfer within gestiune) cannot track source/destination location
**Why it happens:** Database schema missing columns
**How to avoid:** Add migration to include `loc_folosinta_sursa_id` and `loc_folosinta_destinatie_id` in tranzactii table
**Warning signs:** Cannot query transfer history for location changes

### Pitfall 6: LocFolosinta Selection Without Gestiune Context
**What goes wrong:** User can select location from wrong gestiune
**Why it happens:** Not filtering locuri by gestiuneDestinatieId
**How to avoid:** Use useWatch on gestiuneDestinatieId and load corresponding locuri dynamically (existing pattern)
**Warning signs:** Location doesn't belong to destination gestiune after transfer

## Code Examples

Verified patterns from official sources and project codebase:

### Drizzle Transaction with Rollback
```typescript
// Source: https://orm.drizzle.team/docs/transactions
await db.transaction(async (tx) => {
  const [asset] = await tx.select().from(mijloaceFixe).where(eq(mijloaceFixe.id, id));

  // Business logic validation
  if (asset.stare !== "activ") {
    tx.rollback(); // Throws, rolls back all changes
  }

  await tx.update(mijloaceFixe).set({ stare: "casat", dataIesire: new Date() }).where(eq(mijloaceFixe.id, id));
  await tx.insert(tranzactii).values({ mijlocFixId: id, tip: "casare", dataOperare: new Date() });
});
```

### Operation Dialog with Conditional Fields
```typescript
// Source: Project pattern from MijlocFixForm.tsx
const gestiuneDestinatieId = useWatch({ control: form.control, name: "gestiuneDestinatieId" });

useEffect(() => {
  if (gestiuneDestinatieId) {
    api.get<LocFolosinta[]>(`/locuri?gestiuneId=${gestiuneDestinatieId}`).then((res) => {
      if (res.success && res.data) {
        setLocuriDestinatie(res.data.filter((l) => l.activ));
      }
    });
  } else {
    setLocuriDestinatie([]);
  }
  form.setValue("locFolosintaDestinatieId", null);
}, [gestiuneDestinatieId]);
```

### Money Class for Value Reduction
```typescript
// Source: Project pattern from shared/money.ts
const valoareCurenta = Money.fromDb(mijlocFix.valoareRamasa);
const reducere = Money.fromDb(data.valoareReducere);

if (reducere.greaterThan(valoareCurenta)) {
  return c.json({ success: false, message: "Reducerea nu poate depasi valoarea ramasa" }, 400);
}

const valoareNoua = valoareCurenta.minus(reducere);

await db.update(mijloaceFixe).set({
  valoareRamasa: valoareNoua.toDbString(),
}).where(eq(mijloaceFixe.id, data.mijlocFixId));
```

### Simple Timeline Component
```typescript
// Source: Project conventions, no external library needed
function TranzactiiTimeline({ tranzactii }: { tranzactii: Tranzactie[] }) {
  const tipIcons: Record<TipTranzactie, ReactNode> = {
    intrare: <Plus className="h-4 w-4" />,
    transfer: <ArrowRightLeft className="h-4 w-4" />,
    casare: <Ban className="h-4 w-4" />,
    declasare: <TrendingDown className="h-4 w-4" />,
    // ... other types
  };

  return (
    <div className="relative pl-6 space-y-4">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
      {tranzactii.map((tx) => (
        <div key={tx.id} className="relative">
          <div className="absolute -left-4 bg-background p-1 rounded-full border">
            {tipIcons[tx.tip]}
          </div>
          <Card className="ml-4">
            <CardContent className="p-4">
              <div className="flex justify-between">
                <span className="font-medium">{tipLabels[tx.tip]}</span>
                <span className="text-muted-foreground text-sm">
                  {new Date(tx.dataOperare).toLocaleDateString("ro-RO")}
                </span>
              </div>
              {tx.descriere && <p className="text-sm text-muted-foreground mt-1">{tx.descriere}</p>}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SQL transactions | Drizzle db.transaction() | 2024 | Simpler API, automatic rollback |
| yup validation | zod with superRefine | 2023 | Better TypeScript inference, tree-shakeable |
| Separate history table triggers | Application-level transaction logging | Current | More control, works across all databases |

**Deprecated/outdated:**
- None relevant - the project stack is current

## Open Questions

Things that couldn't be fully resolved:

1. **Asset state after transfer**
   - What we know: Transfer changes gestiune/locFolosinta
   - What's unclear: Should stare change to "transferat" temporarily or remain "activ"?
   - Recommendation: Keep stare as "activ" since asset is still functional; "transferat" is only for permanent transfers out of organization

2. **Declasare effect on amortization**
   - What we know: Declasare reduces valoareRamasa
   - What's unclear: Should cotaAmortizareLunara be recalculated after declasare?
   - Recommendation: Recalculate based on reduced value and remaining months (requires business clarification)

3. **Multiple operations same day**
   - What we know: Each operation creates a transaction record
   - What's unclear: Should there be rate limiting or warnings?
   - Recommendation: Allow multiple operations; transaction history provides audit trail

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM Transactions](https://orm.drizzle.team/docs/transactions) - Transaction API, MySQL configuration, rollback handling
- [Zod API Documentation](https://zod.dev/api) - superRefine, discriminatedUnion for conditional validation
- Project codebase analysis - schema.ts, mijloace-fixe.ts, MijlocFixForm.tsx patterns

### Secondary (MEDIUM confidence)
- [React Hook Form Advanced Usage](https://react-hook-form.com/advanced-usage) - useWatch for dependent fields
- [Conditional Validation with Zod + RHF](https://micahjon.com/2023/form-validation-with-zod/) - superRefine patterns

### Tertiary (LOW confidence)
- [shadcn-timeline](https://github.com/timDeHof/shadcn-timeline) - Timeline component option (decided not needed)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project and verified
- Architecture: HIGH - Follows established project patterns (dialog forms, api client, transaction logging)
- Pitfalls: HIGH - Based on direct codebase analysis (missing schema columns, existing patterns)

**Research date:** 2026-01-23
**Valid until:** 30 days (stable domain, established patterns)

## Schema Migration Required

**IMPORTANT:** Before implementing OP-02, the following migration is needed:

```typescript
// packages/server/src/db/schema.ts - Add to tranzactii table
locFolosintaSursaId: int("loc_folosinta_sursa_id"),
locFolosintaDestinatieId: int("loc_folosinta_destinatie_id"),
```

Then run `bun run db:push` to apply migration.
