# Requirements: MiFix - Gestiune Mijloace Fixe

**Defined:** 2026-01-22
**Core Value:** Contabilitatea poate genera amortizarea lunară corect și la timp pentru toate mijloacele fixe active.

## v1 Requirements

Requirements pentru release-ul inițial. Fiecare se mapează la faze din roadmap.

### Setup & Infrastructură

- [ ] **SETUP-01**: Proiect inițializat cu bhvr template (Bun, Hono, React, Vite)
- [ ] **SETUP-02**: Bază de date MySQL configurată cu Drizzle ORM
- [ ] **SETUP-03**: shadcn/ui instalat și configurat
- [ ] **SETUP-04**: Tipuri shared între client și server
- [ ] **SETUP-05**: decimal.js integrat pentru calcule financiare

### Nomenclatoare

- [ ] **NOM-01**: CRUD gestiuni (cod, denumire, responsabil, activ)
- [ ] **NOM-02**: CRUD locuri de folosință (în cadrul gestiunilor)
- [ ] **NOM-03**: CRUD surse de finanțare (cod, denumire)
- [ ] **NOM-04**: CRUD plan de conturi (simbol, denumire, tip, cont amortizare)
- [ ] **NOM-05**: Clasificare MF conform HG 2139/2004 preîncărcată (cod, denumire, grupă, durată normală)

### Mijloace Fixe

- [ ] **MF-01**: Înregistrare mijloc fix cu toate câmpurile (nr. inventar, denumire, clasificare, gestiune, valoare, dată achiziție, durată normală)
- [ ] **MF-02**: Listare mijloace fixe cu filtrare (gestiune, stare, căutare text)
- [ ] **MF-03**: Vizualizare detalii mijloc fix
- [ ] **MF-04**: Editare mijloc fix
- [ ] **MF-05**: Validare număr inventar unic
- [ ] **MF-06**: Selectare clasificare din catalogul HG 2139/2004

### Operațiuni

- [ ] **OP-01**: Transfer mijloc fix între gestiuni cu documentare (gestiune sursă, destinație, dată, observații)
- [ ] **OP-02**: Transfer mijloc fix între locuri de folosință în aceeași gestiune
- [ ] **OP-03**: Casare mijloc fix (marcare ca scos din funcțiune)
- [ ] **OP-04**: Declasare mijloc fix (reducere valoare)
- [ ] **OP-05**: Istoric tranzacții per mijloc fix (toate operațiunile)

### Amortizare

- [ ] **AMO-01**: Calcul amortizare liniară (valoare inventar / durată normală în luni)
- [ ] **AMO-02**: Generare amortizare lunară batch (pentru toate MF active și amortizabile)
- [ ] **AMO-03**: Actualizare valoare amortizată și valoare rămasă pe MF
- [ ] **AMO-04**: Vizualizare istoric amortizări per MF
- [ ] **AMO-05**: Vizualizare amortizări pe lună/an (toate MF-urile)
- [ ] **AMO-06**: Nu depășește valoarea de amortizat (ultima lună = rest)

### Rapoarte

- [ ] **RAP-01**: Fișa mijlocului fix (date complete + istoric tranzacții + istoric amortizare)
- [ ] **RAP-02**: Balanța de verificare cantitativ-valorică (pe gestiuni, cu totaluri)
- [ ] **RAP-03**: Jurnal acte operate (istoric tranzacții pe perioadă)
- [ ] **RAP-04**: Situație amortizare lunară (amortizări calculate pe lună)
- [ ] **RAP-05**: Filtrare rapoarte pe perioadă, gestiune, clasificare

### Autentificare

- [ ] **AUTH-01**: Login cu user și parolă
- [ ] **AUTH-02**: Sesiune persistentă (rămâne logat între refresh-uri)
- [ ] **AUTH-03**: Logout

## v2 Requirements

Amânate pentru release viitor. Tracked dar nu în roadmap-ul curent.

### Export Rapoarte

- **EXP-01**: Export rapoarte în PDF
- **EXP-02**: Export rapoarte în Excel

### Amortizare Avansată

- **AMO-ADV-01**: Amortizare degresivă
- **AMO-ADV-02**: Amortizare accelerată
- **AMO-ADV-03**: Dual tracking fiscal vs contabil

### Utilizatori Multipli

- **USER-01**: Mai multe conturi de utilizator
- **USER-02**: Roluri și permisiuni

### Integrări

- **INT-01**: Export SAF-T (Declaration 406)
- **INT-02**: Import date din alte sisteme

## Out of Scope

Explicit excluse. Documentate pentru a preveni scope creep.

| Feature | Motiv |
|---------|-------|
| Multi-tenant/SaaS | Aplicație internă pentru un singur spital |
| Mobile app | Web-first, suficient pentru uz intern |
| Migrare date FoxPro | Se pornește fresh, fără import date vechi |
| OAuth/SSO | Login simplu e suficient pentru nevoi curente |
| Real-time collaboration | Single-user efectiv, fără concurență |
| Audit log detaliat | Istoric tranzacții acoperă nevoia de bază |
| Documente atașate | Nu e necesar pentru v1 |
| Inventariere cu barcode | Funcționalitate avansată, poate v2+ |

## Traceability

Care faze acoperă care requirements. Actualizat în timpul creării roadmap-ului.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | TBD | Pending |
| SETUP-02 | TBD | Pending |
| SETUP-03 | TBD | Pending |
| SETUP-04 | TBD | Pending |
| SETUP-05 | TBD | Pending |
| NOM-01 | TBD | Pending |
| NOM-02 | TBD | Pending |
| NOM-03 | TBD | Pending |
| NOM-04 | TBD | Pending |
| NOM-05 | TBD | Pending |
| MF-01 | TBD | Pending |
| MF-02 | TBD | Pending |
| MF-03 | TBD | Pending |
| MF-04 | TBD | Pending |
| MF-05 | TBD | Pending |
| MF-06 | TBD | Pending |
| OP-01 | TBD | Pending |
| OP-02 | TBD | Pending |
| OP-03 | TBD | Pending |
| OP-04 | TBD | Pending |
| OP-05 | TBD | Pending |
| AMO-01 | TBD | Pending |
| AMO-02 | TBD | Pending |
| AMO-03 | TBD | Pending |
| AMO-04 | TBD | Pending |
| AMO-05 | TBD | Pending |
| AMO-06 | TBD | Pending |
| RAP-01 | TBD | Pending |
| RAP-02 | TBD | Pending |
| RAP-03 | TBD | Pending |
| RAP-04 | TBD | Pending |
| RAP-05 | TBD | Pending |
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 0
- Unmapped: 34 ⚠️

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after initial definition*
