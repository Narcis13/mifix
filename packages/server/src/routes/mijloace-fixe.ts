import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { like, or, eq, sql, and } from "drizzle-orm";
import { db } from "../db";
import {
  mijloaceFixe,
  clasificari,
  gestiuni,
  locuriUilizare,
  surseFinantare,
  conturi,
  tipuriDocument,
} from "../db/schema";
import { insertMijlocFixSchema, updateMijlocFixSchema } from "../validation/schemas";
import type { ApiResponse, PaginatedResponse, MijlocFix, Clasificare, Gestiune, LocFolosinta, SursaFinantare, Cont, TipDocument } from "shared";
import { Money } from "shared";

export const mijloaceFixeRoutes = new Hono();

// ============================================================================
// GET / - List mijloace fixe with filtering and pagination
// ============================================================================
mijloaceFixeRoutes.get("/", async (c) => {
  const search = c.req.query("search");
  const gestiuneId = c.req.query("gestiuneId");
  const locFolosintaId = c.req.query("locFolosintaId");
  const stare = c.req.query("stare");
  const grupa = c.req.query("grupa");
  const page = parseInt(c.req.query("page") || "1");
  const pageSize = parseInt(c.req.query("pageSize") || "20");

  // Build conditions array
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(mijloaceFixe.numarInventar, `%${search}%`),
        like(mijloaceFixe.denumire, `%${search}%`)
      )
    );
  }

  if (gestiuneId) {
    conditions.push(eq(mijloaceFixe.gestiuneId, parseInt(gestiuneId)));
  }

  if (locFolosintaId) {
    conditions.push(eq(mijloaceFixe.locFolosintaId, parseInt(locFolosintaId)));
  }

  if (stare) {
    conditions.push(eq(mijloaceFixe.stare, stare as "activ" | "casare" | "declasare" | "transfer"));
  }

  if (grupa) {
    conditions.push(eq(clasificari.grupa, grupa));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count total for pagination
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(mijloaceFixe)
    .leftJoin(clasificari, eq(mijloaceFixe.clasificareCod, clasificari.cod))
    .where(whereClause);
  const total = Number(countResult[0].count);

  // Get paginated results with joins
  const result = await db
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
    .where(whereClause)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .orderBy(mijloaceFixe.denumire);

  // Map database result to API response
  const items: MijlocFix[] = result.map((row) => ({
    id: row.mijlocFix.id,
    numarInventar: row.mijlocFix.numarInventar,
    denumire: row.mijlocFix.denumire,
    descriere: row.mijlocFix.descriere ?? undefined,
    clasificareCod: row.mijlocFix.clasificareCod,
    clasificare: row.clasificare ? {
      cod: row.clasificare.cod,
      denumire: row.clasificare.denumire,
      grupa: row.clasificare.grupa,
      durataNormalaMin: row.clasificare.durataNormalaMin,
      durataNormalaMax: row.clasificare.durataNormalaMax,
      cotaAmortizare: row.clasificare.cotaAmortizare ?? undefined,
    } : undefined,
    gestiuneId: row.mijlocFix.gestiuneId,
    gestiune: row.gestiune ? {
      id: row.gestiune.id,
      cod: row.gestiune.cod,
      denumire: row.gestiune.denumire,
      responsabil: row.gestiune.responsabil ?? undefined,
      activ: row.gestiune.activ ?? true,
    } : undefined,
    locFolosintaId: row.mijlocFix.locFolosintaId ?? undefined,
    locFolosinta: row.locFolosinta ? {
      id: row.locFolosinta.id,
      gestiuneId: row.locFolosinta.gestiuneId,
      cod: row.locFolosinta.cod,
      denumire: row.locFolosinta.denumire,
      activ: row.locFolosinta.activ ?? true,
    } : undefined,
    sursaFinantareId: row.mijlocFix.sursaFinantareId ?? undefined,
    sursaFinantare: row.sursaFinantare ? {
      id: row.sursaFinantare.id,
      cod: row.sursaFinantare.cod,
      denumire: row.sursaFinantare.denumire,
      activ: row.sursaFinantare.activ ?? true,
    } : undefined,
    contId: row.mijlocFix.contId ?? 0,
    cont: row.cont ? {
      id: row.cont.id,
      simbol: row.cont.simbol,
      denumire: row.cont.denumire,
      tip: row.cont.tip,
      amortizabil: row.cont.amortizabil ?? false,
      contAmortizare: row.cont.contAmortizare ?? undefined,
      activ: row.cont.activ ?? true,
    } : undefined,
    tipDocumentId: row.mijlocFix.tipDocumentId ?? undefined,
    tipDocument: row.tipDocument ? {
      id: row.tipDocument.id,
      cod: row.tipDocument.cod,
      denumire: row.tipDocument.denumire,
      activ: row.tipDocument.activ ?? true,
    } : undefined,
    valoareInventar: row.mijlocFix.valoareInventar,
    valoareAmortizata: row.mijlocFix.valoareAmortizata,
    valoareRamasa: row.mijlocFix.valoareRamasa,
    dataAchizitie: row.mijlocFix.dataAchizitie.toISOString().split("T")[0],
    dataPIF: row.mijlocFix.dataAchizitie.toISOString().split("T")[0], // Same as acquisition for now
    dataStartAmortizare: row.mijlocFix.dataIncepereAmortizare?.toISOString().split("T")[0],
    dataFinalAmortizare: row.mijlocFix.dataFinalizareAmortizare?.toISOString().split("T")[0],
    durataNormala: row.mijlocFix.durataNormala,
    metodaAmortizare: "liniara", // Default method
    amortizabil: row.mijlocFix.eAmortizabil ?? true,
    eAmortizabil: row.mijlocFix.eAmortizabil ?? true,
    documentAchizitie: row.mijlocFix.documentAchizitie ?? undefined,
    furnizor: row.mijlocFix.furnizor ?? undefined,
    stare: row.mijlocFix.stare as "activ" | "conservare" | "casat" | "transferat" | "vandut",
    createdAt: row.mijlocFix.createdAt.toISOString(),
    updatedAt: row.mijlocFix.updatedAt.toISOString(),
  }));

  return c.json<ApiResponse<PaginatedResponse<MijlocFix>>>({
    success: true,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

// ============================================================================
// GET /:id - Get single mijloc fix with full relations
// ============================================================================
mijloaceFixeRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  const [result] = await db
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

  if (!result) {
    return c.json<ApiResponse>({
      success: false,
      message: "Mijlocul fix nu a fost gasit",
    }, 404);
  }

  const data: MijlocFix = {
    id: result.mijlocFix.id,
    numarInventar: result.mijlocFix.numarInventar,
    denumire: result.mijlocFix.denumire,
    descriere: result.mijlocFix.descriere ?? undefined,
    clasificareCod: result.mijlocFix.clasificareCod,
    clasificare: result.clasificare ? {
      cod: result.clasificare.cod,
      denumire: result.clasificare.denumire,
      grupa: result.clasificare.grupa,
      durataNormalaMin: result.clasificare.durataNormalaMin,
      durataNormalaMax: result.clasificare.durataNormalaMax,
      cotaAmortizare: result.clasificare.cotaAmortizare ?? undefined,
    } : undefined,
    gestiuneId: result.mijlocFix.gestiuneId,
    gestiune: result.gestiune ? {
      id: result.gestiune.id,
      cod: result.gestiune.cod,
      denumire: result.gestiune.denumire,
      responsabil: result.gestiune.responsabil ?? undefined,
      activ: result.gestiune.activ ?? true,
    } : undefined,
    locFolosintaId: result.mijlocFix.locFolosintaId ?? undefined,
    locFolosinta: result.locFolosinta ? {
      id: result.locFolosinta.id,
      gestiuneId: result.locFolosinta.gestiuneId,
      cod: result.locFolosinta.cod,
      denumire: result.locFolosinta.denumire,
      activ: result.locFolosinta.activ ?? true,
    } : undefined,
    sursaFinantareId: result.mijlocFix.sursaFinantareId ?? undefined,
    sursaFinantare: result.sursaFinantare ? {
      id: result.sursaFinantare.id,
      cod: result.sursaFinantare.cod,
      denumire: result.sursaFinantare.denumire,
      activ: result.sursaFinantare.activ ?? true,
    } : undefined,
    contId: result.mijlocFix.contId ?? 0,
    cont: result.cont ? {
      id: result.cont.id,
      simbol: result.cont.simbol,
      denumire: result.cont.denumire,
      tip: result.cont.tip,
      amortizabil: result.cont.amortizabil ?? false,
      contAmortizare: result.cont.contAmortizare ?? undefined,
      activ: result.cont.activ ?? true,
    } : undefined,
    tipDocumentId: result.mijlocFix.tipDocumentId ?? undefined,
    tipDocument: result.tipDocument ? {
      id: result.tipDocument.id,
      cod: result.tipDocument.cod,
      denumire: result.tipDocument.denumire,
      activ: result.tipDocument.activ ?? true,
    } : undefined,
    valoareInventar: result.mijlocFix.valoareInventar,
    valoareAmortizata: result.mijlocFix.valoareAmortizata,
    valoareRamasa: result.mijlocFix.valoareRamasa,
    dataAchizitie: result.mijlocFix.dataAchizitie.toISOString().split("T")[0],
    dataPIF: result.mijlocFix.dataAchizitie.toISOString().split("T")[0],
    dataStartAmortizare: result.mijlocFix.dataIncepereAmortizare?.toISOString().split("T")[0],
    dataFinalAmortizare: result.mijlocFix.dataFinalizareAmortizare?.toISOString().split("T")[0],
    durataNormala: result.mijlocFix.durataNormala,
    metodaAmortizare: "liniara",
    amortizabil: result.mijlocFix.eAmortizabil ?? true,
    eAmortizabil: result.mijlocFix.eAmortizabil ?? true,
    documentAchizitie: result.mijlocFix.documentAchizitie ?? undefined,
    furnizor: result.mijlocFix.furnizor ?? undefined,
    stare: result.mijlocFix.stare as "activ" | "conservare" | "casat" | "transferat" | "vandut",
    createdAt: result.mijlocFix.createdAt.toISOString(),
    updatedAt: result.mijlocFix.updatedAt.toISOString(),
  };

  return c.json<ApiResponse<MijlocFix>>({ success: true, data });
});

// ============================================================================
// POST / - Create new mijloc fix
// ============================================================================
mijloaceFixeRoutes.post(
  "/",
  zValidator("json", insertMijlocFixSchema, (result, c) => {
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      return c.json<ApiResponse>(
        { success: false, message: "Validare esuata", errors },
        400
      );
    }
  }),
  async (c) => {
    const data = c.req.valid("json");

    // Check numarInventar uniqueness BEFORE insert
    const existing = await db
      .select({ id: mijloaceFixe.id })
      .from(mijloaceFixe)
      .where(eq(mijloaceFixe.numarInventar, data.numarInventar))
      .limit(1);

    if (existing.length > 0) {
      return c.json<ApiResponse>({
        success: false,
        message: "Numarul de inventar exista deja",
        errors: { numarInventar: ["Numarul de inventar trebuie sa fie unic"] }
      }, 400);
    }

    // Compute derived fields
    const valoareInventar = Money.fromDb(data.valoareInventar);
    const cotaAmortizareLunara = Money.calculateMonthlyDepreciation(
      valoareInventar,
      data.durataNormala
    );

    // Insert with computed fields
    const insertData = {
      ...data,
      valoareAmortizata: "0.00", // New asset
      durataRamasa: data.durataNormala, // Same as normal duration
      cotaAmortizareLunara: cotaAmortizareLunara.toDbString(),
    };

    const [{ id: insertId }] = await db.insert(mijloaceFixe).values(insertData).$returningId();

    // Fetch created record with joins
    const [created] = await db
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
      .where(eq(mijloaceFixe.id, insertId));

    const responseData: MijlocFix = {
      id: created.mijlocFix.id,
      numarInventar: created.mijlocFix.numarInventar,
      denumire: created.mijlocFix.denumire,
      descriere: created.mijlocFix.descriere ?? undefined,
      clasificareCod: created.mijlocFix.clasificareCod,
      clasificare: created.clasificare ? {
        cod: created.clasificare.cod,
        denumire: created.clasificare.denumire,
        grupa: created.clasificare.grupa,
        durataNormalaMin: created.clasificare.durataNormalaMin,
        durataNormalaMax: created.clasificare.durataNormalaMax,
        cotaAmortizare: created.clasificare.cotaAmortizare ?? undefined,
      } : undefined,
      gestiuneId: created.mijlocFix.gestiuneId,
      gestiune: created.gestiune ? {
        id: created.gestiune.id,
        cod: created.gestiune.cod,
        denumire: created.gestiune.denumire,
        responsabil: created.gestiune.responsabil ?? undefined,
        activ: created.gestiune.activ ?? true,
      } : undefined,
      locFolosintaId: created.mijlocFix.locFolosintaId ?? undefined,
      locFolosinta: created.locFolosinta ? {
        id: created.locFolosinta.id,
        gestiuneId: created.locFolosinta.gestiuneId,
        cod: created.locFolosinta.cod,
        denumire: created.locFolosinta.denumire,
        activ: created.locFolosinta.activ ?? true,
      } : undefined,
      sursaFinantareId: created.mijlocFix.sursaFinantareId ?? undefined,
      sursaFinantare: created.sursaFinantare ? {
        id: created.sursaFinantare.id,
        cod: created.sursaFinantare.cod,
        denumire: created.sursaFinantare.denumire,
        activ: created.sursaFinantare.activ ?? true,
      } : undefined,
      contId: created.mijlocFix.contId ?? 0,
      cont: created.cont ? {
        id: created.cont.id,
        simbol: created.cont.simbol,
        denumire: created.cont.denumire,
        tip: created.cont.tip,
        amortizabil: created.cont.amortizabil ?? false,
        contAmortizare: created.cont.contAmortizare ?? undefined,
        activ: created.cont.activ ?? true,
      } : undefined,
      tipDocumentId: created.mijlocFix.tipDocumentId ?? undefined,
      tipDocument: created.tipDocument ? {
        id: created.tipDocument.id,
        cod: created.tipDocument.cod,
        denumire: created.tipDocument.denumire,
        activ: created.tipDocument.activ ?? true,
      } : undefined,
      valoareInventar: created.mijlocFix.valoareInventar,
      valoareAmortizata: created.mijlocFix.valoareAmortizata,
      valoareRamasa: created.mijlocFix.valoareRamasa,
      dataAchizitie: created.mijlocFix.dataAchizitie.toISOString().split("T")[0],
      dataPIF: created.mijlocFix.dataAchizitie.toISOString().split("T")[0],
      dataStartAmortizare: created.mijlocFix.dataIncepereAmortizare?.toISOString().split("T")[0],
      dataFinalAmortizare: created.mijlocFix.dataFinalizareAmortizare?.toISOString().split("T")[0],
      durataNormala: created.mijlocFix.durataNormala,
      metodaAmortizare: "liniara",
      amortizabil: created.mijlocFix.eAmortizabil ?? true,
      eAmortizabil: created.mijlocFix.eAmortizabil ?? true,
      documentAchizitie: created.mijlocFix.documentAchizitie ?? undefined,
      furnizor: created.mijlocFix.furnizor ?? undefined,
      stare: created.mijlocFix.stare as "activ" | "conservare" | "casat" | "transferat" | "vandut",
      createdAt: created.mijlocFix.createdAt.toISOString(),
      updatedAt: created.mijlocFix.updatedAt.toISOString(),
    };

    return c.json<ApiResponse<MijlocFix>>({ success: true, data: responseData }, 201);
  }
);

