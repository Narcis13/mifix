# MiFix - Gestiune Mijloace Fixe

## What This Is

Aplicație web pentru evidența și gestiunea mijloacelor fixe dintr-un spital, conform legislației românești. Înlocuiește un sistem FoxPro vechi care nu mai funcționează pe hardware modern. Aplicația permite înregistrarea activelor, calculul amortizării lunare, transferuri între gestiuni și generarea rapoartelor de evidență.

## Core Value

Contabilitatea poate genera amortizarea lunară corect și la timp pentru toate mijloacele fixe active.

## Current State (v1.0 Shipped)

**Tech stack:** Bun + Hono + React + Vite monorepo, MySQL with Drizzle ORM, shadcn/ui
**LOC:** 14,138 TypeScript
**Shipped:** 2026-01-24

## Requirements

### Validated

- ✓ Înregistrare mijloace fixe cu toate datele necesare (nr. inventar, denumire, clasificare, valoare, durată normală) — v1.0
- ✓ Evidență gestiuni și locuri de folosință în cadrul gestiunilor — v1.0
- ✓ Evidență surse de finanțare — v1.0
- ✓ Plan de conturi pentru încadrarea contabilă — v1.0
- ✓ Clasificarea mijloacelor fixe conform HG 2139/2004 — v1.0
- ✓ Calcul și generare amortizare lunară (metoda liniară) — v1.0
- ✓ Transfer mijloace fixe între gestiuni — v1.0
- ✓ Casare și declasare mijloace fixe — v1.0
- ✓ Fișa mijlocului fix (raport detaliat per activ) — v1.0
- ✓ Balanța de verificare cantitativ-valorică — v1.0
- ✓ Jurnal acte operate — v1.0
- ✓ Autentificare simplă (user/parolă) — v1.0

### Active

(None — awaiting v1.1 requirements definition)

### Out of Scope

- Export PDF/Excel — nu e necesar pentru v1, rapoartele se vizualizează în browser
- Roluri și permisiuni multiple — doar contabilitatea folosește aplicația
- Multi-tenant/SaaS — aplicație internă pentru un singur spital
- Migrare date din FoxPro — se pornește fresh
- Amortizare degresivă/accelerată — doar liniară pentru v1
- OAuth/SSO — login simplu e suficient
- Mobile app — doar web

## Context

**Situația actuală:**
- Spitalul folosește un program FoxPro de gestiune mijloace fixe
- Programul se blochează frecvent și nu mai rulează pe hardware nou
- Departamentul de contabilitate are nevoie de o soluție modernă

**v1.0 shipped:**
- 14,138 LOC TypeScript across client/server/shared packages
- 6 phases, 26 plans, 34 requirements delivered
- 2 days from init to ship

**Utilizatori:**
- Departamentul de contabilitate (1-2 persoane)
- Acces din rețeaua internă a spitalului

**Referință legală:**
- HG 2139/2004 — Catalogul privind clasificarea și duratele normale de funcționare a mijloacelor fixe
- Metode de amortizare conform legislației românești

## Constraints

- **Tech stack**: bhvr template (Bun, Hono, React, Vite), shadcn/ui, Drizzle ORM, MySQL — conform spec.md
- **Deployment**: Server intern spital, nu cloud public
- **Conformitate**: Clasificare și amortizare conform legislației românești
- **Single-user**: Nu necesită concurență complexă sau locking

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pornire fresh fără migrare FoxPro | Date vechi, structură diferită, efort mare de migrare | ✓ Good |
| Doar amortizare liniară în v1 | Cea mai folosită metodă, simplifică implementarea | ✓ Good |
| Rapoarte doar vizualizare | Suficient pentru nevoi curente, export se poate adăuga ulterior | ✓ Good |
| Login simplu fără roluri | Un singur departament folosește aplicația | ✓ Good |
| Manual scaffold instead of bhvr template | Template CLI failed, equivalent structure created manually | ✓ Good |
| shadcn/ui New York style with Neutral base | Cleaner, more professional look | ✓ Good |
| Immutable Money class | All arithmetic returns new instances, preventing mutation bugs | ✓ Good |
| Dialog-based forms for nomenclator CRUD | Single component handles both modes, consistent UX | ✓ Good |
| JWT in HttpOnly cookies | XSS protection, better than localStorage | ✓ Good |
| Atomic db.transaction() for operations | Ensures data integrity for multi-step operations | ✓ Good |

---
*Last updated: 2026-01-24 after v1.0 milestone*
