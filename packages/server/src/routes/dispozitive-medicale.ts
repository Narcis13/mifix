import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, count as drizzleCount } from "drizzle-orm";
import { db } from "../db";
import {
  dispozitiveMedicale,
  mentenantaDispozitive,
  incidenteAdverse,
  mijloaceFixe,
} from "../db/schema";
import {
  insertDispozitivMedicalSchema,
  updateDispozitivMedicalSchema,
  insertMentenantaSchema,
  updateMentenantaSchema,
  insertIncidentAdversSchema,
  updateIncidentAdversSchema,
} from "../validation/schemas";
import type {
  ApiResponse,
  PaginatedResponse,
  DispozitivMedical,
  MentenantaDispozitiv,
  IncidentAdvers,
} from "shared";

export const dispozitiveMedicaleRoutes = new Hono();

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapDM(row: typeof dispozitiveMedicale.$inferSelect): DispozitivMedical {
  return {
    id: row.id,
    mijlocFixId: row.mijlocFixId,
    clasaRisc: row.clasaRisc,
    producator: row.producator,
    taraProducator: row.taraProducator ?? undefined,
    reprezentantAutorizatUE: row.reprezentantAutorizatUE ?? undefined,
    importator: row.importator ?? undefined,
    model: row.model ?? undefined,
    referintaCatalog: row.referintaCatalog ?? undefined,
    udiDI: row.udiDI ?? undefined,
    udiPI: row.udiPI ?? undefined,
    numarSerie: row.numarSerie ?? undefined,
    numarLot: row.numarLot ?? undefined,
    dataFabricatie: row.dataFabricatie?.toISOString().split("T")[0] ?? undefined,
    dataExpirare: row.dataExpirare?.toISOString().split("T")[0] ?? undefined,
    numarEudamed: row.numarEudamed ?? undefined,
    numarInregistrareANMDM: row.numarInregistrareANMDM ?? undefined,
    dataInregistrareANMDM: row.dataInregistrareANMDM?.toISOString().split("T")[0] ?? undefined,
    marcaCE: row.marcaCE ?? true,
    organismNotificat: row.organismNotificat ?? undefined,
    numarCertificatCE: row.numarCertificatCE ?? undefined,
    dataExpiraCertificatCE: row.dataExpiraCertificatCE?.toISOString().split("T")[0] ?? undefined,
    destinatieUtilizare: row.destinatieUtilizare ?? undefined,
    conditiiStocare: row.conditiiStocare ?? undefined,
    intervalMentenantaLuni: row.intervalMentenantaLuni ?? undefined,
    dataMentenantaUrmatoare: row.dataMentenantaUrmatoare?.toISOString().split("T")[0] ?? undefined,
    stareDM: row.stareDM,
    observatii: row.observatii ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapMentenanta(row: typeof mentenantaDispozitive.$inferSelect): MentenantaDispozitiv {
  return {
    id: row.id,
    dispozitivMedicalId: row.dispozitivMedicalId,
    tipMentenanta: row.tipMentenanta,
    dataPlanificata: row.dataPlanificata?.toISOString().split("T")[0] ?? undefined,
    dataEfectuata: row.dataEfectuata?.toISOString().split("T")[0] ?? undefined,
    efectuatDe: row.efectuatDe ?? undefined,
    autorizatDe: row.autorizatDe ?? undefined,
    descriere: row.descriere ?? undefined,
    rezultat: row.rezultat,
    certificatCalibrarNumar: row.certificatCalibrarNumar ?? undefined,
    dataExpiraCalibrare: row.dataExpiraCalibrare?.toISOString().split("T")[0] ?? undefined,
    numarRaport: row.numarRaport ?? undefined,
    observatii: row.observatii ?? undefined,
    dataMentenantaUrmatoare: row.dataMentenantaUrmatoare?.toISOString().split("T")[0] ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapIncident(row: typeof incidenteAdverse.$inferSelect): IncidentAdvers {
  return {
    id: row.id,
    dispozitivMedicalId: row.dispozitivMedicalId,
    dataIncident: row.dataIncident.toISOString().split("T")[0],
    dataSesizare: row.dataSesizare?.toISOString().split("T")[0] ?? undefined,
    tipIncident: row.tipIncident,
    descriere: row.descriere,
    raportatANMDM: row.raportatANMDM ?? false,
    numarRaportANMDM: row.numarRaportANMDM ?? undefined,
    dataRaportANMDM: row.dataRaportANMDM?.toISOString().split("T")[0] ?? undefined,
    actiuneCorectiva: row.actiuneCorectiva ?? undefined,
    dataInchidere: row.dataInchidere?.toISOString().split("T")[0] ?? undefined,
    stareIncident: row.stareIncident,
    observatii: row.observatii ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildValidationErrors(result: any): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  result.error.issues.forEach((issue: any) => {
    const path = issue.path.join(".");
    if (!errors[path]) errors[path] = [];
    errors[path].push(issue.message);
  });
  return errors;
}

// ============================================================================
// Dispozitive Medicale CRUD
// ============================================================================

// GET / - List with pagination + filters
dispozitiveMedicaleRoutes.get("/", async (c) => {
  const stareDM = c.req.query("stareDM");
  const clasaRisc = c.req.query("clasaRisc");
  const page = parseInt(c.req.query("page") || "1");
  const pageSize = parseInt(c.req.query("pageSize") || "20");
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (stareDM && ["activ", "mentenanta", "retras", "carantinat", "defect", "arhivat"].includes(stareDM)) {
    conditions.push(eq(dispozitiveMedicale.stareDM, stareDM as any));
  }
  if (clasaRisc && ["I", "IIa", "IIb", "III"].includes(clasaRisc)) {
    conditions.push(eq(dispozitiveMedicale.clasaRisc, clasaRisc as any));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.select({
      dm: dispozitiveMedicale,
      mf: { id: mijloaceFixe.id, numarInventar: mijloaceFixe.numarInventar, denumire: mijloaceFixe.denumire },
    })
      .from(dispozitiveMedicale)
      .leftJoin(mijloaceFixe, eq(dispozitiveMedicale.mijlocFixId, mijloaceFixe.id))
      .where(where)
      .orderBy(desc(dispozitiveMedicale.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ total: drizzleCount() })
      .from(dispozitiveMedicale)
      .where(where),
  ]);

  const items: DispozitivMedical[] = rows.map(({ dm, mf }) => ({
    ...mapDM(dm),
    mijlocFix: mf ?? undefined,
  }));

  return c.json<ApiResponse<PaginatedResponse<DispozitivMedical>>>({
    success: true,
    data: { items, total: Number(total), page, pageSize, totalPages: Math.ceil(Number(total) / pageSize) },
  });
});

// GET /:id - Single DM with mentenante + incidente
dispozitiveMedicaleRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);

  const [[dmRow], mfRow, mentenante, incidente] = await Promise.all([
    db.select({ dm: dispozitiveMedicale, mf: { id: mijloaceFixe.id, numarInventar: mijloaceFixe.numarInventar, denumire: mijloaceFixe.denumire } })
      .from(dispozitiveMedicale)
      .leftJoin(mijloaceFixe, eq(dispozitiveMedicale.mijlocFixId, mijloaceFixe.id))
      .where(eq(dispozitiveMedicale.id, id)),
    Promise.resolve(null),
    db.select().from(mentenantaDispozitive)
      .where(eq(mentenantaDispozitive.dispozitivMedicalId, id))
      .orderBy(desc(mentenantaDispozitive.dataEfectuata)),
    db.select().from(incidenteAdverse)
      .where(eq(incidenteAdverse.dispozitivMedicalId, id))
      .orderBy(desc(incidenteAdverse.dataIncident)),
  ]);

  if (!dmRow) return c.json<ApiResponse>({ success: false, message: "Dispozitiv medical negasit" }, 404);

  const data: DispozitivMedical = {
    ...mapDM(dmRow.dm),
    mijlocFix: dmRow.mf ?? undefined,
    mentenante: mentenante.map(mapMentenanta),
    incidente: incidente.map(mapIncident),
  };

  return c.json<ApiResponse<DispozitivMedical>>({ success: true, data });
});

// POST / - Create DM
dispozitiveMedicaleRoutes.post(
  "/",
  zValidator("json", insertDispozitivMedicalSchema, (result, c) => {
    if (!result.success) return c.json({ success: false, message: "Validare esuata", errors: buildValidationErrors(result) }, 400);
  }),
  async (c) => {
    const data = c.req.valid("json");

    // Check mijloc fix exists
    const [mf] = await db.select().from(mijloaceFixe).where(eq(mijloaceFixe.id, data.mijlocFixId));
    if (!mf) return c.json<ApiResponse>({ success: false, message: "Mijlocul fix nu exista" }, 404);

    // Check not already linked
    const [existing] = await db.select().from(dispozitiveMedicale)
      .where(eq(dispozitiveMedicale.mijlocFixId, data.mijlocFixId));
    if (existing) return c.json<ApiResponse>({ success: false, message: "Mijlocul fix are deja un dispozitiv medical inregistrat" }, 409);

    const [{ id: insertId }] = await db.insert(dispozitiveMedicale).values(data).$returningId();
    const [created] = await db.select().from(dispozitiveMedicale).where(eq(dispozitiveMedicale.id, insertId));

    return c.json<ApiResponse<DispozitivMedical>>({ success: true, data: mapDM(created) }, 201);
  }
);

// PUT /:id - Update DM
dispozitiveMedicaleRoutes.put(
  "/:id",
  zValidator("json", updateDispozitivMedicalSchema, (result, c) => {
    if (!result.success) return c.json({ success: false, message: "Validare esuata", errors: buildValidationErrors(result) }, 400);
  }),
  async (c) => {
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);

    const [existing] = await db.select().from(dispozitiveMedicale).where(eq(dispozitiveMedicale.id, id));
    if (!existing) return c.json<ApiResponse>({ success: false, message: "Dispozitiv medical negasit" }, 404);

    const data = c.req.valid("json");
    await db.update(dispozitiveMedicale).set(data).where(eq(dispozitiveMedicale.id, id));

    const [updated] = await db.select().from(dispozitiveMedicale).where(eq(dispozitiveMedicale.id, id));
    return c.json<ApiResponse<DispozitivMedical>>({ success: true, data: mapDM(updated) });
  }
);

