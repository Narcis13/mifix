# Plan Implementare: Operatiuni ca Document-Container

> **Scop:** Replicarea fluxului legacy FoxPro unde operatiunile sunt "acte" (containere)
> cu numar/data/tip care grupeaza tranzactii, permitand determinarea stocului
> de mijloace fixe la orice gestiune/loc la orice moment in timp.
>
> **Data creare:** 2026-02-23
> **Branch:** `ajustare`

---

## Cuprins

1. [Analiza Gap](#1-analiza-gap)
2. [Faza A: Schema + Backend Operatiuni Container](#faza-a)
3. [Faza B: Workflow Document-Centric (Intrare/Iesire)](#faza-b)
4. [Faza C: Stoc Bazat pe Tranzactii](#faza-c)
5. [Faza D: UI Operatiuni](#faza-d)
6. [Faza E: Backfill + Integrare](#faza-e)
7. [Estimare Context per Sesiune](#estimare)

---

## 1. Analiza Gap {#1-analiza-gap}

### Ce avem acum (model asset-centric)

```
User -> Pagina MijlocFix -> Buton "Transfer" -> Se creaza 1 tranzactie
        (operatiuneId = NULL, nu se creaza header operatiune)
```

- Tabela `operatiuni` exista in schema dar NU este populata de operatiile noi
- Toate operatiile (transfer, casare, declasare, masa) creeaza tranzactii directe
- `tranzactii.operatiuneId` ramane NULL pe toate operatiile noi
- Nu exista UI pentru gestionarea operatiunilor ca entitati de sine statatoare
- Stocul pe gestiune/loc se determina din starea curenta a `mijloace_fixe`, NU din tranzactii

### Ce trebuie (model document-centric din legacy)

```
User -> Creaza Operatiune (nr=15, data=2024-01-15, tip_doc=MISCARE)
     -> Adauga Linie 1: Transfer MF #100 din Gest.A in Gest.B
     -> Adauga Linie 2: Transfer MF #101 din Gest.A in Gest.B
     -> Adauga Linie 3: Casare MF #200
     -> Finalizare -> Operatiunea devine imutabila
```

### Gap-uri concrete

| # | Gap | Impact |
|---|-----|--------|
| G1 | `operatiuni` nu se creeaza activ | Nu poti grupa tranzactii pe act |
| G2 | Nu exista pagina lista/detaliu operatiuni | Nu vezi "ce s-a intamplat pe actul X" |
| G3 | Lipseste workflow "intrare bunuri" | Nu poti receptiona bunuri noi printr-un act |
| G4 | Nu poti calcula stocul la o data istorica | Rapoartele citesc starea curenta, nu reconstituie din tranzactii |
| G5 | Transfer = update asset, nu dual entry/exit | Nu poti reconstitui miscarea din tranzactii |
| G6 | Lipseste auto-numerotare secventiala operatiuni | Nr. operatie pe an |

---

## Faza A: Schema + Backend Operatiuni Container {#faza-a}

> **Scop:** Activarea tabelei `operatiuni` ca document-container real.
> Toate operatiile existente si viitoare vor crea un header de operatiune.
>
> **Sesiune estimata:** 1 sesiune (~120K tokens)

### Task A.1: Extindere schema `operatiuni`

**Fisiere de modificat:**
- `packages/server/src/db/schema.ts`

**Ce se face:**

Adauga coloana `tipOperatie` pe tabela `operatiuni`:

```ts
// In schema.ts, tabela operatiuni - adauga:
tipOperatie: mysqlEnum("tip_operatie", [
  "intrare",      // Receptie bunuri noi
  "iesire",       // Scoatere din evidenta (casare, declasare)
  "transfer",     // Transfer intre gestiuni/locuri
  "inventar",     // Inventariere
  "ajustare",     // Ajustari de valoare (reevaluare, modernizare)
]).notNull().default("transfer"),

// Adauga stare operatiune:
stare: mysqlEnum("stare_operatie", [
  "deschisa",     // In lucru - se pot adauga/scoate linii
  "finalizata",   // Inchisa - nu se mai poate modifica
  "anulata",      // Anulata - tranzactiile sunt inversate
]).notNull().default("deschisa"),
```

**Reguli schema:**
- NU sterge coloanele existente (backward compatible)
- Pastreaza unique index pe `(an, numarOperatie)`
- Adauga index pe `tipOperatie` si `stare`

**Dupa modificare:**
```bash
bun run --cwd packages/server db:generate
bun run --cwd packages/server db:push
```

### Task A.2: Extindere shared types

**Fisiere de modificat:**
- `packages/shared/src/types/index.ts`

**Ce se face:**

```ts
// Adauga enum-uri noi
export type TipOperatie = "intrare" | "iesire" | "transfer" | "inventar" | "ajustare";
export type StareOperatie = "deschisa" | "finalizata" | "anulata";

// Extinde interfata Operatiune existenta (linia 105-116)
export interface Operatiune {
  id: number;
  numarOperatie: number;
  an: number;
  dataOperare: string;
  tipOperatie: TipOperatie;          // NOU
  stare: StareOperatie;              // NOU
  tipDocumentId?: number;
  tipDocument?: TipDocument;
  numarDocument?: string;
  dataDocument?: string;
  descriere?: string;
  createdAt: string;
  // Populated relations
  tranzactii?: Tranzactie[];         // NOU - liniile operatiunii
  numarLinii?: number;               // NOU - count linii (pentru lista)
}

// Extinde Tranzactie cu operatiune populata
export interface Tranzactie {
  // ... campurile existente ...
  operatiuneId?: number;             // NOU - expune FK
  operatiune?: Operatiune;           // NOU - populated relation
}
```

### Task A.3: Validation schemas pentru operatiuni

**Fisiere de creat:**
- `packages/server/src/validation/operatiuni-header-schemas.ts`

**Ce se face:**

```ts
import { z } from "zod";

// Schema creare operatiune (header)
export const createOperatiuneSchema = z.object({
  tipOperatie: z.enum(["intrare", "iesire", "transfer", "inventar", "ajustare"]),
  dataOperare: z.string().min(1, "Data operarii obligatorie"),
  tipDocumentId: z.number().optional(),
  numarDocument: z.string().max(100).optional(),
  dataDocument: z.string().optional(),
  descriere: z.string().max(500).optional(),
});

// Schema adaugare linie in operatiune
export const addLinieOperatiuneSchema = z.object({
  operatiuneId: z.number().min(1, "Operatiune obligatorie"),
  mijlocFixId: z.number().min(1, "Mijloc fix obligatoriu"),
  tip: z.enum(["intrare", "transfer", "casare", "declasare", "reevaluare", "modernizare", "iesire"]),
  // Transfer-specific
  gestiuneDestinatieId: z.number().optional(),
  locFolosintaDestinatieId: z.number().optional(),
  // Valoare-specific (declasare, reevaluare)
  valoareOperatie: z.string().optional(),
  // Common
  descriere: z.string().max(500).optional(),
  observatii: z.string().max(500).optional(),
});

// Schema finalizare operatiune
export const finalizeOperatiuneSchema = z.object({
  operatiuneId: z.number().min(1, "Operatiune obligatorie"),
});

// Schema anulare operatiune (inversare toate tranzactiile)
export const anuleazaOperatiuneSchema = z.object({
  operatiuneId: z.number().min(1, "Operatiune obligatorie"),
  motiv: z.string().min(1, "Motivul anularii obligatoriu").max(500),
});
```

### Task A.4: Helper auto-numerotare operatiuni

**Fisiere de creat:**
- `packages/server/src/utils/operatiuni-helpers.ts`

**Ce se face:**

Functie care calculeaza urmatorul numar de operatie pe an:

```ts
import { db } from "../db";
import { operatiuni } from "../db/schema";
import { eq, and, max } from "drizzle-orm";

/**
 * Calculeaza urmatorul numar secvential de operatie pentru un an dat.
 * Legacy echivalent: YEAR(c_data) * 1,000,000 + nr_oper
 *
 * @param tx - Tranzactie DB (pentru atomicitate)
 * @param an - Anul operatiei
 * @returns Urmatorul numar disponibil (1-based)
 */
export async function getNextNumarOperatie(
  tx: typeof db,
  an: number
): Promise<number> {
  const [result] = await tx
    .select({ maxNr: max(operatiuni.numarOperatie) })
    .from(operatiuni)
    .where(eq(operatiuni.an, an));

  return (result?.maxNr ?? 0) + 1;
}
```

### Task A.5: Route-uri CRUD operatiuni-header

**Fisiere de creat:**
- `packages/server/src/routes/operatiuni-header.ts`

**Fisiere de modificat:**
- `packages/server/src/index.ts` (inregistrare route)

**Endpoints:**

```
GET    /api/operatiuni-acte              -> Lista operatiuni (paginat, filtre: an, tip, stare, data)
GET    /api/operatiuni-acte/:id          -> Detaliu operatiune + tranzactii
POST   /api/operatiuni-acte              -> Creare operatiune noua (auto-numerotare)
POST   /api/operatiuni-acte/:id/linie    -> Adauga linie (tranzactie) la operatiune deschisa
DELETE /api/operatiuni-acte/:id/linie/:tranzactieId -> Sterge linie din operatiune deschisa
POST   /api/operatiuni-acte/:id/finalizeaza  -> Finalizare (lock)
POST   /api/operatiuni-acte/:id/anuleaza     -> Anulare (inversare tranzactii)
```

> **NOTA:** Folosim `/operatiuni-acte` pentru a nu intra in conflict cu
> `/operatiuni` existent care contine operatiile asset-centric (transfer, casare etc.)
> In Faza E vom decide daca le unificam sau le pastram separate.

**Logica cheie per endpoint:**

#### `POST /api/operatiuni-acte` (creare)

```
1. Extrage anul din dataOperare
2. In tranzactie DB:
   a. Calculeaza nextNumarOperatie(an)
   b. INSERT in operatiuni cu:
      - numarOperatie = nextNumarOperatie
      - an = anul
      - dataOperare, tipOperatie, stare='deschisa'
      - tipDocumentId, numarDocument, dataDocument, descriere
3. Return operatiunea creata cu numarOperatie
```

#### `POST /api/operatiuni-acte/:id/linie` (adauga linie)

```
1. Verifica operatiunea exista si stare='deschisa'
2. Verifica mijlocul fix exista si e activ
3. In functie de tip tranzactie:
   - "transfer": verifica gestiune/loc destinatie, UPDATE asset, INSERT tranzactie
   - "casare": UPDATE asset stare='casare', INSERT tranzactie
   - "declasare": valideaza valoare, UPDATE asset valoare, INSERT tranzactie
   - "intrare": (Faza B) INSERT mijloc fix + tranzactie intrare
4. SET tranzactie.operatiuneId = operatiunea curenta
5. Return tranzactia creata
```

#### `POST /api/operatiuni-acte/:id/finalizeaza`

```
1. Verifica operatiunea exista si stare='deschisa'
2. Verifica are cel putin 1 linie (tranzactie)
3. UPDATE operatiuni SET stare='finalizata'
4. Return success
```

#### `POST /api/operatiuni-acte/:id/anuleaza`

```
1. Verifica operatiunea exista si stare='finalizata' sau 'deschisa'
2. Pentru fiecare tranzactie din operatiune (in ordine inversa):
   - Aplica logica inversa (exact ca stergere-tranzactie existenta din OP-06)
   - DELETE tranzactia
3. UPDATE operatiuni SET stare='anulata'
4. Return success cu nr linii inversate
```

### Task A.6: Modificare operatii existente sa creeze header

**Fisiere de modificat:**
- `packages/server/src/routes/operatiuni.ts`

**Ce se face:**

Fiecare operatie existenta (OP-01 pana la OP-10) trebuie sa:
1. Creeze un header `operatiuni` (auto-numerotare)
2. Seteze `operatiuneId` pe tranzactiile create
3. Finalizeze operatiunea imediat (stare='finalizata') - pentru ca aceste operatii sunt "one-shot"

**Exemplu modificare `POST /transfer-gestiune` (OP-01):**

```ts
// INAINTE (linia 205-216 din operatiuni.ts):
await tx.insert(tranzactii).values({
  mijlocFixId: data.mijlocFixId,
  tip: "transfer",
  ...
});

// DUPA:
// 1. Creaza header operatiune
const an = new Date(data.dataOperare).getFullYear();
const numarOp = await getNextNumarOperatie(tx, an);

const [opResult] = await tx.insert(operatiuni).values({
  numarOperatie: numarOp,
  an,
  dataOperare: new Date(data.dataOperare),
  tipOperatie: "transfer",
  stare: "finalizata",  // one-shot = finalizata direct
  numarDocument: data.documentNumar || null,
  dataDocument: data.documentData ? new Date(data.documentData) : null,
  descriere: `Transfer gestiune: ${asset.gestiuneId} -> ${data.gestiuneDestinatieId}`,
});

// 2. Creaza tranzactia cu operatiuneId
await tx.insert(tranzactii).values({
  mijlocFixId: data.mijlocFixId,
  operatiuneId: opResult.insertId, // LEGATURA!
  tip: "transfer",
  ...
});
```

**Acelasi pattern se aplica la:**
- OP-01 `transfer-gestiune` -> tipOperatie='transfer'
- OP-02 `transfer-loc` -> tipOperatie='transfer'
- OP-03 `casare` -> tipOperatie='iesire'
- OP-04 `declasare` -> tipOperatie='ajustare'
- OP-07 `transfer-cont` -> tipOperatie='transfer'
- OP-09 `transfer-gestiune-masa` -> tipOperatie='transfer'
- OP-10 `transfer-loc-masa` -> tipOperatie='transfer'

**ATENTIE la operatiile de masa (OP-07, OP-09, OP-10):**
Se creeaza UN SINGUR header de operatiune, si TOATE tranzactiile (cate una per asset)
primesc acelasi `operatiuneId`. Asta e exact echivalentul legacy.

### Task A.7: Test manual + verificare

**Ce se face:**
1. `bun run dev` - verifica compilare
2. Test manual: efectueaza un transfer din UI -> verifica in DB ca s-a creat operatiune
3. Verifica ca rapoartele existente (centralizator-acte, raport-act) functioneaza in continuare
4. Verifica ca `GET /api/operatiuni-acte` returneaza operatiunile

---

## Faza B: Workflow Document-Centric (Intrare/Iesire) {#faza-b}

> **Scop:** Adaugarea fluxului de creare operatiune interactiva:
> creezi actul, adaugi linii (bunuri), finalizezi.
> Include receptie bunuri noi (intrare) si iesire bunuri (casare batch).
>
> **Sesiune estimata:** 1-2 sesiuni (~150K tokens fiecare)

### Task B.1: Endpoint "Intrare Mijloc Fix prin Operatiune"

**Fisiere de modificat:**
- `packages/server/src/routes/operatiuni-header.ts`
- `packages/server/src/validation/operatiuni-header-schemas.ts`

**Ce se face:**

Endpoint care adauga un mijloc fix NOU ca linie intr-o operatiune de intrare:

```
POST /api/operatiuni-acte/:id/linie-intrare
```

**Schema validare:**

```ts
export const addLinieIntrareSchema = z.object({
  // Date mijloc fix (se creeaza asset-ul)
  numarInventar: z.string().min(1).max(50),
  denumire: z.string().min(1).max(255),
  clasificareCod: z.string().min(1),
  gestiuneId: z.number().min(1),
  locFolosintaId: z.number().optional(),
  sursaFinantareId: z.number().optional(),
  contId: z.number().min(1),
  provenientaId: z.number().optional(),
  tipStocId: z.number().optional(),
  unitateMasuraId: z.number().optional(),
  // Valori
  valoareInventar: z.string().min(1),
  // Amortizare
  durataNormala: z.number().min(1),
  eAmortizabil: z.boolean().default(true),
  // Observatii
  descriere: z.string().max(500).optional(),
});
```

**Logica:**

```
1. Verifica operatiunea exista, stare='deschisa', tipOperatie='intrare'
2. Verifica numarInventar unic
3. Calculeaza valori derivate:
   - valoareRamasa = valoareInventar (intrare initiala)
   - valoareAmortizata = 0
   - valoareInitiala = valoareInventar
   - cotaAmortizareLunara = valoareInventar / durataNormala
   - durataRamasa = durataNormala
   - dataAchizitie = operatiune.dataOperare
   - tipDocumentId = operatiune.tipDocumentId
   - documentAchizitie = operatiune.numarDocument
4. INSERT in mijloace_fixe
5. INSERT in tranzactii cu:
   - tip = 'intrare'
   - operatiuneId = operatiunea curenta
   - valoareOperatie = valoareInventar
   - gestiuneDestinatieId = gestiuneId (destinatia la intrare)
6. Return mijlocul fix creat + tranzactia
```

### Task B.2: Endpoint "Iesire Mijloc Fix prin Operatiune"

**Fisiere de modificat:**
- `packages/server/src/routes/operatiuni-header.ts`
- `packages/server/src/validation/operatiuni-header-schemas.ts`

**Ce se face:**

Endpoint care adauga un mijloc fix EXISTENT ca linie de iesire (casare/scoatere):

```
POST /api/operatiuni-acte/:id/linie-iesire
```

**Schema:**

```ts
export const addLinieIesireSchema = z.object({
  mijlocFixId: z.number().min(1),
  tipIesire: z.enum(["casare", "declasare", "iesire"]),
  valoareOperatie: z.string().optional(), // obligatoriu pt declasare
  motiv: z.string().min(1).max(500),
  observatii: z.string().max(500).optional(),
});
```

**Logica:**

```
1. Verifica operatiunea exista, stare='deschisa', tipOperatie='iesire'
2. Verifica mijlocul fix exista si e activ
3. Verifica mijlocul fix nu e deja pe o alta linie in aceasta operatiune
4. In functie de tipIesire:
   - "casare": UPDATE stare='casare', dataIesire, motivIesire
   - "declasare": validare valoare, UPDATE valoareRamasa
   - "iesire": UPDATE stare generica
5. INSERT tranzactie cu operatiuneId
6. Return tranzactia + asset-ul actualizat
```

### Task B.3: Endpoint "Linie Transfer prin Operatiune"

**Fisiere de modificat:**
- `packages/server/src/routes/operatiuni-header.ts`

**Ce se face:**

```
POST /api/operatiuni-acte/:id/linie-transfer
```

**Schema:**

```ts
export const addLinieTransferSchema = z.object({
  mijlocFixId: z.number().min(1),
  gestiuneDestinatieId: z.number().optional(), // transfer gestiune
  locFolosintaDestinatieId: z.number().optional(), // transfer loc
  contDestinatieId: z.number().optional(), // transfer cont
  observatii: z.string().max(500).optional(),
});
```

**Logica: reutilizeaza logica existenta din OP-01/OP-02/OP-07** dar:
- Seteaza `operatiuneId` pe tranzactie
- Nu creeaza un header separat (foloseste operatiunea curenta)

### Task B.4: Endpoint sterge linie din operatiune deschisa

**Fisiere de modificat:**
- `packages/server/src/routes/operatiuni-header.ts`

```
DELETE /api/operatiuni-acte/:id/linie/:tranzactieId
```

**Logica:**

```
1. Verifica operatiunea exista si stare='deschisa'
2. Verifica tranzactia exista si apartine acestei operatiuni
3. Inverseaza efectul tranzactiei (reutilizeaza logica din OP-06)
4. DELETE tranzactia
5. Return success
```

### Task B.5: Cautare rapida mijloace fixe pentru adaugare in operatiune

**Fisiere de modificat:**
- `packages/server/src/routes/mijloace-fixe.ts`

**Ce se face:**

Endpoint de cautare rapida (autocomplete) pentru selectia mijloacelor fixe:

```
GET /api/mijloace-fixe/cautare?q=...&gestiuneId=...&stare=activ&limit=20
```

Returneaza lista scurta (id, numarInventar, denumire, gestiune, loc, valoare)
pentru uz in dialog-ul de adaugare linie.

---

## Faza C: Stoc Bazat pe Tranzactii {#faza-c}

> **Scop:** Calculul stocului de mijloace fixe la o gestiune/loc la un moment dat,
> reconstruit din tranzactii (nu din starea curenta a asset-urilor).
>
> **Sesiune estimata:** 1 sesiune (~100K tokens)

### Task C.1: Query helper "stoc la data"

**Fisiere de creat:**
- `packages/server/src/utils/stoc-helpers.ts`

**Ce se face:**

Functie SQL care calculeaza stocul pe gestiune/loc la o data specificata,
bazat pe tranzactii de tip intrare/iesire/transfer:

```ts
/**
 * Calculeaza stocul de MF la o gestiune (si optional loc) la o data.
 *
 * Logica:
 * - Un MF este "la gestiune G" la data D daca:
 *   - Are tranzactie de tip 'intrare' cu gestiuneDestinatieId=G si data <= D
 *   - NU are tranzactie ulterioara (data <= D) care il muta din G
 *     (transfer cu gestiuneSursaId=G, sau casare/iesire)
 *
 * Alternativa (mai simpla, bazata pe starea curenta + tranzactii):
 * - Porneste de la starea curenta a asset-ului
 * - Aplica invers tranzactiile de DUPA data D
 * - Rezultatul = starea asset-ului la data D
 *
 * @param dataSnapshot - Data la care calculam stocul
 * @param gestiuneId - Gestiunea
 * @param locFolosintaId - Optional, loc folosinta
 * @param contId - Optional, filtru cont
 * @returns Lista MF cu valori la data respectiva
 */
```

**Abordarea recomandata (forward scan):**

```sql
-- Stocul la gestiune G, loc L, la data D:
-- = toate MF care au ultima tranzactie de INTRARE/TRANSFER-IN in G/L inainte de D
--   si NU au o tranzactie de IESIRE/TRANSFER-OUT din G/L inainte de D DUPA ultima intrare

-- Simplificat: determina "locatia" fiecarui MF la data D
-- prin ultimul transfer/intrare cu data <= D

SELECT mf.id, mf.numar_inventar, mf.denumire, mf.valoare_inventar
FROM mijloace_fixe mf
WHERE mf.id IN (
  -- MF care la data D erau in gestiunea G
  -- Ultima tranzactie relevanta (transfer sau intrare) cu data <= D
  -- indica gestiunea la acel moment
  SELECT t1.mijloc_fix_id
  FROM tranzactii t1
  WHERE t1.data_operare <= ?  -- data D
    AND t1.id = (
      SELECT t2.id FROM tranzactii t2
      WHERE t2.mijloc_fix_id = t1.mijloc_fix_id
        AND t2.data_operare <= ?  -- data D
        AND t2.tip IN ('intrare', 'transfer')
      ORDER BY t2.data_operare DESC, t2.id DESC
      LIMIT 1
    )
    AND (
      (t1.tip = 'intrare' AND t1.gestiune_destinatie_id = ?)
      OR
      (t1.tip = 'transfer' AND t1.gestiune_destinatie_id = ?)
    )
    -- Exclude MF care au iesire (casare/iesire) inainte de data D
    AND t1.mijloc_fix_id NOT IN (
      SELECT t3.mijloc_fix_id FROM tranzactii t3
      WHERE t3.mijloc_fix_id = t1.mijloc_fix_id
        AND t3.data_operare <= ?  -- data D
        AND t3.tip IN ('casare', 'iesire')
        AND t3.data_operare >= t1.data_operare
    )
)
```

**NOTA IMPORTANTA:** Aceasta este o query complexa. Poate fi simplificata
daca acceptam ca pentru datele CURENTE putem folosi direct starea asset-ului,
si doar pentru date ISTORICE facem scan de tranzactii. Recomand ambele variante:
- `getStocCurent(gestiuneId, locId?)` -> simplu, din `mijloace_fixe WHERE gestiuneId=... AND stare='activ'`
- `getStocLaData(data, gestiuneId, locId?)` -> reconstruit din tranzactii

### Task C.2: Raport "Fisa pe Gestiune"

**Fisiere de modificat:**
- `packages/server/src/routes/rapoarte.ts`
- `packages/shared/src/types/rapoarte.ts`

**Ce se face:**

Raport care arata toate miscarile (intrari/iesiri) la o gestiune intr-o perioada:

```
POST /api/rapoarte/fisa-gestiune
```

**Input:**
```ts
{
  gestiuneId: number;
  dataStart: string;
  dataEnd: string;
  locFolosintaId?: number;  // optional
  contId?: number;          // optional
}
```

**Output:**
```ts
interface FisaGestiuneRow {
  dataOperare: string;
  numarOperatie: number;
  tipDocument: string;
  numarDocument: string;
  numarInventar: string;
  denumireMijlocFix: string;
  tipMiscare: "intrare" | "iesire";  // din perspectiva gestiunii
  valoare: string;  // valoare inventar
  descriere: string;
}

interface FisaGestiuneResult {
  gestiune: Gestiune;
  locFolosinta?: LocFolosinta;
  perioada: { start: string; end: string };
  soldInitial: number;     // nr MF la gestiune la dataStart
  intrari: number;         // nr MF intrate in perioada
  iesiri: number;          // nr MF iesite in perioada
  soldFinal: number;       // nr MF la gestiune la dataEnd
  valoareSoldInitial: string;
  valoareIntrari: string;
  valoareIesiri: string;
  valoareSoldFinal: string;
  miscari: FisaGestiuneRow[];
}
```

**Logica SQL:**
```sql
-- Miscari la gestiune G in perioada [D1, D2]:
SELECT
  t.data_operare,
  o.numar_operatie,
  td.denumire as tip_document,
  o.numar_document,
  mf.numar_inventar,
  mf.denumire as denumire_mf,
  CASE
    WHEN t.gestiune_destinatie_id = ? THEN 'intrare'   -- vine in gestiune
    WHEN t.gestiune_sursa_id = ? THEN 'iesire'          -- pleaca din gestiune
    WHEN t.tip = 'intrare' AND mf.gestiune_id = ? THEN 'intrare'  -- intrare initiala
    WHEN t.tip IN ('casare', 'iesire') THEN 'iesire'    -- casare/iesire
  END as tip_miscare,
  mf.valoare_inventar
FROM tranzactii t
JOIN mijloace_fixe mf ON mf.id = t.mijloc_fix_id
LEFT JOIN operatiuni o ON o.id = t.operatiune_id
LEFT JOIN tipuri_document td ON td.id = o.tip_document_id
WHERE t.data_operare BETWEEN ? AND ?
  AND (
    t.gestiune_sursa_id = ?
    OR t.gestiune_destinatie_id = ?
    OR (t.tip = 'intrare' AND mf.gestiune_id = ?)
    OR (t.tip IN ('casare', 'iesire') AND mf.gestiune_id = ?)
  )
ORDER BY t.data_operare, o.numar_operatie, t.id
```

### Task C.3: Raport "Situatia Stocului pe Gestiuni"

**Fisiere de modificat:**
- `packages/server/src/routes/rapoarte.ts`
- `packages/shared/src/types/rapoarte.ts`

**Ce se face:**

Raport snapshot: cate MF are fiecare gestiune la o data anume.

```
POST /api/rapoarte/stoc-gestiuni
```

**Input:**
```ts
{
  dataSnapshot: string;   // data la care vrem stocul
  contId?: number;        // optional filtru cont
  detaliat: boolean;      // false=sumar pe gestiuni, true=cu lista MF
}
```

**Output:**
```ts
interface StocGestiuneRow {
  gestiune: Gestiune;
  numarMijloaceFixe: number;
  valoareTotala: string;
  // Daca detaliat=true:
  mijloaceFixe?: Array<{
    numarInventar: string;
    denumire: string;
    valoareInventar: string;
    cont: string;
  }>;
}
```

**NOTA:** Pentru stocul curent (dataSnapshot = azi), query-ul este trivial:
```sql
SELECT g.*, COUNT(mf.id), SUM(mf.valoare_inventar)
FROM gestiuni g
LEFT JOIN mijloace_fixe mf ON mf.gestiune_id = g.id AND mf.stare = 'activ'
GROUP BY g.id
```

Pentru date istorice, foloseste `getStocLaData()` din Task C.1.

### Task C.4: Adauga filtre stoc la raportul "Lista Inventariere" existent

**Fisiere de modificat:**
- `packages/server/src/routes/rapoarte.ts` (endpoint lista-inventariere)

**Ce se face:**
- Lista de inventariere exista deja (Phase 4) dar foloseste starea curenta
- Adauga parametru optional `dataSnapshot` care, daca specificat,
  reconstituie stocul din tranzactii in loc de starea curenta
- Pastreaza backward compatibility (fara `dataSnapshot` = comportament curent)

---

## Faza D: UI Operatiuni {#faza-d}

> **Scop:** Interfata de gestionare operatiuni: lista, creare, adaugare linii, finalizare.
>
> **Sesiune estimata:** 2 sesiuni (~120K tokens fiecare)

### Task D.1: Pagina "Lista Operatiuni"

**Fisiere de creat:**
- `packages/client/src/pages/Operatiuni.tsx`

**Fisiere de modificat:**
- `packages/client/src/App.tsx` (adauga route + nav)

**Ce se face:**

Pagina cu tabel TanStack Table care arata toate operatiunile:

| Nr. | Data | Tip Operatie | Document | Nr. Linii | Stare | Actiuni |
|-----|------|-------------|----------|-----------|-------|---------|
| 15/2024 | 2024-01-15 | Transfer | MISCARE #123 | 3 | Finalizata | Vizualizeaza |
| 14/2024 | 2024-01-10 | Intrare | PV #45 | 5 | Deschisa | Editeaza / Finalizeaza |

**Filtre:**
- An (dropdown, default = anul curent)
- Tip operatie (dropdown: toate, intrare, iesire, transfer, ajustare)
- Stare (dropdown: toate, deschisa, finalizata, anulata)
- Perioada (dataStart - dataEnd)

**Actiuni:**
- Buton "Operatiune Noua" -> deschide dialog creare
- Click pe rand -> navigare la detaliu

**Componente shadcn necesare:** Table, Select, DatePicker, Button, Badge (pt stare)

### Task D.2: Dialog "Creare Operatiune"

**Fisiere de creat:**
- `packages/client/src/components/operatiuni/CreateOperatiuneDialog.tsx`

**Ce se face:**

Dialog cu formular:
- Tip operatie (select: Intrare, Iesire, Transfer, Inventar, Ajustare)
- Data operarii (date picker)
- Tip document (select din nomenclator tipuri_document)
- Numar document (text input)
- Data document (date picker, optional)
- Descriere (textarea, optional)

La submit -> `POST /api/operatiuni-acte` -> navigare la pagina detaliu operatiune.

### Task D.3: Pagina "Detaliu Operatiune"

**Fisiere de creat:**
- `packages/client/src/pages/OperatiuneDetail.tsx`

**Ce se face:**

Pagina cu doua sectiuni:

**Header operatiune (read-only daca finalizata):**
```
Nr. Operatie: 15/2024
Data: 2024-01-15
Tip: Transfer
Document: MISCARE #123 din 2024-01-15
Stare: [Badge] Deschisa
Descriere: Transfer bunuri intre gestiuni
```

**Tabel linii (tranzactii):**

| # | Nr. Inventar | Denumire | Tip | De la | La | Valoare | Actiuni |
|---|-------------|----------|-----|-------|-----|---------|---------|
| 1 | MF-001 | Laptop Dell | Transfer | Gest.A | Gest.B | 5,000.00 | Sterge |
| 2 | MF-002 | Imprimanta | Transfer | Gest.A | Gest.B | 2,000.00 | Sterge |

**Actiuni (daca stare='deschisa'):**
- Buton "Adauga Linie" -> dialog adaugare (B.1/B.2/B.3 in functie de tip operatie)
- Buton "Sterge Linie" pe fiecare rand
- Buton "Finalizeaza Operatiunea" -> confirmare -> lock
- Buton "Anuleaza" -> confirmare + motiv -> inversare

**Actiuni (daca stare='finalizata'):**
- Buton "Anuleaza Operatiunea" -> confirmare + motiv
- Buton "Tipareste" -> print layout

**Actiuni (daca stare='anulata'):**
- Doar vizualizare, totul read-only

### Task D.4: Dialog "Adauga Linie - Intrare"

**Fisiere de creat:**
- `packages/client/src/components/operatiuni/AddLinieIntrareDialog.tsx`

**Ce se face:**

Dialog complex (formular creare mijloc fix simplificat):
- Numar inventar (text)
- Denumire (text)
- Clasificare (select cu cautare)
- Gestiune destinatie (select)
- Loc folosinta (select, filtrat pe gestiune)
- Cont (select)
- Sursa finantare (select)
- Valoare inventar (number input)
- Durata normala (number input, luni)
- Amortizabil (checkbox)

La submit -> `POST /api/operatiuni-acte/:id/linie-intrare`

### Task D.5: Dialog "Adauga Linie - Transfer"

**Fisiere de creat:**
- `packages/client/src/components/operatiuni/AddLinieTransferDialog.tsx`

**Ce se face:**

Dialog cu:
- Cautare mijloc fix (autocomplete, `GET /api/mijloace-fixe/cautare`)
- Arata: nr inventar, denumire, gestiune curenta, loc curent, valoare
- Gestiune destinatie (select, doar daca transfer gestiune)
- Loc destinatie (select, filtrat pe gestiune destinatie)
- Cont destinatie (select, doar daca transfer cont)
- Observatii (textarea)

### Task D.6: Dialog "Adauga Linie - Iesire"

**Fisiere de creat:**
- `packages/client/src/components/operatiuni/AddLinieIesireDialog.tsx`

**Ce se face:**

Dialog cu:
- Cautare mijloc fix (autocomplete)
- Tip iesire (select: Casare, Declasare, Iesire)
- Valoare reducere (doar daca declasare)
- Motiv (textarea, obligatoriu)
- Observatii (textarea)

### Task D.7: Integrare navigatie

**Fisiere de modificat:**
- `packages/client/src/App.tsx`

**Ce se face:**

```tsx
// In navItems, adauga DUPA "Op. Masa":
{ path: "/operatiuni", label: "Operatiuni" },

// In router, adauga:
<Route path="/operatiuni" element={<Operatiuni />} />
<Route path="/operatiuni/:id" element={<OperatiuneDetail />} />
```

---

## Faza E: Backfill + Integrare Finala {#faza-e}

> **Scop:** Legarea tranzactiilor existente (fara operatiuneId) de operatiuni,
> si integrarea completa a celor doua fluxuri.
>
> **Sesiune estimata:** 1 sesiune (~80K tokens)

### Task E.1: Script backfill tranzactii orfane

**Fisiere de creat:**
- `packages/server/src/scripts/backfill-operatiuni.ts`

**Ce se face:**

Script one-time care:
1. Gaseste toate tranzactiile cu `operatiuneId = NULL`
2. Le grupeaza logic (dupa data + tip + asset similar)
3. Creeaza cate un header de operatiune per grup
4. Updateaza `operatiuneId` pe tranzactii

**Strategia de grupare:**

```
-- Tranzactiile migrated din legacy ar trebui sa aiba deja operatiuneId
-- (setate in Phase 2 migration script)
--
-- Tranzactiile create de operatiile OP-01...OP-10 (Phase 3) nu au operatiuneId
-- Le grupam astfel:
-- - Acelasi tip + aceeasi data + acelasi documentNumar = o operatiune
-- - Daca nu au documentNumar, fiecare tranzactie = o operatiune separata
```

**Executare:**
```bash
bun run --cwd packages/server src/scripts/backfill-operatiuni.ts
```

### Task E.2: Refactor - unificare flux operatiuni

**Fisiere de modificat:**
- `packages/server/src/routes/operatiuni.ts`
- `packages/client/src/pages/MijlocFixDetail.tsx`
- `packages/client/src/pages/OperatiuniMasa.tsx`

**Ce se face:**

**Decizie de luat:** Dupa ce avem fluxul document-centric, vrem:
- **Optiunea A:** Pastram ambele fluxuri (asset-centric + document-centric) - mai flexibil
- **Optiunea B:** Toate operatiile trec prin document-centric - mai consistent

**Recomandare: Optiunea A** (pastram ambele)
- Operatiile rapide (transfer 1 asset din pagina detaliu) raman asset-centric
  dar creeaza header de operatiune in spate (deja facut in A.6)
- Operatiile complexe (intrare N bunuri pe un act) folosesc fluxul document-centric
- Ambele genereaza operatiuni valide cu tranzactii legate

### Task E.3: Integrare in pagina existenta MijlocFixDetail

**Fisiere de modificat:**
- `packages/client/src/pages/MijlocFixDetail.tsx`

**Ce se face:**

In sectiunea "Istoric Tranzactii" a paginii de detaliu mijloc fix:
- Adauga coloana "Nr. Operatie" care arata `operatiune.numarOperatie/operatiune.an`
- Click pe nr. operatie -> navigare la `/operatiuni/:operatiuneId`
- Aceasta face legatura intre vizualizarea asset-centric si cea document-centric

### Task E.4: Extindere raport "Centralizator Acte"

**Fisiere de modificat:**
- `packages/server/src/routes/rapoarte.ts` (endpoint centralizator-acte)

**Ce se face:**

Centralizatorul exista deja dar poate fi imbunatatit:
- Adauga coloana "Tip Operatie" (din `operatiuni.tipOperatie`)
- Adauga coloana "Stare" (din `operatiuni.stare`)
- Adauga filtru pe tipOperatie
- Exclude operatiunile anulate din calcule (sau arata-le marcat)

### Task E.5: Verificare integritate date

**Fisiere de modificat:**
- `packages/server/src/routes/verificare.ts`

**Ce se face:**

Adauga verificari noi in endpoint-ul `/api/verificare`:
- **Check:** Tranzactii fara operatiuneId (nu ar trebui sa mai existe dupa backfill)
- **Check:** Operatiuni deschise mai vechi de 30 zile (posibil uitate)
- **Check:** Operatiuni finalizate fara linii (nu ar trebui sa existe)
- **Check:** Consistenta stoc curent vs stoc calculat din tranzactii

---

## Estimare Context per Sesiune {#estimare}

| Sesiune | Faza | Tasks | Fisiere Noi | Fisiere Modificate | Est. Tokens |
|---------|------|-------|-------------|-------------------|-------------|
| **S1** | A | A.1 - A.7 | 2 | 4 | ~120K |
| **S2** | B | B.1 - B.5 | 1 | 2 | ~100K |
| **S3** | C | C.1 - C.4 | 1 | 2 | ~100K |
| **S4** | D (part 1) | D.1 - D.3 | 3 | 1 | ~120K |
| **S5** | D (part 2) | D.4 - D.7 | 3 | 1 | ~100K |
| **S6** | E | E.1 - E.5 | 1 | 4 | ~80K |

**Total estimat: 6 sesiuni**

---

## Ordine de Dependente

```
A.1 (schema) ──> A.2 (types) ──> A.3 (validation) ──> A.4 (helper)
                                                           │
                                                           v
A.5 (routes CRUD) ──> A.6 (modif operatii existente) ──> A.7 (test)
                                                           │
                          ┌────────────────────────────────┘
                          v
B.1 (intrare) ──> B.2 (iesire) ──> B.3 (transfer) ──> B.4 (sterge linie) ──> B.5 (cautare)
                                                                                   │
                          ┌────────────────────────────────────────────────────────┘
                          v
C.1 (stoc helper) ──> C.2 (fisa gestiune) ──> C.3 (stoc gestiuni) ──> C.4 (lista inventar)
                          │
                          v
D.1 (lista UI) ──> D.2 (dialog creare) ──> D.3 (detaliu UI) ──> D.4/D.5/D.6 (dialogs) ──> D.7 (nav)
                                                                                                  │
                          ┌──────────────────────────────────────────────────────────────────────┘
                          v
E.1 (backfill) ──> E.2 (unificare) ──> E.3 (detail link) ──> E.4 (centralizator) ──> E.5 (verificare)
```

---

## Instructiuni pentru Fiecare Sesiune

La inceputul fiecarei sesiuni de implementare:

```
1. Citeste: .claude/MIGRATION-STATE.md -> identifica "Current Phase" si "Current Task"
2. Citeste: .claude/PLAN-OPERATIUNI.md -> sectiunea fazei curente pentru detalii
3. Anunta: "Implementez Faza 7X, Task X.Y: [descriere]"
4. Implementeaza task-urile din faza curenta
5. La final:
   - Bifeaza task-urile completate in MIGRATION-STATE.md: `- [ ]` -> `- [x]`
   - Actualizeaza "Current Phase" si "Current Task" cu urmatorul necompletat
   - Adauga rand in "Session Log"
   - Commit
```

### Conventii de commit

```
feat: add operatiuni tipOperatie + stare columns (Phase A, Task A.1)
feat: add operatiuni-acte CRUD routes (Phase A, Task A.5)
feat: wire existing operations to create operatiune header (Phase A, Task A.6)
feat: add intrare linie endpoint (Phase B, Task B.1)
feat: add stoc-la-data helper (Phase C, Task C.1)
feat: add Operatiuni list page (Phase D, Task D.1)
chore: backfill orphaned tranzactii (Phase E, Task E.1)
```
