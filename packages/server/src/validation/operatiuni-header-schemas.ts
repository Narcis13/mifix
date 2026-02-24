import { z } from "zod";

// ============================================================================
// Create Operatiune (header) Schema
// ============================================================================
export const createOperatiuneSchema = z.object({
  tipOperatie: z.enum(["intrare", "iesire", "transfer", "inventar", "ajustare"]),
  dataOperare: z.string().min(1, "Data operarii obligatorie"),
  tipDocumentId: z.number().optional(),
  numarDocument: z.string().max(100).optional(),
  dataDocument: z.string().optional(),
  descriere: z.string().max(500).optional(),
});

export type CreateOperatiuneInput = z.infer<typeof createOperatiuneSchema>;

// ============================================================================
// Finalizare Operatiune Schema
// ============================================================================
export const finalizeOperatiuneSchema = z.object({
  operatiuneId: z.number().min(1, "Operatiune obligatorie"),
});

export type FinalizeOperatiuneInput = z.infer<typeof finalizeOperatiuneSchema>;

// ============================================================================
// Anulare Operatiune Schema
// ============================================================================
export const anuleazaOperatiuneSchema = z.object({
  motiv: z.string().min(1, "Motivul anularii obligatoriu").max(500),
});

export type AnuleazaOperatiuneInput = z.infer<typeof anuleazaOperatiuneSchema>;

// ============================================================================
// Add Linie Intrare Schema (B.1 - create new MF via operatiune)
// ============================================================================
export const addLinieIntrareSchema = z.object({
  numarInventar: z.string().min(1, "Numar inventar obligatoriu").max(50),
  denumire: z.string().min(1, "Denumire obligatorie").max(255),
  clasificareCod: z.string().min(1, "Clasificare obligatorie"),
  gestiuneId: z.number().min(1, "Gestiune obligatorie"),
  locFolosintaId: z.number().optional(),
  sursaFinantareId: z.number().optional(),
  contId: z.number().min(1, "Cont obligatoriu"),
  provenientaId: z.number().optional(),
  tipStocId: z.number().optional(),
  unitateMasuraId: z.number().optional(),
  valoareInventar: z.string().min(1, "Valoare inventar obligatorie"),
  durataNormala: z.number().min(1, "Durata normala obligatorie"),
  eAmortizabil: z.boolean().default(true),
  descriere: z.string().max(500).optional(),
});

export type AddLinieIntrareInput = z.infer<typeof addLinieIntrareSchema>;

// ============================================================================
// Add Linie Iesire Schema (B.2 - casare/declasare via operatiune)
// ============================================================================
export const addLinieIesireSchema = z.object({
  mijlocFixId: z.number().min(1, "Mijloc fix obligatoriu"),
  tipIesire: z.enum(["casare", "declasare", "iesire"]),
  valoareOperatie: z.string().optional(),
  motiv: z.string().min(1, "Motivul obligatoriu").max(500),
  observatii: z.string().max(500).optional(),
});

export type AddLinieIesireInput = z.infer<typeof addLinieIesireSchema>;

// ============================================================================
// Add Linie Transfer Schema (B.3 - transfer via operatiune)
// ============================================================================
export const addLinieTransferSchema = z.object({
  mijlocFixId: z.number().min(1, "Mijloc fix obligatoriu"),
  gestiuneDestinatieId: z.number().optional(),
  locFolosintaDestinatieId: z.number().optional(),
  contDestinatieId: z.number().optional(),
  observatii: z.string().max(500).optional(),
});
