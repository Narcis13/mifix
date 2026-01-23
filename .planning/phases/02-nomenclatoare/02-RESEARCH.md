# Phase 2: Nomenclatoare - Research

**Researched:** 2026-01-23
**Domain:** CRUD Operations, Reference Data Management, React Forms & Tables
**Confidence:** HIGH

## Summary

Phase 2 implements CRUD operations for five nomenclator (reference data) tables: gestiuni, locuri de folosinta, surse finantare, conturi, and clasificare HG 2139/2004. The existing database schema from Phase 1 already defines these tables with proper relationships. This phase requires building the API routes with Drizzle ORM, validation with Zod, and React UI with shadcn/ui components (tables, forms, dialogs).

The standard approach uses Hono routes with `@hono/zod-validator` for API validation, `drizzle-zod` to generate Zod schemas from Drizzle schema, TanStack Table for data display, and react-hook-form with shadcn/ui Form components for data entry. The key challenge is implementing dependent selects (locuri de folosinta depends on gestiuni) and preloading the HG 2139/2004 classification catalog (approximately 2000+ entries).

**Primary recommendation:** Build a consistent CRUD pattern for all nomenclatoare using a shared DataTable component with TanStack Table, Dialog-based forms with react-hook-form + Zod, and Hono API routes with drizzle-zod validation. Add client-side routing with React Router v7 for navigation between nomenclatoare.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | 0.45.x | Database operations (CRUD) | Type-safe, SQL-like, already configured |
| Hono | 4.x | API routing | Already configured, lightweight |
| React | 19.x | UI framework | Already configured |
| shadcn/ui | latest | UI components | Already initialized with Button |
| Zod | 3.x | Schema validation | Industry standard, integrates with everything |

### New Dependencies Required

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hono/zod-validator | latest | API request validation | Every POST/PUT endpoint |
| drizzle-zod | latest | Generate Zod from Drizzle schema | API validation, type consistency |
| @tanstack/react-table | 8.x | Data table functionality | All nomenclator list views |
| react-hook-form | 7.x | Form state management | All create/edit forms |
| @hookform/resolvers | latest | Zod integration for RHF | Form validation |
| react-router-dom | 7.x | Client-side routing | Navigation between nomenclatoare |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Router v7 | TanStack Router | TanStack better types but more complex setup, React Router v7 is simpler and widely known |
| TanStack Table | AG Grid / MUI DataGrid | TanStack is headless, integrates with shadcn/ui perfectly |
| react-hook-form | TanStack Form | RHF more mature, better shadcn/ui docs |
| Dialog forms | Page-based forms | Dialogs keep user context, better UX for simple CRUD |

**Installation:**

```bash
# Server package
cd packages/server
bun add @hono/zod-validator drizzle-zod

# Client package
cd packages/client
bun add @tanstack/react-table react-hook-form @hookform/resolvers zod react-router-dom
bunx shadcn@latest add table dialog form input select label textarea
```

## Architecture Patterns

### Recommended Project Structure

```
packages/
├── server/
│   └── src/
│       ├── db/
│       │   ├── index.ts          # DB connection (exists)
│       │   └── schema.ts         # Drizzle schema (exists)
│       ├── routes/
│       │   ├── health.ts         # Health routes (exists)
│       │   ├── gestiuni.ts       # Gestiuni CRUD routes
│       │   ├── locuri.ts         # Locuri folosinta CRUD routes
│       │   ├── surse.ts          # Surse finantare CRUD routes
│       │   ├── conturi.ts        # Conturi CRUD routes
│       │   └── clasificari.ts    # Clasificari read-only routes
│       ├── validation/
│       │   └── schemas.ts        # drizzle-zod generated schemas
│       └── index.ts              # Mount all routes
│
├── client/
│   └── src/
│       ├── components/
│       │   ├── ui/               # shadcn/ui components
│       │   ├── data-table/       # Reusable DataTable component
│       │   │   ├── DataTable.tsx
│       │   │   ├── DataTablePagination.tsx
│       │   │   └── DataTableColumnHeader.tsx
│       │   └── nomenclatoare/    # Nomenclator-specific components
│       │       ├── GestiuniTable.tsx
│       │       ├── GestiuniForm.tsx
│       │       ├── LocuriTable.tsx
│       │       └── ...
│       ├── pages/
│       │   ├── Gestiuni.tsx
│       │   ├── Locuri.tsx
│       │   ├── SurseFinantare.tsx
│       │   ├── Conturi.tsx
│       │   └── Clasificari.tsx
│       ├── hooks/
│       │   └── useNomenclator.ts  # Generic CRUD hook
│       ├── lib/
│       │   ├── utils.ts          # cn() helper (exists)
│       │   └── api.ts            # API client functions
│       ├── App.tsx
│       └── main.tsx
│
└── shared/
    └── src/
        └── types/
            └── index.ts          # Entity types (exists)
```

