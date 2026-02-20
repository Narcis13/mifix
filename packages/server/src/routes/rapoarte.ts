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
  operatiuni,
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
  BalantaAnaliticaResponse,
  BalantaAnaliticaRow,
  CentralizatorActResponse,
  CentralizatorActRow,
  ListaInventariereResponse,
  ListaInventariereRow,
  RaportActResponse,
  RaportActTranzactieRow,
  SituatieObiectResponse,
  SituatieObiectRow,
  ListaInventariereGoalaResponse,
  ListaInventariereGoalaRow,
  LocuriObiectResponse,
  LocuriObiectRow,
  CorespMaterialContResponse,
  CorespMaterialContRow,
  ListaMaterialeResponse,
  ListaMaterialeRow,
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

// ============================================================================
// GET /balanta-analitica - RAP-05: Balanta Analitica (Per-Item Analytical Balance)
// Legacy equivalent: BAL_MIJL.PRG
// Shows opening balance, entries, exits, and closing balance per asset
// ============================================================================
rapoarteRoutes.get("/balanta-analitica", async (c) => {
  const dataStart = c.req.query("dataStart");
  const dataEnd = c.req.query("dataEnd");
  const gestiuneIdParam = c.req.query("gestiuneId");
  const contIdParam = c.req.query("contId");
  const stare = c.req.query("stare");

  // Validate required parameters
  if (!dataStart || !dataEnd) {
    return c.json<ApiResponse>({
      success: false,
      message: "Parametrii dataStart si dataEnd sunt obligatorii",
    }, 400);
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dataStart) || !dateRegex.test(dataEnd)) {
    return c.json<ApiResponse>({
      success: false,
      message: "Format data invalid. Folositi YYYY-MM-DD",
    }, 400);
  }

  try {
    const gestiuneId = gestiuneIdParam ? parseInt(gestiuneIdParam) : undefined;
    const contId = contIdParam ? parseInt(contIdParam) : undefined;

    // Validate stare against known enum values
    const validStari = ["activ", "casare", "declasare", "transfer"];
    if (stare && !validStari.includes(stare)) {
      return c.json<ApiResponse>({
        success: false,
        message: "Stare invalida",
      }, 400);
    }

    // Build dynamic filter conditions (using raw aliases since query uses table aliases)
    const extraConditions: ReturnType<typeof sql>[] = [];
    if (gestiuneId) {
      extraConditions.push(sql`AND mf.gestiune_id = ${gestiuneId}`);
    }
    if (contId) {
      extraConditions.push(sql`AND mf.cont_id = ${contId}`);
    }
    if (stare) {
      extraConditions.push(sql`AND mf.stare = ${stare}`);
    }

    // Combine extra conditions into a single sql fragment
    const extraWhere = extraConditions.length > 0
      ? extraConditions.reduce((acc, cond) => sql`${acc} ${cond}`)
      : sql``;

    // Single query: compute opening balance, period debits/credits per asset
    // Debit types (value in): intrare, modernizare, reevaluare
    // Credit types (value out): casare, declasare, iesire
    // Neutral (no value change): transfer
    const result = await db.execute(sql`
      SELECT
        mf.id as mijloc_fix_id,
        mf.numar_inventar,
        mf.denumire,
        mf.stare,
        g.cod as gestiune_cod,
        g.denumire as gestiune_denumire,
        c.simbol as cont_simbol,
        CAST(COALESCE(SUM(CASE
          WHEN t.data_operare < ${dataStart} AND t.tip IN ('intrare', 'modernizare', 'reevaluare') THEN COALESCE(t.valoare_operatie, 0)
          WHEN t.data_operare < ${dataStart} AND t.tip IN ('casare', 'declasare', 'iesire') THEN -COALESCE(t.valoare_operatie, 0)
          ELSE 0
        END), 0) AS DECIMAL(15,2)) as sold_initial,
        CAST(COALESCE(SUM(CASE
          WHEN t.data_operare >= ${dataStart} AND t.data_operare <= ${dataEnd} AND t.tip IN ('intrare', 'modernizare', 'reevaluare') THEN COALESCE(t.valoare_operatie, 0)
          ELSE 0
        END), 0) AS DECIMAL(15,2)) as debit,
        CAST(COALESCE(SUM(CASE
          WHEN t.data_operare >= ${dataStart} AND t.data_operare <= ${dataEnd} AND t.tip IN ('casare', 'declasare', 'iesire') THEN COALESCE(t.valoare_operatie, 0)
          ELSE 0
        END), 0) AS DECIMAL(15,2)) as credit
      FROM mijloace_fixe mf
      INNER JOIN tranzactii t ON t.mijloc_fix_id = mf.id
      LEFT JOIN gestiuni g ON mf.gestiune_id = g.id
      LEFT JOIN conturi c ON mf.cont_id = c.id
      WHERE t.data_operare <= ${dataEnd}
        ${extraWhere}
      GROUP BY mf.id, mf.numar_inventar, mf.denumire, mf.stare,
               g.cod, g.denumire, c.simbol
      HAVING sold_initial != 0 OR debit != 0 OR credit != 0
      ORDER BY g.cod, mf.numar_inventar
    `);

    const resultRows = result[0] as any[];

    // Map to typed rows and compute totals
    let totalSoldInitial = Money.zero();
    let totalDebit = Money.zero();
    let totalCredit = Money.zero();

    const rows: BalantaAnaliticaRow[] = resultRows.map((row: any) => {
      const soldInitial = String(row.sold_initial ?? "0.00");
      const debit = String(row.debit ?? "0.00");
      const credit = String(row.credit ?? "0.00");

      const soldInitialMoney = Money.fromDb(soldInitial);
      const debitMoney = Money.fromDb(debit);
      const creditMoney = Money.fromDb(credit);
      const soldFinal = soldInitialMoney.plus(debitMoney).minus(creditMoney);

      totalSoldInitial = totalSoldInitial.plus(soldInitialMoney);
      totalDebit = totalDebit.plus(debitMoney);
      totalCredit = totalCredit.plus(creditMoney);

      return {
        mijlocFixId: row.mijloc_fix_id,
        numarInventar: row.numar_inventar,
        denumire: row.denumire,
        stare: row.stare,
        gestiuneCod: row.gestiune_cod ?? "",
        gestiuneDenumire: row.gestiune_denumire ?? "",
        contSimbol: row.cont_simbol ?? null,
        soldInitial: soldInitialMoney.toDbString(),
        debit: debitMoney.toDbString(),
        credit: creditMoney.toDbString(),
        soldFinal: soldFinal.toDbString(),
      };
    });

    const totalSoldFinal = totalSoldInitial.plus(totalDebit).minus(totalCredit);

    const data: BalantaAnaliticaResponse = {
      rows,
      totals: {
        soldInitial: totalSoldInitial.toDbString(),
        debit: totalDebit.toDbString(),
        credit: totalCredit.toDbString(),
        soldFinal: totalSoldFinal.toDbString(),
      },
      filters: {
        dataStart,
        dataEnd,
        gestiuneId,
        contId,
        stare,
      },
    };

    return c.json<ApiResponse<BalantaAnaliticaResponse>>({ success: true, data });
  } catch (error) {
    console.error("Balanta Analitica error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea balantei analitice",
    }, 500);
  }
});

