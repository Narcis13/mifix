
# Ce vreau in mare sa faca aplicatia
vreau sa dezvolt o aplicatie de gestionare mijloace fixe utilizind ca si tech stack acesta : https://github.com/stevedylandev/bhvr ca si punct de plecare la care adaug shadcn pentru UI, iar pe partea de backend o sa am Drizzle ORM cu MySQL ca baza de date. Aplicatia va fi relativ simpla, va permite introducerea mijloacelor fixe , gestionarea gestiunilor, surselor de finantare, clasificatia mijloacelor fixe in Romania,locurilor de folosinta in cadrul gestiunilor, conturilor contabile (plan de conturi). Se vor putea efectua tranzactii gen transfer dintr-o gestiune in alta, casare, declasare. Se va genera amortizarea lunara pentru cele amortizabile si se vor lista rapoarte diverse:fisa mijlocului fix, balanta de verificare cantitativ valorica, jurnal acte operate, alte rapoarte.


# Specificații Tehnice - Aplicație Gestiune Mijloace Fixe

## 1. Prezentare Generală

### 1.1 Scopul Aplicației
Aplicație web pentru gestiunea mijloacelor fixe conform legislației românești, permițând evidența, amortizarea și raportarea activelor imobilizate.

### 1.2 Stack Tehnologic

| Component | Tehnologie |
|-----------|------------|
| **Runtime** | Bun |
| **Frontend** | React + Vite + TypeScript |
| **UI Components** | shadcn/ui + Tailwind CSS |
| **Backend** | Hono |
| **ORM** | Drizzle ORM |
| **Bază de date** | MySQL |
| **Monorepo** | Turbo (bhvr template) |
| **Validare** | Zod |

### 1.3 Structura Proiectului

```
gestiune-mf/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # Componente UI (shadcn)
│   │   ├── pages/             # Pagini aplicație
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilități
│   │   └── services/          # API calls
├── server/                    # Hono Backend
│   ├── src/
│   │   ├── routes/            # API routes
│   │   ├── db/                # Drizzle schema & migrations
│   │   ├── services/          # Business logic
│   │   └── utils/             # Helpers
├── shared/                    # Tipuri comune
│   └── src/
│       └── types/
└── package.json
```

---

## 2. Model de Date (Database Schema)

### 2.1 Diagrama Entități-Relații

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   clasificari   │     │  mijloace_fixe  │     │    gestiuni     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ cod (PK)        │◄────│ clasificare_cod │     │ id (PK)         │
│ denumire        │     │ id (PK)         │────►│ denumire        │
│ durata_normala  │     │ gestiune_id     │     │ responsabil     │
│ grupa           │     │ loc_folosinta_id│     └─────────────────┘
└─────────────────┘     │ sursa_fin_id    │            │
                        │ cont_id         │            │
┌─────────────────┐     │ ...             │     ┌──────▼──────────┐
│ surse_finantare │     └─────────────────┘     │ locuri_folosinta│
├─────────────────┤            │                ├─────────────────┤
│ id (PK)         │◄───────────┘                │ id (PK)         │
│ denumire        │                             │ gestiune_id     │
│ cod             │     ┌─────────────────┐     │ denumire        │
└─────────────────┘     │   tranzactii    │     └─────────────────┘
                        ├─────────────────┤
┌─────────────────┐     │ id (PK)         │     ┌─────────────────┐
│  conturi        │     │ mf_id           │     │  amortizari     │
├─────────────────┤     │ tip             │     ├─────────────────┤
│ id (PK)         │     │ data            │     │ id (PK)         │
│ simbol          │     │ detalii (JSON)  │     │ mf_id           │
│ denumire        │     └─────────────────┘     │ luna            │
│ tip             │                             │ an              │
└─────────────────┘                             │ suma            │
                                                └─────────────────┘
```

### 2.2 Schema Drizzle ORM

```typescript
// server/src/db/schema.ts

import { 
  mysqlTable, 
  varchar, 
  int, 
  decimal, 
  date, 
  datetime, 
  boolean,
  json,
  mysqlEnum,
  index
} from 'drizzle-orm/mysql-core';

// ═══════════════════════════════════════════════════════════════
// NOMENCLATOARE
// ═══════════════════════════════════════════════════════════════

// Clasificare Mijloace Fixe (Catalogul clasificării MF - HG 2139/2004)
export const clasificari = mysqlTable('clasificari', {
  cod: varchar('cod', { length: 10 }).primaryKey(),        // ex: "2.1.1.1.1"
  denumire: varchar('denumire', { length: 500 }).notNull(),
  grupa: varchar('grupa', { length: 5 }).notNull(),         // I, II, III
  durataNormalaMin: int('durata_normala_min').notNull(),    // ani
  durataNormalaMax: int('durata_normala_max').notNull(),
  cotaAmortizare: decimal('cota_amortizare', { precision: 5, scale: 2 }), // %
});

