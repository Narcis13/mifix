# MiFix - Gestiune Mijloace Fixe

## What This Is

Aplicație web pentru evidența și gestiunea mijloacelor fixe dintr-un spital, conform legislației românești. Înlocuiește un sistem FoxPro vechi care nu mai funcționează pe hardware modern. Aplicația permite înregistrarea activelor, calculul amortizării lunare, transferuri între gestiuni și generarea rapoartelor de evidență.

## Core Value

Contabilitatea poate genera amortizarea lunară corect și la timp pentru toate mijloacele fixe active.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Înregistrare mijloace fixe cu toate datele necesare (nr. inventar, denumire, clasificare, valoare, durată normală)
- [ ] Evidență gestiuni și locuri de folosință în cadrul gestiunilor
- [ ] Evidență surse de finanțare
- [ ] Plan de conturi pentru încadrarea contabilă
- [ ] Clasificarea mijloacelor fixe conform HG 2139/2004
- [ ] Calcul și generare amortizare lunară (metoda liniară)
- [ ] Transfer mijloace fixe între gestiuni
- [ ] Casare și declasare mijloace fixe
- [ ] Fișa mijlocului fix (raport detaliat per activ)
- [ ] Balanța de verificare cantitativ-valorică
- [ ] Jurnal acte operate
- [ ] Autentificare simplă (user/parolă)

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
| Pornire fresh fără migrare FoxPro | Date vechi, structură diferită, efort mare de migrare | — Pending |
| Doar amortizare liniară în v1 | Cea mai folosită metodă, simplifică implementarea | — Pending |
| Rapoarte doar vizualizare | Suficient pentru nevoi curente, export se poate adăuga ulterior | — Pending |
| Login simplu fără roluri | Un singur departament folosește aplicația | — Pending |

---
*Last updated: 2026-01-22 after initialization*