// ============================================================================
// GET /centralizator - RAP-06: Centralizator Acte (Operations Centralizer)
// Legacy equivalent: CENTRAL.PRG
// Aggregated debit/credit totals per operation/document in a date range
// ============================================================================
rapoarteRoutes.get("/centralizator", async (c) => {
  const dataStart = c.req.query("dataStart");
  const dataEnd = c.req.query("dataEnd");
  const gestiuneIdParam = c.req.query("gestiuneId");
  const contIdParam = c.req.query("contId");

  if (!dataStart || !dataEnd) {
    return c.json<ApiResponse>({
      success: false,
      message: "Parametrii dataStart si dataEnd sunt obligatorii",
    }, 400);
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dataStart) || !dateRegex.test(dataEnd)) {
    return c.json<ApiResponse>({
      success: false,
      message: "Format data invalid. Folositi YYYY-MM-DD",
    }, 400);
  }

  try {
    const gestiuneId = gestiuneIdParam ? parseInt(gestiuneIdParam) : undefined;
    const contId = contIdParam ? parseInt(contIdParam) : undefined;

    // Build optional filters on the asset (via transaction join)
    const extraConditions: ReturnType<typeof sql>[] = [];
    if (gestiuneId) {
      extraConditions.push(sql`AND mf.gestiune_id = ${gestiuneId}`);
    }
    if (contId) {
      extraConditions.push(sql`AND mf.cont_id = ${contId}`);
    }
    const extraWhere = extraConditions.length > 0
      ? extraConditions.reduce((acc, cond) => sql`${acc} ${cond}`)
      : sql``;

    // Group transactions by operation, computing debit/credit totals
    const result = await db.execute(sql`
      SELECT
        op.id as operatiune_id,
        op.numar_operatie,
        op.an,
        op.data_operare,
        td.denumire as tip_document_denumire,
        op.numar_document,
        op.descriere,
        CAST(COALESCE(SUM(CASE
          WHEN t.tip IN ('intrare', 'modernizare', 'reevaluare') THEN COALESCE(t.valoare_operatie, 0)
          ELSE 0
        END), 0) AS DECIMAL(15,2)) as valoare_debit,
        CAST(COALESCE(SUM(CASE
          WHEN t.tip IN ('casare', 'declasare', 'iesire') THEN COALESCE(t.valoare_operatie, 0)
          ELSE 0
        END), 0) AS DECIMAL(15,2)) as valoare_credit
      FROM operatiuni op
      LEFT JOIN tipuri_document td ON op.tip_document_id = td.id
      INNER JOIN tranzactii t ON t.operatiune_id = op.id
      LEFT JOIN mijloace_fixe mf ON t.mijloc_fix_id = mf.id
      WHERE op.data_operare >= ${dataStart}
        AND op.data_operare <= ${dataEnd}
        ${extraWhere}
      GROUP BY op.id, op.numar_operatie, op.an, op.data_operare,
               td.denumire, op.numar_document, op.descriere
      HAVING valoare_debit != 0 OR valoare_credit != 0
      ORDER BY op.data_operare, op.numar_operatie
    `);

    const resultRows = result[0] as any[];

    let totalDebit = Money.zero();
    let totalCredit = Money.zero();

    const rows: CentralizatorActRow[] = resultRows.map((row: any) => {
      const debit = String(row.valoare_debit ?? "0.00");
      const credit = String(row.valoare_credit ?? "0.00");

      const debitMoney = Money.fromDb(debit);
      const creditMoney = Money.fromDb(credit);

      totalDebit = totalDebit.plus(debitMoney);
      totalCredit = totalCredit.plus(creditMoney);

      return {
        operatiuneId: row.operatiune_id,
        numarOperatie: row.numar_operatie,
        an: row.an,
        dataOperare: row.data_operare,
        tipDocumentDenumire: row.tip_document_denumire ?? null,
        numarDocument: row.numar_document ?? null,
        descriere: row.descriere ?? null,
        valoareDebit: debitMoney.toDbString(),
        valoareCredit: creditMoney.toDbString(),
      };
    });

    const data: CentralizatorActResponse = {
      rows,
      totals: {
        valoareDebit: totalDebit.toDbString(),
        valoareCredit: totalCredit.toDbString(),
      },
      filters: {
        dataStart,
        dataEnd,
        gestiuneId,
        contId,
      },
    };

    return c.json<ApiResponse<CentralizatorActResponse>>({ success: true, data });
  } catch (error) {
    console.error("Centralizator Acte error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea centralizatorului",
    }, 500);
  }
});

