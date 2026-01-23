import { z } from "zod";

// ============================================================================
// Transfer Gestiune Schema - OP-01
// Transfer asset between gestiuni (custodians)
// ============================================================================
export const transferGestiuneSchema = z.object({
  mijlocFixId: z.number().min(1, "Mijloc fix obligatoriu"),
  gestiuneDestinatieId: z.number().min(1, "Gestiune destinatie obligatorie"),
  locFolosintaDestinatieId: z.number().nullable().optional(),
  dataOperare: z.string().min(1, "Data operarii obligatorie"),
  documentNumar: z.string().max(100, "Numar document maxim 100 caractere").optional(),
  documentData: z.string().optional(),
  observatii: z.string().max(500, "Observatii maxim 500 caractere").optional(),
});

export type TransferGestiuneInput = z.infer<typeof transferGestiuneSchema>;

// ============================================================================
// Transfer Loc Schema - OP-02
// Transfer asset between locations within same gestiune
// ============================================================================
export const transferLocSchema = z.object({
  mijlocFixId: z.number().min(1, "Mijloc fix obligatoriu"),
  locFolosintaDestinatieId: z.number().min(1, "Loc folosinta destinatie obligatoriu"),
  dataOperare: z.string().min(1, "Data operarii obligatorie"),
  documentNumar: z.string().max(100, "Numar document maxim 100 caractere").optional(),
  documentData: z.string().optional(),
  observatii: z.string().max(500, "Observatii maxim 500 caractere").optional(),
});

export type TransferLocInput = z.infer<typeof transferLocSchema>;

// ============================================================================
// Casare Schema - OP-03
// Dispose of asset (end of lifecycle)
// ============================================================================
export const casareSchema = z.object({
  mijlocFixId: z.number().min(1, "Mijloc fix obligatoriu"),
  dataOperare: z.string().min(1, "Data operarii obligatorie"),
  motivCasare: z.string().min(1, "Motivul casarii obligatoriu").max(500, "Motivul casarii maxim 500 caractere"),
  documentNumar: z.string().max(100, "Numar document maxim 100 caractere").optional(),
  documentData: z.string().optional(),
  observatii: z.string().max(500, "Observatii maxim 500 caractere").optional(),
});

export type CasareInput = z.infer<typeof casareSchema>;

// ============================================================================
// Declasare Schema - OP-04
// Reduce asset value (partial write-off)
// ============================================================================
export const declasareSchema = z.object({
  mijlocFixId: z.number().min(1, "Mijloc fix obligatoriu"),
  valoareReducere: z.string().min(1, "Valoarea reducerii obligatorie"),
  dataOperare: z.string().min(1, "Data operarii obligatorie"),
  motivDeclasare: z.string().min(1, "Motivul declasarii obligatoriu").max(500, "Motivul declasarii maxim 500 caractere"),
  documentNumar: z.string().max(100, "Numar document maxim 100 caractere").optional(),
  documentData: z.string().optional(),
  observatii: z.string().max(500, "Observatii maxim 500 caractere").optional(),
});

export type DeclasareInput = z.infer<typeof declasareSchema>;
