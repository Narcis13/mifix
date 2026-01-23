import { createInsertSchema } from "drizzle-zod";
import { gestiuni, locuriUilizare, surseFinantare, conturi } from "../db/schema";
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
