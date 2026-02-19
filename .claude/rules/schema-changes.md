---
paths:
  - "packages/server/src/db/**"
---

# Schema Change Rules

- ALL monetary fields must use `decimal('field_name', { precision: 15, scale: 2 })`
- ALL tables with user-facing data need `activ` boolean field (soft delete pattern)
- ALL lookup tables need `cod` (varchar, unique) + `denumire` (varchar) as minimum
- After schema changes: run `bun run --cwd packages/server db:generate` then `bun run --cwd packages/server db:push`
- Export ALL new tables and relations from schema.ts
- Create Zod insert/update schemas with `createInsertSchema` from drizzle-zod
- Update `packages/shared/src/types/index.ts` with corresponding TypeScript interfaces