// Gestiuni
export const gestiuni = mysqlTable('gestiuni', {
  id: int('id').primaryKey().autoincrement(),
  cod: varchar('cod', { length: 20 }).notNull().unique(),
  denumire: varchar('denumire', { length: 200 }).notNull(),
  responsabil: varchar('responsabil', { length: 200 }),
  activ: boolean('activ').default(true),
  createdAt: datetime('created_at').defaultNow(),
  updatedAt: datetime('updated_at').defaultNow().onUpdateNow(),
});

// Locuri de Folosință
export const locuriUzilizare = mysqlTable('locuri_folosinta', {
  id: int('id').primaryKey().autoincrement(),
  gestiuneId: int('gestiune_id').notNull().references(() => gestiuni.id),
  cod: varchar('cod', { length: 20 }).notNull(),
  denumire: varchar('denumire', { length: 200 }).notNull(),
  activ: boolean('activ').default(true),
}, (table) => ({
  gestiuneIdx: index('gestiune_idx').on(table.gestiuneId),
}));

// Surse de Finanțare
export const surseFinantare = mysqlTable('surse_finantare', {
  id: int('id').primaryKey().autoincrement(),
  cod: varchar('cod', { length: 20 }).notNull().unique(),
  denumire: varchar('denumire', { length: 200 }).notNull(),
  activ: boolean('activ').default(true),
});

// Plan de Conturi
export const conturi = mysqlTable('conturi', {
  id: int('id').primaryKey().autoincrement(),
  simbol: varchar('simbol', { length: 20 }).notNull().unique(), // ex: "212.01"
  denumire: varchar('denumire', { length: 300 }).notNull(),
  tip: mysqlEnum('tip', ['activ', 'pasiv', 'bifunctional']).notNull(),
  amortizabil: boolean('amortizabil').default(false),
  contAmortizare: varchar('cont_amortizare', { length: 20 }), // contul corespondent pt amortizare
  activ: boolean('activ').default(true),
});

// ═══════════════════════════════════════════════════════════════
// ENTITATE PRINCIPALĂ: MIJLOACE FIXE
// ═══════════════════════════════════════════════════════════════

export const mijloaceFixe = mysqlTable('mijloace_fixe', {
  id: int('id').primaryKey().autoincrement(),
  
  // Identificare
  numarInventar: varchar('numar_inventar', { length: 50 }).notNull().unique(),
  denumire: varchar('denumire', { length: 500 }).notNull(),
  descriere: varchar('descriere', { length: 1000 }),
  
  // Clasificare și încadrare
  clasificareCod: varchar('clasificare_cod', { length: 10 })
    .notNull()
    .references(() => clasificari.cod),
  
  // Localizare
  gestiuneId: int('gestiune_id').notNull().references(() => gestiuni.id),
  locFolosintaId: int('loc_folosinta_id').references(() => locuriUzilizare.id),
  
  // Finanțare și contabilitate
  sursaFinantareId: int('sursa_finantare_id').references(() => surseFinantare.id),
  contId: int('cont_id').notNull().references(() => conturi.id),
  
  // Valori
  valoareInventar: decimal('valoare_inventar', { precision: 15, scale: 2 }).notNull(),
  valoareAmortizata: decimal('valoare_amortizata', { precision: 15, scale: 2 }).default('0'),
  valoareRamasaAmortizat: decimal('valoare_ramasa', { precision: 15, scale: 2 }),
  
  // Date importante
  dataAchizitie: date('data_achizitie').notNull(),
  dataPIF: date('data_pif').notNull(),  // Punere în funcțiune
  dataStartAmortizare: date('data_start_amortizare'),
  dataFinalAmortizare: date('data_final_amortizare'),
  
  // Amortizare
  durataNormala: int('durata_normala').notNull(),  // luni
  metodaAmortizare: mysqlEnum('metoda_amortizare', [
    'liniara',
    'degresiva', 
    'accelerata'
  ]).default('liniara'),
  amortizabil: boolean('amortizabil').default(true),
  
  // Documente
  documentAchizitie: varchar('document_achizitie', { length: 100 }),
  nrDocumentAchizitie: varchar('nr_document_achizitie', { length: 50 }),
  dataDocumentAchizitie: date('data_document_achizitie'),
  furnizor: varchar('furnizor', { length: 200 }),
  
  // Status
  stare: mysqlEnum('stare', [
    'activ',
    'conservare',
    'casat',
    'transferat',
    'vandut'
  ]).default('activ'),
  
  // Audit
  createdAt: datetime('created_at').defaultNow(),
  updatedAt: datetime('updated_at').defaultNow().onUpdateNow(),
  
}, (table) => ({
  gestiuneIdx: index('gestiune_idx').on(table.gestiuneId),
  clasificareIdx: index('clasificare_idx').on(table.clasificareCod),
  stareIdx: index('stare_idx').on(table.stare),
  dataAchIdx: index('data_ach_idx').on(table.dataAchizitie),
}));

// ═══════════════════════════════════════════════════════════════
// TRANZACȚII ȘI OPERAȚIUNI
// ═══════════════════════════════════════════════════════════════

