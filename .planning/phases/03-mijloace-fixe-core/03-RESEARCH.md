# Phase 3: Mijloace Fixe Core - Research

**Researched:** 2026-01-23
**Domain:** Fixed Assets CRUD, Complex Forms, Advanced Filtering, Detail Pages
**Confidence:** HIGH

## Summary

Phase 3 implements the core CRUD operations for Mijloace Fixe (fixed assets), the primary business entity of the application. This builds on established patterns from Phase 2 (nomenclatoare) but introduces new complexities: multi-section forms with many fields, classification picker modal, detail/edit pages with routing, and advanced filtering with multiple criteria. The database schema for mijloaceFixe already exists from Phase 1 with all required fields and relations.

The phase requires extending existing patterns rather than introducing new libraries. Key additions include: React Router nested routes for detail/edit pages, TanStack Table column visibility for configurable columns, a reusable classification picker modal (using Command/Popover pattern), and Badge component for status display. The form will be substantially larger than nomenclatoare forms, requiring section organization with clear headers.

**Primary recommendation:** Follow established CRUD patterns from Phase 2, extending them with: (1) page-based detail/edit views instead of dialog-only forms, (2) classification picker modal using shadcn Combobox pattern, (3) Badge component for status indicators, (4) column visibility state in DataTable, and (5) multi-filter toolbar with URL state sync.

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | 0.45.x | Database CRUD with joins | Already configured, pattern established |
| Hono | 4.x | API routing | Already configured |
| React | 19.x | UI framework | Already configured |
| React Router | 7.x | Client routing | Already configured, handles nested routes |
| shadcn/ui | latest | UI components | Already initialized |
| TanStack Table | 8.x | Data tables | Already installed |
| react-hook-form | 7.x | Form management | Already installed |
| Zod | 4.x | Validation | Already installed |

### New shadcn/ui Components Needed

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| Badge | Status indicator (Activ/Casat) | Asset list status column |
| Command | Searchable picker | Classification picker modal |
| Popover | Picker container | Classification picker modal |
| Card | Section containers | Form sections, detail view sections |
| Separator | Visual section dividers | Form section headers |

### No New Dependencies Required

This phase uses the existing stack. All required functionality is available through:
- React Router v7 nested routes (already installed)
- TanStack Table column visibility (already installed)
- shadcn/ui Combobox pattern (Command + Popover)

**Installation (shadcn components only):**

```bash
cd packages/client
bunx shadcn@latest add badge command popover card separator
```

## Architecture Patterns

### Recommended Project Structure Addition

```
packages/client/src/
├── pages/
│   ├── MijloaceFixe.tsx           # Asset list with filtering
│   ├── MijlocFixDetail.tsx        # Single asset detail view
│   └── MijlocFixEdit.tsx          # Edit form page (separate from detail)
├── components/
│   ├── mijloace-fixe/
│   │   ├── MijlocFixForm.tsx      # Reusable form for create/edit
│   │   ├── MijlocFixFilters.tsx   # Filter toolbar component
│   │   ├── ClasificarePicker.tsx  # Classification modal picker
│   │   └── MijlocFixColumns.tsx   # Column definitions for table
│   └── ui/
│       ├── badge.tsx              # Status badge (shadcn)
│       ├── command.tsx            # Command palette (shadcn)
│       └── popover.tsx            # Popover container (shadcn)

packages/server/src/
├── routes/
│   └── mijloace-fixe.ts           # MF CRUD routes with filtering
└── validation/
    └── schemas.ts                 # Add MijlocFix schemas
```

### Pattern 1: React Router Nested Routes for Asset Pages

**What:** Route structure for list, detail, and edit pages
**When to use:** All asset navigation

```typescript
// packages/client/src/main.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // ... existing routes
      {
        path: "mijloace-fixe",
        children: [
          {
            index: true,
            element: <MijloaceFixePage />,  // List view
          },
          {
            path: "nou",
            element: <MijlocFixEdit />,     // Create form
          },
          {
            path: ":id",
            element: <MijlocFixDetail />,   // Detail view
          },
          {
            path: ":id/edit",
            element: <MijlocFixEdit />,     // Edit form
          },
        ],
      },
    ],
  },
]);
```

### Pattern 2: Classification Picker Modal (Combobox)

**What:** Searchable modal for selecting classification from HG 2139/2004 catalog
**When to use:** MijlocFix form classification field

