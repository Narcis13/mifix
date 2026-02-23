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

// ============================================================================
// Stergere Tranzactie Schema - OP-06
// Delete/reverse the most recent transaction for an asset
// ============================================================================
export const stergeTranzactieSchema = z.object({
  tranzactieId: z.number().min(1, "ID tranzactie obligatoriu"),
});

export type StergeTranzactieInput = z.infer<typeof stergeTranzactieSchema>;

// ============================================================================
// Transfer Cont Schema - OP-07
// Mass-transfer assets from one account to another (MOD_CONT equivalent)
// ============================================================================
export const transferContSchema = z.object({
  contSursaId: z.number().min(1, "Contul sursa obligatoriu"),
  contDestinatieId: z.number().min(1, "Contul destinatie obligatoriu"),
  numarInventar: z.string().optional(), // specific asset, or omit for all at source account
  dataOperare: z.string().min(1, "Data operarii obligatorie"),
  documentNumar: z.string().max(100).optional(),
  documentData: z.string().optional(),
  observatii: z.string().max(500).optional(),
});

export type TransferContInput = z.infer<typeof transferContSchema>;

// ============================================================================
// Stergere Mijloc Fix Schema - OP-08
// Delete unused asset (no transactions besides initial entry)
// ============================================================================
export const stergeMijlocFixSchema = z.object({
  mijlocFixId: z.number().min(1, "Mijloc fix obligatoriu"),
});

export type StergeMijlocFixInput = z.infer<typeof stergeMijlocFixSchema>;

// ============================================================================
// Transfer Gestiune in Masa Schema - OP-09
// Mass-transfer assets between gestiuni (MOD_GEST equivalent)
// ============================================================================
export const transferGestiuneMasaSchema = z.object({
  gestiuneSursaId: z.number().min(1, "Gestiunea sursa obligatorie"),
  gestiuneDestinatieId: z.number().min(1, "Gestiunea destinatie obligatorie"),
  numarInventar: z.string().optional(), // specific asset, or omit for all
  dataOperare: z.string().min(1, "Data operarii obligatorie"),
  documentNumar: z.string().max(100).optional(),
  documentData: z.string().optional(),
  observatii: z.string().max(500).optional(),
});

export type TransferGestiuneMasaInput = z.infer<typeof transferGestiuneMasaSchema>;

// ============================================================================
// Transfer Loc in Masa Schema - OP-10
// Mass-transfer assets between locations (MOD_DISP equivalent)
// ============================================================================
export const transferLocMasaSchema = z.object({
  gestiuneId: z.number().min(1, "Gestiunea obligatorie"),
  locFolosintaSursaId: z.number().min(1, "Locul sursa obligatoriu"),
  locFolosintaDestinatieId: z.number().min(1, "Locul destinatie obligatoriu"),
  numarInventar: z.string().optional(), // specific asset, or omit for all
  dataOperare: z.string().min(1, "Data operarii obligatorie"),
  documentNumar: z.string().max(100).optional(),
  documentData: z.string().optional(),
  observatii: z.string().max(500).optional(),
});

export type TransferLocMasaInput = z.infer<typeof transferLocMasaSchema>;