// ============================================================================
// GET /lista-inventariere - RAP-07: Lista de Inventariere (Inventory List)
// Legacy equivalent: GEN_INVE.PRG
// Snapshot of all assets at a specific date with book values
// ============================================================================
rapoarteRoutes.get("/lista-inventariere", async (c) => {
  const dataInventar = c.req.query("dataInventar");
  const gestiuneIdParam = c.req.query("gestiuneId");
  const contIdParam = c.req.query("contId");
  const stare = c.req.query("stare");

  if (!dataInventar) {
    return c.json<ApiResponse>({
      success: false,
      message: "Parametrul dataInventar este obligatoriu",
    }, 400);
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dataInventar)) {
    return c.json<ApiResponse>({
      success: false,
      message: "Format data invalid. Folositi YYYY-MM-DD",
    }, 400);
  }

  try {
    const gestiuneId = gestiuneIdParam ? parseInt(gestiuneIdParam) : undefined;
    const contId = contIdParam ? parseInt(contIdParam) : undefined;

    const validStari = ["activ", "casare", "declasare", "transfer"];
    if (stare && !validStari.includes(stare)) {
      return c.json<ApiResponse>({
        success: false,
        message: "Stare invalida",
      }, 400);
    }

    // Build optional filters
    const extraConditions: ReturnType<typeof sql>[] = [];
    if (gestiuneId) {
      extraConditions.push(sql`AND mf.gestiune_id = ${gestiuneId}`);
    }
    if (contId) {
      extraConditions.push(sql`AND mf.cont_id = ${contId}`);
    }
    if (stare) {
      extraConditions.push(sql`AND mf.stare = ${stare}`);
    }
    const extraWhere = extraConditions.length > 0
      ? extraConditions.reduce((acc, cond) => sql`${acc} ${cond}`)
      : sql``;

    // Compute book value at inventory date for each asset:
    // value = sum(debit transactions up to date) - sum(credit transactions up to date)
    // Only include assets that have positive book value at the inventory date
    const result = await db.execute(sql`
      SELECT
        mf.id as mijloc_fix_id,
        mf.numar_inventar,
        mf.denumire,
        mf.stare,
        mf.data_achizitie,
        g.cod as gestiune_cod,
        g.denumire as gestiune_denumire,
        lf.cod as loc_folosinta_cod,
        lf.denumire as loc_folosinta_denumire,
        c.simbol as cont_simbol,
        sf.cod as sursa_finantare_cod,
        CAST(COALESCE(SUM(CASE
          WHEN t.tip IN ('intrare', 'modernizare', 'reevaluare') THEN COALESCE(t.valoare_operatie, 0)
          WHEN t.tip IN ('casare', 'declasare', 'iesire') THEN -COALESCE(t.valoare_operatie, 0)
          ELSE 0
        END), 0) AS DECIMAL(15,2)) as valoare_inventar
      FROM mijloace_fixe mf
      INNER JOIN tranzactii t ON t.mijloc_fix_id = mf.id
      LEFT JOIN gestiuni g ON mf.gestiune_id = g.id
      LEFT JOIN locuri_folosinta lf ON mf.loc_folosinta_id = lf.id
      LEFT JOIN conturi c ON mf.cont_id = c.id
      LEFT JOIN surse_finantare sf ON mf.sursa_finantare_id = sf.id
      WHERE t.data_operare <= ${dataInventar}
        ${extraWhere}
      GROUP BY mf.id, mf.numar_inventar, mf.denumire, mf.stare, mf.data_achizitie,
               g.cod, g.denumire, lf.cod, lf.denumire, c.simbol, sf.cod
      HAVING valoare_inventar > 0
      ORDER BY g.cod, mf.numar_inventar
    `);

    const resultRows = result[0] as any[];

    let totalValoareInventar = Money.zero();

    const rows: ListaInventariereRow[] = resultRows.map((row: any) => {
      const valoare = String(row.valoare_inventar ?? "0.00");
      const valoareMoney = Money.fromDb(valoare);
      totalValoareInventar = totalValoareInventar.plus(valoareMoney);

      return {
        mijlocFixId: row.mijloc_fix_id,
        numarInventar: row.numar_inventar,
        denumire: row.denumire,
        stare: row.stare,
        gestiuneCod: row.gestiune_cod ?? "",
        gestiuneDenumire: row.gestiune_denumire ?? "",
        locFolosintaCod: row.loc_folosinta_cod ?? null,
        locFolosintaDenumire: row.loc_folosinta_denumire ?? null,
        contSimbol: row.cont_simbol ?? null,
        sursaFinantareCod: row.sursa_finantare_cod ?? null,
        dataAchizitie: row.data_achizitie
          ? new Date(row.data_achizitie).toISOString().split("T")[0]
          : "",
        valoareInventar: valoareMoney.toDbString(),
      };
    });

    const data: ListaInventariereResponse = {
      rows,
      totals: {
        numarActive: rows.length,
        valoareInventar: totalValoareInventar.toDbString(),
      },
      filters: {
        dataInventar,
        gestiuneId,
        contId,
        stare,
      },
    };

    return c.json<ApiResponse<ListaInventariereResponse>>({ success: true, data });
  } catch (error) {
    console.error("Lista de Inventariere error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea listei de inventariere",
    }, 500);
  }
});