// ============================================================================
// Mentenanta CRUD (nested under dispozitiv)
// ============================================================================

// GET /:id/mentenante
dispozitiveMedicaleRoutes.get("/:id/mentenante", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);

  const rows = await db.select().from(mentenantaDispozitive)
    .where(eq(mentenantaDispozitive.dispozitivMedicalId, id))
    .orderBy(desc(mentenantaDispozitive.dataEfectuata));

  return c.json<ApiResponse<MentenantaDispozitiv[]>>({ success: true, data: rows.map(mapMentenanta) });
});

// POST /:id/mentenante
dispozitiveMedicaleRoutes.post(
  "/:id/mentenante",
  zValidator("json", insertMentenantaSchema, (result, c) => {
    if (!result.success) return c.json({ success: false, message: "Validare esuata", errors: buildValidationErrors(result) }, 400);
  }),
  async (c) => {
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);

    const [dm] = await db.select().from(dispozitiveMedicale).where(eq(dispozitiveMedicale.id, id));
    if (!dm) return c.json<ApiResponse>({ success: false, message: "Dispozitiv medical negasit" }, 404);

    const data = { ...c.req.valid("json"), dispozitivMedicalId: id };
    const [{ id: insertId }] = await db.insert(mentenantaDispozitive).values(data).$returningId();

    // If has next maintenance date, update DM
    if (data.dataMentenantaUrmatoare) {
      await db.update(dispozitiveMedicale)
        .set({ dataMentenantaUrmatoare: data.dataMentenantaUrmatoare, stareDM: "activ" })
        .where(eq(dispozitiveMedicale.id, id));
    }

    const [created] = await db.select().from(mentenantaDispozitive).where(eq(mentenantaDispozitive.id, insertId));
    return c.json<ApiResponse<MentenantaDispozitiv>>({ success: true, data: mapMentenanta(created) }, 201);
  }
);

