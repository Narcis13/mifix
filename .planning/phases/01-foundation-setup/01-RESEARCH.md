# Phase 1: Foundation & Setup - Research

**Researched:** 2026-01-22
**Domain:** Full-stack TypeScript monorepo (Bun, Hono, React, Vite, MySQL, Drizzle ORM)
**Confidence:** HIGH

## Summary

Phase 1 establishes the development foundation using the bhvr monorepo template with Bun runtime, Hono backend, React/Vite frontend, MySQL database with Drizzle ORM, shadcn/ui components, and decimal.js for financial calculations. This is a well-documented, production-ready stack with excellent TypeScript support throughout.

The bhvr template provides the core monorepo structure with shared types between client and server. Drizzle ORM is the modern choice for TypeScript-first database access with MySQL, offering type safety and excellent migration tooling. The key challenge is properly handling decimal precision for financial calculations - Drizzle returns decimal columns as strings, which must be converted to decimal.js instances for calculations and properly serialized in API responses.

**Primary recommendation:** Use bhvr template as-is, add Drizzle ORM with mysql2 driver, configure shadcn/ui with Tailwind v4, and create a shared Money utility class wrapping decimal.js for all financial operations.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Bun | latest | JavaScript runtime, package manager, bundler | Built-in TypeScript transpiler, fastest runtime, native testing |
| Hono | 4.x | Backend web framework | Lightweight (~13kb), excellent TypeScript, works perfectly with Bun |
| React | 19.x | Frontend UI library | Industry standard, excellent ecosystem |
| Vite | 6.x | Frontend build tool | Fast HMR, excellent DX, native TypeScript |
| Turbo | 2.5.x | Monorepo build orchestration | Caching, task dependencies, parallel execution |
| Drizzle ORM | 0.45.x | TypeScript ORM | SQL-like syntax, excellent type inference, lightweight |
| mysql2 | 3.x | MySQL driver | Best Node.js MySQL driver, used by Drizzle |
| shadcn/ui | latest | UI component library | Not a dependency - copies components into project |
| Tailwind CSS | 4.x | Utility CSS framework | Required by shadcn/ui, excellent DX |
| decimal.js | 10.x | Arbitrary precision decimals | Handles financial calculations correctly |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-kit | 0.30.x | Migration CLI | Schema migrations, database introspection |
| @tailwindcss/vite | 4.x | Vite plugin for Tailwind | Required for Tailwind v4 + Vite |
| @types/node | latest | Node.js types | Required for path resolution in Vite config |
| zod | 3.x | Schema validation | API input validation, form validation |
| drizzle-zod | latest | Zod schema generation | Generate Zod schemas from Drizzle schemas |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle ORM | Prisma | Prisma has better tooling but heavier, Drizzle is SQL-like and lighter |
| mysql2 | Bun's native SQL | Bun SQL doesn't support MySQL yet (only PostgreSQL, SQLite) |
| decimal.js | big.js | big.js is smaller but decimal.js has more features for financial apps |
| shadcn/ui | Radix UI directly | shadcn/ui provides styled, customizable components ready to use |

**Installation:**

```bash
# Create project from bhvr template
bun create bhvr@latest mifix
cd mifix

# Add database dependencies (in server package)
cd packages/server
bun add drizzle-orm mysql2
bun add -D drizzle-kit

# Add decimal.js to shared package
cd ../shared
bun add decimal.js

# Add shadcn/ui dependencies (in client package)
cd ../client
bun add tailwindcss @tailwindcss/vite
bun add -D @types/node
bunx shadcn@latest init
```

## Architecture Patterns

### Recommended Project Structure

```
mifix/
├── package.json              # Root workspace config
├── turbo.json                # Turbo build orchestration
├── packages/
│   ├── client/               # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── ui/       # shadcn/ui components
│   │   │   ├── lib/          # Utilities (cn, api client)
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── server/               # Hono backend
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── index.ts  # Database connection
│   │   │   │   └── schema.ts # Drizzle schema definitions
│   │   │   ├── routes/       # API route handlers
│   │   │   └── index.ts      # Hono app entry
│   │   ├── drizzle/          # Generated migrations
│   │   ├── drizzle.config.ts # Drizzle Kit config
│   │   └── package.json
│   │
│   └── shared/               # Shared types and utilities
│       ├── src/
│       │   ├── types/        # Shared TypeScript types
│       │   │   └── index.ts
│       │   ├── money.ts      # decimal.js wrapper for financial calcs
│       │   └── index.ts      # Exports
│       └── package.json
```

### Pattern 1: Database Connection with Drizzle

**What:** Initialize Drizzle ORM with mysql2 connection pool
**When to use:** Server startup, all database operations