export const tranzactii = mysqlTable('tranzactii', {
  id: int('id').primaryKey().autoincrement(),
  
  mijlocFixId: int('mijloc_fix_id').notNull().references(() => mijloaceFixe.id),
  
  tip: mysqlEnum('tip', [
    'intrare',           // Intrare în gestiune (achiziție, donație, etc.)
    'transfer',          // Transfer între gestiuni
    'casare',            // Scoatere din funcțiune
    'declasare',         // Declasare/downgrade
    'reevaluare',        // Reevaluare
    'modernizare',       // Modernizare (creștere valoare)
    'iesire'             // Ieșire (vânzare, etc.)
  ]).notNull(),
  
  dataOperare: date('data_operare').notNull(),
  dataDocument: date('data_document'),
  nrDocument: varchar('nr_document', { length: 50 }),
  tipDocument: varchar('tip_document', { length: 100 }),
  
  // Pentru transferuri
  gestiuneSursaId: int('gestiune_sursa_id').references(() => gestiuni.id),
  gestiuneDestinatieId: int('gestiune_destinatie_id').references(() => gestiuni.id),
  locFolosintaSursaId: int('loc_folosinta_sursa_id').references(() => locuriUzilizare.id),
  locFolosintaDestinatieId: int('loc_folosinta_dest_id').references(() => locuriUzilizare.id),
  
  // Valori implicate
  valoareOperatie: decimal('valoare_operatie', { precision: 15, scale: 2 }),
  
  // Detalii suplimentare (flexible)
  detalii: json('detalii'),
  observatii: varchar('observatii', { length: 1000 }),
  
  // Audit
  userId: int('user_id'),  // cine a efectuat operația
  createdAt: datetime('created_at').defaultNow(),
  
}, (table) => ({
  mfIdx: index('mf_idx').on(table.mijlocFixId),
  tipIdx: index('tip_idx').on(table.tip),
  dataIdx: index('data_idx').on(table.dataOperare),
}));

// ═══════════════════════════════════════════════════════════════
// AMORTIZĂRI LUNARE
// ═══════════════════════════════════════════════════════════════

export const amortizari = mysqlTable('amortizari', {
  id: int('id').primaryKey().autoincrement(),
  
  mijlocFixId: int('mijloc_fix_id').notNull().references(() => mijloaceFixe.id),
  
  luna: int('luna').notNull(),  // 1-12
  an: int('an').notNull(),
  
  valoareLunara: decimal('valoare_lunara', { precision: 15, scale: 2 }).notNull(),
  valoareCumulata: decimal('valoare_cumulata', { precision: 15, scale: 2 }).notNull(),
  valoareRamasa: decimal('valoare_ramasa', { precision: 15, scale: 2 }).notNull(),
  
  procesat: boolean('procesat').default(false),  // dacă a fost generat în contabilitate
  dataGenerare: datetime('data_generare').defaultNow(),
  
}, (table) => ({
  mfIdx: index('mf_idx').on(table.mijlocFixId),
  perioadaIdx: index('perioada_idx').on(table.an, table.luna),
  uniqueIdx: index('unique_mf_luna').on(table.mijlocFixId, table.an, table.luna),
}));
```

### 2.3 Tipuri Shared (TypeScript)

```typescript
// shared/src/types/index.ts

// ═══════════════════════════════════════════════════════════════
// ENUMERĂRI
// ═══════════════════════════════════════════════════════════════

export type MetodaAmortizare = 'liniara' | 'degresiva' | 'accelerata';
export type StareMijlocFix = 'activ' | 'conservare' | 'casat' | 'transferat' | 'vandut';
export type TipTranzactie = 'intrare' | 'transfer' | 'casare' | 'declasare' | 'reevaluare' | 'modernizare' | 'iesire';
export type TipCont = 'activ' | 'pasiv' | 'bifunctional';

// ═══════════════════════════════════════════════════════════════
// INTERFEȚE ENTITĂȚI
// ═══════════════════════════════════════════════════════════════

export interface Clasificare {
  cod: string;
  denumire: string;
  grupa: string;
  durataNormalaMin: number;
  durataNormalaMax: number;
  cotaAmortizare?: number;
}

export interface Gestiune {
  id: number;
  cod: string;
  denumire: string;
  responsabil?: string;
  activ: boolean;
}

export interface LocFolosinta {
  id: number;
  gestiuneId: number;
  cod: string;
  denumire: string;
  activ: boolean;
  // Relații populate
  gestiune?: Gestiune;
}

export interface SursaFinantare {
  id: number;
  cod: string;
  denumire: string;
  activ: boolean;
}

export interface Cont {
  id: number;
  simbol: string;
  denumire: string;
  tip: TipCont;
  amortizabil: boolean;
  contAmortizare?: string;
  activ: boolean;
}

export interface MijlocFix {
  id: number;
  numarInventar: string;
  denumire: string;
  descriere?: string;
  
  // Clasificare
  clasificareCod: string;
  clasificare?: Clasificare;
  
  // Localizare
  gestiuneId: number;
  gestiune?: Gestiune;
  locFolosintaId?: number;
  locFolosinta?: LocFolosinta;
  
  // Finanțare
  sursaFinantareId?: number;
  sursaFinantare?: SursaFinantare;
  contId: number;
  cont?: Cont;
  