// ============================================================================
// GET /act/:operatiuneId - RAP-08: Raport Act (Single Operation Detail)
// Legacy equivalent: LIS_ACTE.PRG
// All transaction lines for a specific operation with full context
// ============================================================================
rapoarteRoutes.get("/act/:operatiuneId", async (c) => {
  const operatiuneId = parseInt(c.req.param("operatiuneId"), 10);

  if (isNaN(operatiuneId)) {
    return c.json<ApiResponse>({ success: false, message: "ID operatiune invalid" }, 400);
  }

  try {
    // Fetch operation header
    const [opResult] = await db
      .select({
        id: operatiuni.id,
        numarOperatie: operatiuni.numarOperatie,
        an: operatiuni.an,
        dataOperare: operatiuni.dataOperare,
        tipDocumentDenumire: tipuriDocument.denumire,
        numarDocument: operatiuni.numarDocument,
        dataDocument: operatiuni.dataDocument,
        descriere: operatiuni.descriere,
      })
      .from(operatiuni)
      .leftJoin(tipuriDocument, eq(operatiuni.tipDocumentId, tipuriDocument.id))
      .where(eq(operatiuni.id, operatiuneId));

    if (!opResult) {
      return c.json<ApiResponse>({
        success: false,
        message: "Operatiunea nu a fost gasita",
      }, 404);
    }

    // Fetch all transactions for this operation with full joins
    const result = await db.execute(sql`
      SELECT
        t.id as tranzactie_id,
        t.mijloc_fix_id,
        mf.numar_inventar,
        mf.denumire as denumire_mijloc_fix,
        t.tip,
        CAST(COALESCE(t.valoare_operatie, 0) AS DECIMAL(15,2)) as valoare_operatie,
        gs.cod as gestiune_sursa_cod,
        gs.denumire as gestiune_sursa_denumire,
        gd.cod as gestiune_destinatie_cod,
        gd.denumire as gestiune_destinatie_denumire,
        ls.cod as loc_sursa_cod,
        ld.cod as loc_destinatie_cod,
        c.simbol as cont_simbol,
        c.denumire as cont_denumire,
        t.descriere
      FROM tranzactii t
      INNER JOIN mijloace_fixe mf ON t.mijloc_fix_id = mf.id
      LEFT JOIN gestiuni gs ON t.gestiune_sursa_id = gs.id
      LEFT JOIN gestiuni gd ON t.gestiune_destinatie_id = gd.id
      LEFT JOIN locuri_folosinta ls ON t.loc_folosinta_sursa_id = ls.id
      LEFT JOIN locuri_folosinta ld ON t.loc_folosinta_destinatie_id = ld.id
      LEFT JOIN conturi c ON mf.cont_id = c.id
      WHERE t.operatiune_id = ${operatiuneId}
      ORDER BY mf.numar_inventar
    `);

    const resultRows = result[0] as any[];

    let totalDebit = Money.zero();
    let totalCredit = Money.zero();

    const debitTypes = ["intrare", "modernizare", "reevaluare"];
    const creditTypes = ["casare", "declasare", "iesire"];

    const rows: RaportActTranzactieRow[] = resultRows.map((row: any) => {
      const valoare = String(row.valoare_operatie ?? "0.00");
      const valoareMoney = Money.fromDb(valoare);

      if (debitTypes.includes(row.tip)) {
        totalDebit = totalDebit.plus(valoareMoney);
      } else if (creditTypes.includes(row.tip)) {
        totalCredit = totalCredit.plus(valoareMoney);
      }

      return {
        tranzactieId: row.tranzactie_id,
        mijlocFixId: row.mijloc_fix_id,
        numarInventar: row.numar_inventar,
        denumireMijlocFix: row.denumire_mijloc_fix,
        tip: row.tip,
        valoareOperatie: valoareMoney.isZero() ? null : valoareMoney.toDbString(),
        gestiuneSursaCod: row.gestiune_sursa_cod ?? null,
        gestiuneSursaDenumire: row.gestiune_sursa_denumire ?? null,
        gestiuneDestinatieCod: row.gestiune_destinatie_cod ?? null,
        gestiuneDestinatieDenumire: row.gestiune_destinatie_denumire ?? null,
        locFolosintaSursaCod: row.loc_sursa_cod ?? null,
        locFolosintaDestinatieCod: row.loc_destinatie_cod ?? null,
        contSimbol: row.cont_simbol ?? null,
        contDenumire: row.cont_denumire ?? null,
        descriere: row.descriere ?? null,
      };
    });

    const data: RaportActResponse = {
      operatiune: {
        id: opResult.id,
        numarOperatie: opResult.numarOperatie,
        an: opResult.an,
        dataOperare: opResult.dataOperare.toISOString().split("T")[0],
        tipDocumentDenumire: opResult.tipDocumentDenumire ?? null,
        numarDocument: opResult.numarDocument ?? null,
        dataDocument: opResult.dataDocument?.toISOString().split("T")[0] ?? null,
        descriere: opResult.descriere ?? null,
      },
      rows,
      totals: {
        numarTranzactii: rows.length,
        valoareDebit: totalDebit.toDbString(),
        valoareCredit: totalCredit.toDbString(),
      },
    };

    return c.json<ApiResponse<RaportActResponse>>({ success: true, data });
  } catch (error) {
    console.error("Raport Act error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea raportului de act",
    }, 500);
  }
});

