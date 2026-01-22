# Stack Research: Fixed Assets Management App (MiFix)

**Domain:** Internal accounting application (gestiune mijloace fixe)
**Researched:** 2026-01-22
**Overall Confidence:** HIGH

---

## Core Stack (Confirmed by User)

| Component | Version | Purpose | Confidence |
|-----------|---------|---------|------------|
| Bun | 1.3.5 | JavaScript runtime | HIGH - [verified via GitHub releases](https://github.com/oven-sh/bun/releases) |
| React | 19.x | Frontend UI library | HIGH |
| Vite | 6.x (or 7.x) | Build tool / dev server | HIGH - [verified via Vite docs](https://vite.dev/releases) |
| TypeScript | 5.x | Type safety | HIGH |
| shadcn/ui | latest | UI component library | HIGH - [verified via shadcn docs](https://ui.shadcn.com/) |
| Tailwind CSS | 4.x | Styling | HIGH |
| Hono | 4.11.4 | Backend web framework | HIGH - [verified via npm](https://www.npmjs.com/package/hono) |
| Drizzle ORM | 0.45.1 | Database ORM | HIGH - [verified via npm](https://www.npmjs.com/package/drizzle-orm) |
| MySQL | 8.x | Database | HIGH |
| Zod | 4.3.5 | Schema validation | HIGH - [verified via GitHub](https://github.com/colinhacks/zod/releases) |

---

## Recommended Additions

### Authentication

**Library:** better-auth v1.4.15
- **Why:**
  - Purpose-built for TypeScript with first-class Hono integration
  - Native Drizzle ORM adapter with MySQL support
  - Simple email/password authentication out of the box
  - Plugin ecosystem for future expansion (if needed)
  - Active development (acquired momentum after Lucia Auth deprecation)
  - CLI generates database schema automatically
- **Confidence:** HIGH
- **Sources:**
  - [Better Auth Hono Integration](https://www.better-auth.com/docs/integrations/hono)
  - [Better Auth Drizzle Adapter](https://www.better-auth.com/docs/adapters/drizzle)
  - [Hono Examples](https://hono.dev/examples/better-auth)

**Alternatives Considered:**
| Alternative | Why Rejected |
|-------------|--------------|
| Lucia Auth | Deprecated - maintainer archived the project in 2024, now only a learning resource |
| Auth.js (NextAuth) | Optimized for Next.js, more complex setup for Hono |
| Roll your own | Unnecessary complexity for simple user/password auth |
| Passport.js | Legacy approach, not TypeScript-first |

**Setup Notes:**
```typescript
// auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
  }),
  emailAndPassword: {
    enabled: true,
  },
});

// Hono route
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});
```

---

### Data Tables (Filtering/Sorting)

**Library:** @tanstack/react-table v8.21.3
- **Why:**
  - De facto standard for React data tables
  - Headless UI - full control over styling (works perfectly with shadcn/ui)
  - Built-in sorting, filtering, pagination, column visibility
  - TypeScript-first with excellent type inference
  - shadcn/ui has official Data Table component built on TanStack Table
  - Lightweight (no UI overhead)
- **Confidence:** HIGH
- **Sources:**
  - [TanStack Table Docs](https://tanstack.com/table/latest)
  - [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table)

**Alternatives Considered:**
| Alternative | Why Rejected |
|-------------|--------------|
| AG Grid | Overkill for this app, commercial license for advanced features |
| MUI DataGrid | Brings Material UI dependency, conflicts with shadcn/ui |
| react-table v7 | Outdated, TanStack Table v8 is the successor |

**Setup Notes:**
```bash
# Install via shadcn CLI (includes table component)
npx shadcn@latest add table
npm install @tanstack/react-table
```

---

### Date Handling

**Library:** date-fns v4.1.0
- **Why:**
  - Modern, modular date utility library
  - Tree-shakeable - only import what you use
  - First-class TypeScript support
  - v4 adds first-class timezone support (useful for accounting periods)
  - Immutable operations (no mutation bugs)
  - Simple API for accounting period calculations (startOfMonth, endOfMonth, etc.)
  - 37M+ weekly downloads - battle-tested
- **Confidence:** HIGH
- **Sources:**
  - [date-fns v4 Release](https://blog.date-fns.org/v40-with-time-zone-support/)
  - [date-fns Documentation](https://date-fns.org/)

**Alternatives Considered:**
| Alternative | Why Rejected |
|-------------|--------------|
| Moment.js | Deprecated, large bundle size, mutable API |
| Day.js | Good alternative, but date-fns is more popular and feature-rich |
| Luxon | Heavier, date-fns v4 now has timezone support |
| Native Date | Insufficient for accounting period calculations |

**Useful Functions for Accounting:**
```typescript
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  differenceInMonths,
  format,
  parse
} from 'date-fns';

// Depreciation period calculations
const depreciationStartDate = startOfMonth(acquisitionDate);
const monthsDepreciated = differenceInMonths(currentDate, depreciationStartDate);
```

---

### Decimal/Money Handling

**Library:** decimal.js v10.6.0
- **Why:**
  - Arbitrary-precision decimal arithmetic
  - Prevents floating-point errors in financial calculations
  - Used by Prisma ORM for Decimal type (industry standard)
  - Comprehensive API for all arithmetic operations
  - Supports BigInt (v10.6.0)
  - Perfect for depreciation calculations where precision matters
- **Confidence:** HIGH
- **Sources:**
  - [decimal.js GitHub](https://github.com/MikeMcl/decimal.js)
  - [decimal.js API](https://mikemcl.github.io/decimal.js/)

**Alternatives Considered:**
| Alternative | Why Rejected |
|-------------|--------------|
| big.js | Lighter but less features; decimal.js recommended for financial |
| bignumber.js | Similar to decimal.js but uses decimal places not significant digits |
| Dinero.js | Good for currency, but overkill - no multi-currency needed |
| currency.js | Simpler but decimal.js is more powerful for depreciation math |
| Native Number | NEVER use for money - floating point errors |

**Critical Usage Pattern:**
```typescript
import Decimal from 'decimal.js';

// ALWAYS use Decimal for money
const acquisitionValue = new Decimal('125000.00');
const residualValue = new Decimal('5000.00');
const depreciableAmount = acquisitionValue.minus(residualValue);
const monthlyDepreciation = depreciableAmount.dividedBy(usefulLifeMonths);

// Store in DB as string, convert back
const dbValue = monthlyDepreciation.toFixed(2); // "1000.00"
```

**Database Storage:**
```typescript
// In Drizzle schema - use decimal type
import { decimal } from 'drizzle-orm/mysql-core';

export const assets = mysqlTable('assets', {
  acquisitionValue: decimal('acquisition_value', { precision: 15, scale: 2 }).notNull(),
  monthlyDepreciation: decimal('monthly_depreciation', { precision: 15, scale: 2 }).notNull(),
});
```

---

### Report Generation (Browser-Based Viewing)

**Primary: react-to-print v3.2.0**
- **Why:**
  - Simplest solution for browser-based report viewing and printing
  - Uses native browser print dialog (prints to PDF or physical printer)
  - Works with React components directly - style your reports with Tailwind
  - No server-side PDF generation needed
  - Zero external dependencies for PDF viewing
  - Perfect for internal hospital accounting use case
- **Confidence:** HIGH
- **Sources:**
  - [react-to-print npm](https://www.npmjs.com/package/react-to-print)
  - [GitHub](https://github.com/MatthewHerbst/react-to-print)

**Alternative for PDF Generation: @react-pdf/renderer v4.3.2**
- **When to use:** If you need to generate downloadable PDFs programmatically
- **Why:** React-like API for creating PDF documents
- **Confidence:** MEDIUM (may not be needed if react-to-print suffices)
- **Sources:**
  - [react-pdf Documentation](https://react-pdf.org/)
  - [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer)

**Recommendation:** Start with react-to-print. It's simpler and covers 90% of use cases for internal reports. Add @react-pdf/renderer later only if you need:
- Emailed PDF attachments
- Programmatic PDF downloads without print dialog
- PDF archives stored on server

**Setup Notes:**
```typescript
// Report component with print support
import { useReactToPrint } from 'react-to-print';

function DepreciationReport({ data }) {
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef });

  return (
    <>
      <Button onClick={handlePrint}>Print Report</Button>
      <div ref={contentRef} className="print:p-8">
        {/* Report content styled with Tailwind */}
        {/* Use @media print CSS for print-specific styling */}
      </div>
    </>
  );
}
```

---

## Anti-Recommendations

### Do NOT Use

| Library | Reason |
|---------|--------|
| **Lucia Auth** | Deprecated/archived. Use Better Auth instead. |
| **Moment.js** | Deprecated, huge bundle, mutable API. Use date-fns. |
| **Native JS Number for money** | Floating point errors. ALWAYS use decimal.js for financial calculations. |
| **MUI DataGrid** | Brings entire Material UI ecosystem, conflicts with shadcn/ui styling approach. |
| **Prisma** | User chose Drizzle ORM (good choice - better performance, SQL-like syntax). |
| **Express.js** | User chose Hono (good choice - faster, better TypeScript, works with Bun). |
| **Create React App** | Deprecated. Vite is the standard in 2025+. |
| **jsPDF directly** | Use react-to-print or @react-pdf/renderer for React apps. |

### Patterns to Avoid

1. **Storing money as float/double in database**
   - Use DECIMAL(15,2) in MySQL
   - Use decimal.js in TypeScript

2. **Calculating dates with native Date arithmetic**
   - Use date-fns for all date calculations
   - Never do `date.getMonth() + 1` for next month (edge cases fail)

3. **Rolling your own auth for simple cases**
   - Better Auth handles session management, CSRF, password hashing
   - Focus on business logic, not security primitives

4. **Building custom table from scratch**
   - TanStack Table + shadcn/ui handles sorting, filtering, pagination
   - Reinventing this is time-consuming and bug-prone

---

## Version Summary Table

| Component | Version | Last Verified | Confidence |
|-----------|---------|---------------|------------|
| Bun | 1.3.5 | 2026-01-22 | HIGH |
| Vite | 6.x / 7.x | 2026-01-22 | HIGH |
| React | 19.x | 2026-01-22 | HIGH |
| TypeScript | 5.x | 2026-01-22 | HIGH |
| Hono | 4.11.4 | 2026-01-22 | HIGH |
| Drizzle ORM | 0.45.1 | 2026-01-22 | HIGH |
| Zod | 4.3.5 | 2026-01-22 | HIGH |
| better-auth | 1.4.15 | 2026-01-22 | HIGH |
| @tanstack/react-table | 8.21.3 | 2026-01-22 | HIGH |
| date-fns | 4.1.0 | 2026-01-22 | HIGH |
| decimal.js | 10.6.0 | 2026-01-22 | HIGH |
| react-to-print | 3.2.0 | 2026-01-22 | HIGH |
| @react-pdf/renderer | 4.3.2 | 2026-01-22 | MEDIUM (optional) |

---

## Installation Commands

```bash
# Core dependencies (already decided by user)
bun add react react-dom hono drizzle-orm mysql2 zod
bun add -D typescript vite @vitejs/plugin-react drizzle-kit

# Recommended additions
bun add better-auth @tanstack/react-table date-fns decimal.js react-to-print

# shadcn/ui setup (run after initial project setup)
npx shadcn@latest init
npx shadcn@latest add table button input card form dialog

# Optional (if PDF generation needed beyond print)
bun add @react-pdf/renderer
```

---

## Sources

### Authentication
- [Better Auth Official Docs](https://www.better-auth.com/)
- [Better Auth Hono Integration](https://www.better-auth.com/docs/integrations/hono)
- [Better Auth Drizzle Adapter](https://www.better-auth.com/docs/adapters/drizzle)
- [Lucia Auth Deprecation Discussion](https://github.com/lucia-auth/lucia/discussions/1707)

### Data Tables
- [TanStack Table Documentation](https://tanstack.com/table/latest)
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table)

### Date Handling
- [date-fns Official Documentation](https://date-fns.org/)
- [date-fns v4 Release Blog](https://blog.date-fns.org/v40-with-time-zone-support/)

### Decimal/Money
- [decimal.js GitHub](https://github.com/MikeMcl/decimal.js)
- [decimal.js API Documentation](https://mikemcl.github.io/decimal.js/)

### Report Generation
- [react-to-print GitHub](https://github.com/MatthewHerbst/react-to-print)
- [react-pdf Documentation](https://react-pdf.org/)

### Core Stack
- [Hono Documentation](https://hono.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Zod v4 Release Notes](https://zod.dev/v4)
- [Vite Documentation](https://vite.dev/)
- [Bun Documentation](https://bun.com)