  // Valori
  valoareInventar: number;
  valoareAmortizata: number;
  valoareRamasaAmortizat: number;
  
  // Date
  dataAchizitie: string;
  dataPIF: string;
  dataStartAmortizare?: string;
  dataFinalAmortizare?: string;
  
  // Amortizare
  durataNormala: number;
  metodaAmortizare: MetodaAmortizare;
  amortizabil: boolean;
  
  // Documente
  documentAchizitie?: string;
  nrDocumentAchizitie?: string;
  dataDocumentAchizitie?: string;
  furnizor?: string;
  
  // Status
  stare: StareMijlocFix;
  
  createdAt: string;
  updatedAt: string;
}

export interface Tranzactie {
  id: number;
  mijlocFixId: number;
  mijlocFix?: MijlocFix;
  tip: TipTranzactie;
  dataOperare: string;
  dataDocument?: string;
  nrDocument?: string;
  tipDocument?: string;
  gestiuneSursaId?: number;
  gestiuneDestinatieId?: number;
  locFolosintaSursaId?: number;
  locFolosintaDestinatieId?: number;
  valoareOperatie?: number;
  detalii?: Record<string, unknown>;
  observatii?: string;
  userId?: number;
  createdAt: string;
}

export interface Amortizare {
  id: number;
  mijlocFixId: number;
  mijlocFix?: MijlocFix;
  luna: number;
  an: number;
  valoareLunara: number;
  valoareCumulata: number;
  valoareRamasa: number;
  procesat: boolean;
  dataGenerare: string;
}

// ═══════════════════════════════════════════════════════════════
// DTOs (Data Transfer Objects)
// ═══════════════════════════════════════════════════════════════

export interface CreateMijlocFixDTO {
  numarInventar: string;
  denumire: string;
  descriere?: string;
  clasificareCod: string;
  gestiuneId: number;
  locFolosintaId?: number;
  sursaFinantareId?: number;
  contId: number;
  valoareInventar: number;
  dataAchizitie: string;
  dataPIF: string;
  durataNormala: number;
  metodaAmortizare?: MetodaAmortizare;
  amortizabil?: boolean;
  documentAchizitie?: string;
  nrDocumentAchizitie?: string;
  dataDocumentAchizitie?: string;
  furnizor?: string;
}

export interface TransferDTO {
  mijlocFixId: number;
  gestiuneDestinatieId: number;
  locFolosintaDestinatieId?: number;
  dataOperare: string;
  nrDocument?: string;
  observatii?: string;
}

export interface CasareDTO {
  mijlocFixId: number;
  dataOperare: string;
  nrDocument?: string;
  motiv?: string;
  observatii?: string;
}

export interface GenerareAmortizareDTO {
  luna: number;
  an: number;
}

// ═══════════════════════════════════════════════════════════════
// RĂSPUNSURI API
// ═══════════════════════════════════════════════════════════════

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ═══════════════════════════════════════════════════════════════
// FILTRE ȘI CĂUTARE
// ═══════════════════════════════════════════════════════════════