// ============================================================================
// GET /situatie-obiecte - RAP-09: Situatia Obiectelor de Inventar
// Legacy equivalent: SIT_OBIE.PRG
// Current snapshot of all assets with values and usage percentages
// ============================================================================
rapoarteRoutes.get("/situatie-obiecte", async (c) => {
  const gestiuneIdParam = c.req.query("gestiuneId");
  const contIdParam = c.req.query("contId");
  const stare = c.req.query("stare");
  const durataDepasita = c.req.query("durataDepasita"); // "true" for TERMENE mode

  try {
    const gestiuneId = gestiuneIdParam ? parseInt(gestiuneIdParam) : undefined;
    const contId = contIdParam ? parseInt(contIdParam) : undefined;

    const validStari = ["activ", "casare", "declasare", "transfer"];
    if (stare && !validStari.includes(stare)) {
      return c.json<ApiResponse>({ success: false, message: "Stare invalida" }, 400);
    }

    // Build optional filters
    const extraConditions: ReturnType<typeof sql>[] = [];
    if (gestiuneId) {
      extraConditions.push(sql`AND mf.gestiune_id = ${gestiuneId}`);
    }
    if (contId) {
      extraConditions.push(sql`AND mf.cont_id = ${contId}`);
    }
    if (stare) {
      extraConditions.push(sql`AND mf.stare = ${stare}`);
    }
    const extraWhere = extraConditions.length > 0
      ? extraConditions.reduce((acc, cond) => sql`${acc} ${cond}`)
      : sql``;

    const result = await db.execute(sql`
      SELECT
        mf.id as mijloc_fix_id,
        mf.numar_inventar,
        mf.denumire,
        mf.stare,
        mf.data_achizitie,
        mf.durata_normala,
        CAST(mf.valoare_inventar AS DECIMAL(15,2)) as valoare_inventar,
        CAST(mf.valoare_amortizata AS DECIMAL(15,2)) as valoare_amortizata,
        CAST(mf.valoare_ramasa AS DECIMAL(15,2)) as valoare_ramasa,
        g.cod as gestiune_cod,
        g.denumire as gestiune_denumire,
        lf.cod as loc_folosinta_cod,
        lf.denumire as loc_folosinta_denumire,
        c.simbol as cont_simbol,
        sf.cod as sursa_finantare_cod,
        p.cod as provenienta_cod
      FROM mijloace_fixe mf
      INNER JOIN gestiuni g ON mf.gestiune_id = g.id
      LEFT JOIN locuri_folosinta lf ON mf.loc_folosinta_id = lf.id
      LEFT JOIN conturi c ON mf.cont_id = c.id
      LEFT JOIN surse_finantare sf ON mf.sursa_finantare_id = sf.id
      LEFT JOIN provenienta p ON mf.provenienta_id = p.id
      WHERE mf.stare = 'activ'
        ${extraWhere}
      ORDER BY g.cod, mf.numar_inventar
    `);

    const resultRows = result[0] as any[];

    let totalValoareInventar = Money.zero();
    let totalValoareAmortizata = Money.zero();
    let totalValoareRamasa = Money.zero();

    const now = new Date();

    const allRows: SituatieObiectRow[] = resultRows.map((row: any) => {
      const valoareInventar = String(row.valoare_inventar ?? "0.00");
      const valoareAmortizata = String(row.valoare_amortizata ?? "0.00");
      const valoareRamasa = String(row.valoare_ramasa ?? "0.00");

      // Compute usage percentage: (days_since_acquisition / durata_normala_days) * 100
      const dataAchizitie = new Date(row.data_achizitie);
      const daysSinceAcquisition = Math.floor((now.getTime() - dataAchizitie.getTime()) / (1000 * 60 * 60 * 24));
      const durataNormalaDays = row.durata_normala * 30; // approximate months to days
      const procentFolosire = durataNormalaDays > 0
        ? Math.round((daysSinceAcquisition / durataNormalaDays) * 10000) / 100
        : 0;

      return {
        mijlocFixId: row.mijloc_fix_id,
        numarInventar: row.numar_inventar,
        denumire: row.denumire,
        stare: row.stare,
        gestiuneCod: row.gestiune_cod ?? "",
        gestiuneDenumire: row.gestiune_denumire ?? "",
        locFolosintaCod: row.loc_folosinta_cod ?? null,
        locFolosintaDenumire: row.loc_folosinta_denumire ?? null,
        contSimbol: row.cont_simbol ?? null,
        sursaFinantareCod: row.sursa_finantare_cod ?? null,
        provenientaCod: row.provenienta_cod ?? null,
        dataAchizitie: dataAchizitie.toISOString().split("T")[0],
        valoareInventar,
        valoareAmortizata,
        valoareRamasa,
        durataNormala: row.durata_normala,
        procentFolosire,
      };
    });

    // Filter for exceeded duration if requested (TERMENE mode)
    const rows = durataDepasita === "true"
      ? allRows.filter((r) => r.procentFolosire >= 100)
      : allRows;

    for (const row of rows) {
      totalValoareInventar = totalValoareInventar.plus(Money.fromDb(row.valoareInventar));
      totalValoareAmortizata = totalValoareAmortizata.plus(Money.fromDb(row.valoareAmortizata));
      totalValoareRamasa = totalValoareRamasa.plus(Money.fromDb(row.valoareRamasa));
    }

    const data: SituatieObiectResponse = {
      rows,
      totals: {
        numarActive: rows.length,
        valoareInventar: totalValoareInventar.toDbString(),
        valoareAmortizata: totalValoareAmortizata.toDbString(),
        valoareRamasa: totalValoareRamasa.toDbString(),
      },
      filters: {
        gestiuneId,
        contId,
        stare,
      },
    };

    return c.json<ApiResponse<SituatieObiectResponse>>({ success: true, data });
  } catch (error) {
    console.error("Situatie Obiecte error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea situatiei obiectelor",
    }, 500);
  }
});

