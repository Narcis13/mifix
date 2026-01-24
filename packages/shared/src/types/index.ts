// ═══════════════════════════════════════════════════════════════
// ENUMERATIONS
// ═══════════════════════════════════════════════════════════════

export type MetodaAmortizare = "liniara" | "degresiva" | "accelerata";
export type StareMijlocFix =
  | "activ"
  | "conservare"
  | "casat"
  | "transferat"
  | "vandut";
export type TipTranzactie =
  | "intrare"
  | "transfer"
  | "casare"
  | "declasare"
  | "reevaluare"
  | "modernizare"
  | "iesire";
export type TipCont = "activ" | "pasiv" | "bifunctional";

// ═══════════════════════════════════════════════════════════════
// ENTITY INTERFACES
// Note: Monetary values are strings to preserve decimal precision
// ═══════════════════════════════════════════════════════════════

export interface Clasificare {
  cod: string;
  denumire: string;
  grupa: string;
  durataNormalaMin: number;
  durataNormalaMax: number;
  cotaAmortizare?: string; // decimal as string
}

export interface Gestiune {
  id: number;
  cod: string;
  denumire: string;
  responsabil?: string;
  activ: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocFolosinta {
  id: number;
  gestiuneId: number;
  cod: string;
  denumire: string;
  activ: boolean;
  // Populated relations
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

export interface TipDocument {
  id: number;
  cod: string;
  denumire: string;
  activ: boolean;
}

export interface MijlocFix {
  id: number;
  numarInventar: string;
  denumire: string;
  descriere?: string;

  // Classification
  clasificareCod: string;
  clasificare?: Clasificare;

  // Location
  gestiuneId: number;
  gestiune?: Gestiune;
  locFolosintaId?: number;
  locFolosinta?: LocFolosinta;

  // Financing
  sursaFinantareId?: number;
  sursaFinantare?: SursaFinantare;
  contId: number;
  cont?: Cont;

  // Document type
  tipDocumentId?: number;
  tipDocument?: TipDocument;

  // Values (strings for decimal precision)
  valoareInventar: string;
  valoareAmortizata: string;
  valoareRamasa: string;

  // Dates (ISO strings)
  dataAchizitie: string;
  dataPIF: string;
  dataStartAmortizare?: string;
  dataFinalAmortizare?: string;

  // Depreciation
  durataNormala: number; // months
  metodaAmortizare: MetodaAmortizare;
  amortizabil: boolean;
  eAmortizabil: boolean; // override for depreciation calculation

  // Documents
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
  documentNumar?: string;
  documentData?: string;
  gestiuneSursaId?: number;
  gestiuneDestinatieId?: number;
  locFolosintaSursaId?: number;
  locFolosintaDestinatieId?: number;
  // Populated relations
  gestiuneSursa?: Gestiune;
  gestiuneDestinatie?: Gestiune;
  locFolosintaSursa?: LocFolosinta;
  locFolosintaDestinatie?: LocFolosinta;
  // Values
  valoareOperatie?: string;
  valoareInainte?: string;
  valoareDupa?: string;
  descriere?: string;
  observatii?: string;
  createdAt: string;
}

export interface Amortizare {
  id: number;
  mijlocFixId: number;
  mijlocFix?: MijlocFix;
  an: number;
  luna: number;
  valoareLunara: string;
  valoareCumulata: string;
  valoareRamasa: string;
  valoareInventar: string;
  durataRamasa: number;
  calculat: boolean;
  dataCalcul?: string;
  createdAt: string;
}

// Batch generation response
export interface GenereazaAmortizareResult {
  processed: number;
  skipped: number;
  totalEligible: number;
}

// Monthly summary for AMO-05
export interface AmortizareSumar {
  an: number;
  luna: number;
  totalLunar: string;
  numarActive: number;
}

// Verification response
export interface AmortizareVerificare {
  luna: number;
  procesat: boolean;
  numarActive: number;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE TYPES
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
// HEALTH CHECK RESPONSE
// ═══════════════════════════════════════════════════════════════

export interface HealthResponse {
  status: string;
  timestamp: string;
}