// PUT /:id/mentenante/:mid
dispozitiveMedicaleRoutes.put(
  "/:id/mentenante/:mid",
  zValidator("json", updateMentenantaSchema, (result, c) => {
    if (!result.success) return c.json({ success: false, message: "Validare esuata", errors: buildValidationErrors(result) }, 400);
  }),
  async (c) => {
    const mid = parseInt(c.req.param("mid"), 10);
    if (isNaN(mid)) return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);

    const [existing] = await db.select().from(mentenantaDispozitive).where(eq(mentenantaDispozitive.id, mid));
    if (!existing) return c.json<ApiResponse>({ success: false, message: "Inregistrare mentenanta negasita" }, 404);

    const data = c.req.valid("json");
    await db.update(mentenantaDispozitive).set(data).where(eq(mentenantaDispozitive.id, mid));

    const [updated] = await db.select().from(mentenantaDispozitive).where(eq(mentenantaDispozitive.id, mid));
    return c.json<ApiResponse<MentenantaDispozitiv>>({ success: true, data: mapMentenanta(updated) });
  }
);

// ============================================================================
// Incidente Adverse CRUD (nested under dispozitiv)
// ============================================================================

// GET /:id/incidente
dispozitiveMedicaleRoutes.get("/:id/incidente", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);

  const rows = await db.select().from(incidenteAdverse)
    .where(eq(incidenteAdverse.dispozitivMedicalId, id))
    .orderBy(desc(incidenteAdverse.dataIncident));

  return c.json<ApiResponse<IncidentAdvers[]>>({ success: true, data: rows.map(mapIncident) });
});