// ============================================================================
// GET /lista-inventariere-goala - RAP-11: Lista Inventariere Goala
// Legacy equivalent: INV_GOL.PRG
// Empty inventory list (just item names for physical counting)
// ============================================================================
rapoarteRoutes.get("/lista-inventariere-goala", async (c) => {
  const gestiuneIdParam = c.req.query("gestiuneId");
  const contIdParam = c.req.query("contId");
  const stare = c.req.query("stare");

  try {
    const gestiuneId = gestiuneIdParam ? parseInt(gestiuneIdParam) : undefined;
    const contId = contIdParam ? parseInt(contIdParam) : undefined;

    const extraConditions: ReturnType<typeof sql>[] = [];
    if (gestiuneId) {
      extraConditions.push(sql`AND mf.gestiune_id = ${gestiuneId}`);
    }
    if (contId) {
      extraConditions.push(sql`AND mf.cont_id = ${contId}`);
    }
    if (stare) {
      extraConditions.push(sql`AND mf.stare = ${stare}`);
    }
    const extraWhere = extraConditions.length > 0
      ? extraConditions.reduce((acc, cond) => sql`${acc} ${cond}`)
      : sql``;

    const result = await db.execute(sql`
      SELECT
        mf.id as mijloc_fix_id,
        mf.numar_inventar,
        mf.denumire,
        g.cod as gestiune_cod,
        g.denumire as gestiune_denumire
      FROM mijloace_fixe mf
      INNER JOIN gestiuni g ON mf.gestiune_id = g.id
      WHERE mf.stare = 'activ'
        ${extraWhere}
      ORDER BY g.cod, mf.numar_inventar
    `);

    const resultRows = result[0] as any[];

    const rows: ListaInventariereGoalaRow[] = resultRows.map((row: any) => ({
      mijlocFixId: row.mijloc_fix_id,
      numarInventar: row.numar_inventar,
      denumire: row.denumire,
      gestiuneCod: row.gestiune_cod ?? "",
      gestiuneDenumire: row.gestiune_denumire ?? "",
    }));

    const data: ListaInventariereGoalaResponse = {
      rows,
      totals: { numarActive: rows.length },
      filters: { gestiuneId, contId, stare },
    };

    return c.json<ApiResponse<ListaInventariereGoalaResponse>>({ success: true, data });
  } catch (error) {
    console.error("Lista Inventariere Goala error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea listei de inventariere goale",
    }, 500);
  }
});

