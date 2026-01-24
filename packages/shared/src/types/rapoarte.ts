// ═══════════════════════════════════════════════════════════════
// REPORT TYPES - Romanian Accounting Compliance Reports
// ═══════════════════════════════════════════════════════════════

// RAP-01: Fisa Mijlocului Fix (Fixed Asset Card)
export interface FisaMijlocFix {
  // Asset core data
  id: number;
  numarInventar: string;
  denumire: string;
  descriere: string | null;

  // Classification
  clasificareCod: string;
  clasificareDenumire: string;
  clasificareGrupa: string;

  // Location
  gestiuneCod: string;
  gestiuneDenumire: string;
  locFolosintaCod: string | null;
  locFolosintaDenumire: string | null;

  // Financial
  sursaFinantareCod: string | null;
  sursaFinantareDenumire: string | null;
  contSimbol: string | null;
  contDenumire: string | null;

  // Acquisition
  dataAchizitie: string;
  documentAchizitie: string | null;
  tipDocumentCod: string | null;
  tipDocumentDenumire: string | null;
  furnizor: string | null;

  // Values (as strings for decimal precision)
  valoareInitiala: string;
  valoareInventar: string;
  valoareAmortizata: string;
  valoareRamasa: string;

  // Depreciation
  durataNormala: number;
  durataRamasa: number;
  cotaAmortizareLunara: string;
  eAmortizabil: boolean;
  dataIncepereAmortizare: string | null;
  dataFinalizareAmortizare: string | null;

  // Status
  stare: string;
  dataIesire: string | null;
  motivIesire: string | null;
  observatii: string | null;

  // History
  tranzactii: TranzactieRaport[];
  amortizari: AmortizareRaport[];
}

export interface TranzactieRaport {
  id: number;
  tip: string;
  dataOperare: string;
  documentNumar: string | null;
  gestiuneSursaCod: string | null;
  gestiuneDestinatieCod: string | null;
  locFolosintaSursaCod: string | null;
  locFolosintaDestinatieCod: string | null;
  valoareOperatie: string | null;
  descriere: string | null;
}

export interface AmortizareRaport {
  id: number;
  an: number;
  luna: number;
  valoareLunara: string;
  valoareCumulata: string;
  valoareRamasa: string;
}

// RAP-02: Balanta de Verificare (Trial Balance)
export interface BalantaRow {
  gestiuneId: number;
  gestiuneCod: string;
  gestiuneDenumire: string;
  numarActive: number;
  valoareInventar: string;
  valoareAmortizata: string;
  valoareRamasa: string;
}

export interface BalantaResponse {
  rows: BalantaRow[];
  totals: {
    numarActive: number;
    valoareInventar: string;
    valoareAmortizata: string;
    valoareRamasa: string;
  };
  filters: {
    stare?: string;
    clasificareCod?: string;
  };
}

// RAP-03: Jurnal Acte Operate (Operations Journal)
export interface JurnalActRow {
  id: number;
  mijlocFixId: number;
  numarInventar: string;
  denumireMijlocFix: string;
  tip: string;
  dataOperare: string;
  documentNumar: string | null;
  gestiuneSursaCod: string | null;
  gestiuneDestinatieCod: string | null;
  valoareOperatie: string | null;
  descriere: string | null;
}

export interface JurnalResponse {
  rows: JurnalActRow[];
  totals: {
    numarOperatii: number;
  };
  filters: {
    dataStart?: string;
    dataEnd?: string;
    gestiuneId?: number;
    tip?: string;
  };
}

// RAP-04: Situatie Amortizare Lunara (Monthly Depreciation Report)
export interface SituatieAmortizareRow {
  mijlocFixId: number;
  numarInventar: string;
  denumire: string;
  gestiuneCod: string;
  clasificareCod: string;
  valoareInventar: string;
  valoareLunara: string;
  valoareCumulata: string;
  valoareRamasa: string;
}

export interface SituatieAmortizareResponse {
  rows: SituatieAmortizareRow[];
  totals: {
    valoareInventar: string;
    valoareLunara: string;
    valoareCumulata: string;
    valoareRamasa: string;
  };
  period: {
    an: number;
    luna: number;
  };
  filters: {
    gestiuneId?: number;
    clasificareCod?: string;
  };
}

// Filter parameters
export interface ReportFilters {
  dataStart?: string;
  dataEnd?: string;
  gestiuneId?: number;
  clasificareCod?: string;
  stare?: string;
}