### Pattern 1: Hono CRUD Route with Zod Validation

**What:** Standard CRUD route pattern with validation
**When to use:** Every nomenclator API route

```typescript
// packages/server/src/routes/gestiuni.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { gestiuni } from "../db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import type { ApiResponse, Gestiune } from "shared";

const app = new Hono();

// Generate Zod schemas from Drizzle schema
const insertGestiuneSchema = createInsertSchema(gestiuni, {
  cod: (schema) => schema.min(1, "Codul este obligatoriu").max(20),
  denumire: (schema) => schema.min(1, "Denumirea este obligatorie").max(200),
});

const updateGestiuneSchema = insertGestiuneSchema.partial().omit({ id: true });

// GET all
app.get("/", async (c) => {
  const result = await db.select().from(gestiuni).orderBy(gestiuni.cod);
  const response: ApiResponse<Gestiune[]> = {
    success: true,
    data: result.map(serializeGestiune),
  };
  return c.json(response);
});

// GET by id
app.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const [result] = await db.select().from(gestiuni).where(eq(gestiuni.id, id));
  if (!result) {
    return c.json({ success: false, message: "Nu exista" }, 404);
  }
  return c.json({ success: true, data: serializeGestiune(result) });
});

// POST create
app.post(
  "/",
  zValidator("json", insertGestiuneSchema),
  async (c) => {
    const data = c.req.valid("json");
    const [result] = await db.insert(gestiuni).values(data).$returningId();
    return c.json({ success: true, data: { id: result.id } }, 201);
  }
);

// PUT update
app.put(
  "/:id",
  zValidator("json", updateGestiuneSchema),
  async (c) => {
    const id = parseInt(c.req.param("id"));
    const data = c.req.valid("json");
    await db.update(gestiuni).set(data).where(eq(gestiuni.id, id));
    return c.json({ success: true });
  }
);

// DELETE (soft delete - set activ = false)
app.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  await db.update(gestiuni).set({ activ: false }).where(eq(gestiuni.id, id));
  return c.json({ success: true });
});

function serializeGestiune(g: typeof gestiuni.$inferSelect): Gestiune {
  return {
    id: g.id,
    cod: g.cod,
    denumire: g.denumire,
    responsabil: g.responsabil ?? undefined,
    activ: g.activ ?? true,
    createdAt: g.createdAt?.toISOString(),
    updatedAt: g.updatedAt?.toISOString(),
  };
}

export { app as gestiuniRoutes };
```

### Pattern 2: DataTable with TanStack Table

**What:** Reusable data table component with sorting, filtering, pagination
**When to use:** All nomenclator list views

```typescript
// packages/client/src/components/data-table/DataTable.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Cauta...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  });

  return (
    <div className="space-y-4">
      {searchKey && (
        <Input
          placeholder={searchPlaceholder}
          value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn(searchKey)?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nu exista date.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Inapoi
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Inainte
        </Button>
      </div>
    </div>
  );
}
```

### Pattern 3: Dialog Form with react-hook-form

**What:** Modal form for create/edit operations
**When to use:** All nomenclator forms

