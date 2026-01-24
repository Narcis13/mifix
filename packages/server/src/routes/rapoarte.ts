import { Hono } from "hono";
import { eq, and, between, desc, sql } from "drizzle-orm";
import { db } from "../db";
import {
  mijloaceFixe,
  clasificari,
  gestiuni,
  locuriUilizare,
  surseFinantare,
  conturi,
  tipuriDocument,
  tranzactii,
  amortizari,
} from "../db/schema";
import { Money } from "shared";
import type {
  ApiResponse,
  FisaMijlocFix,
  TranzactieRaport,
  AmortizareRaport,
  BalantaResponse,
  BalantaRow,
  JurnalResponse,
  JurnalActRow,
  SituatieAmortizareResponse,
  SituatieAmortizareRow,
} from "shared";

export const rapoarteRoutes = new Hono();

// ============================================================================
// GET /fisa/:id - RAP-01: Fisa Mijlocului Fix (Fixed Asset Card)
// ============================================================================
rapoarteRoutes.get("/fisa/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  try {
    // Fetch asset with all joins
    const [assetResult] = await db
      .select({
        mijlocFix: mijloaceFixe,
        clasificare: clasificari,
        gestiune: gestiuni,
        locFolosinta: locuriUilizare,
        sursaFinantare: surseFinantare,
        cont: conturi,
        tipDocument: tipuriDocument,
      })
      .from(mijloaceFixe)
      .leftJoin(clasificari, eq(mijloaceFixe.clasificareCod, clasificari.cod))
      .leftJoin(gestiuni, eq(mijloaceFixe.gestiuneId, gestiuni.id))
      .leftJoin(locuriUilizare, eq(mijloaceFixe.locFolosintaId, locuriUilizare.id))
      .leftJoin(surseFinantare, eq(mijloaceFixe.sursaFinantareId, surseFinantare.id))
      .leftJoin(conturi, eq(mijloaceFixe.contId, conturi.id))
      .leftJoin(tipuriDocument, eq(mijloaceFixe.tipDocumentId, tipuriDocument.id))
      .where(eq(mijloaceFixe.id, id));

    if (!assetResult) {
      return c.json<ApiResponse>({
        success: false,
        message: "Mijlocul fix nu a fost gasit",
      }, 404);
    }

    // Fetch transactions with gestiune/loc codes
    // We need to alias gestiuni table for source and destination
    const transactionsResult = await db
      .select({
        tranzactie: tranzactii,
        gestiuneSursa: {
          cod: sql<string>`gs.cod`.as("gestiune_sursa_cod"),
        },
        gestiuneDestinatie: {
          cod: sql<string>`gd.cod`.as("gestiune_destinatie_cod"),
        },
        locSursa: {
          cod: sql<string>`ls.cod`.as("loc_sursa_cod"),
        },
        locDestinatie: {
          cod: sql<string>`ld.cod`.as("loc_destinatie_cod"),
        },
      })
      .from(tranzactii)
      .leftJoin(sql`gestiuni gs`, sql`${tranzactii.gestiuneSursaId} = gs.id`)
      .leftJoin(sql`gestiuni gd`, sql`${tranzactii.gestiuneDestinatieId} = gd.id`)
      .leftJoin(sql`locuri_folosinta ls`, sql`${tranzactii.locFolosintaSursaId} = ls.id`)
      .leftJoin(sql`locuri_folosinta ld`, sql`${tranzactii.locFolosintaDestinatieId} = ld.id`)
      .where(eq(tranzactii.mijlocFixId, id))
      .orderBy(desc(tranzactii.dataOperare));

    const tranzactiiRaport: TranzactieRaport[] = transactionsResult.map((row) => ({
      id: row.tranzactie.id,
      tip: row.tranzactie.tip,
      dataOperare: row.tranzactie.dataOperare.toISOString().split("T")[0],
      documentNumar: row.tranzactie.documentNumar,
      gestiuneSursaCod: row.gestiuneSursa.cod ?? null,
      gestiuneDestinatieCod: row.gestiuneDestinatie.cod ?? null,
      locFolosintaSursaCod: row.locSursa.cod ?? null,
      locFolosintaDestinatieCod: row.locDestinatie.cod ?? null,
      valoareOperatie: row.tranzactie.valoareOperatie,
      descriere: row.tranzactie.descriere,
    }));

    // Fetch depreciation records
    const amortizariResult = await db
      .select()
      .from(amortizari)
      .where(eq(amortizari.mijlocFixId, id))
      .orderBy(desc(amortizari.an), desc(amortizari.luna));

    const amortizariRaport: AmortizareRaport[] = amortizariResult.map((row) => ({
      id: row.id,
      an: row.an,
      luna: row.luna,
      valoareLunara: row.valoareLunara,
      valoareCumulata: row.valoareCumulata,
      valoareRamasa: row.valoareRamasa,
    }));

    // Build response
    const mf = assetResult.mijlocFix;
    const data: FisaMijlocFix = {
      id: mf.id,
      numarInventar: mf.numarInventar,
      denumire: mf.denumire,
      descriere: mf.descriere,

      clasificareCod: mf.clasificareCod,
      clasificareDenumire: assetResult.clasificare?.denumire ?? "",
      clasificareGrupa: assetResult.clasificare?.grupa ?? "",

      gestiuneCod: assetResult.gestiune?.cod ?? "",
      gestiuneDenumire: assetResult.gestiune?.denumire ?? "",
      locFolosintaCod: assetResult.locFolosinta?.cod ?? null,
      locFolosintaDenumire: assetResult.locFolosinta?.denumire ?? null,

      sursaFinantareCod: assetResult.sursaFinantare?.cod ?? null,
      sursaFinantareDenumire: assetResult.sursaFinantare?.denumire ?? null,
      contSimbol: assetResult.cont?.simbol ?? null,
      contDenumire: assetResult.cont?.denumire ?? null,

      dataAchizitie: mf.dataAchizitie.toISOString().split("T")[0],
      documentAchizitie: mf.documentAchizitie,
      tipDocumentCod: assetResult.tipDocument?.cod ?? null,
      tipDocumentDenumire: assetResult.tipDocument?.denumire ?? null,
      furnizor: mf.furnizor,

      valoareInitiala: mf.valoareInitiala,
      valoareInventar: mf.valoareInventar,
      valoareAmortizata: mf.valoareAmortizata,
      valoareRamasa: mf.valoareRamasa,

      durataNormala: mf.durataNormala,
      durataRamasa: mf.durataRamasa,
      cotaAmortizareLunara: mf.cotaAmortizareLunara,
      eAmortizabil: mf.eAmortizabil ?? true,
      dataIncepereAmortizare: mf.dataIncepereAmortizare?.toISOString().split("T")[0] ?? null,
      dataFinalizareAmortizare: mf.dataFinalizareAmortizare?.toISOString().split("T")[0] ?? null,

      stare: mf.stare,
      dataIesire: mf.dataIesire?.toISOString().split("T")[0] ?? null,
      motivIesire: mf.motivIesire,
      observatii: mf.observatii,

      tranzactii: tranzactiiRaport,
      amortizari: amortizariRaport,
    };

    return c.json<ApiResponse<FisaMijlocFix>>({ success: true, data });
  } catch (error) {
    console.error("Fisa Mijloc Fix error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea fisei mijlocului fix",
    }, 500);
  }
});