export interface MijloaceFixeFilters {
  search?: string;
  gestiuneId?: number;
  clasificareCod?: string;
  stare?: StareMijlocFix;
  amortizabil?: boolean;
  dataAchizitieStart?: string;
  dataAchizitieEnd?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

---

## 3. Arhitectură API (Backend Routes)

### 3.1 Structura Endpoint-uri

```
/api
├── /clasificari
│   ├── GET    /              # Lista clasificări (paginat, cu search)
│   └── GET    /:cod          # Detalii clasificare
│
├── /gestiuni
│   ├── GET    /              # Lista gestiuni
│   ├── POST   /              # Creare gestiune
│   ├── GET    /:id           # Detalii gestiune
│   ├── PUT    /:id           # Actualizare gestiune
│   └── DELETE /:id           # Dezactivare gestiune
│
├── /locuri-folosinta
│   ├── GET    /              # Lista (cu filtru pe gestiune)
│   ├── POST   /              # Creare loc folosință
│   ├── GET    /:id           # Detalii
│   ├── PUT    /:id           # Actualizare
│   └── DELETE /:id           # Dezactivare
│
├── /surse-finantare
│   ├── GET    /              # Lista surse
│   ├── POST   /              # Creare
│   ├── PUT    /:id           # Actualizare
│   └── DELETE /:id           # Dezactivare
│
├── /conturi
│   ├── GET    /              # Plan de conturi (filtru tip, amortizabil)
│   ├── POST   /              # Creare cont
│   ├── PUT    /:id           # Actualizare
│   └── DELETE /:id           # Dezactivare
│
├── /mijloace-fixe
│   ├── GET    /              # Lista MF (paginat, filtre multiple)
│   ├── POST   /              # Înregistrare MF nou
│   ├── GET    /:id           # Detalii MF complet
│   ├── PUT    /:id           # Actualizare MF
│   ├── DELETE /:id           # Soft delete
│   │
│   ├── POST   /:id/transfer  # Transfer între gestiuni
│   ├── POST   /:id/casare    # Casare MF
│   ├── POST   /:id/declasare # Declasare MF
│   │
│   └── GET    /:id/istoric   # Istoric tranzacții MF
│
├── /tranzactii
│   ├── GET    /              # Lista tranzacții (filtre: tip, perioadă)
│   └── GET    /:id           # Detalii tranzacție
│
├── /amortizare
│   ├── POST   /genereaza     # Generare amortizare lunară
│   ├── GET    /luna/:an/:luna # Amortizări pe lună
│   └── GET    /mf/:id        # Istoric amortizare per MF
│
└── /rapoarte
    ├── GET    /fisa-mf/:id           # Fișa mijlocului fix
    ├── GET    /balanta               # Balanță verificare cantitativ-valorică
    ├── GET    /jurnal                # Jurnal acte operate
    ├── GET    /situatie-amortizare   # Situație amortizare
    └── GET    /inventar              # Lista inventar
```

### 3.2 Exemplu Implementare Route

```typescript
// server/src/routes/mijloace-fixe.ts

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { MijloaceFixeService } from '../services/mijloace-fixe.service';
import type { ApiResponse, MijlocFix, PaginatedResponse } from 'shared';

const mijloaceFixeRouter = new Hono();

// Schema validare pentru creare
const createMijlocFixSchema = z.object({
  numarInventar: z.string().min(1).max(50),
  denumire: z.string().min(1).max(500),
  descriere: z.string().max(1000).optional(),
  clasificareCod: z.string().min(1),
  gestiuneId: z.number().int().positive(),
  locFolosintaId: z.number().int().positive().optional(),
  sursaFinantareId: z.number().int().positive().optional(),
  contId: z.number().int().positive(),
  valoareInventar: z.number().positive(),
  dataAchizitie: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dataPIF: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durataNormala: z.number().int().positive(),
  metodaAmortizare: z.enum(['liniara', 'degresiva', 'accelerata']).default('liniara'),
  amortizabil: z.boolean().default(true),
  documentAchizitie: z.string().optional(),
  nrDocumentAchizitie: z.string().optional(),
  dataDocumentAchizitie: z.string().optional(),
  furnizor: z.string().optional(),
});

// GET / - Lista mijloace fixe
mijloaceFixeRouter.get('/', async (c) => {
  const query = c.req.query();
  
  const filters = {
    search: query.search,
    gestiuneId: query.gestiuneId ? parseInt(query.gestiuneId) : undefined,
    stare: query.stare as any,
    page: parseInt(query.page || '1'),
    pageSize: parseInt(query.pageSize || '20'),
  };
  
  const result = await MijloaceFixeService.getAll(filters);
  
  return c.json<ApiResponse<PaginatedResponse<MijlocFix>>>({
    success: true,
    data: result,
  });
});

// POST / - Creare mijloc fix
mijloaceFixeRouter.post(
  '/',
  zValidator('json', createMijlocFixSchema),
  async (c) => {
    const data = c.req.valid('json');
    
    const result = await MijloaceFixeService.create(data);
    
    return c.json<ApiResponse<MijlocFix>>({
      success: true,
      data: result,
      message: 'Mijloc fix înregistrat cu succes',
    }, 201);
  }
);

// POST /:id/transfer - Transfer
mijloaceFixeRouter.post(
  '/:id/transfer',
  zValidator('json', z.object({
    gestiuneDestinatieId: z.number().int().positive(),
    locFolosintaDestinatieId: z.number().int().positive().optional(),
    dataOperare: z.string(),
    nrDocument: z.string().optional(),
    observatii: z.string().optional(),
  })),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');
    
    const result = await MijloaceFixeService.transfer(id, data);
    
    return c.json<ApiResponse>({
      success: true,
      message: 'Transfer efectuat cu succes',
      data: result,
    });
  }
);

export default mijloaceFixeRouter;
```

---

## 4. Logică Business - Amortizare

### 4.1 Calculul Amortizării

```typescript
// server/src/services/amortizare.service.ts

export class AmortizareService {
  
  /**
   * Calculează amortizarea lunară pentru metoda liniară
   * Formula: Valoare Inventar / Durată Normală (luni)
   */
  static calculeazaAmortizareLiniara(
    valoareInventar: number,
    durataNormalaLuni: number
  ): number {
    return Number((valoareInventar / durataNormalaLuni).toFixed(2));
  }
  
  /**
   * Calculează amortizarea pentru metoda degresivă
   * AD1: Cota liniară × Coeficient multiplicator
   * Coeficienți: 1.5 (2-5 ani), 2.0 (5-10 ani), 2.5 (>10 ani)
   */
  static calculeazaAmortizareDegresiva(
    valoareRamasa: number,
    durataNormalaAni: number,
    anCurent: number,
    lunaInAn: number
  ): number {
    const coeficient = 
      durataNormalaAni <= 5 ? 1.5 :
      durataNormalaAni <= 10 ? 2.0 : 2.5;
    
    const cotaLiniara = 100 / durataNormalaAni;
    const cotaDegresiva = cotaLiniara * coeficient;
    
    // Amortizare anuală
    const amortizareAnuala = (valoareRamasa * cotaDegresiva) / 100;
    
    // Amortizare lunară
    return Number((amortizareAnuala / 12).toFixed(2));
  }
  
  /**
   * Generează amortizarea pentru o lună specificată
   */
  static async genereazaAmortizareLunara(
    luna: number, 
    an: number
  ): Promise<GenerareAmortizareResult> {
    // 1. Selectează toate MF active și amortizabile
    const mijloaceFixe = await db
      .select()
      .from(mijloaceFixeTable)
      .where(
        and(
          eq(mijloaceFixeTable.stare, 'activ'),
          eq(mijloaceFixeTable.amortizabil, true),
          // Data start amortizare <= luna curentă
          lte(mijloaceFixeTable.dataStartAmortizare, `${an}-${String(luna).padStart(2, '0')}-01`)
        )
      );
    
    const rezultate: Amortizare[] = [];
    
    for (const mf of mijloaceFixe) {
      // Verifică dacă nu s-a atins valoarea totală
      if (mf.valoareAmortizata >= mf.valoareInventar) {
        continue;
      }
      
      // Calculează valoarea lunară
      let valoareLunara: number;
      
      switch (mf.metodaAmortizare) {
        case 'liniara':
          valoareLunara = this.calculeazaAmortizareLiniara(
            mf.valoareInventar,
            mf.durataNormala
          );
          break;
        case 'degresiva':
          valoareLunara = this.calculeazaAmortizareDegresiva(
            mf.valoareInventar - mf.valoareAmortizata,
            mf.durataNormala / 12,
            an,
            luna
          );
          break;
        default:
          valoareLunara = this.calculeazaAmortizareLiniara(
            mf.valoareInventar,
            mf.durataNormala
          );
      }
      
      // Nu depăși valoarea rămasă
      const valoareRamasa = mf.valoareInventar - mf.valoareAmortizata;
      if (valoareLunara > valoareRamasa) {
        valoareLunara = valoareRamasa;
      }
      
      // Inserează înregistrarea
      const amortizare = await db.insert(amortizariTable).values({
        mijlocFixId: mf.id,
        luna,
        an,
        valoareLunara,
        valoareCumulata: mf.valoareAmortizata + valoareLunara,
        valoareRamasa: valoareRamasa - valoareLunara,
      });
      
      // Actualizează MF
      await db
        .update(mijloaceFixeTable)
        .set({
          valoareAmortizata: mf.valoareAmortizata + valoareLunara,
          valoareRamasaAmortizat: valoareRamasa - valoareLunara,
        })
        .where(eq(mijloaceFixeTable.id, mf.id));
      
      rezultate.push(amortizare);
    }
    
    return {
      luna,
      an,
      totalMijloaceFixe: rezultate.length,
      totalAmortizare: rezultate.reduce((sum, a) => sum + a.valoareLunara, 0),
    };
  }
}
```

---

## 5. Interfață Utilizator (Frontend)

### 5.1 Structura Pagini

```
/                           → Dashboard
/mijloace-fixe              → Lista MF (tabel, filtre, căutare)
/mijloace-fixe/nou          → Formular adăugare MF
/mijloace-fixe/:id          → Detalii & editare MF
/mijloace-fixe/:id/fisa     → Fișa mijlocului fix (print)

/gestiuni                   → CRUD Gestiuni
/locuri-folosinta           → CRUD Locuri folosință
/surse-finantare            → CRUD Surse finanțare
/conturi                    → Plan de conturi

/tranzactii                 → Istoric tranzacții
/tranzactii/transfer        → Formular transfer
/tranzactii/casare          → Formular casare

/amortizare                 → Generare & vizualizare amortizare
/amortizare/genereaza       → Generare amortizare lunară

/rapoarte                   → Meniu rapoarte
/rapoarte/balanta           → Balanță verificare
/rapoarte/jurnal            → Jurnal acte operate
/rapoarte/inventar          → Lista inventar
```

### 5.2 Componente shadcn/ui Recomandate

```typescript
// Componente de utilizat din shadcn/ui:

// Formulare
- Form, FormField, FormItem, FormLabel, FormControl, FormMessage
- Input, Textarea
- Select, SelectTrigger, SelectContent, SelectItem
- DatePicker (cu react-day-picker)
- Checkbox, RadioGroup

// Tabele
- Table, TableHeader, TableBody, TableRow, TableCell
- DataTable (custom, cu sorting, filtering, pagination)

// Layout
- Card, CardHeader, CardTitle, CardContent
- Tabs, TabsList, TabsTrigger, TabsContent
- Sheet (pentru sidebars)
- Dialog (pentru modals)

// Feedback
- Alert, AlertDescription
- Toast (pentru notificări)
- Badge (pentru status)
- Skeleton (pentru loading)

// Navigație
- Button, ButtonGroup
- DropdownMenu
- Command (pentru search)
- Breadcrumb
```

### 5.3 Exemplu Componentă - Lista Mijloace Fixe

```tsx
// client/src/pages/MijloaceFixePage.tsx

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, FileText } from 'lucide-react';
import { MijlocFix, Gestiune, MijloaceFixeFilters } from 'shared';
import { mijloaceFixeApi, gestiuniApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export function MijloaceFixePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mijloaceFixe, setMijloaceFixe] = useState<MijlocFix[]>([]);
  const [gestiuni, setGestiuni] = useState<Gestiune[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const filters: MijloaceFixeFilters = {
    search: searchParams.get('search') || undefined,
    gestiuneId: searchParams.get('gestiune') 
      ? parseInt(searchParams.get('gestiune')!) 
      : undefined,
    stare: (searchParams.get('stare') as any) || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: 20,
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  async function loadData() {
    setLoading(true);
    try {
      const [mfResponse, gestiuniResponse] = await Promise.all([
        mijloaceFixeApi.getAll(filters),
        gestiuniApi.getAll(),
      ]);
      setMijloaceFixe(mfResponse.data.items);
      setTotal(mfResponse.data.total);
      setGestiuni(gestiuniResponse.data);
    } finally {
      setLoading(false);
    }
  }

  const stareColors: Record<string, string> = {
    activ: 'bg-green-100 text-green-800',
    conservare: 'bg-yellow-100 text-yellow-800',
    casat: 'bg-red-100 text-red-800',
    transferat: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mijloace Fixe</h1>
        <Button asChild>
          <Link to="/mijloace-fixe/nou">
            <Plus className="mr-2 h-4 w-4" />
            Adaugă Mijloc Fix
          </Link>
        </Button>
      </div>

      {/* Filtre */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută după denumire sau număr inventar..."
            className="pl-9"
            value={filters.search || ''}
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              if (e.target.value) {
                newParams.set('search', e.target.value);
              } else {
                newParams.delete('search');
              }
              newParams.set('page', '1');
              setSearchParams(newParams);
            }}
          />
        </div>

        <Select
          value={filters.gestiuneId?.toString() || 'all'}
          onValueChange={(value) => {
            const newParams = new URLSearchParams(searchParams);
            if (value !== 'all') {
              newParams.set('gestiune', value);
            } else {
              newParams.delete('gestiune');
            }
            setSearchParams(newParams);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toate gestiunile" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate gestiunile</SelectItem>
            {gestiuni.map((g) => (
              <SelectItem key={g.id} value={g.id.toString()}>
                {g.denumire}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.stare || 'all'}
          onValueChange={(value) => {
            const newParams = new URLSearchParams(searchParams);
            if (value !== 'all') {
              newParams.set('stare', value);
            } else {
              newParams.delete('stare');
            }
            setSearchParams(newParams);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Stare" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="activ">Activ</SelectItem>
            <SelectItem value="conservare">Conservare</SelectItem>
            <SelectItem value="casat">Casat</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabel */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nr. Inventar</TableHead>
              <TableHead>Denumire</TableHead>
              <TableHead>Gestiune</TableHead>
              <TableHead className="text-right">Valoare</TableHead>
              <TableHead className="text-right">Amortizat</TableHead>
              <TableHead>Stare</TableHead>
              <TableHead className="w-[100px]">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mijloaceFixe.map((mf) => (
              <TableRow key={mf.id}>
                <TableCell className="font-mono">{mf.numarInventar}</TableCell>
                <TableCell>
                  <Link 
                    to={`/mijloace-fixe/${mf.id}`}
                    className="hover:underline font-medium"
                  >
                    {mf.denumire}
                  </Link>
                </TableCell>
                <TableCell>{mf.gestiune?.denumire}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(mf.valoareInventar)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(mf.valoareAmortizata)}
                </TableCell>
                <TableCell>
                  <Badge className={stareColors[mf.stare]}>
                    {mf.stare}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/mijloace-fixe/${mf.id}/fisa`}>
                      <FileText className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginare */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total: {total} înregistrări
        </p>
        {/* Componenta de paginare */}
      </div>
    </div>
  );
}
```

---

## 6. Rapoarte

### 6.1 Fișa Mijlocului Fix

**Conținut:**
- Date identificare (nr. inventar, denumire, clasificare)
- Gestiune curentă și loc de folosință
- Valori: inventar, amortizare cumulată, valoare rămasă
- Document achiziție
- Grafic amortizare
- Istoric complet tranzacții

### 6.2 Balanță de Verificare Cantitativ-Valorică

**Filtre:**
- Perioada (de la - până la)
- Gestiune
- Clasificare

**Coloane:**
- Nr. crt
- Nr. inventar
- Denumire
- Cantitate
- Valoare intrare
- Amortizare cumulată
- Valoare rămasă
- Stare

**Totaluri pe:**
- Gestiune
- Clasificare/Grupă
- General

### 6.3 Jurnal Acte Operate

**Filtre:**
- Perioada
- Tip operațiune
- Gestiune

**Conținut:**
- Data operație
- Nr. document
- Tip operație
- Mijloc fix afectat
- Valoare
- Gestiune sursă/destinație (pentru transferuri)

---

## 7. Configurare și Deployment

### 7.1 Variabile de Mediu

```env
# .env (server)
DATABASE_URL=mysql://user:password@localhost:3306/gestiune_mf
NODE_ENV=development

