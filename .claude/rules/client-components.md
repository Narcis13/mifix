---
paths:
  - "packages/client/src/**"
---

# Client Component Rules

- Use shadcn/ui components (from `components/ui/`)
- Tables: Use `DataTable` component with TanStack column definitions
- Forms: Use `react-hook-form` with Zod resolver
- Dialogs: Use Radix `Dialog` component pattern from existing operation dialogs
- Reports: Wrap in `PrintLayout` component for print support
- Filters: Use `ReportFilters` component or follow its pattern
- Navigation: Add new pages to `App.tsx` router
- API calls: Use `fetch` with `/api/` prefix, handle ApiResponse wrapper
- Toast notifications: Use `sonner` for success/error messages
- Monetary display: Use `Money.fromDb(value).toDisplay()` for formatting
