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
  uniqueIndex,
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
// 4. Surse Finantare - Funding Sources (with hierarchy from legacy FINANTAT)
// ============================================================================
export const surseFinantare = mysqlTable("surse_finantare", {
  id: int("id").primaryKey().autoincrement(),
  cod: varchar("cod", { length: 20 }).notNull().unique(),
  denumire: varchar("denumire", { length: 200 }).notNull(),
  capitol: boolean("capitol").default(false), // true=parent chapter, false=detail level
  codCapitol1: int("cod_capitol_1"), // self-ref parent chapter ID 1
  codCapitol2: int("cod_capitol_2"), // self-ref parent chapter ID 2
  activ: boolean("activ").default(true),
});

// ============================================================================
// 5. Conturi - Chart of Accounts (with hierarchy from legacy CONTURI)
// ============================================================================
export const conturi = mysqlTable("conturi", {
  id: int("id").primaryKey().autoincrement(),
  simbol: varchar("simbol", { length: 30 }).notNull().unique(),
  denumire: varchar("denumire", { length: 300 }).notNull(),
  tip: mysqlEnum("tip", ["activ", "pasiv", "bifunctional"]).notNull(),
  titlu: boolean("titlu").default(false), // true=parent/title account, false=detail/posting account
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
// 7. Provenienta - Provenance Sources (from legacy PROVENIE)
// ============================================================================
export const provenienta = mysqlTable("provenienta", {
  id: int("id").primaryKey().autoincrement(),
  cod: varchar("cod", { length: 20 }).notNull().unique(),
  denumire: varchar("denumire", { length: 200 }).notNull(),
  activ: boolean("activ").default(true),
});

// ============================================================================
// 8. Tipuri Stoc - Stock/Usage Types (from legacy STOC_UZ)
// ============================================================================
export const tipuriStoc = mysqlTable("tipuri_stoc", {
  id: int("id").primaryKey().autoincrement(),
  cod: varchar("cod", { length: 20 }).notNull().unique(),
  denumire: varchar("denumire", { length: 200 }).notNull(),
  activ: boolean("activ").default(true),
});

// ============================================================================
// 9. Unitati Masura - Units of Measure (from legacy UNIT_MAS)
// ============================================================================
export const unitatiMasura = mysqlTable("unitati_masura", {
  id: int("id").primaryKey().autoincrement(),
  cod: varchar("cod", { length: 20 }).notNull().unique(),
  denumire: varchar("denumire", { length: 200 }).notNull(),
  activ: boolean("activ").default(true),
});

// ============================================================================
// 10. Operatiuni - Operation Headers (from legacy OPERATII, batch grouping)
// ============================================================================
export const operatiuni = mysqlTable(
  "operatiuni",
  {
    id: int("id").primaryKey().autoincrement(),
    numarOperatie: int("numar_operatie").notNull(),
    an: int("an").notNull(),
    dataOperare: date("data_operare").notNull(),
    tipOperatie: mysqlEnum("tip_operatie", [
      "intrare",
      "iesire",
      "transfer",
      "inventar",
      "ajustare",
    ]).notNull().default("transfer"),
    stare: mysqlEnum("stare_operatie", [
      "deschisa",
      "finalizata",
      "anulata",
    ]).notNull().default("deschisa"),
    tipDocumentId: int("tip_document_id"),
    numarDocument: varchar("numar_document", { length: 100 }),
    dataDocument: date("data_document"),
    descriere: varchar("descriere", { length: 500 }),
    createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("uniq_operatiuni_an_numar").on(table.an, table.numarOperatie),
    index("idx_operatiuni_data").on(table.dataOperare),
    index("idx_operatiuni_tip").on(table.tipOperatie),
    index("idx_operatiuni_stare").on(table.stare),
  ]
);

// ============================================================================
// 11. Mijloace Fixe - Fixed Assets (Main Entity)
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

    // Provenance, stock type, unit of measure (from legacy dimensions)
    provenientaId: int("provenienta_id"),
    tipStocId: int("tip_stoc_id"),
    unitateMasuraId: int("unitate_masura_id"),

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
    operatiuneId: int("operatiune_id"), // FK to operatiuni (batch grouping)

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
    uniqueIndex("uniq_amortizari_mijloc_fix_an_luna").on(
      table.mijlocFixId,
      table.an,
      table.luna
    ),
  ]
);

