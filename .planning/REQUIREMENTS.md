# Requirements: MiFix - Gestiune Mijloace Fixe

**Defined:** 2026-01-22
**Core Value:** Contabilitatea poate genera amortizarea lunara corect si la timp pentru toate mijloacele fixe active.

## v1 Requirements

Requirements pentru release-ul initial. Fiecare se mapeaza la faze din roadmap.

### Setup & Infrastructura

- [ ] **SETUP-01**: Proiect initializat cu bhvr template (Bun, Hono, React, Vite)
- [ ] **SETUP-02**: Baza de date MySQL configurata cu Drizzle ORM
- [ ] **SETUP-03**: shadcn/ui instalat si configurat
- [ ] **SETUP-04**: Tipuri shared intre client si server
- [ ] **SETUP-05**: decimal.js integrat pentru calcule financiare

### Nomenclatoare

- [ ] **NOM-01**: CRUD gestiuni (cod, denumire, responsabil, activ)
- [ ] **NOM-02**: CRUD locuri de folosinta (in cadrul gestiunilor)
- [ ] **NOM-03**: CRUD surse de finantare (cod, denumire)
- [ ] **NOM-04**: CRUD plan de conturi (simbol, denumire, tip, cont amortizare)
- [ ] **NOM-05**: Clasificare MF conform HG 2139/2004 preincarcata (cod, denumire, grupa, durata normala)

### Mijloace Fixe

- [ ] **MF-01**: Inregistrare mijloc fix cu toate campurile (nr. inventar, denumire, clasificare, gestiune, valoare, data achizitie, durata normala)
- [ ] **MF-02**: Listare mijloace fixe cu filtrare (gestiune, stare, cautare text)
- [ ] **MF-03**: Vizualizare detalii mijloc fix
- [ ] **MF-04**: Editare mijloc fix
- [ ] **MF-05**: Validare numar inventar unic
- [ ] **MF-06**: Selectare clasificare din catalogul HG 2139/2004

### Operatiuni

- [ ] **OP-01**: Transfer mijloc fix intre gestiuni cu documentare (gestiune sursa, destinatie, data, observatii)
- [ ] **OP-02**: Transfer mijloc fix intre locuri de folosinta in aceeasi gestiune
- [ ] **OP-03**: Casare mijloc fix (marcare ca scos din functiune)
- [ ] **OP-04**: Declasare mijloc fix (reducere valoare)
- [ ] **OP-05**: Istoric tranzactii per mijloc fix (toate operatiunile)

### Amortizare

- [ ] **AMO-01**: Calcul amortizare liniara (valoare inventar / durata normala in luni)
- [ ] **AMO-02**: Generare amortizare lunara batch (pentru toate MF active si amortizabile)
- [ ] **AMO-03**: Actualizare valoare amortizata si valoare ramasa pe MF
- [ ] **AMO-04**: Vizualizare istoric amortizari per MF
- [ ] **AMO-05**: Vizualizare amortizari pe luna/an (toate MF-urile)
- [ ] **AMO-06**: Nu depaseste valoarea de amortizat (ultima luna = rest)

### Rapoarte

- [ ] **RAP-01**: Fisa mijlocului fix (date complete + istoric tranzactii + istoric amortizare)
- [ ] **RAP-02**: Balanta de verificare cantitativ-valorica (pe gestiuni, cu totaluri)
- [ ] **RAP-03**: Jurnal acte operate (istoric tranzactii pe perioada)
- [ ] **RAP-04**: Situatie amortizare lunara (amortizari calculate pe luna)
- [ ] **RAP-05**: Filtrare rapoarte pe perioada, gestiune, clasificare

### Autentificare

- [ ] **AUTH-01**: Login cu user si parola
- [ ] **AUTH-02**: Sesiune persistenta (ramane logat intre refresh-uri)
- [ ] **AUTH-03**: Logout

## v2 Requirements

Amanate pentru release viitor. Tracked dar nu in roadmap-ul curent.

### Export Rapoarte

- **EXP-01**: Export rapoarte in PDF
- **EXP-02**: Export rapoarte in Excel

### Amortizare Avansata

- **AMO-ADV-01**: Amortizare degresiva
- **AMO-ADV-02**: Amortizare accelerata
- **AMO-ADV-03**: Dual tracking fiscal vs contabil

### Utilizatori Multipli

- **USER-01**: Mai multe conturi de utilizator
- **USER-02**: Roluri si permisiuni

### Integrari

- **INT-01**: Export SAF-T (Declaration 406)
- **INT-02**: Import date din alte sisteme

## Out of Scope

Explicit excluse. Documentate pentru a preveni scope creep.

| Feature | Motiv |
|---------|-------|
| Multi-tenant/SaaS | Aplicatie interna pentru un singur spital |
| Mobile app | Web-first, suficient pentru uz intern |
| Migrare date FoxPro | Se porneste fresh, fara import date vechi |
| OAuth/SSO | Login simplu e suficient pentru nevoi curente |
| Real-time collaboration | Single-user efectiv, fara concurenta |
| Audit log detaliat | Istoric tranzactii acopera nevoia de baza |
| Documente atasate | Nu e necesar pentru v1 |
| Inventariere cu barcode | Functionalitate avansata, poate v2+ |

## Traceability

Care faze acopera care requirements. Actualizat in timpul crearii roadmap-ului.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Pending |
| SETUP-02 | Phase 1 | Pending |
| SETUP-03 | Phase 1 | Pending |
| SETUP-04 | Phase 1 | Pending |
| SETUP-05 | Phase 1 | Pending |
| NOM-01 | Phase 2 | Pending |
| NOM-02 | Phase 2 | Pending |
| NOM-03 | Phase 2 | Pending |
| NOM-04 | Phase 2 | Pending |
| NOM-05 | Phase 2 | Pending |
| MF-01 | Phase 3 | Pending |
| MF-02 | Phase 3 | Pending |
| MF-03 | Phase 3 | Pending |
| MF-04 | Phase 3 | Pending |
| MF-05 | Phase 3 | Pending |
| MF-06 | Phase 3 | Pending |
| OP-01 | Phase 4 | Pending |
| OP-02 | Phase 4 | Pending |
| OP-03 | Phase 4 | Pending |
| OP-04 | Phase 4 | Pending |
| OP-05 | Phase 4 | Pending |
| AMO-01 | Phase 5 | Pending |
| AMO-02 | Phase 5 | Pending |
| AMO-03 | Phase 5 | Pending |
| AMO-04 | Phase 5 | Pending |
| AMO-05 | Phase 5 | Pending |
| AMO-06 | Phase 5 | Pending |
| RAP-01 | Phase 6 | Pending |
| RAP-02 | Phase 6 | Pending |
| RAP-03 | Phase 6 | Pending |
| RAP-04 | Phase 6 | Pending |
| RAP-05 | Phase 6 | Pending |
| AUTH-01 | Phase 6 | Pending |
| AUTH-02 | Phase 6 | Pending |
| AUTH-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after roadmap creation*