// POST /:id/incidente
dispozitiveMedicaleRoutes.post(
  "/:id/incidente",
  zValidator("json", insertIncidentAdversSchema, (result, c) => {
    if (!result.success) return c.json({ success: false, message: "Validare esuata", errors: buildValidationErrors(result) }, 400);
  }),
  async (c) => {
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);

    const [dm] = await db.select().from(dispozitiveMedicale).where(eq(dispozitiveMedicale.id, id));
    if (!dm) return c.json<ApiResponse>({ success: false, message: "Dispozitiv medical negasit" }, 404);

    const data = { ...c.req.valid("json"), dispozitivMedicalId: id };
    const [{ id: insertId }] = await db.insert(incidenteAdverse).values(data).$returningId();

    const [created] = await db.select().from(incidenteAdverse).where(eq(incidenteAdverse.id, insertId));
    return c.json<ApiResponse<IncidentAdvers>>({ success: true, data: mapIncident(created) }, 201);
  }
);

// PUT /:id/incidente/:iid
dispozitiveMedicaleRoutes.put(
  "/:id/incidente/:iid",
  zValidator("json", updateIncidentAdversSchema, (result, c) => {
    if (!result.success) return c.json({ success: false, message: "Validare esuata", errors: buildValidationErrors(result) }, 400);
  }),
  async (c) => {
    const iid = parseInt(c.req.param("iid"), 10);
    if (isNaN(iid)) return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);

    const [existing] = await db.select().from(incidenteAdverse).where(eq(incidenteAdverse.id, iid));
    if (!existing) return c.json<ApiResponse>({ success: false, message: "Incident advers negasit" }, 404);

    const data = c.req.valid("json");
    await db.update(incidenteAdverse).set(data).where(eq(incidenteAdverse.id, iid));

    const [updated] = await db.select().from(incidenteAdverse).where(eq(incidenteAdverse.id, iid));
    return c.json<ApiResponse<IncidentAdvers>>({ success: true, data: mapIncident(updated) });
  }
);
