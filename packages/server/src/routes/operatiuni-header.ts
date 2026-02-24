import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, sql, between, count as drizzleCount } from "drizzle-orm";
import { db } from "../db";
import {
  operatiuni,
  tranzactii,
  tipuriDocument,
  mijloaceFixe,
  gestiuni,
  locuriUilizare,
  conturi,
} from "../db/schema";
import { alias } from "drizzle-orm/mysql-core";
import { getNextNumarOperatie } from "../utils/operatiuni-helpers";
import {
  createOperatiuneSchema,
  anuleazaOperatiuneSchema,
  addLinieIntrareSchema,
  addLinieIesireSchema,
  addLinieTransferSchema,
} from "../validation/operatiuni-header-schemas";
import { Money } from "shared";
import type { ApiResponse, PaginatedResponse, Operatiune, Tranzactie } from "shared";

export const operatiuniHeaderRoutes = new Hono();

// ============================================================================
// GET / - List operatiuni with filtering and pagination
// ============================================================================
operatiuniHeaderRoutes.get("/", async (c) => {
  const an = c.req.query("an");
  const tipOperatie = c.req.query("tipOperatie");
  const stare = c.req.query("stare");
  const dataStart = c.req.query("dataStart");
  const dataEnd = c.req.query("dataEnd");
  const page = parseInt(c.req.query("page") || "1");
  const pageSize = parseInt(c.req.query("pageSize") || "20");

  try {
    const conditions = [];

    if (an) {
      conditions.push(eq(operatiuni.an, parseInt(an)));
    }

    if (tipOperatie && ["intrare", "iesire", "transfer", "inventar", "ajustare"].includes(tipOperatie)) {
      conditions.push(eq(operatiuni.tipOperatie, tipOperatie as any));
    }

    if (stare && ["deschisa", "finalizata", "anulata"].includes(stare)) {
      conditions.push(eq(operatiuni.stare, stare as any));
    }

    if (dataStart && dataEnd) {
      conditions.push(between(operatiuni.dataOperare, new Date(dataStart), new Date(dataEnd)));
    } else if (dataStart) {
      conditions.push(sql`${operatiuni.dataOperare} >= ${new Date(dataStart)}`);
    } else if (dataEnd) {
      conditions.push(sql`${operatiuni.dataOperare} <= ${new Date(dataEnd)}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(operatiuni)
      .where(whereClause);
    const total = Number(countResult[0].count);

    // Get paginated results with line count
    const result = await db
      .select({
        operatiune: operatiuni,
        tipDocument: tipuriDocument,
        numarLinii: sql<number>`(
          SELECT COUNT(*) FROM tranzactii
          WHERE tranzactii.operatiune_id = ${operatiuni.id}
        )`,
      })
      .from(operatiuni)
      .leftJoin(tipuriDocument, eq(operatiuni.tipDocumentId, tipuriDocument.id))
      .where(whereClause)
      .orderBy(desc(operatiuni.dataOperare), desc(operatiuni.numarOperatie))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items: Operatiune[] = result.map((row) => ({
      id: row.operatiune.id,
      numarOperatie: row.operatiune.numarOperatie,
      an: row.operatiune.an,
      dataOperare: row.operatiune.dataOperare?.toISOString().split("T")[0] ?? "",
      tipOperatie: row.operatiune.tipOperatie,
      stare: row.operatiune.stare,
      tipDocumentId: row.operatiune.tipDocumentId ?? undefined,
      tipDocument: row.tipDocument
        ? {
            id: row.tipDocument.id,
            cod: row.tipDocument.cod,
            denumire: row.tipDocument.denumire,
            activ: row.tipDocument.activ ?? true,
          }
        : undefined,
      numarDocument: row.operatiune.numarDocument ?? undefined,
      dataDocument: row.operatiune.dataDocument?.toISOString().split("T")[0] ?? undefined,
      descriere: row.operatiune.descriere ?? undefined,
      createdAt: row.operatiune.createdAt?.toISOString() ?? "",
      numarLinii: Number(row.numarLinii),
    }));

    return c.json<ApiResponse<PaginatedResponse<Operatiune>>>({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("List operatiuni error:", error);
    return c.json<ApiResponse>({ success: false, message: "Eroare la listarea operatiunilor" }, 500);
  }
});

// ============================================================================
// GET /:id - Get operatiune detail with tranzactii
// ============================================================================
operatiuniHeaderRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  try {
    // Fetch operatiune header
    const [result] = await db
      .select({
        operatiune: operatiuni,
        tipDocument: tipuriDocument,
      })
      .from(operatiuni)
      .leftJoin(tipuriDocument, eq(operatiuni.tipDocumentId, tipuriDocument.id))
      .where(eq(operatiuni.id, id));

    if (!result) {
      return c.json<ApiResponse>({ success: false, message: "Operatiunea nu a fost gasita" }, 404);
    }

    // Fetch tranzactii (linii) for this operatiune
    const gestiuneSursa = alias(gestiuni, "gestiune_sursa");
    const gestiuneDestinatie = alias(gestiuni, "gestiune_destinatie");
    const locFolosintaSursa = alias(locuriUilizare, "loc_folosinta_sursa");
    const locFolosintaDestinatie = alias(locuriUilizare, "loc_folosinta_destinatie");

    const linii = await db
      .select({
        tranzactie: tranzactii,
        mijlocFix: mijloaceFixe,
        gestiuneSursa: gestiuneSursa,
        gestiuneDestinatie: gestiuneDestinatie,
        locFolosintaSursa: locFolosintaSursa,
        locFolosintaDestinatie: locFolosintaDestinatie,
      })
      .from(tranzactii)
      .leftJoin(mijloaceFixe, eq(tranzactii.mijlocFixId, mijloaceFixe.id))
      .leftJoin(gestiuneSursa, eq(tranzactii.gestiuneSursaId, gestiuneSursa.id))
      .leftJoin(gestiuneDestinatie, eq(tranzactii.gestiuneDestinatieId, gestiuneDestinatie.id))
      .leftJoin(locFolosintaSursa, eq(tranzactii.locFolosintaSursaId, locFolosintaSursa.id))
      .leftJoin(locFolosintaDestinatie, eq(tranzactii.locFolosintaDestinatieId, locFolosintaDestinatie.id))
      .where(eq(tranzactii.operatiuneId, id))
      .orderBy(tranzactii.id);

    const tranzactiiMapped: Tranzactie[] = linii.map((row) => ({
      id: row.tranzactie.id,
      mijlocFixId: row.tranzactie.mijlocFixId,
      operatiuneId: row.tranzactie.operatiuneId ?? undefined,
      tip: row.tranzactie.tip,
      dataOperare: row.tranzactie.dataOperare?.toISOString().split("T")[0] ?? "",
      documentNumar: row.tranzactie.documentNumar ?? undefined,
      documentData: row.tranzactie.documentData?.toISOString().split("T")[0] ?? undefined,
      mijlocFix: row.mijlocFix
        ? {
            id: row.mijlocFix.id,
            numarInventar: row.mijlocFix.numarInventar,
            denumire: row.mijlocFix.denumire,
            clasificareCod: row.mijlocFix.clasificareCod,
            gestiuneId: row.mijlocFix.gestiuneId,
            valoareInventar: row.mijlocFix.valoareInventar ?? "0.00",
            valoareAmortizata: row.mijlocFix.valoareAmortizata ?? "0.00",
            valoareRamasa: row.mijlocFix.valoareRamasa ?? "0.00",
            stare: row.mijlocFix.stare as any,
          } as any
        : undefined,
      gestiuneSursaId: row.tranzactie.gestiuneSursaId ?? undefined,
      gestiuneDestinatieId: row.tranzactie.gestiuneDestinatieId ?? undefined,
      locFolosintaSursaId: row.tranzactie.locFolosintaSursaId ?? undefined,
      locFolosintaDestinatieId: row.tranzactie.locFolosintaDestinatieId ?? undefined,
      gestiuneSursa: row.gestiuneSursa
        ? { id: row.gestiuneSursa.id, cod: row.gestiuneSursa.cod, denumire: row.gestiuneSursa.denumire, activ: row.gestiuneSursa.activ ?? true }
        : undefined,
      gestiuneDestinatie: row.gestiuneDestinatie
        ? { id: row.gestiuneDestinatie.id, cod: row.gestiuneDestinatie.cod, denumire: row.gestiuneDestinatie.denumire, activ: row.gestiuneDestinatie.activ ?? true }
        : undefined,
      locFolosintaSursa: row.locFolosintaSursa
        ? { id: row.locFolosintaSursa.id, gestiuneId: row.locFolosintaSursa.gestiuneId, cod: row.locFolosintaSursa.cod, denumire: row.locFolosintaSursa.denumire, activ: row.locFolosintaSursa.activ ?? true }
        : undefined,
      locFolosintaDestinatie: row.locFolosintaDestinatie
        ? { id: row.locFolosintaDestinatie.id, gestiuneId: row.locFolosintaDestinatie.gestiuneId, cod: row.locFolosintaDestinatie.cod, denumire: row.locFolosintaDestinatie.denumire, activ: row.locFolosintaDestinatie.activ ?? true }
        : undefined,
      valoareOperatie: row.tranzactie.valoareOperatie ?? undefined,
      valoareInainte: row.tranzactie.valoareInainte ?? undefined,
      valoareDupa: row.tranzactie.valoareDupa ?? undefined,
      descriere: row.tranzactie.descriere ?? undefined,
      observatii: row.tranzactie.observatii ?? undefined,
      createdAt: row.tranzactie.createdAt?.toISOString() ?? "",
    }));

    const operatiune: Operatiune = {
      id: result.operatiune.id,
      numarOperatie: result.operatiune.numarOperatie,
      an: result.operatiune.an,
      dataOperare: result.operatiune.dataOperare?.toISOString().split("T")[0] ?? "",
      tipOperatie: result.operatiune.tipOperatie,
      stare: result.operatiune.stare,
      tipDocumentId: result.operatiune.tipDocumentId ?? undefined,
      tipDocument: result.tipDocument
        ? {
            id: result.tipDocument.id,
            cod: result.tipDocument.cod,
            denumire: result.tipDocument.denumire,
            activ: result.tipDocument.activ ?? true,
          }
        : undefined,
      numarDocument: result.operatiune.numarDocument ?? undefined,
      dataDocument: result.operatiune.dataDocument?.toISOString().split("T")[0] ?? undefined,
      descriere: result.operatiune.descriere ?? undefined,
      createdAt: result.operatiune.createdAt?.toISOString() ?? "",
      tranzactii: tranzactiiMapped,
      numarLinii: tranzactiiMapped.length,
    };

    return c.json<ApiResponse<Operatiune>>({ success: true, data: operatiune });
  } catch (error) {
    console.error("Get operatiune detail error:", error);
    return c.json<ApiResponse>({ success: false, message: "Eroare la obtinerea detaliului operatiunii" }, 500);
  }
});

// ============================================================================
// POST / - Create new operatiune header (auto-numerotare)
// ============================================================================
operatiuniHeaderRoutes.post(
  "/",
  zValidator("json", createOperatiuneSchema, (result, c) => {
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

    try {
      const result = await db.transaction(async (tx) => {
        const an = new Date(data.dataOperare).getFullYear();
        const numarOp = await getNextNumarOperatie(tx, an);

        const [insertResult] = await tx.insert(operatiuni).values({
          numarOperatie: numarOp,
          an,
          dataOperare: new Date(data.dataOperare),
          tipOperatie: data.tipOperatie,
          stare: "deschisa",
          tipDocumentId: data.tipDocumentId || null,
          numarDocument: data.numarDocument || null,
          dataDocument: data.dataDocument ? new Date(data.dataDocument) : null,
          descriere: data.descriere || null,
        });

        // Fetch the created operatiune
        const [created] = await tx
          .select()
          .from(operatiuni)
          .where(eq(operatiuni.id, insertResult.insertId));

        return created;
      });

      const operatiune: Operatiune = {
        id: result.id,
        numarOperatie: result.numarOperatie,
        an: result.an,
        dataOperare: result.dataOperare?.toISOString().split("T")[0] ?? "",
        tipOperatie: result.tipOperatie,
        stare: result.stare,
        tipDocumentId: result.tipDocumentId ?? undefined,
        numarDocument: result.numarDocument ?? undefined,
        dataDocument: result.dataDocument?.toISOString().split("T")[0] ?? undefined,
        descriere: result.descriere ?? undefined,
        createdAt: result.createdAt?.toISOString() ?? "",
        tranzactii: [],
        numarLinii: 0,
      };

      return c.json<ApiResponse<Operatiune>>({
        success: true,
        data: operatiune,
        message: `Operatiunea ${numarOpFormatted(operatiune)} a fost creata`,
      }, 201);
    } catch (error) {
      console.error("Create operatiune error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la crearea operatiunii" }, 500);
    }
  }
);

// ============================================================================
// POST /:id/finalizeaza - Finalize operatiune (lock)
// ============================================================================
operatiuniHeaderRoutes.post("/:id/finalizeaza", async (c) => {
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  try {
    await db.transaction(async (tx) => {
      const [op] = await tx
        .select()
        .from(operatiuni)
        .where(eq(operatiuni.id, id));

      if (!op) {
        throw new Error("NOT_FOUND:Operatiunea nu a fost gasita");
      }

      if (op.stare !== "deschisa") {
        throw new Error("INVALID_STATE:Doar operatiunile deschise pot fi finalizate");
      }

      // Check at least 1 line exists
      const [lineCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(tranzactii)
        .where(eq(tranzactii.operatiuneId, id));

      if (Number(lineCount.count) === 0) {
        throw new Error("INVALID_STATE:Operatiunea trebuie sa aiba cel putin o linie pentru a fi finalizata");
      }

      await tx
        .update(operatiuni)
        .set({ stare: "finalizata" })
        .where(eq(operatiuni.id, id));
    });

    return c.json<ApiResponse>({ success: true, message: "Operatiunea a fost finalizata" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare la finalizare";

    if (message.startsWith("NOT_FOUND:")) {
      return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
    }
    if (message.startsWith("INVALID_STATE:")) {
      return c.json<ApiResponse>({ success: false, message: message.slice(14) }, 400);
    }

    console.error("Finalizare operatiune error:", error);
    return c.json<ApiResponse>({ success: false, message: "Eroare la finalizarea operatiunii" }, 500);
  }
});

// ============================================================================
// POST /:id/anuleaza - Cancel operatiune (reverse all transactions)
// ============================================================================
operatiuniHeaderRoutes.post(
  "/:id/anuleaza",
  zValidator("json", anuleazaOperatiuneSchema, (result, c) => {
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
    const id = parseInt(c.req.param("id"));
    const data = c.req.valid("json");

    if (isNaN(id)) {
      return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
    }

    try {
      const result = await db.transaction(async (tx) => {
        const [op] = await tx
          .select()
          .from(operatiuni)
          .where(eq(operatiuni.id, id));

        if (!op) {
          throw new Error("NOT_FOUND:Operatiunea nu a fost gasita");
        }

        if (op.stare === "anulata") {
          throw new Error("INVALID_STATE:Operatiunea este deja anulata");
        }

        // Fetch all tranzactii in reverse order (most recent first)
        const linii = await tx
          .select()
          .from(tranzactii)
          .where(eq(tranzactii.operatiuneId, id))
          .orderBy(desc(tranzactii.id));

        // Reverse each transaction effect
        for (const tranzactie of linii) {
          const [asset] = await tx
            .select()
            .from(mijloaceFixe)
            .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));

          if (!asset) continue;

          switch (tranzactie.tip) {
            case "transfer": {
              const updateSet: Record<string, unknown> = {};
              if (tranzactie.gestiuneSursaId) {
                updateSet.gestiuneId = tranzactie.gestiuneSursaId;
              }
              updateSet.locFolosintaId = tranzactie.locFolosintaSursaId;
              await tx
                .update(mijloaceFixe)
                .set(updateSet)
                .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));
              break;
            }

            case "casare": {
              await tx
                .update(mijloaceFixe)
                .set({
                  stare: "activ",
                  dataIesire: null,
                  motivIesire: null,
                })
                .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));
              break;
            }

            case "declasare": {
              if (tranzactie.valoareInainte) {
                await tx
                  .update(mijloaceFixe)
                  .set({ valoareRamasa: tranzactie.valoareInainte })
                  .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));
              }
              break;
            }

            default: {
              if (tranzactie.valoareInainte) {
                await tx
                  .update(mijloaceFixe)
                  .set({ valoareRamasa: tranzactie.valoareInainte })
                  .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));
              }
              break;
            }
          }

          // Delete the transaction
          await tx
            .delete(tranzactii)
            .where(eq(tranzactii.id, tranzactie.id));
        }

        // Mark operatiune as cancelled
        await tx
          .update(operatiuni)
          .set({ stare: "anulata" })
          .where(eq(operatiuni.id, id));

        return linii.length;
      });

      return c.json<ApiResponse<{ liniiInversate: number }>>({
        success: true,
        data: { liniiInversate: result },
        message: `Operatiunea a fost anulata (${result} linii inversate)`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la anulare";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("INVALID_STATE:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(14) }, 400);
      }

      console.error("Anulare operatiune error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la anularea operatiunii" }, 500);
    }
  }
);

// ============================================================================
// POST /:id/linie-intrare - Add new MF as line in intrare operatiune (B.1)
// ============================================================================
operatiuniHeaderRoutes.post(
  "/:id/linie-intrare",
  zValidator("json", addLinieIntrareSchema, (result, c) => {
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
    const id = parseInt(c.req.param("id"));
    const data = c.req.valid("json");

    if (isNaN(id)) {
      return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
    }

    try {
      const result = await db.transaction(async (tx) => {
        // 1. Verify operatiune exists, is open, and is of type 'intrare'
        const [op] = await tx
          .select()
          .from(operatiuni)
          .where(eq(operatiuni.id, id));

        if (!op) {
          throw new Error("NOT_FOUND:Operatiunea nu a fost gasita");
        }
        if (op.stare !== "deschisa") {
          throw new Error("INVALID_STATE:Operatiunea nu este deschisa");
        }
        if (op.tipOperatie !== "intrare") {
          throw new Error("INVALID_STATE:Operatiunea nu este de tip intrare");
        }

        // 2. Verify numarInventar is unique
        const existing = await tx
          .select({ id: mijloaceFixe.id })
          .from(mijloaceFixe)
          .where(eq(mijloaceFixe.numarInventar, data.numarInventar))
          .limit(1);

        if (existing.length > 0) {
          throw new Error("DUPLICATE:Numarul de inventar exista deja");
        }

        // 3. Verify gestiune exists
        const [gest] = await tx
          .select()
          .from(gestiuni)
          .where(eq(gestiuni.id, data.gestiuneId));

        if (!gest) {
          throw new Error("INVALID_REF:Gestiunea nu exista");
        }

        // 4. Verify loc folosinta belongs to gestiune (if provided)
        if (data.locFolosintaId) {
          const [loc] = await tx
            .select()
            .from(locuriUilizare)
            .where(
              and(
                eq(locuriUilizare.id, data.locFolosintaId),
                eq(locuriUilizare.gestiuneId, data.gestiuneId)
              )
            );
          if (!loc) {
            throw new Error("INVALID_REF:Locul de folosinta nu apartine gestiunii");
          }
        }

        // 5. Verify cont exists
        const [cont] = await tx
          .select()
          .from(conturi)
          .where(eq(conturi.id, data.contId));

        if (!cont) {
          throw new Error("INVALID_REF:Contul nu exista");
        }

        // 6. Calculate derived values
        const valoareInventar = Money.fromDb(data.valoareInventar);
        const cotaAmortizareLunara = Money.calculateMonthlyDepreciation(
          valoareInventar,
          data.durataNormala
        );

        // 7. INSERT mijloc fix
        const [mfResult] = await tx.insert(mijloaceFixe).values({
          numarInventar: data.numarInventar,
          denumire: data.denumire,
          clasificareCod: data.clasificareCod,
          gestiuneId: data.gestiuneId,
          locFolosintaId: data.locFolosintaId || null,
          sursaFinantareId: data.sursaFinantareId || null,
          contId: data.contId,
          provenientaId: data.provenientaId || null,
          tipStocId: data.tipStocId || null,
          unitateMasuraId: data.unitateMasuraId || null,
          tipDocumentId: op.tipDocumentId,
          dataAchizitie: op.dataOperare,
          documentAchizitie: op.numarDocument,
          valoareInitiala: valoareInventar.toDbString(),
          valoareInventar: valoareInventar.toDbString(),
          valoareAmortizata: "0.00",
          valoareRamasa: valoareInventar.toDbString(),
          durataNormala: data.durataNormala,
          durataRamasa: data.durataNormala,
          cotaAmortizareLunara: cotaAmortizareLunara.toDbString(),
          eAmortizabil: data.eAmortizabil,
          stare: "activ",
        });

        const mijlocFixId = mfResult.insertId;

        // 8. INSERT tranzactie with operatiuneId
        const [trResult] = await tx.insert(tranzactii).values({
          mijlocFixId,
          operatiuneId: id,
          tip: "intrare",
          dataOperare: op.dataOperare,
          documentNumar: op.numarDocument,
          documentData: op.dataDocument,
          gestiuneDestinatieId: data.gestiuneId,
          locFolosintaDestinatieId: data.locFolosintaId || null,
          valoareOperatie: valoareInventar.toDbString(),
          descriere: data.descriere || null,
        });

        return { mijlocFixId, tranzactieId: trResult.insertId };
      });

      return c.json<ApiResponse<{ mijlocFixId: number; tranzactieId: number }>>({
        success: true,
        data: result,
        message: "Linie intrare adaugata",
      }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("INVALID_STATE:") || message.startsWith("DUPLICATE:") || message.startsWith("INVALID_REF:")) {
        return c.json<ApiResponse>({ success: false, message: message.split(":").slice(1).join(":") }, 400);
      }

      console.error("Add linie intrare error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la adaugarea liniei de intrare" }, 500);
    }
  }
);

// ============================================================================
// POST /:id/linie-iesire - Add existing MF as exit line (casare/declasare) (B.2)
// ============================================================================
operatiuniHeaderRoutes.post(
  "/:id/linie-iesire",
  zValidator("json", addLinieIesireSchema, (result, c) => {
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
    const id = parseInt(c.req.param("id"));
    const data = c.req.valid("json");

    if (isNaN(id)) {
      return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
    }

    try {
      const result = await db.transaction(async (tx) => {
        // 1. Verify operatiune exists, is open, and is of type 'iesire'
        const [op] = await tx
          .select()
          .from(operatiuni)
          .where(eq(operatiuni.id, id));

        if (!op) {
          throw new Error("NOT_FOUND:Operatiunea nu a fost gasita");
        }
        if (op.stare !== "deschisa") {
          throw new Error("INVALID_STATE:Operatiunea nu este deschisa");
        }
        if (op.tipOperatie !== "iesire") {
          throw new Error("INVALID_STATE:Operatiunea nu este de tip iesire");
        }

        // 2. Verify mijloc fix exists and is active
        const [asset] = await tx
          .select()
          .from(mijloaceFixe)
          .where(eq(mijloaceFixe.id, data.mijlocFixId));

        if (!asset) {
          throw new Error("NOT_FOUND:Mijlocul fix nu a fost gasit");
        }
        if (asset.stare !== "activ") {
          throw new Error("INVALID_STATE:Mijlocul fix nu este activ");
        }

        // 3. Verify MF is not already on another line in this operatiune
        const existingLine = await tx
          .select({ id: tranzactii.id })
          .from(tranzactii)
          .where(
            and(
              eq(tranzactii.operatiuneId, id),
              eq(tranzactii.mijlocFixId, data.mijlocFixId)
            )
          )
          .limit(1);

        if (existingLine.length > 0) {
          throw new Error("DUPLICATE:Mijlocul fix este deja adaugat in aceasta operatiune");
        }

        // 4. Apply exit logic based on tipIesire
        const tranzactieValues: Record<string, unknown> = {
          mijlocFixId: data.mijlocFixId,
          operatiuneId: id,
          dataOperare: op.dataOperare,
          documentNumar: op.numarDocument,
          documentData: op.dataDocument,
          descriere: data.motiv,
          observatii: data.observatii || null,
        };

        switch (data.tipIesire) {
          case "casare": {
            await tx
              .update(mijloaceFixe)
              .set({
                stare: "casare",
                dataIesire: op.dataOperare,
                motivIesire: data.motiv,
              })
              .where(eq(mijloaceFixe.id, data.mijlocFixId));

            tranzactieValues.tip = "casare";
            break;
          }

          case "declasare": {
            if (!data.valoareOperatie) {
              throw new Error("INVALID_VALUE:Valoarea operatiei este obligatorie pentru declasare");
            }

            const valoareRamasaCurenta = Money.fromDb(asset.valoareRamasa);
            const valoareReducere = Money.fromDb(data.valoareOperatie);

            if (valoareReducere.greaterThan(valoareRamasaCurenta)) {
              throw new Error("INVALID_VALUE:Valoarea reducerii depaseste valoarea ramasa");
            }
            if (valoareReducere.isZero() || valoareReducere.isNegative()) {
              throw new Error("INVALID_VALUE:Valoarea reducerii trebuie sa fie pozitiva");
            }

            const valoareRamasaNoua = valoareRamasaCurenta.minus(valoareReducere);

            await tx
              .update(mijloaceFixe)
              .set({ valoareRamasa: valoareRamasaNoua.toDbString() })
              .where(eq(mijloaceFixe.id, data.mijlocFixId));

            tranzactieValues.tip = "declasare";
            tranzactieValues.valoareOperatie = valoareReducere.toDbString();
            tranzactieValues.valoareInainte = valoareRamasaCurenta.toDbString();
            tranzactieValues.valoareDupa = valoareRamasaNoua.toDbString();
            break;
          }

          case "iesire": {
            await tx
              .update(mijloaceFixe)
              .set({
                stare: "casare",
                dataIesire: op.dataOperare,
                motivIesire: data.motiv,
              })
              .where(eq(mijloaceFixe.id, data.mijlocFixId));

            tranzactieValues.tip = "iesire";
            break;
          }
        }

        const [trResult] = await tx.insert(tranzactii).values(tranzactieValues as any);

        return { tranzactieId: trResult.insertId };
      });

      return c.json<ApiResponse<{ tranzactieId: number }>>({
        success: true,
        data: result,
        message: "Linie iesire adaugata",
      }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("INVALID_STATE:") || message.startsWith("DUPLICATE:") || message.startsWith("INVALID_VALUE:")) {
        return c.json<ApiResponse>({ success: false, message: message.split(":").slice(1).join(":") }, 400);
      }

      console.error("Add linie iesire error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la adaugarea liniei de iesire" }, 500);
    }
  }
);

// ============================================================================
// POST /:id/linie-transfer - Add transfer line to operatiune (B.3)
// ============================================================================
operatiuniHeaderRoutes.post(
  "/:id/linie-transfer",
  zValidator("json", addLinieTransferSchema, (result, c) => {
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
    const id = parseInt(c.req.param("id"));
    const data = c.req.valid("json");

    if (isNaN(id)) {
      return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
    }

    try {
      const result = await db.transaction(async (tx) => {
        // 1. Verify operatiune exists, is open, and is of type 'transfer'
        const [op] = await tx
          .select()
          .from(operatiuni)
          .where(eq(operatiuni.id, id));

        if (!op) {
          throw new Error("NOT_FOUND:Operatiunea nu a fost gasita");
        }
        if (op.stare !== "deschisa") {
          throw new Error("INVALID_STATE:Operatiunea nu este deschisa");
        }
        if (op.tipOperatie !== "transfer") {
          throw new Error("INVALID_STATE:Operatiunea nu este de tip transfer");
        }

        // 2. Verify mijloc fix exists and is active
        const [asset] = await tx
          .select()
          .from(mijloaceFixe)
          .where(eq(mijloaceFixe.id, data.mijlocFixId));

        if (!asset) {
          throw new Error("NOT_FOUND:Mijlocul fix nu a fost gasit");
        }
        if (asset.stare !== "activ") {
          throw new Error("INVALID_STATE:Mijlocul fix nu este activ");
        }

        // 3. Verify MF is not already on another line in this operatiune
        const existingLine = await tx
          .select({ id: tranzactii.id })
          .from(tranzactii)
          .where(
            and(
              eq(tranzactii.operatiuneId, id),
              eq(tranzactii.mijlocFixId, data.mijlocFixId)
            )
          )
          .limit(1);

        if (existingLine.length > 0) {
          throw new Error("DUPLICATE:Mijlocul fix este deja adaugat in aceasta operatiune");
        }

        // 4. Must have at least one transfer destination
        if (!data.gestiuneDestinatieId && !data.locFolosintaDestinatieId && !data.contDestinatieId) {
          throw new Error("INVALID_VALUE:Trebuie specificata cel putin o destinatie (gestiune, loc sau cont)");
        }

        const updateSet: Record<string, unknown> = {};
        const tranzactieValues: Record<string, unknown> = {
          mijlocFixId: data.mijlocFixId,
          operatiuneId: id,
          tip: "transfer",
          dataOperare: op.dataOperare,
          documentNumar: op.numarDocument,
          documentData: op.dataDocument,
          descriere: data.observatii || null,
        };

        // 5. Handle gestiune transfer
        if (data.gestiuneDestinatieId) {
          if (asset.gestiuneId === data.gestiuneDestinatieId) {
            throw new Error("INVALID_VALUE:Gestiunea destinatie trebuie sa fie diferita de cea curenta");
          }
          const [destGest] = await tx
            .select()
            .from(gestiuni)
            .where(eq(gestiuni.id, data.gestiuneDestinatieId));
          if (!destGest) {
            throw new Error("INVALID_REF:Gestiunea destinatie nu exista");
          }

          tranzactieValues.gestiuneSursaId = asset.gestiuneId;
          tranzactieValues.gestiuneDestinatieId = data.gestiuneDestinatieId;
          updateSet.gestiuneId = data.gestiuneDestinatieId;
          // Clear loc folosinta when changing gestiune, unless new loc is provided
          updateSet.locFolosintaId = data.locFolosintaDestinatieId || null;
        }

        // 6. Handle loc folosinta transfer
        if (data.locFolosintaDestinatieId) {
          const targetGestiuneId = data.gestiuneDestinatieId || asset.gestiuneId;
          const [destLoc] = await tx
            .select()
            .from(locuriUilizare)
            .where(
              and(
                eq(locuriUilizare.id, data.locFolosintaDestinatieId),
                eq(locuriUilizare.gestiuneId, targetGestiuneId)
              )
            );
          if (!destLoc) {
            throw new Error("INVALID_REF:Locul de folosinta nu apartine gestiunii destinatie");
          }

          tranzactieValues.locFolosintaSursaId = asset.locFolosintaId;
          tranzactieValues.locFolosintaDestinatieId = data.locFolosintaDestinatieId;
          updateSet.locFolosintaId = data.locFolosintaDestinatieId;
        }

        // 7. Handle cont transfer
        if (data.contDestinatieId) {
          const [destCont] = await tx
            .select()
            .from(conturi)
            .where(eq(conturi.id, data.contDestinatieId));
          if (!destCont) {
            throw new Error("INVALID_REF:Contul destinatie nu exista");
          }

          tranzactieValues.valoareInainte = String(asset.contId);
          tranzactieValues.valoareDupa = String(data.contDestinatieId);
          updateSet.contId = data.contDestinatieId;
        }

        // 8. Apply asset update
        if (Object.keys(updateSet).length > 0) {
          await tx
            .update(mijloaceFixe)
            .set(updateSet)
            .where(eq(mijloaceFixe.id, data.mijlocFixId));
        }

        // 9. Create tranzactie
        const [trResult] = await tx.insert(tranzactii).values(tranzactieValues as any);

        return { tranzactieId: trResult.insertId };
      });

      return c.json<ApiResponse<{ tranzactieId: number }>>({
        success: true,
        data: result,
        message: "Linie transfer adaugata",
      }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("INVALID_STATE:") || message.startsWith("DUPLICATE:") || message.startsWith("INVALID_VALUE:") || message.startsWith("INVALID_REF:")) {
        return c.json<ApiResponse>({ success: false, message: message.split(":").slice(1).join(":") }, 400);
      }

      console.error("Add linie transfer error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la adaugarea liniei de transfer" }, 500);
    }
  }
);

// ============================================================================
// DELETE /:id/linie/:tranzactieId - Remove line from open operatiune (B.4)
// ============================================================================
operatiuniHeaderRoutes.delete("/:id/linie/:tranzactieId", async (c) => {
  const id = parseInt(c.req.param("id"));
  const tranzactieId = parseInt(c.req.param("tranzactieId"));

  if (isNaN(id) || isNaN(tranzactieId)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Verify operatiune exists and is open
      const [op] = await tx
        .select()
        .from(operatiuni)
        .where(eq(operatiuni.id, id));

      if (!op) {
        throw new Error("NOT_FOUND:Operatiunea nu a fost gasita");
      }
      if (op.stare !== "deschisa") {
        throw new Error("INVALID_STATE:Liniile pot fi sterse doar din operatiuni deschise");
      }

      // 2. Verify tranzactie exists and belongs to this operatiune
      const [tranzactie] = await tx
        .select()
        .from(tranzactii)
        .where(
          and(
            eq(tranzactii.id, tranzactieId),
            eq(tranzactii.operatiuneId, id)
          )
        );

      if (!tranzactie) {
        throw new Error("NOT_FOUND:Tranzactia nu a fost gasita in aceasta operatiune");
      }

      // 3. Reverse the transaction effect on the asset
      const [asset] = await tx
        .select()
        .from(mijloaceFixe)
        .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));

      if (asset) {
        switch (tranzactie.tip) {
          case "transfer": {
            // Reverse: move asset back to source gestiune/loc
            const updateSet: Record<string, unknown> = {};
            if (tranzactie.gestiuneSursaId) {
              updateSet.gestiuneId = tranzactie.gestiuneSursaId;
            }
            updateSet.locFolosintaId = tranzactie.locFolosintaSursaId;
            // Handle cont transfer reversal (stored in valoareInainte/valoareDupa)
            if (tranzactie.valoareInainte && tranzactie.valoareDupa &&
                !tranzactie.gestiuneSursaId && !tranzactie.locFolosintaSursaId) {
              updateSet.contId = parseInt(tranzactie.valoareInainte);
            }
            await tx
              .update(mijloaceFixe)
              .set(updateSet)
              .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));
            break;
          }

          case "casare":
          case "iesire": {
            // Reverse: reactivate asset
            await tx
              .update(mijloaceFixe)
              .set({
                stare: "activ",
                dataIesire: null,
                motivIesire: null,
              })
              .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));
            break;
          }

          case "declasare": {
            // Reverse: restore previous value
            if (tranzactie.valoareInainte) {
              await tx
                .update(mijloaceFixe)
                .set({ valoareRamasa: tranzactie.valoareInainte })
                .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));
            }
            break;
          }

          case "intrare": {
            // Reverse: delete the created MF entirely
            await tx
              .delete(mijloaceFixe)
              .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));
            break;
          }

          default: {
            // Generic reversal with valoareInainte
            if (tranzactie.valoareInainte) {
              await tx
                .update(mijloaceFixe)
                .set({ valoareRamasa: tranzactie.valoareInainte })
                .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));
            }
            break;
          }
        }
      }

      // 4. Delete the transaction
      await tx
        .delete(tranzactii)
        .where(eq(tranzactii.id, tranzactieId));
    });

    return c.json<ApiResponse>({ success: true, message: "Linia a fost stearsa" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare";

    if (message.startsWith("NOT_FOUND:")) {
      return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
    }
    if (message.startsWith("INVALID_STATE:")) {
      return c.json<ApiResponse>({ success: false, message: message.slice(14) }, 400);
    }

    console.error("Delete linie error:", error);
    return c.json<ApiResponse>({ success: false, message: "Eroare la stergerea liniei" }, 500);
  }
});

// ============================================================================
// Helper
// ============================================================================
function numarOpFormatted(op: Operatiune): string {
  return `${op.numarOperatie}/${op.an}`;
}
