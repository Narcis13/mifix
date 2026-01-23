import {
  mysqlTable,
  varchar,
  int,
  decimal,
  date,
  timestamp,
  boolean,
  json,
  mysqlEnum,
  index,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";

// ============================================================================
// 1. Clasificari - HG 2139/2004 Classification Catalog
// ============================================================================
export const clasificari = mysqlTable("clasificari", {
  cod: varchar("cod", { length: 10 }).primaryKey(),
  denumire: varchar("denumire", { length: 500 }).notNull(),
  grupa: varchar("grupa", { length: 5 }).notNull(), // I, II, III
  durataNormalaMin: int("durata_normala_min").notNull(),
  durataNormalaMax: int("durata_normala_max").notNull(),
  cotaAmortizare: decimal("cota_amortizare", { precision: 5, scale: 2 }),
});

// ============================================================================
// 2. Gestiuni - Asset Custodians
// ============================================================================
export const gestiuni = mysqlTable("gestiuni", {
  id: int("id").primaryKey().autoincrement(),
  cod: varchar("cod", { length: 20 }).notNull().unique(),
  denumire: varchar("denumire", { length: 200 }).notNull(),
  responsabil: varchar("responsabil", { length: 200 }),
  activ: boolean("activ").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// ============================================================================
// 3. Locuri Folosinta - Locations within Gestiuni
// ============================================================================
export const locuriUilizare = mysqlTable(
  "locuri_folosinta",
  {
    id: int("id").primaryKey().autoincrement(),
    gestiuneId: int("gestiune_id").notNull(),
    cod: varchar("cod", { length: 20 }).notNull(),
    denumire: varchar("denumire", { length: 200 }).notNull(),
    activ: boolean("activ").default(true),
  },
  (table) => [index("idx_locuri_folosinta_gestiune").on(table.gestiuneId)]
);

// ============================================================================
// 4. Surse Finantare - Funding Sources
// ============================================================================
export const surseFinantare = mysqlTable("surse_finantare", {
  id: int("id").primaryKey().autoincrement(),
  cod: varchar("cod", { length: 20 }).notNull().unique(),
  denumire: varchar("denumire", { length: 200 }).notNull(),
  activ: boolean("activ").default(true),
});

// ============================================================================
// 5. Conturi - Chart of Accounts
// ============================================================================
export const conturi = mysqlTable("conturi", {
  id: int("id").primaryKey().autoincrement(),
  simbol: varchar("simbol", { length: 20 }).notNull().unique(),
  denumire: varchar("denumire", { length: 300 }).notNull(),
  tip: mysqlEnum("tip", ["activ", "pasiv", "bifunctional"]).notNull(),
  amortizabil: boolean("amortizabil").default(false),
  contAmortizare: varchar("cont_amortizare", { length: 20 }),
  activ: boolean("activ").default(true),
});

// ============================================================================
// 6. Tipuri Document - Document Types for Asset Acquisition
// ============================================================================
export const tipuriDocument = mysqlTable("tipuri_document", {
  id: int("id").primaryKey().autoincrement(),
  cod: varchar("cod", { length: 20 }).notNull().unique(),
  denumire: varchar("denumire", { length: 100 }).notNull(),
  activ: boolean("activ").default(true),
});

// ============================================================================
// 7. Mijloace Fixe - Fixed Assets (Main Entity)
// ============================================================================
export const mijloaceFixe = mysqlTable(
  "mijloace_fixe",
  {
    id: int("id").primaryKey().autoincrement(),
    numarInventar: varchar("numar_inventar", { length: 50 }).notNull().unique(),
    denumire: varchar("denumire", { length: 255 }).notNull(),
    descriere: varchar("descriere", { length: 1000 }),

    // Classification reference
    clasificareCod: varchar("clasificare_cod", { length: 10 }).notNull(),

    // Location references
    gestiuneId: int("gestiune_id").notNull(),
    locFolosintaId: int("loc_folosinta_id"),

    // Funding reference
    sursaFinantareId: int("sursa_finantare_id"),

    // Accounting reference
    contId: int("cont_id"),

    // Document type reference
    tipDocumentId: int("tip_document_id"),

    // Acquisition details
    dataAchizitie: date("data_achizitie").notNull(),
    documentAchizitie: varchar("document_achizitie", { length: 100 }),
    furnizor: varchar("furnizor", { length: 200 }),

    // ALL monetary values use decimal(15, 2) - NEVER use int or float
    valoareInitiala: decimal("valoare_initiala", { precision: 15, scale: 2 }).notNull(),
    valoareInventar: decimal("valoare_inventar", { precision: 15, scale: 2 }).notNull(),
    valoareAmortizata: decimal("valoare_amortizata", { precision: 15, scale: 2 })
      .notNull()
      .default("0.00"),
    valoareRamasa: decimal("valoare_ramasa", { precision: 15, scale: 2 }).notNull(),

    // Depreciation parameters
    durataNormala: int("durata_normala").notNull(), // months
    durataRamasa: int("durata_ramasa").notNull(), // months
    cotaAmortizareLunara: decimal("cota_amortizare_lunara", {
      precision: 15,
      scale: 2,
    }).notNull(),
    eAmortizabil: boolean("e_amortizabil").default(true), // override depreciation calculation

    // State
    stare: mysqlEnum("stare", ["activ", "casare", "declasare", "transfer"]).notNull().default("activ"),
    dataIncepereAmortizare: date("data_incepere_amortizare"),
    dataFinalizareAmortizare: date("data_finalizare_amortizare"),
    dataIesire: date("data_iesire"),
    motivIesire: varchar("motiv_iesire", { length: 500 }),

    // Metadata
    observatii: varchar("observatii", { length: 1000 }),
    createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_mijloace_fixe_gestiune").on(table.gestiuneId),
    index("idx_mijloace_fixe_clasificare").on(table.clasificareCod),
    index("idx_mijloace_fixe_stare").on(table.stare),
    index("idx_mijloace_fixe_data_achizitie").on(table.dataAchizitie),
  ]
);

// ============================================================================
// 7. Tranzactii - Asset Transactions
// ============================================================================
export const tranzactii = mysqlTable(
  "tranzactii",
  {
    id: int("id").primaryKey().autoincrement(),
    mijlocFixId: int("mijloc_fix_id").notNull(),

    tip: mysqlEnum("tip", [
      "intrare",
      "transfer",
      "casare",
      "declasare",
      "reevaluare",
      "modernizare",
      "iesire",
    ]).notNull(),

    dataOperare: date("data_operare").notNull(),
    documentNumar: varchar("document_numar", { length: 100 }),
    documentData: date("document_data"),

    // For transfers
    gestiuneSursaId: int("gestiune_sursa_id"),
    gestiuneDestinatieId: int("gestiune_destinatie_id"),
    locFolosintaSursaId: int("loc_folosinta_sursa_id"),
    locFolosintaDestinatieId: int("loc_folosinta_destinatie_id"),

    // Monetary values - decimal(15, 2)
    valoareOperatie: decimal("valoare_operatie", { precision: 15, scale: 2 }),
    valoareInainte: decimal("valoare_inainte", { precision: 15, scale: 2 }),
    valoareDupa: decimal("valoare_dupa", { precision: 15, scale: 2 }),

    // Details
    descriere: varchar("descriere", { length: 500 }),
    observatii: varchar("observatii", { length: 1000 }),

    // Metadata
    createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_tranzactii_mijloc_fix").on(table.mijlocFixId),
    index("idx_tranzactii_tip").on(table.tip),
    index("idx_tranzactii_data_operare").on(table.dataOperare),
  ]
);

// ============================================================================
// 8. Amortizari - Monthly Depreciation Records
// ============================================================================
export const amortizari = mysqlTable(
  "amortizari",
  {
    id: int("id").primaryKey().autoincrement(),
    mijlocFixId: int("mijloc_fix_id").notNull(),
    an: int("an").notNull(),
    luna: int("luna").notNull(),

    // All monetary values - decimal(15, 2)
    valoareLunara: decimal("valoare_lunara", { precision: 15, scale: 2 }).notNull(),
    valoareCumulata: decimal("valoare_cumulata", { precision: 15, scale: 2 }).notNull(),
    valoareRamasa: decimal("valoare_ramasa", { precision: 15, scale: 2 }).notNull(),

    // Reference values at calculation time
    valoareInventar: decimal("valoare_inventar", { precision: 15, scale: 2 }).notNull(),
    durataRamasa: int("durata_ramasa").notNull(),

    // Status
    calculat: boolean("calculat").default(false),
    dataCalcul: timestamp("data_calcul"),

    // Metadata
    createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_amortizari_mijloc_fix_an_luna").on(
      table.mijlocFixId,
      table.an,
      table.luna
    ),
  ]
);

// ============================================================================
// Relations
// ============================================================================

export const gestiuniRelations = relations(gestiuni, ({ many }) => ({
  locuriUilizare: many(locuriUilizare),
  mijloaceFixe: many(mijloaceFixe),
}));

export const locuriUilizareRelations = relations(locuriUilizare, ({ one }) => ({
  gestiune: one(gestiuni, {
    fields: [locuriUilizare.gestiuneId],
    references: [gestiuni.id],
  }),
}));

export const clasificariRelations = relations(clasificari, ({ many }) => ({
  mijloaceFixe: many(mijloaceFixe),
}));

export const surseFinantareRelations = relations(surseFinantare, ({ many }) => ({
  mijloaceFixe: many(mijloaceFixe),
}));

export const conturiRelations = relations(conturi, ({ many }) => ({
  mijloaceFixe: many(mijloaceFixe),
}));

export const tipuriDocumentRelations = relations(tipuriDocument, ({ many }) => ({
  mijloaceFixe: many(mijloaceFixe),
}));

export const mijloaceFixeRelations = relations(mijloaceFixe, ({ one, many }) => ({
  clasificare: one(clasificari, {
    fields: [mijloaceFixe.clasificareCod],
    references: [clasificari.cod],
  }),
  gestiune: one(gestiuni, {
    fields: [mijloaceFixe.gestiuneId],
    references: [gestiuni.id],
  }),
  locFolosinta: one(locuriUilizare, {
    fields: [mijloaceFixe.locFolosintaId],
    references: [locuriUilizare.id],
  }),
  sursaFinantare: one(surseFinantare, {
    fields: [mijloaceFixe.sursaFinantareId],
    references: [surseFinantare.id],
  }),
  cont: one(conturi, {
    fields: [mijloaceFixe.contId],
    references: [conturi.id],
  }),
  tipDocument: one(tipuriDocument, {
    fields: [mijloaceFixe.tipDocumentId],
    references: [tipuriDocument.id],
  }),
  tranzactii: many(tranzactii),
  amortizari: many(amortizari),
}));

export const tranzactiiRelations = relations(tranzactii, ({ one }) => ({
  mijlocFix: one(mijloaceFixe, {
    fields: [tranzactii.mijlocFixId],
    references: [mijloaceFixe.id],
  }),
  gestiuneSursa: one(gestiuni, {
    fields: [tranzactii.gestiuneSursaId],
    references: [gestiuni.id],
  }),
  gestiuneDestinatie: one(gestiuni, {
    fields: [tranzactii.gestiuneDestinatieId],
    references: [gestiuni.id],
  }),
  locFolosintaSursa: one(locuriUilizare, {
    fields: [tranzactii.locFolosintaSursaId],
    references: [locuriUilizare.id],
  }),
  locFolosintaDestinatie: one(locuriUilizare, {
    fields: [tranzactii.locFolosintaDestinatieId],
    references: [locuriUilizare.id],
  }),
}));

export const amortizariRelations = relations(amortizari, ({ one }) => ({
  mijlocFix: one(mijloaceFixe, {
    fields: [amortizari.mijlocFixId],
    references: [mijloaceFixe.id],
  }),
}));