// ============================================================================
// GET /balanta - RAP-02: Balanta de Verificare (Trial Balance)
// ============================================================================
rapoarteRoutes.get("/balanta", async (c) => {
  const stare = c.req.query("stare") || "activ";
  const clasificareCod = c.req.query("clasificareCod");

  try {
    // Build conditions
    const conditions = [eq(mijloaceFixe.stare, stare as "activ" | "casare" | "declasare" | "transfer")];
    if (clasificareCod) {
      conditions.push(eq(mijloaceFixe.clasificareCod, clasificareCod));
    }

    // Group by gestiune with aggregates
    const result = await db
      .select({
        gestiuneId: gestiuni.id,
        gestiuneCod: gestiuni.cod,
        gestiuneDenumire: gestiuni.denumire,
        numarActive: sql<number>`count(*)`,
        valoareInventar: sql<string>`cast(sum(${mijloaceFixe.valoareInventar}) as decimal(15,2))`,
        valoareAmortizata: sql<string>`cast(sum(${mijloaceFixe.valoareAmortizata}) as decimal(15,2))`,
        valoareRamasa: sql<string>`cast(sum(${mijloaceFixe.valoareRamasa}) as decimal(15,2))`,
      })
      .from(mijloaceFixe)
      .innerJoin(gestiuni, eq(mijloaceFixe.gestiuneId, gestiuni.id))
      .where(and(...conditions))
      .groupBy(gestiuni.id, gestiuni.cod, gestiuni.denumire)
      .orderBy(gestiuni.cod);

    // Map rows
    const rows: BalantaRow[] = result.map((row) => ({
      gestiuneId: row.gestiuneId,
      gestiuneCod: row.gestiuneCod,
      gestiuneDenumire: row.gestiuneDenumire,
      numarActive: Number(row.numarActive),
      valoareInventar: row.valoareInventar ?? "0.00",
      valoareAmortizata: row.valoareAmortizata ?? "0.00",
      valoareRamasa: row.valoareRamasa ?? "0.00",
    }));

    // Calculate totals using Money class for precision
    let totalNumarActive = 0;
    let totalValoareInventar = Money.zero();
    let totalValoareAmortizata = Money.zero();
    let totalValoareRamasa = Money.zero();

    for (const row of rows) {
      totalNumarActive += row.numarActive;
      totalValoareInventar = totalValoareInventar.plus(Money.fromDb(row.valoareInventar));
      totalValoareAmortizata = totalValoareAmortizata.plus(Money.fromDb(row.valoareAmortizata));
      totalValoareRamasa = totalValoareRamasa.plus(Money.fromDb(row.valoareRamasa));
    }

    const data: BalantaResponse = {
      rows,
      totals: {
        numarActive: totalNumarActive,
        valoareInventar: totalValoareInventar.toDbString(),
        valoareAmortizata: totalValoareAmortizata.toDbString(),
        valoareRamasa: totalValoareRamasa.toDbString(),
      },
      filters: {
        stare,
        clasificareCod,
      },
    };

    return c.json<ApiResponse<BalantaResponse>>({ success: true, data });
  } catch (error) {
    console.error("Balanta de Verificare error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea balantei de verificare",
    }, 500);
  }
});

