import { createInsertSchema } from "drizzle-zod";
import { gestiuni, locuriUilizare, surseFinantare, conturi, tipuriDocument, mijloaceFixe } from "../db/schema";
import type { z } from "zod";

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
// Mijloace Fixe - Fixed Assets
// ============================================================================
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
