---
name: mifix-migration
description: Use this skill when working on the MiFix legacy-to-modern migration. Handles session bootstrap, phase execution, state tracking, and context management for the FoxPro-to-SaaS migration project.
---

# MiFix Migration Orchestrator

You are executing a phased migration of a Romanian FoxPro inventory management system to a modern SaaS app.

## Session Bootstrap (ALWAYS DO FIRST)

```
1. READ .claude/MIGRATION-STATE.md
2. RUN: git status && git log --oneline -5
3. IDENTIFY next uncompleted task
4. ANNOUNCE: "Resuming at Phase X, Task X.Y: [description]"
5. IF Phase 1-2: READ import/mf/analysis-data-model.md (schema reference)
   IF Phase 3-4: READ import/mf/analysis-business-logic.md (operations reference)
   IF Phase 4-5: READ import/mf/analysis-reports.md (reports reference)
```

## Phase Execution Protocol

### Before Starting a Task
1. Read only the files you need for THIS task (minimize context usage)
2. Check existing patterns in similar code (e.g., look at existing routes before adding new ones)
3. Plan the changes mentally before writing

### While Executing
- Follow existing code patterns EXACTLY (copy structure from similar files)
- Use Money class for ALL financial calculations
- Use Zod for ALL validation
- Use Drizzle relations for ALL joins
- Test incrementally: write code -> verify it compiles -> test endpoint

### After Completing a Task
1. Verify the change works (run dev server, test endpoint)
2. Update MIGRATION-STATE.md: mark task as [x] completed
3. Update session log entry
4. Commit with descriptive message
5. Check if next task is in same phase (continue) or different phase (end session)

## Phase Details

### Phase 1: Schema Completions
**Context needed:** `packages/server/src/db/schema.ts`, `import/mf/analysis-data-model.md`
**Pattern:** Copy existing table definitions (e.g., `surseFinantare` pattern for new tables)

Tasks:
- 1.1-1.3: New reference tables. Pattern: define table + relations + insertSchema + CRUD route + UI page
- 1.4-1.5: Add fields to existing tables. Pattern: alter schema + generate migration
- 1.6: Operation headers table (new concept bridging legacy batch operations)
- 1.7: Run `bun run db:generate && bun run db:push`
- 1.8-1.9: CRUD routes and UI following existing patterns

**Validation:** All new tables have routes, validation schemas, and basic CRUD UI.

### Phase 2: Legacy Data Migration
**Context needed:** `import/mf/legacy_data.sqlite`, `packages/server/src/db/schema.ts`
**New file:** `packages/server/src/db/migrate-legacy.ts`

The critical transform: MATERIAL + TRANZACT -> mijloace_fixe + tranzactii
- Each MATERIAL becomes one mijloace_fixe record
- Each TRANZACT line becomes one tranzactii record linked to its asset
- SOLDURI are NOT migrated (computed on demand in modern system)
- Operation grouping (OPERATII) maps to new operatiuni table

**Verification queries:**
```sql
-- Record counts must match
SELECT COUNT(*) FROM material;  -- should equal mijloace_fixe count
SELECT COUNT(*) FROM tranzact;  -- should equal tranzactii count
-- Value sums must match (within rounding tolerance)
```

### Phase 3: Missing Operations
**Context needed:** `import/mf/analysis-business-logic.md`, existing `routes/operatiuni.ts`
**Pattern:** Follow existing operation patterns (transfer-gestiune, casare, etc.)

Key business rules to preserve:
- Cannot delete operation if subsequent operations reference same asset
- Cannot exit more than available quantity
- Mass transfers update both asset and create transaction record

### Phase 4-5: Reports
**Context needed:** `import/mf/analysis-reports.md`, existing `routes/rapoarte.ts`
**Pattern:** API endpoint + React component + PrintLayout wrapper

Each report needs:
1. API route with query params (Zod validated)
2. SQL query with proper joins/aggregates
3. Money class for all totals
4. React component with ReportFilters + PrintLayout
5. Route registration in App.tsx

### Phase 6: Polish
- Data integrity checks (compare with VERIFIC.PRG checks)
- Print/export for all reports
- End-to-end testing

## Context Management Rules

**DO:**
- Read only files needed for current task
- Use subagents for exploration/research
- Commit after each task completion
- Update state tracker after each task

**DON'T:**
- Read ALL legacy analysis files at once (pick the relevant one)
- Read entire large files when you only need a section
- Keep exploratory context in main session (delegate to subagents)
- Work on multiple phases in one session

## Quick Reference: Existing Patterns

**New Drizzle table:**
```typescript
// In schema.ts
export const tableName = mysqlTable('table_name', {
  id: int('id').autoincrement().primaryKey(),
  cod: varchar('cod', { length: 20 }).notNull().unique(),
  denumire: varchar('denumire', { length: 200 }).notNull(),
  activ: boolean('activ').default(true),
});
```

**New CRUD route:**
```typescript
// In routes/table-name.ts
const app = new Hono();
app.get('/', async (c) => { /* list */ });
app.get('/:id', async (c) => { /* get by id */ });
app.post('/', zValidator('json', insertSchema), async (c) => { /* create */ });
app.put('/:id', zValidator('json', updateSchema), async (c) => { /* update */ });
export default app;
```

**New report endpoint:**
```typescript
app.get('/report-name', async (c) => {
  const params = c.req.query();
  // Validate params with Zod
  // Query with Drizzle joins
  // Compute totals with Money class
  return c.json({ success: true, data: result });
});
```

**New UI page:**
```tsx
// Follow existing patterns in pages/ directory
// Use DataTable for lists, Dialog for modals, PrintLayout for reports
```