```typescript
// packages/client/src/components/mijloace-fixe/ClasificarePicker.tsx
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Clasificare } from "shared";

interface ClasificarePickerProps {
  value?: string;  // clasificare cod
  onSelect: (clasificare: Clasificare) => void;
  disabled?: boolean;
}

export function ClasificarePicker({
  value,
  onSelect,
  disabled,
}: ClasificarePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Clasificare[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search - fetch from API
  const handleSearch = async (query: string) => {
    setSearch(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const res = await api.get<PaginatedResponse<Clasificare>>(
      `/clasificari?search=${encodeURIComponent(query)}&pageSize=20`
    );
    if (res.success && res.data) {
      setResults(res.data.items);
    }
    setIsLoading(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value ? value : "Selecteaza clasificarea..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Cauta dupa cod sau denumire..."
            value={search}
            onValueChange={handleSearch}
          />
          <CommandList>
            {isLoading && (
              <CommandEmpty>Se cauta...</CommandEmpty>
            )}
            {!isLoading && results.length === 0 && search.length >= 2 && (
              <CommandEmpty>Nu s-au gasit clasificari.</CommandEmpty>
            )}
            {!isLoading && search.length < 2 && (
              <CommandEmpty>Introduceti cel putin 2 caractere.</CommandEmpty>
            )}
            <CommandGroup>
              {results.map((clasificare) => (
                <CommandItem
                  key={clasificare.cod}
                  value={clasificare.cod}
                  onSelect={() => {
                    onSelect(clasificare);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === clasificare.cod ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-mono">{clasificare.cod}</span>
                    <span className="text-sm text-muted-foreground truncate max-w-[400px]">
                      {clasificare.denumire}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### Pattern 3: Multi-Section Form Layout

**What:** Large form organized into logical sections with headers
**When to use:** MijlocFix create/edit form

```typescript
// Form sections structure for MijlocFixForm
const formSections = [
  {
    id: "identificare",
    title: "Date Identificare",
    fields: ["numarInventar", "denumire", "descriere", "clasificareCod"],
  },
  {
    id: "document",
    title: "Document Intrare",
    fields: ["tipDocument", "numarDocument", "dataDocument"],
  },
  {
    id: "contabil",
    title: "Date Contabile",
    fields: ["gestiuneId", "locFolosintaId", "contId", "sursaFinantareId"],
  },
  {
    id: "amortizare",
    title: "Amortizare",
    fields: ["valoareInventar", "dataAchizitie", "durataNormala", "eAmortizabil"],
  },
];