// ============================================================================
// GET /jurnal - RAP-03: Jurnal Acte Operate (Operations Journal)
// ============================================================================
rapoarteRoutes.get("/jurnal", async (c) => {
  const dataStart = c.req.query("dataStart");
  const dataEnd = c.req.query("dataEnd");
  const gestiuneIdParam = c.req.query("gestiuneId");
  const tip = c.req.query("tip");

  // Validate required parameters
  if (!dataStart || !dataEnd) {
    return c.json<ApiResponse>({
      success: false,
      message: "Parametrii dataStart si dataEnd sunt obligatorii",
    }, 400);
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dataStart) || !dateRegex.test(dataEnd)) {
    return c.json<ApiResponse>({
      success: false,
      message: "Format data invalid. Folositi YYYY-MM-DD",
    }, 400);
  }

  try {
    const gestiuneId = gestiuneIdParam ? parseInt(gestiuneIdParam) : undefined;

    // Build conditions
    const conditions = [
      between(tranzactii.dataOperare, new Date(dataStart), new Date(dataEnd)),
    ];

    // Filter by gestiune (either source or destination)
    if (gestiuneId) {
      conditions.push(
        sql`(${tranzactii.gestiuneSursaId} = ${gestiuneId} OR ${tranzactii.gestiuneDestinatieId} = ${gestiuneId})`
      );
    }

    if (tip) {
      conditions.push(eq(tranzactii.tip, tip as any));
    }

    // Query with joins
    const result = await db
      .select({
        tranzactie: tranzactii,
        numarInventar: mijloaceFixe.numarInventar,
        denumireMijlocFix: mijloaceFixe.denumire,
        gestiuneSursaCod: sql<string>`gs.cod`.as("gestiune_sursa_cod"),
        gestiuneDestinatieCod: sql<string>`gd.cod`.as("gestiune_destinatie_cod"),
      })
      .from(tranzactii)
      .innerJoin(mijloaceFixe, eq(tranzactii.mijlocFixId, mijloaceFixe.id))
      .leftJoin(sql`gestiuni gs`, sql`${tranzactii.gestiuneSursaId} = gs.id`)
      .leftJoin(sql`gestiuni gd`, sql`${tranzactii.gestiuneDestinatieId} = gd.id`)
      .where(and(...conditions))
      .orderBy(desc(tranzactii.dataOperare));

    const rows: JurnalActRow[] = result.map((row) => ({
      id: row.tranzactie.id,
      mijlocFixId: row.tranzactie.mijlocFixId,
      numarInventar: row.numarInventar,
      denumireMijlocFix: row.denumireMijlocFix,
      tip: row.tranzactie.tip,
      dataOperare: row.tranzactie.dataOperare.toISOString().split("T")[0],
      documentNumar: row.tranzactie.documentNumar,
      gestiuneSursaCod: row.gestiuneSursaCod ?? null,
      gestiuneDestinatieCod: row.gestiuneDestinatieCod ?? null,
      valoareOperatie: row.tranzactie.valoareOperatie,
      descriere: row.tranzactie.descriere,
    }));

    const data: JurnalResponse = {
      rows,
      totals: {
        numarOperatii: rows.length,
      },
      filters: {
        dataStart,
        dataEnd,
        gestiuneId,
        tip,
      },
    };

    return c.json<ApiResponse<JurnalResponse>>({ success: true, data });
  } catch (error) {
    console.error("Jurnal Acte Operate error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea jurnalului de acte",
    }, 500);
  }
});