// ============================================================================
// Medical Devices Extension - Dispozitive Medicale
// Legislation basis:
//   - Regulamentul (UE) 2017/745 (MDR) — clasa risc, UDI, EUDAMED, organism notificat
//   - Legea 38/2023 — transpunere MDR în România
//   - ANMDM (Agenția Națională a Medicamentului și Dispozitivelor Medicale)
//   - Ordinul MS 912/2019 — vigilență dispozitive medicale
// ============================================================================

// 12. Dispozitive Medicale - Medical Device data (extends mijloace_fixe 1:1)
export const dispozitiveMedicale = mysqlTable(
  "dispozitive_medicale",
  {
    id: int("id").primaryKey().autoincrement(),

    // Link to fixed asset (1:1)
    mijlocFixId: int("mijloc_fix_id").notNull().unique(),

    // Clasificare risc per MDR 2017/745 Anexa VIII
    clasaRisc: mysqlEnum("clasa_risc", ["I", "IIa", "IIb", "III"]).notNull(),

    // Producător (MDR Art. 10)
    producator: varchar("producator", { length: 300 }).notNull(),
    taraProducator: varchar("tara_producator", { length: 100 }),

    // Reprezentant autorizat UE (MDR Art. 11) — obligatoriu pt non-UE
    reprezentantAutorizatUE: varchar("reprezentant_autorizat_ue", { length: 300 }),

    // Importator (MDR Art. 13)
    importator: varchar("importator", { length: 300 }),

    // Identificare dispozitiv
    model: varchar("model", { length: 200 }),
    referintaCatalog: varchar("referinta_catalog", { length: 100 }),

    // UDI — Unique Device Identifier (MDR Art. 27, obligatoriu)
    udiDI: varchar("udi_di", { length: 100 }),  // Device Identifier (stabil per versiune)
    udiPI: varchar("udi_pi", { length: 200 }),  // Production Identifier (lot+serie+expirare)

    // Identificatori fizici
    numarSerie: varchar("numar_serie", { length: 100 }),
    numarLot: varchar("numar_lot", { length: 100 }),
    dataFabricatie: date("data_fabricatie"),
    dataExpirare: date("data_expirare"),

    // EUDAMED — baza de date UE (MDR Art. 29)
    numarEudamed: varchar("numar_eudamed", { length: 100 }),

    // ANMDM — înregistrare națională România
    numarInregistrareANMDM: varchar("numar_inregistrare_anmdm", { length: 100 }),
    dataInregistrareANMDM: date("data_inregistrare_anmdm"),

    // Marcare CE (MDR Art. 20)
    marcaCE: boolean("marca_ce").default(true),
    organismNotificat: varchar("organism_notificat", { length: 100 }),
    numarCertificatCE: varchar("numar_certificat_ce", { length: 100 }),
    dataExpiraCertificatCE: date("data_expira_certificat_ce"),

    // Destinație utilizare (MDR Art. 2)
    destinatieUtilizare: varchar("destinatie_utilizare", { length: 500 }),

    // Condiții stocare / transport
    conditiiStocare: varchar("conditii_stocare", { length: 300 }),

    // Mentenanță planificată
    intervalMentenantaLuni: int("interval_mentenanta_luni"),
    dataMentenantaUrmatoare: date("data_mentenanta_urmatoare"),

    // Stare specifică ciclului de viață al DM
    stareDM: mysqlEnum("stare_dm", [
      "activ",      // în uz
      "mentenanta", // în mentenanță/calibrare
      "retras",     // retras din uz (MDR Art. 95 — field safety)
      "carantinat", // carantinat — investigație în curs
      "defect",     // defect, neoperațional
      "arhivat",    // scos din uz, arhivat
    ]).notNull().default("activ"),

    observatii: varchar("observatii", { length: 1000 }),
    createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_dispozitive_medicale_mijloc_fix").on(table.mijlocFixId),
    index("idx_dispozitive_medicale_clasa_risc").on(table.clasaRisc),
    index("idx_dispozitive_medicale_stare").on(table.stareDM),
    index("idx_dispozitive_medicale_data_expirare").on(table.dataExpirare),
    index("idx_dispozitive_medicale_data_mentenanta").on(table.dataMentenantaUrmatoare),
    index("idx_dispozitive_medicale_data_expira_ce").on(table.dataExpiraCertificatCE),
  ]
);