```typescript
// packages/server/src/db/index.ts
// Source: https://orm.drizzle.team/docs/get-started-mysql
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const poolConnection = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mifix",
});

export const db = drizzle({ client: poolConnection, schema, mode: "default" });
```

### Pattern 2: Drizzle Schema for Financial Data

**What:** Define MySQL schema with proper decimal types for money
**When to use:** Any table with monetary values

```typescript
// packages/server/src/db/schema.ts
// Source: https://orm.drizzle.team/docs/column-types/mysql
import { mysqlTable, int, varchar, decimal, datetime, boolean } from "drizzle-orm/mysql-core";

export const fixedAssets = mysqlTable("fixed_assets", {
  id: int("id").primaryKey().autoincrement(),
  inventoryNumber: varchar("inventory_number", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  // Financial values: precision 15, scale 2 (max 9,999,999,999,999.99)
  purchaseValue: decimal("purchase_value", { precision: 15, scale: 2 }).notNull(),
  depreciatedValue: decimal("depreciated_value", { precision: 15, scale: 2 }).notNull().default("0"),
  remainingValue: decimal("remaining_value", { precision: 15, scale: 2 }).notNull(),
  purchaseDate: datetime("purchase_date").notNull(),
  usefulLifeMonths: int("useful_life_months").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: datetime("created_at").notNull().defaultNow(),
  updatedAt: datetime("updated_at").notNull().defaultNow(),
});
```

### Pattern 3: Money Utility with decimal.js

**What:** Wrapper class for financial calculations ensuring precision
**When to use:** ALL financial calculations, never use native JS numbers

```typescript
// packages/shared/src/money.ts
// Source: https://mikemcl.github.io/decimal.js/
import Decimal from "decimal.js";

// Configure decimal.js for financial calculations
Decimal.set({
  precision: 20,           // Significant digits
  rounding: Decimal.ROUND_HALF_UP,  // Standard financial rounding
});

export class Money {
  private value: Decimal;

  constructor(value: string | number | Decimal) {
    // Always use string for construction to avoid precision loss
    this.value = new Decimal(typeof value === "number" ? value.toString() : value);
  }

  plus(other: Money | string | number): Money {
    return new Money(this.value.plus(new Decimal(other instanceof Money ? other.value : other)));
  }

  minus(other: Money | string | number): Money {
    return new Money(this.value.minus(new Decimal(other instanceof Money ? other.value : other)));
  }

  times(multiplier: number | string): Money {
    return new Money(this.value.times(new Decimal(multiplier)));
  }

  dividedBy(divisor: number | string): Money {
    return new Money(this.value.dividedBy(new Decimal(divisor)));
  }

  // For database storage (string)
  toDbString(): string {
    return this.value.toFixed(2);
  }

  // For display
  toDisplay(decimals: number = 2): string {
    return this.value.toFixed(decimals);
  }

  // For JSON serialization
  toJSON(): string {
    return this.toDbString();
  }

  // Comparison
  equals(other: Money): boolean {
    return this.value.equals(other.value);
  }

  greaterThan(other: Money): boolean {
    return this.value.greaterThan(other.value);
  }

  lessThan(other: Money): boolean {
    return this.value.lessThan(other.value);
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  // Static factory from database string
  static fromDb(dbValue: string): Money {
    return new Money(dbValue);
  }
}
```

### Pattern 4: Shared Types Between Client and Server

**What:** Type definitions used by both packages
**When to use:** API response types, entity types

```typescript
// packages/shared/src/types/index.ts
export interface FixedAsset {
  id: number;
  inventoryNumber: string;
  name: string;
  purchaseValue: string;      // Decimal as string for precision
  depreciatedValue: string;
  remainingValue: string;
  purchaseDate: string;       // ISO date string
  usefulLifeMonths: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Pattern 5: Hono API Route with Type Safety

**What:** Backend route returning typed data
**When to use:** All API endpoints

```typescript
// packages/server/src/routes/assets.ts
import { Hono } from "hono";
import { db } from "../db";
import { fixedAssets } from "../db/schema";
import type { ApiResponse, FixedAsset } from "shared";

const app = new Hono();

app.get("/", async (c) => {
  const assets = await db.select().from(fixedAssets);

  // Drizzle returns decimals as strings - this is correct for precision
  const response: ApiResponse<FixedAsset[]> = {
    success: true,
    data: assets.map(asset => ({
      ...asset,
      purchaseDate: asset.purchaseDate.toISOString(),
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    })),
  };

  return c.json(response);
});

export default app;
```

### Pattern 6: Vite Proxy for Development

**What:** Proxy API requests from Vite dev server to Hono backend
**When to use:** Development mode to avoid CORS

```typescript
// packages/client/vite.config.ts
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