// ============================================================================
// GET /locuri-obiecte - RAP-12: Locuri cu Obiecte
// Legacy equivalent: LOCURI.PRG
// Locations that have active inventory items
// ============================================================================
rapoarteRoutes.get("/locuri-obiecte", async (c) => {
  try {
    const result = await db.execute(sql`
      SELECT
        g.cod as gestiune_cod,
        g.denumire as gestiune_denumire,
        lf.cod as loc_folosinta_cod,
        lf.denumire as loc_folosinta_denumire,
        COUNT(*) as numar_active
      FROM mijloace_fixe mf
      INNER JOIN gestiuni g ON mf.gestiune_id = g.id
      LEFT JOIN locuri_folosinta lf ON mf.loc_folosinta_id = lf.id
      WHERE mf.stare = 'activ'
      GROUP BY g.cod, g.denumire, lf.cod, lf.denumire
      ORDER BY g.cod, lf.cod
    `);

    const resultRows = result[0] as any[];

    let totalActive = 0;
    const rows: LocuriObiectRow[] = resultRows.map((row: any) => {
      const numarActive = Number(row.numar_active);
      totalActive += numarActive;
      return {
        gestiuneCod: row.gestiune_cod,
        gestiuneDenumire: row.gestiune_denumire,
        locFolosintaCod: row.loc_folosinta_cod ?? null,
        locFolosintaDenumire: row.loc_folosinta_denumire ?? null,
        numarActive,
      };
    });

    const data: LocuriObiectResponse = {
      rows,
      totals: {
        numarLocuri: rows.length,
        numarActive: totalActive,
      },
    };

    return c.json<ApiResponse<LocuriObiectResponse>>({ success: true, data });
  } catch (error) {
    console.error("Locuri Obiecte error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea raportului de locuri",
    }, 500);
  }
});