// 13. Mentenanta Dispozitive - Registru mentenanță/calibrare
// Bază legală: MDR Art. 10(9) — post-market surveillance, Ord. MS 912/2019
export const mentenantaDispozitive = mysqlTable(
  "mentenanta_dispozitive",
  {
    id: int("id").primaryKey().autoincrement(),
    dispozitivMedicalId: int("dispozitiv_medical_id").notNull(),

    tipMentenanta: mysqlEnum("tip_mentenanta", [
      "preventiva",  // mentenanță preventivă planificată
      "corectiva",   // mentenanță corectivă după defecțiune
      "calibrare",   // calibrare (RENAR/ISO 17025)
      "verificare",  // inspecție periodică
      "actualizare", // actualizare software/firmware
    ]).notNull(),

    dataPlanificata: date("data_planificata"),
    dataEfectuata: date("data_efectuata"),

    efectuatDe: varchar("efectuat_de", { length: 200 }),
    autorizatDe: varchar("autorizat_de", { length: 200 }),

    descriere: varchar("descriere", { length: 1000 }),

    rezultat: mysqlEnum("rezultat_mentenanta", [
      "ok",          // corespunde, apt de utilizare
      "conditionat", // acceptat cu restricții
      "defect",      // necorespunzător, necesită reparație
      "retras",      // scos din serviciu
    ]).notNull(),

    // Date calibrare
    certificatCalibrarNumar: varchar("certificat_calibrare_numar", { length: 100 }),
    dataExpiraCalibrare: date("data_expira_calibrare"),

    numarRaport: varchar("numar_raport", { length: 100 }),
    observatii: varchar("observatii", { length: 1000 }),
    dataMentenantaUrmatoare: date("data_mentenanta_urmatoare"),

    createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_mentenanta_dispozitiv").on(table.dispozitivMedicalId),
    index("idx_mentenanta_data_efectuata").on(table.dataEfectuata),
    index("idx_mentenanta_data_urmatoare").on(table.dataMentenantaUrmatoare),
    index("idx_mentenanta_tip").on(table.tipMentenanta),
  ]
);

