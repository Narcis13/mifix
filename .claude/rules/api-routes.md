---
paths:
  - "packages/server/src/routes/**"
---

# API Route Rules

- ALL routes return `ApiResponse<T>` format: `{ success: boolean, data?: T, message?: string, errors?: string[] }`
- ALL list endpoints support pagination: `PaginatedResponse<T>` with `items, total, page, pageSize, totalPages`
- ALL mutation routes use Zod validation via `zValidator('json', schema)`
- ALL monetary calculations use `Money` class from `@mifix/shared`
- Register new routes in `packages/server/src/index.ts`
- Follow existing naming: kebab-case URLs, camelCase in TypeScript
- DB transactions for multi-table operations: `await db.transaction(async (tx) => { ... })`
