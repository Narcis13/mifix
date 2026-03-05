import { createInsertSchema } from "drizzle-zod";
import { gestiuni, locuriUilizare, surseFinantare, conturi, tipuriDocument, provenienta, tipuriStoc, unitatiMasura, operatiuni, mijloaceFixe, dispozitiveMedicale, mentenantaDispozitive, incidenteAdverse } from "../db/schema";
import { z } from "zod";

// ============================================================================
// Gestiuni - Asset Custodians
// ============================================================================
export const insertGestiuneSchema = createInsertSchema(gestiuni, {
  cod: (schema) => schema.min(1, "Cod obligatoriu").max(20, "Cod maxim 20 caractere"),
  denumire: (schema) => schema.min(1, "Denumire obligatorie").max(200, "Denumire maxim 200 caractere"),
  responsabil: (schema) => schema.max(200, "Responsabil maxim 200 caractere").optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertGestiune = z.infer<typeof insertGestiuneSchema>;

export const updateGestiuneSchema = insertGestiuneSchema.partial();
export type UpdateGestiune = z.infer<typeof updateGestiuneSchema>;

// ============================================================================
// Locuri Folosinta - Locations within Gestiuni
// ============================================================================
export const insertLocFolosintaSchema = createInsertSchema(locuriUilizare, {
  cod: (schema) => schema.min(1, "Cod obligatoriu").max(20, "Cod maxim 20 caractere"),
  denumire: (schema) => schema.min(1, "Denumire obligatorie").max(200, "Denumire maxim 200 caractere"),
  gestiuneId: (schema) => schema.min(1, "Gestiune obligatorie"),
}).omit({ id: true });

export type InsertLocFolosinta = z.infer<typeof insertLocFolosintaSchema>;

export const updateLocFolosintaSchema = insertLocFolosintaSchema.partial();
export type UpdateLocFolosinta = z.infer<typeof updateLocFolosintaSchema>;

// ============================================================================
// Surse Finantare - Funding Sources
// ============================================================================
export const insertSursaFinantareSchema = createInsertSchema(surseFinantare, {
  cod: (schema) => schema.min(1, "Cod obligatoriu").max(20, "Cod maxim 20 caractere"),
  denumire: (schema) => schema.min(1, "Denumire obligatorie").max(200, "Denumire maxim 200 caractere"),
}).omit({ id: true });

export type InsertSursaFinantare = z.infer<typeof insertSursaFinantareSchema>;

export const updateSursaFinantareSchema = insertSursaFinantareSchema.partial();
export type UpdateSursaFinantare = z.infer<typeof updateSursaFinantareSchema>;

// ============================================================================
// Conturi - Chart of Accounts
// ============================================================================
export const insertContSchema = createInsertSchema(conturi, {
  simbol: (schema) => schema.min(1, "Simbol obligatoriu").max(20, "Simbol maxim 20 caractere"),
  denumire: (schema) => schema.min(1, "Denumire obligatorie").max(300, "Denumire maxim 300 caractere"),
  contAmortizare: (schema) => schema.max(20, "Cont amortizare maxim 20 caractere").optional(),
}).omit({ id: true });

export type InsertCont = z.infer<typeof insertContSchema>;

export const updateContSchema = insertContSchema.partial();
export type UpdateCont = z.infer<typeof updateContSchema>;

// ============================================================================
// Tipuri Document - Document Types for Asset Acquisition
// ============================================================================
export const insertTipDocumentSchema = createInsertSchema(tipuriDocument, {
  cod: (schema) => schema.min(1, "Cod obligatoriu").max(20, "Cod maxim 20 caractere"),
  denumire: (schema) => schema.min(1, "Denumire obligatorie").max(100, "Denumire maxim 100 caractere"),
}).omit({ id: true });

export type InsertTipDocument = z.infer<typeof insertTipDocumentSchema>;

export const updateTipDocumentSchema = insertTipDocumentSchema.partial();
export type UpdateTipDocument = z.infer<typeof updateTipDocumentSchema>;

// ============================================================================
// Provenienta - Provenance Sources
// ============================================================================
export const insertProvenientaSchema = createInsertSchema(provenienta, {
  cod: (schema) => schema.min(1, "Cod obligatoriu").max(20, "Cod maxim 20 caractere"),
  denumire: (schema) => schema.min(1, "Denumire obligatorie").max(200, "Denumire maxim 200 caractere"),
}).omit({ id: true });

export type InsertProvenienta = z.infer<typeof insertProvenientaSchema>;

export const updateProvenientaSchema = insertProvenientaSchema.partial();
export type UpdateProvenienta = z.infer<typeof updateProvenientaSchema>;

// ============================================================================
// Tipuri Stoc - Stock/Usage Types
// ============================================================================
export const insertTipStocSchema = createInsertSchema(tipuriStoc, {
  cod: (schema) => schema.min(1, "Cod obligatoriu").max(20, "Cod maxim 20 caractere"),
  denumire: (schema) => schema.min(1, "Denumire obligatorie").max(200, "Denumire maxim 200 caractere"),
}).omit({ id: true });

export type InsertTipStoc = z.infer<typeof insertTipStocSchema>;

export const updateTipStocSchema = insertTipStocSchema.partial();
export type UpdateTipStoc = z.infer<typeof updateTipStocSchema>;

// ============================================================================
// Unitati Masura - Units of Measure
// ============================================================================
export const insertUnitateMasuraSchema = createInsertSchema(unitatiMasura, {
  cod: (schema) => schema.min(1, "Cod obligatoriu").max(20, "Cod maxim 20 caractere"),
  denumire: (schema) => schema.min(1, "Denumire obligatorie").max(200, "Denumire maxim 200 caractere"),
}).omit({ id: true });

export type InsertUnitateMasura = z.infer<typeof insertUnitateMasuraSchema>;

export const updateUnitateMasuraSchema = insertUnitateMasuraSchema.partial();
export type UpdateUnitateMasura = z.infer<typeof updateUnitateMasuraSchema>;

// ============================================================================
// Operatiuni - Operation Headers
// ============================================================================
export const insertOperatiuneSchema = createInsertSchema(operatiuni, {
  numarOperatie: (schema) => schema.min(1, "Numar operatie obligatoriu"),
  an: (schema) => schema.min(2000, "An minim 2000").max(2100, "An maxim 2100"),
  descriere: (schema) => schema.max(500, "Descriere maxim 500 caractere").optional(),
  numarDocument: (schema) => schema.max(100, "Numar document maxim 100 caractere").optional(),
}).omit({ id: true, createdAt: true });

export type InsertOperatiune = z.infer<typeof insertOperatiuneSchema>;

export const updateOperatiuneSchema = insertOperatiuneSchema.partial();
export type UpdateOperatiune = z.infer<typeof updateOperatiuneSchema>;

// ============================================================================
// Mijloace Fixe - Fixed Assets
// ============================================================================

// Helper for date string to Date coercion
const dateStringToDate = z.string().transform((val) => new Date(val));

export const insertMijlocFixSchema = createInsertSchema(mijloaceFixe, {
  numarInventar: (schema) => schema
    .min(1, "Numar inventar obligatoriu")
    .max(50, "Numar inventar maxim 50 caractere"),
  denumire: (schema) => schema
    .min(1, "Denumire obligatorie")
    .max(255, "Denumire maxim 255 caractere"),
  descriere: (schema) => schema
    .max(1000, "Descriere maxim 1000 caractere")
    .optional(),
  clasificareCod: (schema) => schema
    .min(1, "Clasificare obligatorie"),
  gestiuneId: (schema) => schema
    .min(1, "Gestiune obligatorie"),
  valoareInitiala: (schema) => schema
    .min(1, "Valoare initiala obligatorie"),
  valoareInventar: (schema) => schema
    .min(1, "Valoare inventar obligatorie"),
  valoareRamasa: (schema) => schema
    .min(1, "Valoare ramasa obligatorie"),
  durataNormala: (schema) => schema
    .min(1, "Durata normala obligatorie"),
  observatii: (schema) => schema
    .max(1000, "Observatii maxim 1000 caractere")
    .optional(),
  // Date fields - coerce string to Date
  dataAchizitie: () => dateStringToDate,
  dataIncepereAmortizare: () => dateStringToDate.optional(),
  dataFinalizareAmortizare: () => dateStringToDate.optional(),
  dataIesire: () => dateStringToDate.optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  valoareAmortizata: true,  // Computed
  durataRamasa: true,       // Computed
  cotaAmortizareLunara: true, // Computed
});

export type InsertMijlocFix = z.infer<typeof insertMijlocFixSchema>;

export const updateMijlocFixSchema = insertMijlocFixSchema.partial();
export type UpdateMijlocFix = z.infer<typeof updateMijlocFixSchema>;

// ============================================================================
// Dispozitive Medicale - Medical Device Extension (MDR EU 2017/745)
// ============================================================================

const dateStringOpt = () => z.string().transform((val) => new Date(val)).optional();

export const insertDispozitivMedicalSchema = createInsertSchema(dispozitiveMedicale, {
  mijlocFixId: (schema) => schema.min(1, "Mijloc fix obligatoriu"),
  producator: (schema) => schema.min(1, "Producator obligatoriu").max(300, "Maxim 300 caractere"),
  taraProducator: (schema) => schema.max(100).optional(),
  reprezentantAutorizatUE: (schema) => schema.max(300).optional(),
  importator: (schema) => schema.max(300).optional(),
  model: (schema) => schema.max(200).optional(),
  referintaCatalog: (schema) => schema.max(100).optional(),
  udiDI: (schema) => schema.max(100).optional(),
  udiPI: (schema) => schema.max(200).optional(),
  numarSerie: (schema) => schema.max(100).optional(),
  numarLot: (schema) => schema.max(100).optional(),
  numarEudamed: (schema) => schema.max(100).optional(),
  numarInregistrareANMDM: (schema) => schema.max(100).optional(),
  organismNotificat: (schema) => schema.max(100).optional(),
  numarCertificatCE: (schema) => schema.max(100).optional(),
  destinatieUtilizare: (schema) => schema.max(500).optional(),
  conditiiStocare: (schema) => schema.max(300).optional(),
  observatii: (schema) => schema.max(1000).optional(),
  dataFabricatie: dateStringOpt,
  dataExpirare: dateStringOpt,
  dataInregistrareANMDM: dateStringOpt,
  dataExpiraCertificatCE: dateStringOpt,
  dataMentenantaUrmatoare: dateStringOpt,
}).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertDispozitivMedical = z.infer<typeof insertDispozitivMedicalSchema>;

export const updateDispozitivMedicalSchema = insertDispozitivMedicalSchema.partial();
export type UpdateDispozitivMedical = z.infer<typeof updateDispozitivMedicalSchema>;

// ============================================================================
// Mentenanta Dispozitive - Maintenance Registry
// ============================================================================
export const insertMentenantaSchema = createInsertSchema(mentenantaDispozitive, {
  dispozitivMedicalId: (schema) => schema.min(1, "Dispozitiv medical obligatoriu"),
  efectuatDe: (schema) => schema.max(200).optional(),
  autorizatDe: (schema) => schema.max(200).optional(),
  descriere: (schema) => schema.max(1000).optional(),
  certificatCalibrarNumar: (schema) => schema.max(100).optional(),
  numarRaport: (schema) => schema.max(100).optional(),
  observatii: (schema) => schema.max(1000).optional(),
  dataPlanificata: dateStringOpt,
  dataEfectuata: dateStringOpt,
  dataExpiraCalibrare: dateStringOpt,
  dataMentenantaUrmatoare: dateStringOpt,
}).omit({ id: true, createdAt: true });

export type InsertMentenanta = z.infer<typeof insertMentenantaSchema>;

export const updateMentenantaSchema = insertMentenantaSchema.partial();
export type UpdateMentenanta = z.infer<typeof updateMentenantaSchema>;

// ============================================================================
// Incidente Adverse - Adverse Incident Registry (MDR Art. 87-92)
// ============================================================================
export const insertIncidentAdversSchema = createInsertSchema(incidenteAdverse, {
  dispozitivMedicalId: (schema) => schema.min(1, "Dispozitiv medical obligatoriu"),
  descriere: (schema) => schema.min(1, "Descriere obligatorie").max(2000),
  numarRaportANMDM: (schema) => schema.max(100).optional(),
  actiuneCorectiva: (schema) => schema.max(2000).optional(),
  observatii: (schema) => schema.max(1000).optional(),
  dataIncident: () => z.string().transform((val) => new Date(val)),
  dataSesizare: dateStringOpt,
  dataRaportANMDM: dateStringOpt,
  dataInchidere: dateStringOpt,
}).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertIncidentAdvers = z.infer<typeof insertIncidentAdversSchema>;

export const updateIncidentAdversSchema = insertIncidentAdversSchema.partial();
export type UpdateIncidentAdvers = z.infer<typeof updateIncidentAdversSchema>;