// ============================================================================
// GET /amortizare - RAP-04: Situatie Amortizare Lunara (Monthly Depreciation)
// ============================================================================
rapoarteRoutes.get("/amortizare", async (c) => {
  const anParam = c.req.query("an");
  const lunaParam = c.req.query("luna");
  const gestiuneIdParam = c.req.query("gestiuneId");
  const clasificareCod = c.req.query("clasificareCod");

  // Validate required parameters
  if (!anParam || !lunaParam) {
    return c.json<ApiResponse>({
      success: false,
      message: "Parametrii an si luna sunt obligatorii",
    }, 400);
  }

  const an = parseInt(anParam);
  const luna = parseInt(lunaParam);

  if (isNaN(an) || isNaN(luna) || luna < 1 || luna > 12) {
    return c.json<ApiResponse>({
      success: false,
      message: "Valori invalide pentru an sau luna",
    }, 400);
  }

  try {
    const gestiuneId = gestiuneIdParam ? parseInt(gestiuneIdParam) : undefined;

    // Build conditions
    const conditions = [
      eq(amortizari.an, an),
      eq(amortizari.luna, luna),
    ];

    if (gestiuneId) {
      conditions.push(eq(mijloaceFixe.gestiuneId, gestiuneId));
    }

    if (clasificareCod) {
      conditions.push(eq(mijloaceFixe.clasificareCod, clasificareCod));
    }

    // Query with joins
    const result = await db
      .select({
        amortizare: amortizari,
        mijlocFixId: mijloaceFixe.id,
        numarInventar: mijloaceFixe.numarInventar,
        denumire: mijloaceFixe.denumire,
        gestiuneCod: gestiuni.cod,
        clasificareCod: mijloaceFixe.clasificareCod,
      })
      .from(amortizari)
      .innerJoin(mijloaceFixe, eq(amortizari.mijlocFixId, mijloaceFixe.id))
      .innerJoin(gestiuni, eq(mijloaceFixe.gestiuneId, gestiuni.id))
      .where(and(...conditions))
      .orderBy(gestiuni.cod, mijloaceFixe.numarInventar);

    const rows: SituatieAmortizareRow[] = result.map((row) => ({
      mijlocFixId: row.mijlocFixId,
      numarInventar: row.numarInventar,
      denumire: row.denumire,
      gestiuneCod: row.gestiuneCod,
      clasificareCod: row.clasificareCod,
      valoareInventar: row.amortizare.valoareInventar,
      valoareLunara: row.amortizare.valoareLunara,
      valoareCumulata: row.amortizare.valoareCumulata,
      valoareRamasa: row.amortizare.valoareRamasa,
    }));

    // Calculate totals using Money class
    let totalValoareInventar = Money.zero();
    let totalValoareLunara = Money.zero();
    let totalValoareCumulata = Money.zero();
    let totalValoareRamasa = Money.zero();

    for (const row of rows) {
      totalValoareInventar = totalValoareInventar.plus(Money.fromDb(row.valoareInventar));
      totalValoareLunara = totalValoareLunara.plus(Money.fromDb(row.valoareLunara));
      totalValoareCumulata = totalValoareCumulata.plus(Money.fromDb(row.valoareCumulata));
      totalValoareRamasa = totalValoareRamasa.plus(Money.fromDb(row.valoareRamasa));
    }

    const data: SituatieAmortizareResponse = {
      rows,
      totals: {
        valoareInventar: totalValoareInventar.toDbString(),
        valoareLunara: totalValoareLunara.toDbString(),
        valoareCumulata: totalValoareCumulata.toDbString(),
        valoareRamasa: totalValoareRamasa.toDbString(),
      },
      period: {
        an,
        luna,
      },
      filters: {
        gestiuneId,
        clasificareCod,
      },
    };

    return c.json<ApiResponse<SituatieAmortizareResponse>>({ success: true, data });
  } catch (error) {
    console.error("Situatie Amortizare Lunara error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea situatiei de amortizare",
    }, 500);
  }
});