// Section component
function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}
```

### Pattern 4: Column Visibility in DataTable

**What:** Allow users to show/hide table columns
**When to use:** MijloaceFixe list view

```typescript
// Enhanced DataTable with column visibility
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DataTable<TData, TValue>({
  columns,
  data,
  // ...
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  return (
    <div>
      {/* Column visibility dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            Coloane
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rest of table */}
    </div>
  );
}
```

### Pattern 5: Multi-Filter Toolbar

**What:** Multiple filter controls above table
**When to use:** MijloaceFixe list filtering

```typescript
// packages/client/src/components/mijloace-fixe/MijlocFixFilters.tsx
interface MijlocFixFiltersProps {
  gestiuni: Gestiune[];
  locuriForSelectedGestiune: LocFolosinta[];
  filters: {
    gestiuneId?: number;
    locFolosintaId?: number;
    stare?: "activ" | "casat";
    grupa?: string;
    search?: string;
  };
  onFiltersChange: (filters: typeof filters) => void;
}

export function MijlocFixFilters({
  gestiuni,
  locuriForSelectedGestiune,
  filters,
  onFiltersChange,
}: MijlocFixFiltersProps) {
  const debouncedSearch = useDebounce(filters.search, 300);

  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Text search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cauta dupa nr. inventar sau denumire..."
          value={filters.search || ""}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Gestiune filter */}
      <Select
        value={filters.gestiuneId?.toString() || "all"}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            gestiuneId: v === "all" ? undefined : parseInt(v),
            locFolosintaId: undefined, // Reset loc when gestiune changes
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Toate gestiunile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate gestiunile</SelectItem>
          {gestiuni.map((g) => (
            <SelectItem key={g.id} value={g.id.toString()}>
              {g.cod} - {g.denumire}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Stare filter */}
      <Select
        value={filters.stare || "all"}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            stare: v === "all" ? undefined : (v as "activ" | "casat"),
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Toate starile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate starile</SelectItem>
          <SelectItem value="activ">Activ</SelectItem>
          <SelectItem value="casat">Casat</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

### Pattern 6: Badge for Status Display

**What:** Visual status indicator in table and detail view
**When to use:** MijlocFix stare field display

```typescript
// Status badge component
import { Badge } from "@/components/ui/badge";

const stareConfig = {
  activ: { label: "Activ", variant: "default" as const, className: "bg-green-100 text-green-800" },
  casat: { label: "Casat", variant: "secondary" as const, className: "bg-gray-100 text-gray-600" },
  casare: { label: "In casare", variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800" },
  transfer: { label: "Transfer", variant: "outline" as const, className: "bg-blue-100 text-blue-800" },
};

export function StareBadge({ stare }: { stare: keyof typeof stareConfig }) {
  const config = stareConfig[stare];
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
```

### Pattern 7: Clickable Table Rows with Navigation

**What:** Row click navigates to detail page
**When to use:** MijloaceFixe list

```typescript
// In MijloaceFixePage
const navigate = useNavigate();

<TableRow
  key={row.id}
  onClick={() => navigate(`/mijloace-fixe/${row.original.id}`)}
  className="cursor-pointer hover:bg-muted/50"
>
  {/* cells */}
</TableRow>
```

### Anti-Patterns to Avoid

- **Dialog for complex forms:** Use full page for MijlocFix form (too many fields for dialog)
- **Loading all MF at once:** Implement server-side pagination and filtering from start
- **Duplicating form logic:** Same form component for create and edit, differentiate via presence of id
- **Hardcoding column visibility:** Allow user preference (consider localStorage later)
- **Ignoring URL state:** Filters should sync to URL for shareable/bookmarkable views
- **Fetching all relacionate data:** Load gestiuni/locuri/conturi once, cache client-side

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Searchable dropdown | Custom search input + list | shadcn Command + Popover | Keyboard navigation, accessibility |
| Status indicators | Colored spans | shadcn Badge | Consistent styling, variants |
| Form sections | Manual divs | Card component | Consistent padding, borders |
| Column visibility | Custom checkbox list | TanStack Table API | Already built, works with table |
| URL filter sync | Manual URLSearchParams | useSearchParams hook | React Router integration |
| Debounced search | setTimeout/clearTimeout | useDebounce hook (existing) | Clean, reusable |

**Key insight:** Phase 3 complexity comes from volume (many fields, many filters, many relations) not from new technical challenges. Use existing patterns, scale them up.

## Common Pitfalls

### Pitfall 1: MijlocFix Form Field Count Overwhelm

**What goes wrong:** 20+ fields in one form causes confusion, user abandonment
**Why it happens:** Trying to show all fields at once without organization
**How to avoid:**
- Group fields into logical sections with clear headers
- Use Card components to visually separate sections
- Consider progressive disclosure (hide advanced fields initially)
**Warning signs:** User scrolls up and down repeatedly, abandons mid-form

### Pitfall 2: Classification Picker Performance

**What goes wrong:** Picker slow or freezes with 2000+ entries
**Why it happens:** Loading all entries into memory, rendering all at once
**How to avoid:**
- Server-side search with debounce (300ms)
- Limit results to 20 items
- Require minimum 2 characters before search
- Show loading state
**Warning signs:** Input lag, browser memory warnings

### Pitfall 3: Numar Inventar Uniqueness Validation

**What goes wrong:** Duplicate nr. inventar accepted, constraint violation on save
**Why it happens:** Validation only on submit, not on blur
**How to avoid:**
- Server-side check on unique constraint returns clear error message
- Consider async validation on blur for immediate feedback
- Handle MySQL duplicate key error gracefully
**Warning signs:** Cryptic database errors shown to user

### Pitfall 4: Loc Folosinta Dependency on Gestiune

**What goes wrong:** User selects gestiune, loc folosinta options don't update
**Why it happens:** Loc dropdown not re-fetching when gestiune changes
**How to avoid:**
- Watch gestiuneId with useWatch
- Reset locFolosintaId when gestiune changes
- Fetch locuri filtered by gestiuneId
**Warning signs:** Loc dropdown shows options from wrong gestiune

### Pitfall 5: Detail Page Missing Relations

**What goes wrong:** Detail page shows IDs instead of names (gestiune: 5 instead of "Sectia 1")
**Why it happens:** API returns raw IDs, no joined data
**How to avoid:**
- API route uses joins to include related entity names
- Transform function maps DB result to full DTO with nested objects
- Frontend displays from nested relations
**Warning signs:** Raw numeric IDs visible in UI

### Pitfall 6: Edit Form Not Resetting

**What goes wrong:** Edit one asset, navigate to another, old values still shown
**Why it happens:** Form defaultValues not reactive to route param changes
**How to avoid:**
- Use useEffect to reset form when id param changes
- Key the form component with asset ID
- Fetch fresh data when navigating to edit
**Warning signs:** Editing shows previous asset's data

### Pitfall 7: Durata Normala Auto-Fill Race Condition

**What goes wrong:** User selects classification, but durata normala doesn't auto-fill
**Why it happens:** Classification selection and durata update not properly synchronized
**How to avoid:**
- When classification selected, also set durataNormala from classification's range
- Use setValue with shouldValidate: true
- Show range (min-max) to help user understand valid values
**Warning signs:** Durata normala stays empty after classification selection

## Code Examples

### Drizzle Query with Multiple Joins

```typescript
// packages/server/src/routes/mijloace-fixe.ts
// Source: Established pattern from locuri.ts, extended

const result = await db
  .select({
    // MijlocFix fields
    id: mijloaceFixe.id,
    numarInventar: mijloaceFixe.numarInventar,
    denumire: mijloaceFixe.denumire,
    stare: mijloaceFixe.stare,
    valoareInventar: mijloaceFixe.valoareInventar,
    dataAchizitie: mijloaceFixe.dataAchizitie,
    // ... other fields

    // Joined relations
    clasificare_cod: clasificari.cod,
    clasificare_denumire: clasificari.denumire,
    clasificare_grupa: clasificari.grupa,

    gestiune_id: gestiuni.id,
    gestiune_cod: gestiuni.cod,
    gestiune_denumire: gestiuni.denumire,

    locFolosinta_id: locuriUilizare.id,
    locFolosinta_denumire: locuriUilizare.denumire,
  })
  .from(mijloaceFixe)
  .leftJoin(clasificari, eq(mijloaceFixe.clasificareCod, clasificari.cod))
  .leftJoin(gestiuni, eq(mijloaceFixe.gestiuneId, gestiuni.id))
  .leftJoin(locuriUilizare, eq(mijloaceFixe.locFolosintaId, locuriUilizare.id))
  .where(whereConditions)
  .orderBy(mijloaceFixe.denumire)
  .limit(pageSize)
  .offset((page - 1) * pageSize);
```

### Server-Side Filtering with Dynamic Where

```typescript
// packages/server/src/routes/mijloace-fixe.ts
// Source: Pattern from clasificari.ts, extended

import { and, eq, like, or, sql } from "drizzle-orm";

app.get("/", async (c) => {
  const search = c.req.query("search");
  const gestiuneId = c.req.query("gestiuneId");
  const stare = c.req.query("stare");
  const grupa = c.req.query("grupa");
  const page = parseInt(c.req.query("page") || "1");
  const pageSize = parseInt(c.req.query("pageSize") || "20");

  // Build dynamic conditions
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(mijloaceFixe.numarInventar, `%${search}%`),
        like(mijloaceFixe.denumire, `%${search}%`)
      )
    );
  }

  if (gestiuneId) {
    conditions.push(eq(mijloaceFixe.gestiuneId, parseInt(gestiuneId)));
  }

  if (stare) {
    conditions.push(eq(mijloaceFixe.stare, stare));
  }

  if (grupa) {
    conditions.push(eq(clasificari.grupa, grupa));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count for pagination
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(mijloaceFixe)
    .leftJoin(clasificari, eq(mijloaceFixe.clasificareCod, clasificari.cod))
    .where(whereClause);

  const total = Number(countResult[0].count);

  // Paginated results
  const result = await db
    .select({ /* ... fields */ })
    .from(mijloaceFixe)
    .leftJoin(/* ... joins */)
    .where(whereClause)
    .orderBy(mijloaceFixe.denumire)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return c.json<ApiResponse<PaginatedResponse<MijlocFix>>>({
    success: true,
    data: {
      items: result.map(transformMijlocFix),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});
```

### Unique Constraint Validation

```typescript
// packages/server/src/routes/mijloace-fixe.ts
// Source: Standard pattern for unique validation

// Before insert, check uniqueness
const existing = await db
  .select({ id: mijloaceFixe.id })
  .from(mijloaceFixe)
  .where(eq(mijloaceFixe.numarInventar, data.numarInventar))
  .limit(1);

if (existing.length > 0) {
  return c.json<ApiResponse>(
    {
      success: false,
      message: "Numarul de inventar exista deja",
      errors: { numarInventar: ["Numarul de inventar trebuie sa fie unic"] },
    },
    400
  );
}

// For update, exclude current record
const existingForUpdate = await db
  .select({ id: mijloaceFixe.id })
  .from(mijloaceFixe)
  .where(
    and(
      eq(mijloaceFixe.numarInventar, data.numarInventar),
      sql`${mijloaceFixe.id} != ${id}`
    )
  )
  .limit(1);
```

### Form with Auto-Fill from Classification

```typescript
// packages/client/src/components/mijloace-fixe/MijlocFixForm.tsx
// Source: react-hook-form documentation + established patterns

const form = useForm<MijlocFixFormData>({
  resolver: zodResolver(mijlocFixFormSchema),
  defaultValues: {
    // ... default values
  },
});

// When classification is selected, auto-fill durataNormala
const handleClasificareSelect = (clasificare: Clasificare) => {
  form.setValue("clasificareCod", clasificare.cod);
  // Auto-fill with minimum duration, user can adjust within range
  form.setValue("durataNormala", clasificare.durataNormalaMin * 12); // Convert years to months
};

// In form render
<FormField
  control={form.control}
  name="clasificareCod"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Clasificare HG 2139/2004 *</FormLabel>
      <ClasificarePicker
        value={field.value}
        onSelect={handleClasificareSelect}
      />
      <FormMessage />
    </FormItem>
  )}
/>
```

### useParams for Detail/Edit Pages

```typescript
// packages/client/src/pages/MijlocFixDetail.tsx
// Source: React Router v7 documentation

import { useParams, useNavigate } from "react-router-dom";

export function MijlocFixDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mijlocFix, setMijlocFix] = useState<MijlocFix | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMijlocFix = async () => {
      if (!id) return;
      setIsLoading(true);
      const res = await api.get<MijlocFix>(`/mijloace-fixe/${id}`);
      if (res.success && res.data) {
        setMijlocFix(res.data);
      }
      setIsLoading(false);
    };
    loadMijlocFix();
  }, [id]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {mijlocFix?.denumire || "Detalii Mijloc Fix"}
        </h1>
        <Button onClick={() => navigate(`/mijloace-fixe/${id}/edit`)}>
          Editeaza
        </Button>
      </div>
      {/* Detail sections */}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single page forms | Section-organized forms | Always preferred | Better UX for complex forms |
| Modal for everything | Page for complex, modal for simple | Standard practice | Appropriate context for form size |
| Manual filter state | URL-synced filters | React Router v6+ | Bookmarkable, shareable |
| Load all, filter client | Server-side filter + paginate | Standard for lists | Performance, scalability |

**Note:** There are no deprecated patterns specific to this phase. The existing Phase 2 patterns remain current.

## Open Questions

1. **Tip Document Nomenclator**
   - What we know: Needed for document type selection (NIR, PV, Donatie, etc.)
   - What's unclear: Should this be added now or deferred?
   - Recommendation: Add simple tipuriDocument table and seed during Phase 3 implementation as prerequisite task

2. **eAmortizabil Field Placement**
   - What we know: New boolean field for marking assets as non-depreciable
   - What's unclear: Exact schema field position and default value behavior
   - Recommendation: Add to schema in first task, default to true (most assets are depreciable)

3. **Filter State Persistence**
   - What we know: User decision left this to Claude's discretion
   - What's unclear: URL params vs localStorage vs session
   - Recommendation: Use URL searchParams for filters (bookmarkable, shareable), column visibility can use localStorage later

## Sources

### Primary (HIGH confidence)
- [TanStack Table Column Visibility](https://tanstack.com/table/v8/docs/guide/column-visibility) - Column visibility API
- [React Router v7 Nested Routes](https://reactrouter.com/start/library/routing) - Route structure
- [shadcn/ui Combobox](https://ui.shadcn.com/docs/components/combobox) - Command + Popover pattern
- [shadcn/ui Badge](https://ui.shadcn.com/docs/components/badge) - Status badge component
- Existing codebase patterns from Phase 2 (locuri.ts, Clasificari.tsx, ConturiForm.tsx)

### Secondary (MEDIUM confidence)
- [React Hook Form Advanced Usage](https://react-hook-form.com/advanced-usage) - Complex form patterns
- [Drizzle ORM Joins](https://orm.drizzle.team/docs/joins) - Multi-table joins

### Tertiary (LOW confidence)
- WebSearch results for shadcn modal picker patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and patterns established
- Architecture: HIGH - Extends existing Phase 2 patterns with documented additions
- Pitfalls: HIGH - Based on established patterns and common issues
- Code examples: HIGH - Based on existing codebase + official documentation

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - patterns are stable, codebase is known)