### Anti-Patterns to Avoid

- **Native JS numbers for money:** Never use `Number` for financial calculations. 0.1 + 0.2 !== 0.3
- **Manual SQL strings:** Always use Drizzle's query builder for type safety
- **Direct Drizzle decimal to calculations:** Convert to Money class first, then calculate
- **Importing packages across workspaces without building:** Ensure Turbo builds shared before server/client
- **Hardcoded database credentials:** Always use environment variables

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal arithmetic | Custom math functions | decimal.js | Floating point errors, rounding edge cases |
| Database migrations | Raw SQL scripts | drizzle-kit | Version tracking, rollbacks, type generation |
| UI components | Custom buttons, inputs | shadcn/ui | Accessibility, styling consistency |
| API type safety | Manual type assertions | Shared types package | Single source of truth, compile-time checks |
| CORS handling | Custom middleware | Hono cors() | Security edge cases |
| CSS utilities | Custom CSS classes | Tailwind CSS | Consistency, responsive design |
| Form validation | Custom validators | Zod | Edge cases, type inference |

**Key insight:** This stack is well-integrated. The temptation is to "simplify" by removing parts, but each component serves a purpose. The shared types package especially prevents client-server type drift.

## Common Pitfalls

### Pitfall 1: Decimal Type Returns String

**What goes wrong:** Developers expect `number` from database, get `string` for decimal columns
**Why it happens:** Drizzle ORM correctly preserves precision by returning decimals as strings
**How to avoid:**
- Design types with `string` for monetary fields from the start
- Use Money utility class for all calculations
- Document this behavior for the team
**Warning signs:** TypeScript errors comparing `string` to `number`, precision loss in calculations

### Pitfall 2: Vite Proxy Only Works in Development

**What goes wrong:** API calls fail in production builds
**Why it happens:** Vite's proxy is dev-server only, not included in build output
**How to avoid:**
- Use environment variables for API base URL
- Configure production to serve API from same domain or configure CORS
- Test production builds locally
**Warning signs:** API calls work in `bun run dev` but fail in production

### Pitfall 3: Tailwind v4 Breaking Changes with shadcn/ui

**What goes wrong:** Components don't render correctly, styles missing
**Why it happens:** Tailwind v4 has significant changes from v3 (CSS-first config, new utilities)
**How to avoid:**
- Use `bunx shadcn@latest init` which supports v4
- Follow official shadcn/ui Vite installation guide exactly
- Use `@tailwindcss/vite` plugin, not PostCSS setup
**Warning signs:** Missing styles, white page, CSS compilation errors

### Pitfall 4: Turbo Cache Issues with Schema Changes

**What goes wrong:** Old types used after schema changes
**Why it happens:** Turbo aggressively caches build outputs
**How to avoid:**
- Run `turbo build --force` after schema changes
- Ensure `turbo.json` has correct dependency graph
- Add `drizzle/**` to outputs in turbo config
**Warning signs:** TypeScript shows old types, stale imports

### Pitfall 5: MySQL Connection Pool Exhaustion

**What goes wrong:** Database connections fail under load
**Why it happens:** Pool size too small or connections not released
**How to avoid:**
- Configure appropriate `connectionLimit` in pool (default 10)
- Ensure queries complete (no hanging promises)
- Use connection pooling, not single connections
**Warning signs:** "Too many connections" errors, timeouts

### Pitfall 6: Bun Workspace Dependencies

**What goes wrong:** Package installed in wrong workspace
**Why it happens:** Bun's `--filter` behaves differently than npm/yarn
**How to avoid:**
- Use `bun add package --cwd packages/server` instead of filter
- Or `cd packages/server && bun add package`
**Warning signs:** Package in root package.json instead of workspace

## Code Examples

Verified patterns from official sources:

### Drizzle Config for MySQL

```typescript
// packages/server/drizzle.config.ts
// Source: https://orm.drizzle.team/docs/get-started-mysql
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Running Migrations

```bash
# Generate migration from schema changes
bunx drizzle-kit generate

# Apply migrations to database
bunx drizzle-kit migrate

# Or push directly (development only)
bunx drizzle-kit push
```

### shadcn/ui Setup Commands

```bash
# Source: https://ui.shadcn.com/docs/installation/vite
cd packages/client

# Initialize (will ask for preferences)
bunx shadcn@latest init

# Add components as needed
bunx shadcn@latest add button
bunx shadcn@latest add input
bunx shadcn@latest add table
bunx shadcn@latest add dialog
bunx shadcn@latest add form
```

### Hono App Entry Point

```typescript
// packages/server/src/index.ts
// Source: https://hono.dev/docs/getting-started/bun
import { Hono } from "hono";
import { cors } from "hono/cors";
import assetsRoutes from "./routes/assets";