```typescript
// packages/client/src/components/nomenclatoare/GestiuniForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Gestiune } from "shared";

const formSchema = z.object({
  cod: z.string().min(1, "Codul este obligatoriu").max(20),
  denumire: z.string().min(1, "Denumirea este obligatorie").max(200),
  responsabil: z.string().max(200).optional(),
  activ: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface GestiuniFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gestiune?: Gestiune | null;
  onSubmit: (data: FormValues) => Promise<void>;
}

export function GestiuniForm({
  open,
  onOpenChange,
  gestiune,
  onSubmit,
}: GestiuniFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cod: gestiune?.cod ?? "",
      denumire: gestiune?.denumire ?? "",
      responsabil: gestiune?.responsabil ?? "",
      activ: gestiune?.activ ?? true,
    },
  });

  const handleSubmit = async (data: FormValues) => {
    await onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {gestiune ? "Editeaza Gestiune" : "Adauga Gestiune"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cod</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ex: GEST001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="denumire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Denumire</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Denumire gestiune" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responsabil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsabil</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nume responsabil" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activ"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Activ</FormLabel>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Anuleaza
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Se salveaza..." : "Salveaza"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 4: Dependent Select (Locuri Folosinta depends on Gestiune)

**What:** Cascading dropdown where options depend on another field value
**When to use:** Locuri folosinta form (depends on gestiune selection)

```typescript
// packages/client/src/components/nomenclatoare/LocuriForm.tsx
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Gestiune } from "shared";

const formSchema = z.object({
  gestiuneId: z.number({ required_error: "Selecteaza o gestiune" }),
  cod: z.string().min(1).max(20),
  denumire: z.string().min(1).max(200),
  activ: z.boolean().default(true),
});

interface LocuriFormProps {
  gestiuni: Gestiune[];
  // ... other props
}