// ============================================================================
// PUT /:id - Update mijloc fix
// ============================================================================
mijloaceFixeRoutes.put(
  "/:id",
  zValidator("json", updateMijlocFixSchema, (result, c) => {
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      return c.json<ApiResponse>(
        { success: false, message: "Validare esuata", errors },
        400
      );
    }
  }),
  async (c) => {
    const id = parseInt(c.req.param("id"), 10);

    if (isNaN(id)) {
      return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
    }

    const data = c.req.valid("json");

    // Check if exists
    const [existing] = await db.select().from(mijloaceFixe).where(eq(mijloaceFixe.id, id));
    if (!existing) {
      return c.json<ApiResponse>({
        success: false,
        message: "Mijlocul fix nu a fost gasit"
      }, 404);
    }

    // Check numarInventar uniqueness excluding current record
    if (data.numarInventar) {
      const existingForUpdate = await db
        .select({ id: mijloaceFixe.id })
        .from(mijloaceFixe)
        .where(
          and(
            eq(mijloaceFixe.numarInventar, data.numarInventar),
            sql`${mijloaceFixe.id} != ${id}`
          )
        )
        .limit(1);

      if (existingForUpdate.length > 0) {
        return c.json<ApiResponse>({
          success: false,
          message: "Numarul de inventar exista deja",
          errors: { numarInventar: ["Numarul de inventar trebuie sa fie unic"] }
        }, 400);
      }
    }

    // Recalculate derived fields if valoareInventar or durataNormala changed
    let updateData: Record<string, unknown> = { ...data };

    const newValoareInventar = data.valoareInventar ?? existing.valoareInventar;
    const newDurataNormala = data.durataNormala ?? existing.durataNormala;

    if (data.valoareInventar || data.durataNormala) {
      const valoare = Money.fromDb(newValoareInventar);
      const cotaAmortizareLunara = Money.calculateMonthlyDepreciation(
        valoare,
        newDurataNormala
      );
      updateData.cotaAmortizareLunara = cotaAmortizareLunara.toDbString();
    }

    // Update
    await db.update(mijloaceFixe).set(updateData).where(eq(mijloaceFixe.id, id));

    // Fetch updated record with joins
    const [updated] = await db
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

    const responseData: MijlocFix = {
      id: updated.mijlocFix.id,
      numarInventar: updated.mijlocFix.numarInventar,
      denumire: updated.mijlocFix.denumire,
      descriere: updated.mijlocFix.descriere ?? undefined,
      clasificareCod: updated.mijlocFix.clasificareCod,
      clasificare: updated.clasificare ? {
        cod: updated.clasificare.cod,
        denumire: updated.clasificare.denumire,
        grupa: updated.clasificare.grupa,
        durataNormalaMin: updated.clasificare.durataNormalaMin,
        durataNormalaMax: updated.clasificare.durataNormalaMax,
        cotaAmortizare: updated.clasificare.cotaAmortizare ?? undefined,
      } : undefined,
      gestiuneId: updated.mijlocFix.gestiuneId,
      gestiune: updated.gestiune ? {
        id: updated.gestiune.id,
        cod: updated.gestiune.cod,
        denumire: updated.gestiune.denumire,
        responsabil: updated.gestiune.responsabil ?? undefined,
        activ: updated.gestiune.activ ?? true,
      } : undefined,
      locFolosintaId: updated.mijlocFix.locFolosintaId ?? undefined,
      locFolosinta: updated.locFolosinta ? {
        id: updated.locFolosinta.id,
        gestiuneId: updated.locFolosinta.gestiuneId,
        cod: updated.locFolosinta.cod,
        denumire: updated.locFolosinta.denumire,
        activ: updated.locFolosinta.activ ?? true,
      } : undefined,
      sursaFinantareId: updated.mijlocFix.sursaFinantareId ?? undefined,
      sursaFinantare: updated.sursaFinantare ? {
        id: updated.sursaFinantare.id,
        cod: updated.sursaFinantare.cod,
        denumire: updated.sursaFinantare.denumire,
        activ: updated.sursaFinantare.activ ?? true,
      } : undefined,
      contId: updated.mijlocFix.contId ?? 0,
      cont: updated.cont ? {
        id: updated.cont.id,
        simbol: updated.cont.simbol,
        denumire: updated.cont.denumire,
        tip: updated.cont.tip,
        amortizabil: updated.cont.amortizabil ?? false,
        contAmortizare: updated.cont.contAmortizare ?? undefined,
        activ: updated.cont.activ ?? true,
      } : undefined,
      tipDocumentId: updated.mijlocFix.tipDocumentId ?? undefined,
      tipDocument: updated.tipDocument ? {
        id: updated.tipDocument.id,
        cod: updated.tipDocument.cod,
        denumire: updated.tipDocument.denumire,
        activ: updated.tipDocument.activ ?? true,
      } : undefined,
      valoareInventar: updated.mijlocFix.valoareInventar,
      valoareAmortizata: updated.mijlocFix.valoareAmortizata,
      valoareRamasa: updated.mijlocFix.valoareRamasa,
      dataAchizitie: updated.mijlocFix.dataAchizitie.toISOString().split("T")[0],
      dataPIF: updated.mijlocFix.dataAchizitie.toISOString().split("T")[0],
      dataStartAmortizare: updated.mijlocFix.dataIncepereAmortizare?.toISOString().split("T")[0],
      dataFinalAmortizare: updated.mijlocFix.dataFinalizareAmortizare?.toISOString().split("T")[0],
      durataNormala: updated.mijlocFix.durataNormala,
      metodaAmortizare: "liniara",
      amortizabil: updated.mijlocFix.eAmortizabil ?? true,
      eAmortizabil: updated.mijlocFix.eAmortizabil ?? true,
      documentAchizitie: updated.mijlocFix.documentAchizitie ?? undefined,
      furnizor: updated.mijlocFix.furnizor ?? undefined,
      stare: updated.mijlocFix.stare as "activ" | "conservare" | "casat" | "transferat" | "vandut",
      createdAt: updated.mijlocFix.createdAt.toISOString(),
      updatedAt: updated.mijlocFix.updatedAt.toISOString(),
    };

    return c.json<ApiResponse<MijlocFix>>({ success: true, data: responseData });
  }
);
