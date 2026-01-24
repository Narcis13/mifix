# Phase 6: Rapoarte & Autentificare - Research

**Researched:** 2026-01-24
**Domain:** Authentication (simple username/password) and Report Generation (Romanian accounting compliance)
**Confidence:** HIGH

## Summary

This phase combines two distinct domains: simple authentication for a single-user or small-team accounting application, and report generation for Romanian fixed asset management compliance.

For **authentication**, the project uses Bun + Hono stack. Bun provides native `Bun.password` API with Argon2id support (recommended) and bcrypt compatibility. Hono provides built-in JWT middleware with cookie support, and cookie helpers for session management. The approach is straightforward: store hashed passwords in database, issue JWT tokens on login, validate tokens via middleware, store tokens in HttpOnly cookies for security.

For **reports**, the Romanian accounting reports (Fisa Mijlocului Fix, Balanta de Verificare, Jurnal Acte Operate, Situatie Amortizare) are primarily tabular data. The recommended approach is browser printing via `react-to-print` library with CSS print media queries, which provides the simplest implementation while allowing users to print or save as PDF via browser. This avoids complex PDF generation libraries and matches the existing project's simplicity.

**Primary recommendation:** Use Bun.password (Argon2id) + Hono JWT middleware with HttpOnly cookies for auth; use react-to-print with CSS @media print for reports.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Bun.password | native | Password hashing | Built into Bun, uses Argon2id by default, no external deps |
| hono/jwt | built-in | JWT auth middleware | Bundled with Hono, supports cookie-based tokens |
| hono/cookie | built-in | Cookie management | Bundled with Hono, handles signed cookies |
| react-to-print | 3.x | Print React components | De-facto standard for React printing, simple API |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jose (optional) | 5.x | JWT generation | Only if Hono's built-in sign/verify insufficient |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-to-print | @react-pdf/renderer | PDF generation is complex, browser print is simpler for accounting reports |
| Bun.password | bcrypt npm package | Bun.password is native, no npm dependency needed |
| JWT in HttpOnly cookie | localStorage | HttpOnly cookie is more secure against XSS |
| Session-based auth | Lucia Auth | Overkill for simple username/password requirement |

**Installation:**
```bash
# react-to-print is the only new dependency
cd packages/client && bun add react-to-print
```

## Architecture Patterns

### Recommended Project Structure

```
packages/server/src/
  routes/
    auth.ts              # Login, logout endpoints
    rapoarte.ts          # Report data endpoints
  middleware/
    auth.ts              # JWT verification middleware
  db/
    schema.ts            # Add users table

packages/client/src/
  components/
    auth/
      LoginForm.tsx      # Login form component
      AuthContext.tsx    # Auth state management
      ProtectedRoute.tsx # Route guard component
    rapoarte/
      FisaMijlocFix.tsx        # Single asset report
      BalantaVerificare.tsx    # Balance verification report
      JurnalActe.tsx           # Transaction journal
      SituatieAmortizare.tsx   # Monthly depreciation report
      ReportFilters.tsx        # Shared filter component
      PrintLayout.tsx          # Print wrapper component
  pages/
    Login.tsx            # Login page
    Rapoarte.tsx         # Reports dashboard
  hooks/
    useAuth.ts           # Auth hook
```

### Pattern 1: Authentication Flow

**What:** JWT-based authentication with HttpOnly cookies
**When to use:** For all authenticated routes