export function LocuriForm({ gestiuni }: LocuriFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gestiuneId: undefined,
      cod: "",
      denumire: "",
      activ: true,
    },
  });

  // Watch gestiuneId changes for dependent logic
  const selectedGestiuneId = useWatch({
    control: form.control,
    name: "gestiuneId",
  });

  // Filter active gestiuni for select options
  const activeGestiuni = gestiuni.filter((g) => g.activ);

  return (
    <FormField
      control={form.control}
      name="gestiuneId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Gestiune</FormLabel>
          <Select
            onValueChange={(value) => field.onChange(parseInt(value))}
            value={field.value?.toString()}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecteaza gestiunea" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {activeGestiuni.map((gestiune) => (
                <SelectItem key={gestiune.id} value={gestiune.id.toString()}>
                  {gestiune.cod} - {gestiune.denumire}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

### Pattern 5: React Router v7 Setup

**What:** Client-side routing for SPA navigation
**When to use:** Navigation between nomenclatoare pages

```typescript
// packages/client/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import { Gestiuni } from "./pages/Gestiuni";
import { Locuri } from "./pages/Locuri";
import { SurseFinantare } from "./pages/SurseFinantare";
import { Conturi } from "./pages/Conturi";
import { Clasificari } from "./pages/Clasificari";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/nomenclatoare">
          <Route path="gestiuni" element={<Gestiuni />} />
          <Route path="locuri" element={<Locuri />} />
          <Route path="surse" element={<SurseFinantare />} />
          <Route path="conturi" element={<Conturi />} />
          <Route path="clasificari" element={<Clasificari />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
```

### Anti-Patterns to Avoid

- **Duplicating validation:** Define Zod schemas once with drizzle-zod, share between server and client via shared package
- **Hardcoded API URLs:** Use environment variables or relative paths with Vite proxy
- **Loading all clasificari at once:** Implement server-side search/pagination for HG 2139/2004 catalog (2000+ entries)
- **Soft delete without filter:** Always filter by `activ = true` in list views by default
- **No optimistic updates:** Show loading states, disable buttons during submission

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state management | useState for each field | react-hook-form | Re-renders, validation complexity |
| Table sorting/filtering | Manual array manipulation | TanStack Table | Edge cases, performance |
| Schema validation | Manual if/else checks | Zod | Type inference, error messages |
| Modal state | Manual open/close state | shadcn Dialog | Accessibility, focus trap |
| DB to Zod schema | Manual schema duplication | drizzle-zod | Schema drift, maintenance |
| API validation | Manual body parsing | @hono/zod-validator | Security, type safety |
| Pagination | Manual slice/offset | TanStack Table | Edge cases, UI state |

**Key insight:** The CRUD pattern is repetitive. Build reusable components (DataTable, FormDialog) and use them consistently across all 5 nomenclatoare. The effort is in the first one; the rest follow the pattern.

## Common Pitfalls

### Pitfall 1: MySQL $returningId vs RETURNING

**What goes wrong:** Expecting PostgreSQL-style RETURNING clause
**Why it happens:** MySQL doesn't support RETURNING, Drizzle uses different approach
**How to avoid:**
- Use `$returningId()` for insert operations
- It returns `{ id: number }[]` for autoincrement columns
- For non-autoincrement PKs, you need different handling
**Warning signs:** Undefined id after insert

### Pitfall 2: Zod Schema Mismatch with FormField defaultValues

**What goes wrong:** Form doesn't submit, validation errors
**Why it happens:** defaultValues don't match Zod schema types (e.g., undefined vs optional string)
**How to avoid:**
- Use `z.string().optional().default("")` for optional text fields
- Use `z.number()` not `z.string()` for numeric IDs
- Ensure defaultValues match schema exactly
**Warning signs:** "Expected number, received string" errors

### Pitfall 3: TanStack Table Column Keys

**What goes wrong:** Columns don't sort or filter
**Why it happens:** `accessorKey` must match data object property name exactly
**How to avoid:**
- Use `accessorKey: "denumire"` not `accessorKey: "Denumire"`
- For nested data, use `accessorFn: (row) => row.gestiune?.denumire`
**Warning signs:** Undefined values in columns, sorting doesn't work

### Pitfall 4: Dialog Form State Reset

**What goes wrong:** Edit form shows previous values, form stays dirty
**Why it happens:** Form state persists when dialog closes
**How to avoid:**
- Call `form.reset()` on submit success
- Use `defaultValues` that change with the `gestiune` prop
- Consider `useEffect` to reset when dialog opens with new data
**Warning signs:** Old data appears in "Add new" form

### Pitfall 5: Large Clasificari Catalog Performance

**What goes wrong:** UI freezes when loading 2000+ clasificari entries
**Why it happens:** Loading all data into memory, rendering all rows
**How to avoid:**
- Implement server-side search (API with `?search=` param)
- Use pagination (default 50 items per page)
- Consider virtualization for very long lists
**Warning signs:** Slow initial load, browser memory warnings

### Pitfall 6: Select Component Value Type

**What goes wrong:** Select doesn't show selected value, onChange doesn't fire
**Why it happens:** shadcn Select expects string values, database uses numbers
**How to avoid:**
- Convert: `value={field.value?.toString()}`
- Parse back: `onValueChange={(v) => field.onChange(parseInt(v))}`
- Use zod `z.coerce.number()` for form parsing
**Warning signs:** Select shows placeholder despite selected value

## Code Examples

Verified patterns from official sources:

### Drizzle Insert with $returningId (MySQL)

```typescript
// Source: https://orm.drizzle.team/docs/insert
const [result] = await db
  .insert(gestiuni)
  .values({ cod: "GEST001", denumire: "Gestiune 1" })
  .$returningId();
// result = { id: 1 }
```

### Drizzle Update with where

```typescript
// Source: https://orm.drizzle.team/docs/update
await db
  .update(gestiuni)
  .set({ denumire: "Gestiune Noua", updatedAt: sql`NOW()` })
  .where(eq(gestiuni.id, 1));
```

### Drizzle Soft Delete

```typescript
// Source: https://orm.drizzle.team/docs/delete
// Soft delete - mark as inactive instead of actual delete
await db
  .update(gestiuni)
  .set({ activ: false })
  .where(eq(gestiuni.id, 1));
```

### drizzle-zod Schema Generation

```typescript
// Source: https://orm.drizzle.team/docs/zod
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { gestiuni } from "./schema";

const insertGestiuneSchema = createInsertSchema(gestiuni, {
  cod: (schema) => schema.min(1, "Codul este obligatoriu"),
});

const selectGestiuneSchema = createSelectSchema(gestiuni);
```

### Hono Route with Zod Validation

```typescript
// Source: https://hono.dev/docs/guides/validation
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const createSchema = z.object({
  cod: z.string().min(1).max(20),
  denumire: z.string().min(1).max(200),
});

app.post("/", zValidator("json", createSchema), async (c) => {
  const data = c.req.valid("json"); // Typed as { cod: string, denumire: string }
  // ... insert logic
});
```

### shadcn Form with react-hook-form

```typescript
// Source: https://ui.shadcn.com/docs/forms/react-hook-form
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { cod: "", denumire: "" },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="cod"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cod</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FormControl (shadcn) | Field component | 2025 | Simpler API, less nesting |
| Manual form validation | zodResolver + RHF | 2024 | Type-safe, declarative |
| Client-side filtering | Server-side search for large datasets | Always | Performance, scalability |
| React Router v6 | React Router v7 | 2025 | Better type safety in framework mode |
| ag-grid for tables | TanStack Table + shadcn | 2024 | Headless, more flexible |

**Deprecated/outdated:**
- **shadcn Form component abstraction**: Now recommend using Field component directly
- **formState.errors** direct access: Use FormMessage component instead
- **Serial types in PostgreSQL**: Use identity columns (not relevant for MySQL but good to know)

## Open Questions

Things that couldn't be fully resolved:

1. **HG 2139/2004 Data Source**
   - What we know: Catalog contains ~2000 entries with cod, denumire, grupa, durata min/max
   - What's unclear: Best source for machine-readable data (PDF, Excel, or API)
   - Recommendation: Create SQL seed file from official PDF, run once during setup

2. **Clasificari Search Strategy**
   - What we know: Need to search by cod or denumire in 2000+ entries
   - What's unclear: Whether MySQL LIKE is fast enough, or need full-text search
   - Recommendation: Start with LIKE, add index on (cod, denumire), measure performance

3. **React Router v7 Loaders**
   - What we know: v7 in framework mode has loaders/actions like Remix
   - What's unclear: If library mode (SPA) should use these or stick to useEffect
   - Recommendation: Use traditional fetch in useEffect for SPA mode, simpler setup

## Sources

### Primary (HIGH confidence)
- [Drizzle ORM Insert](https://orm.drizzle.team/docs/insert) - MySQL $returningId, onDuplicateKeyUpdate
- [Drizzle ORM Select](https://orm.drizzle.team/docs/select) - where, orderBy, limit/offset
- [Drizzle ORM Update](https://orm.drizzle.team/docs/update) - set, where clause
- [Drizzle ORM Delete](https://orm.drizzle.team/docs/delete) - soft delete patterns
- [drizzle-zod](https://orm.drizzle.team/docs/zod) - createInsertSchema, createSelectSchema
- [Hono Validation](https://hono.dev/docs/guides/validation) - zValidator middleware
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table) - TanStack Table integration
- [shadcn/ui Form](https://ui.shadcn.com/docs/components/form) - react-hook-form integration
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog) - Modal pattern
- [Hono Best Practices](https://hono.dev/docs/guides/best-practices) - Route organization

### Secondary (MEDIUM confidence)
- [TanStack Table Docs](https://tanstack.com/table/latest) - Column definitions, row models
- [React Hook Form](https://react-hook-form.com/docs) - useForm, Controller, useWatch
- [React Router v7](https://reactrouter.com/) - BrowserRouter, Routes, Route

### Tertiary (LOW confidence)
- [HG 2139/2004 Portal Legislativ](https://legislatie.just.ro/Public/DetaliiDocument/58613) - Classification catalog (needs manual extraction)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified with official docs
- Architecture: HIGH - Patterns from Phase 1 + official documentation
- Pitfalls: HIGH - Common issues documented in GitHub issues and community
- HG 2139/2004 data: LOW - Need to extract from PDF, no machine-readable source found

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stack is stable, patterns established)