// 14. Incidente Adverse - Raportare Vigilență (MDR Art. 87-92)
// Bază legală: MDR Art. 87-92, Ordinul MS 912/2019 privind vigilența DM
// Incidentele grave se raportează obligatoriu la ANMDM
export const incidenteAdverse = mysqlTable(
  "incidente_adverse",
  {
    id: int("id").primaryKey().autoincrement(),
    dispozitivMedicalId: int("dispozitiv_medical_id").notNull(),

    dataIncident: date("data_incident").notNull(),
    dataSesizare: date("data_sesizare"),

    tipIncident: mysqlEnum("tip_incident", [
      "incident_sever",    // incident grav (MDR Art. 87) — deces/vătămare gravă
      "incident_nonsever", // incident non-grav
      "near_miss",         // eveniment quasi-accident
      "reclamatie_user",   // reclamație utilizator fără incident
      "malfunctionare",    // malfuncționare dispozitiv
      "alerta_teren",      // acțiune corectivă de siguranță pe teren (FSCA)
    ]).notNull(),

    descriere: varchar("descriere", { length: 2000 }).notNull(),

    // Raportare vigilență ANMDM (obligatorie pt incidente grave — MDR Art. 87)
    raportatANMDM: boolean("raportat_anmdm").default(false),
    numarRaportANMDM: varchar("numar_raport_anmdm", { length: 100 }),
    dataRaportANMDM: date("data_raport_anmdm"),

    actiuneCorectiva: varchar("actiune_corectiva", { length: 2000 }),
    dataInchidere: date("data_inchidere"),

    stareIncident: mysqlEnum("stare_incident", [
      "deschis",
      "investigatie",
      "raportat",
      "inchis",
    ]).notNull().default("deschis"),

    observatii: varchar("observatii", { length: 1000 }),
    createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_incidente_dispozitiv").on(table.dispozitivMedicalId),
    index("idx_incidente_data").on(table.dataIncident),
    index("idx_incidente_stare").on(table.stareIncident),
    index("idx_incidente_tip").on(table.tipIncident),
    index("idx_incidente_raportat_anmdm").on(table.raportatANMDM),
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
  operatiuni: many(operatiuni),
}));

export const provenientaRelations = relations(provenienta, ({ many }) => ({
  mijloaceFixe: many(mijloaceFixe),
}));

export const tipuriStocRelations = relations(tipuriStoc, ({ many }) => ({
  mijloaceFixe: many(mijloaceFixe),
}));

export const unitatiMasuraRelations = relations(unitatiMasura, ({ many }) => ({
  mijloaceFixe: many(mijloaceFixe),
}));

export const operatiuniRelations = relations(operatiuni, ({ one, many }) => ({
  tipDocument: one(tipuriDocument, {
    fields: [operatiuni.tipDocumentId],
    references: [tipuriDocument.id],
  }),
  tranzactii: many(tranzactii),
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
  provenienta: one(provenienta, {
    fields: [mijloaceFixe.provenientaId],
    references: [provenienta.id],
  }),
  tipStoc: one(tipuriStoc, {
    fields: [mijloaceFixe.tipStocId],
    references: [tipuriStoc.id],
  }),
  unitateMasura: one(unitatiMasura, {
    fields: [mijloaceFixe.unitateMasuraId],
    references: [unitatiMasura.id],
  }),
  tranzactii: many(tranzactii),
  amortizari: many(amortizari),
  dispozitivMedical: one(dispozitiveMedicale, {
    fields: [mijloaceFixe.id],
    references: [dispozitiveMedicale.mijlocFixId],
  }),
}));

export const tranzactiiRelations = relations(tranzactii, ({ one }) => ({
  mijlocFix: one(mijloaceFixe, {
    fields: [tranzactii.mijlocFixId],
    references: [mijloaceFixe.id],
  }),
  operatiune: one(operatiuni, {
    fields: [tranzactii.operatiuneId],
    references: [operatiuni.id],
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

export const dispozitiveMedicaleRelations = relations(dispozitiveMedicale, ({ one, many }) => ({
  mijlocFix: one(mijloaceFixe, {
    fields: [dispozitiveMedicale.mijlocFixId],
    references: [mijloaceFixe.id],
  }),
  mentenante: many(mentenantaDispozitive),
  incidente: many(incidenteAdverse),
}));

export const mentenantaDispozitiveRelations = relations(mentenantaDispozitive, ({ one }) => ({
  dispozitivMedical: one(dispozitiveMedicale, {
    fields: [mentenantaDispozitive.dispozitivMedicalId],
    references: [dispozitiveMedicale.id],
  }),
}));

export const incidenteAdverseRelations = relations(incidenteAdverse, ({ one }) => ({
  dispozitivMedical: one(dispozitiveMedicale, {
    fields: [incidenteAdverse.dispozitivMedicalId],
    references: [dispozitiveMedicale.id],
  }),
}));

// ============================================================================
// 9. Users - Application Users for Authentication
// ============================================================================
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  activ: boolean("activ").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});