**Server-side (Hono):**
```typescript
// Source: https://hono.dev/docs/middleware/builtin/jwt
// Source: https://bun.com/docs/api/hashing

import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { setCookie, deleteCookie } from "hono/cookie";
import { sign } from "hono/jwt";

const authRoutes = new Hono();

// Login endpoint
authRoutes.post("/login", async (c) => {
  const { username, password } = await c.req.json();

  // Fetch user from database
  const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user[0]) {
    return c.json({ success: false, message: "Credentiale invalide" }, 401);
  }

  // Verify password using Bun.password
  const valid = await Bun.password.verify(password, user[0].passwordHash);
  if (!valid) {
    return c.json({ success: false, message: "Credentiale invalide" }, 401);
  }

  // Generate JWT
  const token = await sign(
    { sub: user[0].id, username: user[0].username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
    c.env?.JWT_SECRET || process.env.JWT_SECRET || "dev-secret"
  );

  // Set HttpOnly cookie
  setCookie(c, "token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return c.json({ success: true, data: { username: user[0].username } });
});

// Logout endpoint
authRoutes.post("/logout", (c) => {
  deleteCookie(c, "token", { path: "/" });
  return c.json({ success: true });
});

// Protected routes middleware
const authMiddleware = jwt({
  secret: process.env.JWT_SECRET || "dev-secret",
  cookie: "token",
});

// Apply to protected routes
app.use("/api/*", async (c, next) => {
  // Skip auth for login/logout
  if (c.req.path === "/api/auth/login" || c.req.path === "/api/auth/logout") {
    return next();
  }
  return authMiddleware(c, next);
});
```

### Pattern 2: React Protected Routes

**What:** Client-side route protection with auth context
**When to use:** For protecting all app routes except login

```typescript
// Source: https://www.robinwieruch.de/react-router-private-routes/

// AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  user: { username: string } | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUser(data.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.data);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Se incarca...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### Pattern 3: Report Printing with react-to-print

**What:** Print React components using browser print dialog
**When to use:** For all accounting reports

```typescript
// Source: https://github.com/MatthewHerbst/react-to-print

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

// PrintLayout.tsx - Wrapper for printable content
export function PrintLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="print-layout">
      <div className="print-header">
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        <p className="text-xs text-muted-foreground">
          Generat: {new Date().toLocaleDateString("ro-RO")}
        </p>
      </div>
      <div className="print-content">{children}</div>
    </div>
  );
}

// Example Report Component
export function FisaMijlocFix({ mijlocFixId }: { mijlocFixId: number }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<MijlocFixFisa | null>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Fisa-${data?.numarInventar || ""}`,
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
        .print-only { display: block !important; }
      }
    `,
  });

  return (
    <div>
      <div className="no-print mb-4">
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Printeaza
        </Button>
      </div>

      <div ref={contentRef}>
        <PrintLayout title="Fisa Mijlocului Fix" subtitle={data?.denumire}>
          {/* Report content */}
        </PrintLayout>
      </div>
    </div>
  );
}
```

### Pattern 4: Report Data API Endpoint

**What:** Aggregate data for complex reports
**When to use:** For reports combining multiple data sources

```typescript
// routes/rapoarte.ts
export const rapoarteRoutes = new Hono();

// RAP-01: Fisa Mijlocului Fix
rapoarteRoutes.get("/fisa/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  // Get asset with all relations
  const [asset] = await db.select().from(mijloaceFixe)
    .leftJoin(clasificari, eq(mijloaceFixe.clasificareCod, clasificari.cod))
    .leftJoin(gestiuni, eq(mijloaceFixe.gestiuneId, gestiuni.id))
    // ... more joins
    .where(eq(mijloaceFixe.id, id));

  // Get transaction history
  const transactions = await db.select().from(tranzactii)
    .where(eq(tranzactii.mijlocFixId, id))
    .orderBy(desc(tranzactii.dataOperare));

  // Get depreciation history
  const depreciations = await db.select().from(amortizari)
    .where(eq(amortizari.mijlocFixId, id))
    .orderBy(desc(amortizari.an), desc(amortizari.luna));

  return c.json({
    success: true,
    data: {
      ...asset,
      tranzactii: transactions,
      amortizari: depreciations,
    },
  });
});