const app = new Hono();

// Middleware
app.use("/*", cors());

// Routes
app.route("/api/assets", assetsRoutes);

// Health check
app.get("/api/health", (c) => c.json({ status: "ok" }));

export default {
  port: 3000,
  fetch: app.fetch,
};
```

### Financial Calculation Example

```typescript
// Source: https://mikemcl.github.io/decimal.js/
import { Money } from "shared";

// Calculate monthly depreciation
function calculateMonthlyDepreciation(
  purchaseValue: string,  // From database
  usefulLifeMonths: number
): string {
  const value = Money.fromDb(purchaseValue);
  const monthly = value.dividedBy(usefulLifeMonths);
  return monthly.toDbString();  // Returns string for database
}

// Example: 0.1 + 0.2 = 0.3 (not 0.30000000000000004)
const a = new Money("0.1");
const b = new Money("0.2");
const result = a.plus(b);
console.log(result.toDisplay()); // "0.30"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 (JS config) | Tailwind v4 (CSS-first) | 2025 | New `@theme` directive, `@tailwindcss/vite` plugin |
| tailwindcss-animate | tw-animate-css | 2025 | Deprecated animation library in shadcn |
| forwardRef in React | data-slot pattern | React 19 | Components simplified |
| drizzle-kit separate install | Included workflow | 2025 | Better migration experience |
| Separate API proxy server | Vite built-in proxy | 2024 | Simpler dev setup |

**Deprecated/outdated:**
- `tailwindcss-animate`: Use `tw-animate-css` instead for shadcn animations
- Tailwind PostCSS setup: Use `@tailwindcss/vite` plugin with Vite
- `default` shadcn style: `new-york` is now the recommended default
- `toast` component: Use `sonner` instead

## Open Questions

Things that couldn't be fully resolved:

1. **Drizzle relational query decimal bug**
   - What we know: When using `with` (relations) in Drizzle queries, decimal fields may incorrectly serialize to `number` instead of `string`
   - What's unclear: If this is fixed in latest version (0.45.x)
   - Recommendation: Avoid using `with` for tables with decimal columns, or verify behavior in testing

2. **Bun concurrent query issues**
   - What we know: Bun 1.2.0 had issues with concurrent database queries
   - What's unclear: Current status in latest Bun version
   - Recommendation: Use connection pooling with mysql2 (not Bun native SQL) which is more stable

3. **shadcn/ui React 19 peer dependencies**
   - What we know: Some packages may have peer dependency warnings with React 19
   - What's unclear: Which specific packages and if `--force` is safe
   - Recommendation: Use `--force` during install if needed, warnings are usually safe to ignore

## Sources

### Primary (HIGH confidence)
- [bhvr GitHub Repository](https://github.com/stevedylandev/bhvr) - Project structure, commands, shared types pattern
- [bhvr Documentation](https://bhvr.dev/getting-started) - Getting started guide
- [Drizzle ORM MySQL Setup](https://orm.drizzle.team/docs/get-started-mysql) - Driver initialization, connection
- [Drizzle MySQL Column Types](https://orm.drizzle.team/docs/column-types/mysql) - decimal, int, varchar, datetime
- [Drizzle Migrations](https://orm.drizzle.team/docs/migrations) - drizzle-kit generate, push, migrate
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) - Complete setup guide
- [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) - v4 upgrade and changes
- [Hono Bun Guide](https://hono.dev/docs/getting-started/bun) - Setup, routing, static files
- [decimal.js API](https://mikemcl.github.io/decimal.js/) - Configuration, arithmetic, conversion

### Secondary (MEDIUM confidence)
- [Vite Proxy Configuration](https://medium.com/@eric_abell/simplifying-api-proxies-in-vite-a-guide-to-vite-config-js-a5cc3a091a2f) - Dev server proxy setup
- [TypeScript Monorepo Patterns](https://capelski.medium.com/effective-code-sharing-in-typescript-monorepos-475f9600f6b4) - Shared types strategies
- [Drizzle + Hono Factory Pattern](https://hono.dev/docs/helpers/factory) - Database middleware integration

### Tertiary (LOW confidence)
- [Drizzle Decimal Bug](https://github.com/drizzle-team/drizzle-orm/issues/3943) - Relational query decimal serialization issue
- [Bun Concurrent Query Issue](https://orm.drizzle.team/docs/connect-bun-sql) - Mentioned in Drizzle docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are well-documented, bhvr template is production-tested
- Architecture: HIGH - Patterns from official documentation
- Pitfalls: MEDIUM - Some from community sources, not all verified in 2026

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stack is stable)