# .env (client)
VITE_SERVER_URL=http://localhost:3000/api
```

### 7.2 Comenzi Dezvoltare

```bash
# Instalare
bun install

# Dezvoltare
bun dev

# Build
bun run build

# Migrări bază de date
cd server && bun run db:generate
cd server && bun run db:migrate
cd server && bun run db:seed  # pentru date inițiale (clasificări)
```

### 7.3 Date Inițiale (Seed)

```typescript
// server/src/db/seed.ts

// Seed pentru clasificarea mijloacelor fixe conform HG 2139/2004
// Exemplu parțial:

const clasificariSeed = [
  // Grupa I - Construcții
  { cod: '1.1.1', denumire: 'Clădiri industriale', grupa: 'I', durataNormalaMin: 40, durataNormalaMax: 60 },
  { cod: '1.1.2', denumire: 'Clădiri agricole', grupa: 'I', durataNormalaMin: 30, durataNormalaMax: 50 },
  
  // Grupa II - Echipamente tehnologice
  { cod: '2.1.1.1', denumire: 'Utilaje și instalații de lucru', grupa: 'II', durataNormalaMin: 8, durataNormalaMax: 15 },
  { cod: '2.1.2.1', denumire: 'Aparate și instalații de măsurare', grupa: 'II', durataNormalaMin: 6, durataNormalaMax: 12 },
  
  // Grupa III - Mobilier, aparatură
  { cod: '3.1.1', denumire: 'Mobilier', grupa: 'III', durataNormalaMin: 10, durataNormalaMax: 15 },
  { cod: '3.2.1', denumire: 'Aparatură birotică', grupa: 'III', durataNormalaMin: 4, durataNormalaMax: 8 },
  { cod: '3.2.2', denumire: 'Calculatoare electronice', grupa: 'III', durataNormalaMin: 2, durataNormalaMax: 4 },
  
  // ... restul clasificărilor
];

