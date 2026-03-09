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
export type TipOperatie = "intrare" | "iesire" | "transfer" | "inventar" | "ajustare";
export type StareOperatie = "deschisa" | "finalizata" | "anulata";

// Dispozitive medicale (MDR EU 2017/745 + Legea 38/2023)
export type ClasaRiscDM = "I" | "IIa" | "IIb" | "III";
export type StareDM = "activ" | "mentenanta" | "retras" | "carantinat" | "defect" | "arhivat";
export type TipMentenantaDM = "preventiva" | "corectiva" | "calibrare" | "verificare" | "actualizare";
export type RezultatMentenanta = "ok" | "conditionat" | "defect" | "retras";
export type TipIncidentAdvers =
  | "incident_sever"
  | "incident_nonsever"
  | "near_miss"
  | "reclamatie_user"
  | "malfunctionare"
  | "alerta_teren";
export type StareIncident = "deschis" | "investigatie" | "raportat" | "inchis";

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
  capitol: boolean;
  codCapitol1?: number;
  codCapitol2?: number;
  activ: boolean;
}

export interface Cont {
  id: number;
  simbol: string;
  denumire: string;
  tip: TipCont;
  titlu: boolean;
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

export interface Provenienta {
  id: number;
  cod: string;
  denumire: string;
  activ: boolean;
}

export interface TipStoc {
  id: number;
  cod: string;
  denumire: string;
  activ: boolean;
}

export interface UnitateMasura {
  id: number;
  cod: string;
  denumire: string;
  activ: boolean;
}

export interface Operatiune {
  id: number;
  numarOperatie: number;
  an: number;
  dataOperare: string;
  tipOperatie: TipOperatie;
  stare: StareOperatie;
  tipDocumentId?: number;
  tipDocument?: TipDocument;
  numarDocument?: string;
  dataDocument?: string;
  descriere?: string;
  createdAt: string;
  // Populated relations
  tranzactii?: Tranzactie[];
  numarLinii?: number;
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
  durataNormala: number; // months total
  durataRamasa: number;  // months remaining
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
  operatiuneId?: number;
  operatiune?: Operatiune;
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
// DISPOZITIVE MEDICALE (MDR EU 2017/745 + Legea 38/2023 + ANMDM)
// ═══════════════════════════════════════════════════════════════

export interface DispozitivMedical {
  id: number;
  mijlocFixId: number;
  mijlocFix?: Pick<MijlocFix, "id" | "numarInventar" | "denumire">;

  // Clasificare risc (MDR Anexa VIII)
  clasaRisc: ClasaRiscDM;

  // Producător (MDR Art. 10)
  producator: string;
  taraProducator?: string;
  reprezentantAutorizatUE?: string; // obligatoriu pt non-UE
  importator?: string;

  // Identificare
  model?: string;
  referintaCatalog?: string;

  // UDI (MDR Art. 27)
  udiDI?: string;   // Device Identifier
  udiPI?: string;   // Production Identifier (lot+serie+expirare)

  // Identificatori fizici
  numarSerie?: string;
  numarLot?: string;
  dataFabricatie?: string;
  dataExpirare?: string;

  // Înregistrări
  numarEudamed?: string;            // EUDAMED (MDR Art. 29)
  numarInregistrareANMDM?: string;  // Registrul național ANMDM
  dataInregistrareANMDM?: string;

  // Marcare CE (MDR Art. 20)
  marcaCE: boolean;
  organismNotificat?: string;       // nr. Organism Notificat
  numarCertificatCE?: string;
  dataExpiraCertificatCE?: string;

  // Utilizare / stocare
  destinatieUtilizare?: string;
  conditiiStocare?: string;

  // Mentenanță planificată
  intervalMentenantaLuni?: number;
  dataMentenantaUrmatoare?: string;

  stareDM: StareDM;
  observatii?: string;
  createdAt: string;
  updatedAt: string;

  // Relații populate
  mentenante?: MentenantaDispozitiv[];
  incidente?: IncidentAdvers[];
}

export interface MentenantaDispozitiv {
  id: number;
  dispozitivMedicalId: number;
  dispozitivMedical?: Pick<DispozitivMedical, "id" | "mijlocFixId">;

  tipMentenanta: TipMentenantaDM;
  dataPlanificata?: string;
  dataEfectuata?: string;

  efectuatDe?: string;
  autorizatDe?: string;
  descriere?: string;
  rezultat: RezultatMentenanta;

  // Date calibrare
  certificatCalibrarNumar?: string;
  dataExpiraCalibrare?: string;

  numarRaport?: string;
  observatii?: string;
  dataMentenantaUrmatoare?: string;
  createdAt: string;
}

export interface IncidentAdvers {
  id: number;
  dispozitivMedicalId: number;
  dispozitivMedical?: Pick<DispozitivMedical, "id" | "mijlocFixId">;

  dataIncident: string;
  dataSesizare?: string;
  tipIncident: TipIncidentAdvers;
  descriere: string;

  // Raportare ANMDM (MDR Art. 87 — obligatorie pt incidente grave)
  raportatANMDM: boolean;
  numarRaportANMDM?: string;
  dataRaportANMDM?: string;

  actiuneCorectiva?: string;
  dataInchidere?: string;
  stareIncident: StareIncident;
  observatii?: string;
  createdAt: string;
  updatedAt: string;
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