// RAP-02: Balanta de Verificare
rapoarteRoutes.get("/balanta", async (c) => {
  const gestiuneId = c.req.query("gestiuneId");
  const dataStart = c.req.query("dataStart");
  const dataEnd = c.req.query("dataEnd");

  // Aggregate by gestiune with totals
  const result = await db.select({
    gestiuneId: mijloaceFixe.gestiuneId,
    gestiuneCod: gestiuni.cod,
    gestiuneDenumire: gestiuni.denumire,
    numarActive: sql<number>`count(*)`,
    valoareInventar: sql<string>`sum(${mijloaceFixe.valoareInventar})`,
    valoareAmortizata: sql<string>`sum(${mijloaceFixe.valoareAmortizata})`,
    valoareRamasa: sql<string>`sum(${mijloaceFixe.valoareRamasa})`,
  })
    .from(mijloaceFixe)
    .leftJoin(gestiuni, eq(mijloaceFixe.gestiuneId, gestiuni.id))
    .where(eq(mijloaceFixe.stare, "activ"))
    .groupBy(mijloaceFixe.gestiuneId);

  return c.json({ success: true, data: result });
});
```

### Anti-Patterns to Avoid

- **Storing JWT in localStorage:** Vulnerable to XSS attacks. Use HttpOnly cookies instead.
- **Storing passwords in plain text:** Always hash with Argon2id or bcrypt.
- **Client-side only auth checks:** Always validate on server. Client checks are for UX only.
- **Complex PDF generation for simple reports:** Browser print with CSS is simpler and more maintainable.
- **Hardcoding JWT secrets:** Use environment variables.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash function | Bun.password with Argon2id | Cryptographic security requires proven algorithms |
| JWT verification | Manual token parsing | hono/jwt middleware | Token verification has many edge cases |
| Session cookies | Manual cookie parsing | hono/cookie helpers | Cookie security (HttpOnly, Secure, SameSite) |
| Print functionality | window.print directly | react-to-print | Handles iframe, styles, edge cases |
| CSRF protection | Custom tokens | SameSite cookies | Browser-level protection sufficient for same-origin |

**Key insight:** Authentication and printing both have subtle security and compatibility issues. Using established patterns prevents vulnerabilities and cross-browser issues.

## Common Pitfalls

### Pitfall 1: Cookie Not Sent Cross-Origin During Development

**What goes wrong:** Login works but subsequent requests fail because cookie isn't sent
**Why it happens:** Vite dev server proxies to different port, browser treats as cross-origin
**How to avoid:** Configure Vite proxy correctly with changeOrigin, or use same port
**Warning signs:** 401 errors after successful login

```typescript
// vite.config.ts - ensure proxy is configured
export default defineConfig({
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

### Pitfall 2: JWT Expiry Not Handled

**What goes wrong:** User suddenly logged out when token expires
**Why it happens:** No token refresh mechanism
**How to avoid:** For simple app, use longer expiry (24h) and handle 401 gracefully
**Warning signs:** Random logouts during work session

### Pitfall 3: Print Styles Not Applied

**What goes wrong:** Printed report looks different from screen
**Why it happens:** CSS not properly scoped for @media print
**How to avoid:** Test printing early, use pageStyle option in react-to-print
**Warning signs:** Missing styles, wrong layout in print preview

### Pitfall 4: Report Data Not Aggregated Correctly

**What goes wrong:** Report totals don't match expected values
**Why it happens:** SQL aggregation with decimals loses precision
**How to avoid:** Use CAST in SQL, verify with Money class on client
**Warning signs:** Off-by-one-cent errors in totals

### Pitfall 5: Users Table Missing Salt/Hash Columns

**What goes wrong:** Login fails or password storage is insecure
**Why it happens:** Schema designed for plain text passwords
**How to avoid:** Use single passwordHash column (Argon2/bcrypt includes salt)
**Warning signs:** Separate salt column in schema (unnecessary with modern algorithms)

## Code Examples

### Database Schema for Users

```typescript
// Source: Drizzle ORM + project patterns

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  activ: boolean("activ").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});
```

### Password Hashing with Bun

```typescript
// Source: https://bun.com/docs/api/hashing

// Creating a new user
const passwordHash = await Bun.password.hash(plainPassword, {
  algorithm: "argon2id",
  memoryCost: 19456,  // 19 MiB per OWASP
  timeCost: 2,
});

await db.insert(users).values({
  username,
  passwordHash,
});

// Verifying password
const isValid = await Bun.password.verify(plainPassword, user.passwordHash);
// Bun.password.verify auto-detects algorithm from hash format
```

### CSS Print Styles

```css
/* Source: CSS Print Media best practices */

/* Add to index.css */
@media print {
  /* Hide non-printable elements */
  .no-print,
  nav,
  .print-hide {
    display: none !important;
  }

  /* Show print-only elements */
  .print-only {
    display: block !important;
  }

  /* Reset backgrounds for printing */
  body {
    background: white !important;
    color: black !important;
  }

  /* Table styling for reports */
  table {
    border-collapse: collapse;
    width: 100%;
  }

  th, td {
    border: 1px solid #000;
    padding: 4px 8px;
    text-align: left;
  }

  /* Prevent page breaks inside rows */
  tr {
    page-break-inside: avoid;
  }

  /* Page settings */
  @page {
    size: A4;
    margin: 15mm;
  }

  /* Report header on each page */
  .print-header {
    position: running(header);
    text-align: center;
    border-bottom: 1px solid #000;
    padding-bottom: 10px;
    margin-bottom: 10px;
  }
}
```

### Login Form Component

```typescript
// Based on project patterns (shadcn/ui, react-hook-form)

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/components/auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const loginSchema = z.object({
  username: z.string().min(1, "Introduceti utilizatorul"),
  password: z.string().min(1, "Introduceti parola"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    const success = await login(data.username, data.password);
    if (success) {
      toast.success("Autentificare reusita");
      navigate(from, { replace: true });
    } else {
      toast.error("Credentiale invalide");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-20">
      <CardHeader>
        <CardTitle>Autentificare MiFix</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Utilizator</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parola</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} autoComplete="current-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Autentificare
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| bcrypt only | Argon2id preferred | 2015 (PHC winner) | Better GPU/ASIC resistance |
| localStorage for tokens | HttpOnly cookies | Long-standing best practice | XSS protection |
| Complex PDF libraries | Browser print + CSS | Increasingly common | Simpler maintenance |
| Separate salt storage | Embedded in hash | bcrypt/Argon2 design | No separate salt column needed |

**Deprecated/outdated:**
- MD5/SHA1 for passwords: Completely broken, never use
- Session storage for auth tokens: Still XSS vulnerable
- bcrypt cost factor < 10: Too fast, increase to 12+ or use Argon2id

## Open Questions

1. **Seed User Creation**
   - What we know: Need at least one user to login
   - What's unclear: Should there be a CLI command, seed script, or initial setup page?
   - Recommendation: Add seed script similar to clasificari seed, create default admin user

2. **Report Export to Excel**
   - What we know: Requirements mention reports, not export format
   - What's unclear: Whether Excel/CSV export is needed
   - Recommendation: Start with print only, Excel export is future enhancement

3. **Multiple Users/Roles**
   - What we know: Requirements say "user si parola" (singular user implied)
   - What's unclear: Whether multiple users with different permissions needed
   - Recommendation: Implement single user type initially, roles are v2 scope

## Sources

### Primary (HIGH confidence)
- [Bun Hashing API](https://bun.com/docs/api/hashing) - Bun.password documentation
- [Hono JWT Middleware](https://hono.dev/docs/middleware/builtin/jwt) - JWT auth with cookies
- [Hono Cookie Helper](https://hono.dev/docs/helpers/cookie) - Cookie management

### Secondary (MEDIUM confidence)
- [react-to-print GitHub](https://github.com/MatthewHerbst/react-to-print) - Print library docs
- [Password Hashing Guide 2025](https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/) - Algorithm comparison
- [React Router Private Routes](https://www.robinwieruch.de/react-router-private-routes/) - Protected route pattern

### Tertiary (LOW confidence)
- WebSearch results for JWT storage best practices - multiple sources agree on HttpOnly cookies

## Metadata

**Confidence breakdown:**
- Authentication stack: HIGH - Bun.password and Hono JWT are well-documented, native APIs
- Report generation: HIGH - react-to-print is stable, CSS print is standard
- Protected routes: MEDIUM - Pattern is common but implementation varies
- Database schema: HIGH - Simple users table, follows existing project patterns

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain, no fast-moving changes expected)