// Seed pentru plan de conturi standard
const conturiSeed = [
  { simbol: '211', denumire: 'Terenuri și amenajări de terenuri', tip: 'activ', amortizabil: false },
  { simbol: '212', denumire: 'Construcții', tip: 'activ', amortizabil: true, contAmortizare: '2812' },
  { simbol: '213', denumire: 'Instalații tehnice și mașini', tip: 'activ', amortizabil: true, contAmortizare: '2813' },
  { simbol: '214', denumire: 'Mobilier, aparatură birotică', tip: 'activ', amortizabil: true, contAmortizare: '2814' },
  { simbol: '2812', denumire: 'Amortizarea construcțiilor', tip: 'pasiv', amortizabil: false },
  { simbol: '2813', denumire: 'Amortizarea instalațiilor și mașinilor', tip: 'pasiv', amortizabil: false },
  { simbol: '2814', denumire: 'Amortizarea altor imobilizări corporale', tip: 'pasiv', amortizabil: false },
  { simbol: '6811', denumire: 'Cheltuieli de exploatare privind amortizarea imobilizărilor', tip: 'activ', amortizabil: false },
];
```

---

## 8. Checklist Implementare

### Faza 1 - Setup & Infrastructură
- [ ] Inițializare proiect bhvr
- [ ] Configurare Drizzle ORM + MySQL
- [ ] Instalare și configurare shadcn/ui
- [ ] Setup rutare (React Router)
- [ ] Configurare autentificare (opțional, pentru versiuni viitoare)

### Faza 2 - Nomenclatoare
- [ ] CRUD Gestiuni
- [ ] CRUD Locuri folosință
- [ ] CRUD Surse finanțare
- [ ] Import clasificări MF (seed)
- [ ] CRUD Plan de conturi (seed + editare)

### Faza 3 - Mijloace Fixe
- [ ] Formular adăugare MF
- [ ] Lista MF cu filtre și căutare
- [ ] Detalii și editare MF
- [ ] Validări business (nr. inventar unic, etc.)

### Faza 4 - Tranzacții
- [ ] Transfer între gestiuni
- [ ] Casare
- [ ] Declasare
- [ ] Istoric tranzacții

### Faza 5 - Amortizare
- [ ] Implementare calcul amortizare liniară
- [ ] Generare amortizare lunară batch
- [ ] Vizualizare amortizări

### Faza 6 - Rapoarte
- [ ] Fișa mijlocului fix
- [ ] Balanță verificare cantitativ-valorică
- [ ] Jurnal acte operate
- [ ] Export PDF/Excel

---

## 9. Considerații Viitoare

- **Autentificare și autorizare**: Implementare sistem utilizatori cu roluri
- **Multi-tenant**: Suport pentru mai multe organizații
- **Integrare contabilă**: Export către software contabilitate
- **Inventariere**: Modul de inventariere cu suport pentru coduri de bare
- **Documente atașate**: Upload și stocare documente justificative
- **Audit log**: Logare completă a tuturor modificărilor
- **API export**: Export date în formate standard (XML, JSON)

---

*Document generat pentru proiect Gestiune Mijloace Fixe*  
*Versiune: 1.0*  
*Data: Ianuarie 2026*