// ============================================================================
// GET /corespondenta-material-cont - RAP-13: Corespondenta Material-Cont
// Legacy equivalent: MAT_CONT.PRG
// Which account is assigned to each asset in a gestiune
// ============================================================================
rapoarteRoutes.get("/corespondenta-material-cont", async (c) => {
  const gestiuneIdParam = c.req.query("gestiuneId");

  try {
    const gestiuneId = gestiuneIdParam ? parseInt(gestiuneIdParam) : undefined;

    const extraConditions: ReturnType<typeof sql>[] = [];
    if (gestiuneId) {
      extraConditions.push(sql`AND mf.gestiune_id = ${gestiuneId}`);
    }
    const extraWhere = extraConditions.length > 0
      ? extraConditions.reduce((acc, cond) => sql`${acc} ${cond}`)
      : sql``;

    const result = await db.execute(sql`
      SELECT
        mf.id as mijloc_fix_id,
        mf.numar_inventar,
        mf.denumire,
        c.simbol as cont_simbol,
        c.denumire as cont_denumire
      FROM mijloace_fixe mf
      LEFT JOIN conturi c ON mf.cont_id = c.id
      WHERE mf.stare = 'activ'
        ${extraWhere}
      ORDER BY c.simbol, mf.numar_inventar
    `);

    const resultRows = result[0] as any[];

    const rows: CorespMaterialContRow[] = resultRows.map((row: any) => ({
      mijlocFixId: row.mijloc_fix_id,
      numarInventar: row.numar_inventar,
      denumire: row.denumire,
      contSimbol: row.cont_simbol ?? null,
      contDenumire: row.cont_denumire ?? null,
    }));

    const data: CorespMaterialContResponse = {
      rows,
      totals: { numarActive: rows.length },
      filters: { gestiuneId },
    };

    return c.json<ApiResponse<CorespMaterialContResponse>>({ success: true, data });
  } catch (error) {
    console.error("Corespondenta Material-Cont error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea corespondentei material-cont",
    }, 500);
  }
});

// ============================================================================
// GET /lista-materiale - RAP-14: Lista Materiale
// Legacy equivalent: LIS_MATE.PRG
// Material catalog with useful life durations
// ============================================================================
rapoarteRoutes.get("/lista-materiale", async (c) => {
  const gestiuneIdParam = c.req.query("gestiuneId");
  const sortBy = c.req.query("sortBy") || "numar_inventar"; // numar_inventar, denumire

  try {
    const gestiuneId = gestiuneIdParam ? parseInt(gestiuneIdParam) : undefined;

    const extraConditions: ReturnType<typeof sql>[] = [];
    if (gestiuneId) {
      extraConditions.push(sql`AND mf.gestiune_id = ${gestiuneId}`);
    }
    const extraWhere = extraConditions.length > 0
      ? extraConditions.reduce((acc, cond) => sql`${acc} ${cond}`)
      : sql``;

    const orderClause = sortBy === "denumire"
      ? sql`ORDER BY mf.denumire`
      : sql`ORDER BY mf.numar_inventar`;

    const result = await db.execute(sql`
      SELECT
        mf.id as mijloc_fix_id,
        mf.numar_inventar,
        mf.denumire,
        mf.durata_normala,
        mf.data_achizitie,
        CAST(mf.valoare_inventar AS DECIMAL(15,2)) as valoare_inventar,
        mf.stare
      FROM mijloace_fixe mf
      WHERE mf.stare = 'activ'
        ${extraWhere}
      ${orderClause}
    `);

    const resultRows = result[0] as any[];

    let totalValoareInventar = Money.zero();

    const rows: ListaMaterialeRow[] = resultRows.map((row: any) => {
      const valoare = String(row.valoare_inventar ?? "0.00");
      totalValoareInventar = totalValoareInventar.plus(Money.fromDb(valoare));

      return {
        mijlocFixId: row.mijloc_fix_id,
        numarInventar: row.numar_inventar,
        denumire: row.denumire,
        durataNormala: row.durata_normala,
        dataAchizitie: new Date(row.data_achizitie).toISOString().split("T")[0],
        valoareInventar: valoare,
        stare: row.stare,
      };
    });

    const data: ListaMaterialeResponse = {
      rows,
      totals: {
        numarActive: rows.length,
        valoareInventar: totalValoareInventar.toDbString(),
      },
      filters: { gestiuneId, sortBy },
    };

    return c.json<ApiResponse<ListaMaterialeResponse>>({ success: true, data });
  } catch (error) {
    console.error("Lista Materiale error:", error);
    return c.json<ApiResponse>({
      success: false,
      message: "Eroare la generarea listei de materiale",
    }, 500);
  }
});
