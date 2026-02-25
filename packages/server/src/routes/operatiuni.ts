import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, ne, sql, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "../db";
import {
  mijloaceFixe,
  tranzactii,
  gestiuni,
  locuriUilizare,
  conturi,
  operatiuni,
} from "../db/schema";
import { getNextNumarOperatie } from "../utils/operatiuni-helpers";
import { Money } from "shared";
import type { ApiResponse, Tranzactie } from "shared";
import {
  transferGestiuneSchema,
  transferLocSchema,
  casareSchema,
  declasareSchema,
  stergeTranzactieSchema,
  transferContSchema,
  stergeMijlocFixSchema,
  transferGestiuneMasaSchema,
  transferLocMasaSchema,
} from "../validation/operatiuni-schemas";

export const operatiuniRoutes = new Hono();

// ============================================================================
// GET /istoric/:mijlocFixId - Get transaction history for asset (OP-05)
// ============================================================================
operatiuniRoutes.get("/istoric/:mijlocFixId", async (c) => {
  const mijlocFixId = parseInt(c.req.param("mijlocFixId"));

  if (isNaN(mijlocFixId)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  try {
    // Create aliases for JOIN disambiguation
    const gestiuneSursa = alias(gestiuni, "gestiune_sursa");
    const gestiuneDestinatie = alias(gestiuni, "gestiune_destinatie");
    const locFolosintaSursa = alias(locuriUilizare, "loc_folosinta_sursa");
    const locFolosintaDestinatie = alias(locuriUilizare, "loc_folosinta_destinatie");

    const result = await db
      .select({
        tranzactie: tranzactii,
        gestiuneSursa: gestiuneSursa,
        gestiuneDestinatie: gestiuneDestinatie,
        locFolosintaSursa: locFolosintaSursa,
        locFolosintaDestinatie: locFolosintaDestinatie,
        operatiune: operatiuni,
      })
      .from(tranzactii)
      .leftJoin(gestiuneSursa, eq(tranzactii.gestiuneSursaId, gestiuneSursa.id))
      .leftJoin(gestiuneDestinatie, eq(tranzactii.gestiuneDestinatieId, gestiuneDestinatie.id))
      .leftJoin(locFolosintaSursa, eq(tranzactii.locFolosintaSursaId, locFolosintaSursa.id))
      .leftJoin(locFolosintaDestinatie, eq(tranzactii.locFolosintaDestinatieId, locFolosintaDestinatie.id))
      .leftJoin(operatiuni, eq(tranzactii.operatiuneId, operatiuni.id))
      .where(eq(tranzactii.mijlocFixId, mijlocFixId))
      .orderBy(desc(tranzactii.dataOperare), desc(tranzactii.createdAt));

    // Map to API response
    const items: Tranzactie[] = result.map((row) => ({
      id: row.tranzactie.id,
      mijlocFixId: row.tranzactie.mijlocFixId,
      operatiuneId: row.tranzactie.operatiuneId ?? undefined,
      operatiune: row.operatiune
        ? {
            id: row.operatiune.id,
            numarOperatie: row.operatiune.numarOperatie,
            an: row.operatiune.an,
            dataOperare: row.operatiune.dataOperare?.toISOString().split("T")[0] ?? "",
            tipOperatie: row.operatiune.tipOperatie,
            stare: row.operatiune.stare,
            createdAt: row.operatiune.createdAt?.toISOString() ?? "",
          }
        : undefined,
      tip: row.tranzactie.tip,
      dataOperare: row.tranzactie.dataOperare?.toISOString().split("T")[0] ?? "",
      documentNumar: row.tranzactie.documentNumar ?? undefined,
      documentData: row.tranzactie.documentData?.toISOString().split("T")[0] ?? undefined,
      gestiuneSursaId: row.tranzactie.gestiuneSursaId ?? undefined,
      gestiuneDestinatieId: row.tranzactie.gestiuneDestinatieId ?? undefined,
      locFolosintaSursaId: row.tranzactie.locFolosintaSursaId ?? undefined,
      locFolosintaDestinatieId: row.tranzactie.locFolosintaDestinatieId ?? undefined,
      gestiuneSursa: row.gestiuneSursa
        ? {
            id: row.gestiuneSursa.id,
            cod: row.gestiuneSursa.cod,
            denumire: row.gestiuneSursa.denumire,
            responsabil: row.gestiuneSursa.responsabil ?? undefined,
            activ: row.gestiuneSursa.activ ?? true,
          }
        : undefined,
      gestiuneDestinatie: row.gestiuneDestinatie
        ? {
            id: row.gestiuneDestinatie.id,
            cod: row.gestiuneDestinatie.cod,
            denumire: row.gestiuneDestinatie.denumire,
            responsabil: row.gestiuneDestinatie.responsabil ?? undefined,
            activ: row.gestiuneDestinatie.activ ?? true,
          }
        : undefined,
      locFolosintaSursa: row.locFolosintaSursa
        ? {
            id: row.locFolosintaSursa.id,
            gestiuneId: row.locFolosintaSursa.gestiuneId,
            cod: row.locFolosintaSursa.cod,
            denumire: row.locFolosintaSursa.denumire,
            activ: row.locFolosintaSursa.activ ?? true,
          }
        : undefined,
      locFolosintaDestinatie: row.locFolosintaDestinatie
        ? {
            id: row.locFolosintaDestinatie.id,
            gestiuneId: row.locFolosintaDestinatie.gestiuneId,
            cod: row.locFolosintaDestinatie.cod,
            denumire: row.locFolosintaDestinatie.denumire,
            activ: row.locFolosintaDestinatie.activ ?? true,
          }
        : undefined,
      valoareOperatie: row.tranzactie.valoareOperatie ?? undefined,
      valoareInainte: row.tranzactie.valoareInainte ?? undefined,
      valoareDupa: row.tranzactie.valoareDupa ?? undefined,
      descriere: row.tranzactie.descriere ?? undefined,
      observatii: row.tranzactie.observatii ?? undefined,
      createdAt: row.tranzactie.createdAt?.toISOString() ?? "",
    }));

    return c.json<ApiResponse<Tranzactie[]>>({ success: true, data: items });
  } catch (error) {
    console.error("Get istoric error:", error);
    return c.json<ApiResponse>({ success: false, message: "Eroare la obtinerea istoricului" }, 500);
  }
});

// ============================================================================
// POST /transfer-gestiune - Transfer asset between gestiuni (OP-01)
// ============================================================================
operatiuniRoutes.post(
  "/transfer-gestiune",
  zValidator("json", transferGestiuneSchema, (result, c) => {
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
      await db.transaction(async (tx) => {
        // 1. Fetch asset and verify it's active
        const [asset] = await tx
          .select()
          .from(mijloaceFixe)
          .where(eq(mijloaceFixe.id, data.mijlocFixId));

        if (!asset) {
          throw new Error("NOT_FOUND:Mijlocul fix nu a fost gasit");
        }

        if (asset.stare !== "activ") {
          throw new Error("INVALID_STATE:Operatiunea poate fi efectuata doar pe mijloace fixe active");
        }

        // 2. Verify destination gestiune exists and is different from current
        const [destGestiune] = await tx
          .select()
          .from(gestiuni)
          .where(eq(gestiuni.id, data.gestiuneDestinatieId));

        if (!destGestiune) {
          throw new Error("INVALID_DEST:Gestiunea destinatie nu exista");
        }

        if (asset.gestiuneId === data.gestiuneDestinatieId) {
          throw new Error("INVALID_DEST:Gestiunea destinatie trebuie sa fie diferita de gestiunea curenta");
        }

        // 3. Verify locFolosintaDestinatie belongs to destination gestiune (if provided)
        if (data.locFolosintaDestinatieId) {
          const [destLoc] = await tx
            .select()
            .from(locuriUilizare)
            .where(
              and(
                eq(locuriUilizare.id, data.locFolosintaDestinatieId),
                eq(locuriUilizare.gestiuneId, data.gestiuneDestinatieId)
              )
            );

          if (!destLoc) {
            throw new Error("INVALID_LOC:Locul de folosinta nu apartine gestiunii destinatie");
          }
        }

        // 4. Update asset
        await tx
          .update(mijloaceFixe)
          .set({
            gestiuneId: data.gestiuneDestinatieId,
            // Clear locFolosinta when changing gestiune (unless new loc provided)
            locFolosintaId: data.locFolosintaDestinatieId || null,
          })
          .where(eq(mijloaceFixe.id, data.mijlocFixId));

        // 5. Create operatiune header (one-shot = finalizata direct)
        const an = new Date(data.dataOperare).getFullYear();
        const numarOp = await getNextNumarOperatie(tx, an);

        const [opResult] = await tx.insert(operatiuni).values({
          numarOperatie: numarOp,
          an,
          dataOperare: new Date(data.dataOperare),
          tipOperatie: "transfer",
          stare: "finalizata",
          numarDocument: data.documentNumar || null,
          dataDocument: data.documentData ? new Date(data.documentData) : null,
          descriere: `Transfer gestiune: ${asset.gestiuneId} -> ${data.gestiuneDestinatieId}`,
        });

        // 6. Create transaction record with operatiuneId
        await tx.insert(tranzactii).values({
          mijlocFixId: data.mijlocFixId,
          operatiuneId: opResult.insertId,
          tip: "transfer",
          dataOperare: new Date(data.dataOperare),
          documentNumar: data.documentNumar || null,
          documentData: data.documentData ? new Date(data.documentData) : null,
          gestiuneSursaId: asset.gestiuneId,
          gestiuneDestinatieId: data.gestiuneDestinatieId,
          locFolosintaSursaId: asset.locFolosintaId,
          locFolosintaDestinatieId: data.locFolosintaDestinatieId || null,
          descriere: data.observatii || null,
        });
      });

      return c.json<ApiResponse>({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la transfer";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("INVALID_STATE:") || message.startsWith("INVALID_DEST:") || message.startsWith("INVALID_LOC:")) {
        return c.json<ApiResponse>({ success: false, message: message.split(":")[1] }, 400);
      }

      console.error("Transfer gestiune error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la efectuarea transferului" }, 500);
    }
  }
);

// ============================================================================
// POST /transfer-loc - Transfer asset within same gestiune (OP-02)
// ============================================================================
operatiuniRoutes.post(
  "/transfer-loc",
  zValidator("json", transferLocSchema, (result, c) => {
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
      await db.transaction(async (tx) => {
        // 1. Fetch asset and verify it's active
        const [asset] = await tx
          .select()
          .from(mijloaceFixe)
          .where(eq(mijloaceFixe.id, data.mijlocFixId));

        if (!asset) {
          throw new Error("NOT_FOUND:Mijlocul fix nu a fost gasit");
        }

        if (asset.stare !== "activ") {
          throw new Error("INVALID_STATE:Operatiunea poate fi efectuata doar pe mijloace fixe active");
        }

        // 2. Verify destination locFolosinta belongs to same gestiune as asset
        const [destLoc] = await tx
          .select()
          .from(locuriUilizare)
          .where(
            and(
              eq(locuriUilizare.id, data.locFolosintaDestinatieId),
              eq(locuriUilizare.gestiuneId, asset.gestiuneId)
            )
          );

        if (!destLoc) {
          throw new Error("INVALID_LOC:Locul de folosinta nu apartine gestiunii curente");
        }

        if (asset.locFolosintaId === data.locFolosintaDestinatieId) {
          throw new Error("INVALID_LOC:Locul de folosinta destinatie trebuie sa fie diferit de cel curent");
        }

        // 3. Update asset
        await tx
          .update(mijloaceFixe)
          .set({
            locFolosintaId: data.locFolosintaDestinatieId,
          })
          .where(eq(mijloaceFixe.id, data.mijlocFixId));

        // 4. Create operatiune header
        const an = new Date(data.dataOperare).getFullYear();
        const numarOp = await getNextNumarOperatie(tx, an);

        const [opResult] = await tx.insert(operatiuni).values({
          numarOperatie: numarOp,
          an,
          dataOperare: new Date(data.dataOperare),
          tipOperatie: "transfer",
          stare: "finalizata",
          numarDocument: data.documentNumar || null,
          dataDocument: data.documentData ? new Date(data.documentData) : null,
          descriere: `Transfer loc: ${asset.locFolosintaId} -> ${data.locFolosintaDestinatieId}`,
        });

        // 5. Create transaction record with operatiuneId
        await tx.insert(tranzactii).values({
          mijlocFixId: data.mijlocFixId,
          operatiuneId: opResult.insertId,
          tip: "transfer",
          dataOperare: new Date(data.dataOperare),
          documentNumar: data.documentNumar || null,
          documentData: data.documentData ? new Date(data.documentData) : null,
          gestiuneSursaId: null,
          gestiuneDestinatieId: null,
          locFolosintaSursaId: asset.locFolosintaId,
          locFolosintaDestinatieId: data.locFolosintaDestinatieId,
          descriere: data.observatii || null,
        });
      });

      return c.json<ApiResponse>({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la transfer";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("INVALID_STATE:") || message.startsWith("INVALID_LOC:")) {
        return c.json<ApiResponse>({ success: false, message: message.split(":")[1] }, 400);
      }

      console.error("Transfer loc error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la efectuarea transferului" }, 500);
    }
  }
);

// ============================================================================
// POST /casare - Dispose of asset (OP-03)
// ============================================================================
operatiuniRoutes.post(
  "/casare",
  zValidator("json", casareSchema, (result, c) => {
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
      await db.transaction(async (tx) => {
        // 1. Fetch asset and verify it's active
        const [asset] = await tx
          .select()
          .from(mijloaceFixe)
          .where(eq(mijloaceFixe.id, data.mijlocFixId));

        if (!asset) {
          throw new Error("NOT_FOUND:Mijlocul fix nu a fost gasit");
        }

        if (asset.stare !== "activ") {
          throw new Error("INVALID_STATE:Casarea poate fi efectuata doar pe mijloace fixe active");
        }

        // 2. Update asset - set stare to "casare" and record exit details
        await tx
          .update(mijloaceFixe)
          .set({
            stare: "casare",
            dataIesire: new Date(data.dataOperare),
            motivIesire: data.motivCasare,
          })
          .where(eq(mijloaceFixe.id, data.mijlocFixId));

        // 3. Create operatiune header
        const an = new Date(data.dataOperare).getFullYear();
        const numarOp = await getNextNumarOperatie(tx, an);

        const [opResult] = await tx.insert(operatiuni).values({
          numarOperatie: numarOp,
          an,
          dataOperare: new Date(data.dataOperare),
          tipOperatie: "iesire",
          stare: "finalizata",
          numarDocument: data.documentNumar || null,
          dataDocument: data.documentData ? new Date(data.documentData) : null,
          descriere: `Casare: ${data.motivCasare}`,
        });

        // 4. Create transaction record with operatiuneId
        await tx.insert(tranzactii).values({
          mijlocFixId: data.mijlocFixId,
          operatiuneId: opResult.insertId,
          tip: "casare",
          dataOperare: new Date(data.dataOperare),
          documentNumar: data.documentNumar || null,
          documentData: data.documentData ? new Date(data.documentData) : null,
          descriere: data.motivCasare,
          observatii: data.observatii || null,
        });
      });

      return c.json<ApiResponse>({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la casare";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("INVALID_STATE:")) {
        return c.json<ApiResponse>({ success: false, message: message.split(":")[1] }, 400);
      }

      console.error("Casare error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la efectuarea casarii" }, 500);
    }
  }
);

// ============================================================================
// POST /declasare - Reduce asset value (OP-04)
// ============================================================================
operatiuniRoutes.post(
  "/declasare",
  zValidator("json", declasareSchema, (result, c) => {
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
      await db.transaction(async (tx) => {
        // 1. Fetch asset and verify it's active
        const [asset] = await tx
          .select()
          .from(mijloaceFixe)
          .where(eq(mijloaceFixe.id, data.mijlocFixId));

        if (!asset) {
          throw new Error("NOT_FOUND:Mijlocul fix nu a fost gasit");
        }

        if (asset.stare !== "activ") {
          throw new Error("INVALID_STATE:Declasarea poate fi efectuata doar pe mijloace fixe active");
        }

        // 2. Parse monetary values using Money class for precision
        const valoareRamasaCurenta = Money.fromDb(asset.valoareRamasa);
        const valoareReducere = Money.fromDb(data.valoareReducere);

        // 3. Verify reduction doesn't exceed remaining value
        if (valoareReducere.greaterThan(valoareRamasaCurenta)) {
          throw new Error("INVALID_VALUE:Valoarea reducerii nu poate depasi valoarea ramasa");
        }

        if (valoareReducere.isZero() || valoareReducere.isNegative()) {
          throw new Error("INVALID_VALUE:Valoarea reducerii trebuie sa fie pozitiva");
        }

        // 4. Calculate new valoareRamasa
        const valoareRamasaNoua = valoareRamasaCurenta.minus(valoareReducere);

        // 5. Update asset
        await tx
          .update(mijloaceFixe)
          .set({
            valoareRamasa: valoareRamasaNoua.toDbString(),
          })
          .where(eq(mijloaceFixe.id, data.mijlocFixId));

        // 6. Create operatiune header
        const an = new Date(data.dataOperare).getFullYear();
        const numarOp = await getNextNumarOperatie(tx, an);

        const [opResult] = await tx.insert(operatiuni).values({
          numarOperatie: numarOp,
          an,
          dataOperare: new Date(data.dataOperare),
          tipOperatie: "ajustare",
          stare: "finalizata",
          numarDocument: data.documentNumar || null,
          dataDocument: data.documentData ? new Date(data.documentData) : null,
          descriere: `Declasare: ${data.motivDeclasare}`,
        });

        // 7. Create transaction record with operatiuneId
        await tx.insert(tranzactii).values({
          mijlocFixId: data.mijlocFixId,
          operatiuneId: opResult.insertId,
          tip: "declasare",
          dataOperare: new Date(data.dataOperare),
          documentNumar: data.documentNumar || null,
          documentData: data.documentData ? new Date(data.documentData) : null,
          valoareOperatie: valoareReducere.toDbString(),
          valoareInainte: valoareRamasaCurenta.toDbString(),
          valoareDupa: valoareRamasaNoua.toDbString(),
          descriere: data.motivDeclasare,
          observatii: data.observatii || null,
        });
      });

      return c.json<ApiResponse>({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la declasare";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("INVALID_STATE:") || message.startsWith("INVALID_VALUE:")) {
        return c.json<ApiResponse>({ success: false, message: message.split(":")[1] }, 400);
      }

      console.error("Declasare error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la efectuarea declasarii" }, 500);
    }
  }
);

// ============================================================================
// DELETE /stergere-tranzactie - Reverse and delete a transaction (OP-06)
// Only the most recent transaction for an asset can be deleted.
// Reverses the effect on the asset (transfer -> move back, casare -> reactivate, etc.)
// Legacy equivalent: ST_OPER.PRG
// ============================================================================
operatiuniRoutes.post(
  "/stergere-tranzactie",
  zValidator("json", stergeTranzactieSchema, (result, c) => {
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
      await db.transaction(async (tx) => {
        // 1. Fetch the transaction
        const [tranzactie] = await tx
          .select()
          .from(tranzactii)
          .where(eq(tranzactii.id, data.tranzactieId));

        if (!tranzactie) {
          throw new Error("NOT_FOUND:Tranzactia nu a fost gasita");
        }

        // 2. Check this is the most recent transaction for the asset
        const [newerTranzactie] = await tx
          .select({ id: tranzactii.id })
          .from(tranzactii)
          .where(
            and(
              eq(tranzactii.mijlocFixId, tranzactie.mijlocFixId),
              ne(tranzactii.id, tranzactie.id)
            )
          )
          .orderBy(desc(tranzactii.dataOperare), desc(tranzactii.createdAt))
          .limit(1);

        if (newerTranzactie && newerTranzactie.id !== tranzactie.id) {
          // Verify it's actually newer (the ordered query returned the most recent)
          const [mostRecent] = await tx
            .select({ id: tranzactii.id })
            .from(tranzactii)
            .where(eq(tranzactii.mijlocFixId, tranzactie.mijlocFixId))
            .orderBy(desc(tranzactii.dataOperare), desc(tranzactii.createdAt))
            .limit(1);

          if (mostRecent && mostRecent.id !== tranzactie.id) {
            throw new Error(
              "BLOCKED:Nu se poate sterge deoarece exista tranzactii ulterioare pentru acest mijloc fix"
            );
          }
        }

        // 3. Fetch the asset
        const [asset] = await tx
          .select()
          .from(mijloaceFixe)
          .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));

        if (!asset) {
          throw new Error("NOT_FOUND:Mijlocul fix asociat nu a fost gasit");
        }

        // 4. Reverse the transaction effect based on type
        switch (tranzactie.tip) {
          case "transfer": {
            // Reverse: move asset back to source gestiune/loc
            const updateSet: Record<string, unknown> = {};
            if (tranzactie.gestiuneSursaId) {
              updateSet.gestiuneId = tranzactie.gestiuneSursaId;
            }
            // Restore original loc (could be null)
            if (tranzactie.gestiuneSursaId) {
              updateSet.locFolosintaId = tranzactie.locFolosintaSursaId;
            } else {
              // Loc-only transfer
              updateSet.locFolosintaId = tranzactie.locFolosintaSursaId;
            }
            await tx
              .update(mijloaceFixe)
              .set(updateSet)
              .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));
            break;
          }

          case "casare": {
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
                .set({
                  valoareRamasa: tranzactie.valoareInainte,
                })
                .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));
            }
            break;
          }

          case "intrare": {
            // Cannot reverse initial entry - asset would need to be deleted entirely
            throw new Error(
              "BLOCKED:Nu se poate sterge tranzactia de intrare. Folositi 'Stergere mijloc fix' pentru a elimina activul"
            );
          }

          default: {
            // For other types (reevaluare, modernizare, iesire), restore value if tracked
            if (tranzactie.valoareInainte) {
              await tx
                .update(mijloaceFixe)
                .set({
                  valoareRamasa: tranzactie.valoareInainte,
                })
                .where(eq(mijloaceFixe.id, tranzactie.mijlocFixId));
            }
            break;
          }
        }

        // 5. Delete the transaction
        await tx
          .delete(tranzactii)
          .where(eq(tranzactii.id, data.tranzactieId));

        // 6. Cleanup orphaned operatiune if no transactions remain
        if (tranzactie.operatiuneId) {
          const [remaining] = await tx
            .select({ count: sql<number>`COUNT(*)` })
            .from(tranzactii)
            .where(eq(tranzactii.operatiuneId, tranzactie.operatiuneId));

          if (remaining.count === 0) {
            await tx
              .delete(operatiuni)
              .where(eq(operatiuni.id, tranzactie.operatiuneId));
          }
        }
      });

      return c.json<ApiResponse>({ success: true, message: "Tranzactia a fost stearsa si efectele inversate" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la stergere";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("BLOCKED:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(8) }, 400);
      }

      console.error("Stergere tranzactie error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la stergerea tranzactiei" }, 500);
    }
  }
);

// ============================================================================
// POST /transfer-cont - Mass transfer assets to different account (OP-07)
// Legacy equivalent: MOD_CONT.SPR
// ============================================================================
operatiuniRoutes.post(
  "/transfer-cont",
  zValidator("json", transferContSchema, (result, c) => {
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
        // 1. Validate accounts exist and are different
        if (data.contSursaId === data.contDestinatieId) {
          throw new Error("INVALID:Contul sursa si destinatie trebuie sa fie diferite");
        }

        const [contSursa] = await tx
          .select()
          .from(conturi)
          .where(eq(conturi.id, data.contSursaId));
        if (!contSursa) {
          throw new Error("NOT_FOUND:Contul sursa nu exista");
        }

        const [contDest] = await tx
          .select()
          .from(conturi)
          .where(eq(conturi.id, data.contDestinatieId));
        if (!contDest) {
          throw new Error("NOT_FOUND:Contul destinatie nu exista");
        }

        if (contDest.titlu) {
          throw new Error("INVALID:Contul destinatie nu poate fi un cont titlu (capitol)");
        }

        // 2. Find matching active assets
        let conditions = [
          eq(mijloaceFixe.contId, data.contSursaId),
          eq(mijloaceFixe.stare, "activ"),
        ];

        if (data.numarInventar) {
          conditions.push(eq(mijloaceFixe.numarInventar, data.numarInventar));
        }

        const assets = await tx
          .select({ id: mijloaceFixe.id, numarInventar: mijloaceFixe.numarInventar })
          .from(mijloaceFixe)
          .where(and(...conditions));

        if (assets.length === 0) {
          throw new Error("NOT_FOUND:Nu exista mijloace fixe active la contul sursa");
        }

        // 3. Update all matching assets
        const assetIds = assets.map((a) => a.id);
        await tx
          .update(mijloaceFixe)
          .set({ contId: data.contDestinatieId })
          .where(inArray(mijloaceFixe.id, assetIds));

        // 4. Create ONE operatiune header for all transfers
        const an = new Date(data.dataOperare).getFullYear();
        const numarOp = await getNextNumarOperatie(tx, an);

        const [opResult] = await tx.insert(operatiuni).values({
          numarOperatie: numarOp,
          an,
          dataOperare: new Date(data.dataOperare),
          tipOperatie: "transfer",
          stare: "finalizata",
          numarDocument: data.documentNumar || null,
          dataDocument: data.documentData ? new Date(data.documentData) : null,
          descriere: `Transfer cont masa: ${contSursa.simbol} -> ${contDest.simbol} (${assets.length} MF)`,
        });

        // 5. Create transaction records for each asset with same operatiuneId
        for (const asset of assets) {
          await tx.insert(tranzactii).values({
            mijlocFixId: asset.id,
            operatiuneId: opResult.insertId,
            tip: "transfer",
            dataOperare: new Date(data.dataOperare),
            documentNumar: data.documentNumar || null,
            documentData: data.documentData ? new Date(data.documentData) : null,
            descriere: `Transfer cont: ${contSursa.simbol} -> ${contDest.simbol}`,
            observatii: data.observatii || null,
          });
        }

        return assets.length;
      });

      return c.json<ApiResponse<{ count: number }>>({
        success: true,
        data: { count: result },
        message: `${result} mijloace fixe transferate la noul cont`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la transfer cont";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("INVALID:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(8) }, 400);
      }

      console.error("Transfer cont error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la transferul de cont" }, 500);
    }
  }
);

// ============================================================================
// POST /stergere-mijloc-fix - Delete unused asset (OP-08)
// Only assets with no transactions beyond initial entry can be deleted.
// Legacy equivalent: ST_MATER.SPR
// ============================================================================
operatiuniRoutes.post(
  "/stergere-mijloc-fix",
  zValidator("json", stergeMijlocFixSchema, (result, c) => {
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
      await db.transaction(async (tx) => {
        // 1. Fetch asset
        const [asset] = await tx
          .select()
          .from(mijloaceFixe)
          .where(eq(mijloaceFixe.id, data.mijlocFixId));

        if (!asset) {
          throw new Error("NOT_FOUND:Mijlocul fix nu a fost gasit");
        }

        // 2. Check for non-intrare transactions
        const nonIntrareTransactions = await tx
          .select({ id: tranzactii.id })
          .from(tranzactii)
          .where(
            and(
              eq(tranzactii.mijlocFixId, data.mijlocFixId),
              ne(tranzactii.tip, "intrare")
            )
          )
          .limit(1);

        if (nonIntrareTransactions.length > 0) {
          throw new Error(
            "BLOCKED:Mijlocul fix nu poate fi sters deoarece are tranzactii (operatiuni) inregistrate"
          );
        }

        // 3. Delete all transactions (intrare records) for this asset
        await tx
          .delete(tranzactii)
          .where(eq(tranzactii.mijlocFixId, data.mijlocFixId));

        // 4. Delete the asset
        await tx
          .delete(mijloaceFixe)
          .where(eq(mijloaceFixe.id, data.mijlocFixId));
      });

      return c.json<ApiResponse>({ success: true, message: "Mijlocul fix a fost sters" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la stergere";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("BLOCKED:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(8) }, 400);
      }

      console.error("Stergere mijloc fix error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la stergerea mijlocului fix" }, 500);
    }
  }
);

// ============================================================================
// POST /transfer-gestiune-masa - Mass transfer gestiune (OP-09)
// Legacy equivalent: MOD_GEST.SPR
// ============================================================================
operatiuniRoutes.post(
  "/transfer-gestiune-masa",
  zValidator("json", transferGestiuneMasaSchema, (result, c) => {
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
        // 1. Validate gestiuni exist and are different
        if (data.gestiuneSursaId === data.gestiuneDestinatieId) {
          throw new Error("INVALID:Gestiunea sursa si destinatie trebuie sa fie diferite");
        }

        const [gestSursa] = await tx
          .select()
          .from(gestiuni)
          .where(eq(gestiuni.id, data.gestiuneSursaId));
        if (!gestSursa) {
          throw new Error("NOT_FOUND:Gestiunea sursa nu exista");
        }

        const [gestDest] = await tx
          .select()
          .from(gestiuni)
          .where(eq(gestiuni.id, data.gestiuneDestinatieId));
        if (!gestDest) {
          throw new Error("NOT_FOUND:Gestiunea destinatie nu exista");
        }

        // 2. Find matching active assets
        let conditions = [
          eq(mijloaceFixe.gestiuneId, data.gestiuneSursaId),
          eq(mijloaceFixe.stare, "activ"),
        ];

        if (data.numarInventar) {
          conditions.push(eq(mijloaceFixe.numarInventar, data.numarInventar));
        }

        const assets = await tx
          .select({
            id: mijloaceFixe.id,
            gestiuneId: mijloaceFixe.gestiuneId,
            locFolosintaId: mijloaceFixe.locFolosintaId,
          })
          .from(mijloaceFixe)
          .where(and(...conditions));

        if (assets.length === 0) {
          throw new Error("NOT_FOUND:Nu exista mijloace fixe active in gestiunea sursa");
        }

        // 3. Update all matching assets (clear locFolosinta since it belongs to old gestiune)
        const assetIds = assets.map((a) => a.id);
        await tx
          .update(mijloaceFixe)
          .set({ gestiuneId: data.gestiuneDestinatieId, locFolosintaId: null })
          .where(inArray(mijloaceFixe.id, assetIds));

        // 4. Create ONE operatiune header for all transfers
        const an = new Date(data.dataOperare).getFullYear();
        const numarOp = await getNextNumarOperatie(tx, an);

        const [opResult] = await tx.insert(operatiuni).values({
          numarOperatie: numarOp,
          an,
          dataOperare: new Date(data.dataOperare),
          tipOperatie: "transfer",
          stare: "finalizata",
          numarDocument: data.documentNumar || null,
          dataDocument: data.documentData ? new Date(data.documentData) : null,
          descriere: `Transfer masa gestiune: ${gestSursa.denumire} -> ${gestDest.denumire} (${assets.length} MF)`,
        });

        // 5. Create transaction records with same operatiuneId
        for (const asset of assets) {
          await tx.insert(tranzactii).values({
            mijlocFixId: asset.id,
            operatiuneId: opResult.insertId,
            tip: "transfer",
            dataOperare: new Date(data.dataOperare),
            documentNumar: data.documentNumar || null,
            documentData: data.documentData ? new Date(data.documentData) : null,
            gestiuneSursaId: asset.gestiuneId,
            gestiuneDestinatieId: data.gestiuneDestinatieId,
            locFolosintaSursaId: asset.locFolosintaId,
            locFolosintaDestinatieId: null,
            descriere: `Transfer masa gestiune: ${gestSursa.denumire} -> ${gestDest.denumire}`,
            observatii: data.observatii || null,
          });
        }

        return assets.length;
      });

      return c.json<ApiResponse<{ count: number }>>({
        success: true,
        data: { count: result },
        message: `${result} mijloace fixe transferate in noua gestiune`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la transfer";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("INVALID:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(8) }, 400);
      }

      console.error("Transfer gestiune masa error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la transferul de gestiune" }, 500);
    }
  }
);

// ============================================================================
// POST /transfer-loc-masa - Mass transfer location (OP-10)
// Legacy equivalent: MOD_DISP.SPR
// ============================================================================
operatiuniRoutes.post(
  "/transfer-loc-masa",
  zValidator("json", transferLocMasaSchema, (result, c) => {
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
        // 1. Validate locations exist, are different, and belong to the same gestiune
        if (data.locFolosintaSursaId === data.locFolosintaDestinatieId) {
          throw new Error("INVALID:Locul sursa si destinatie trebuie sa fie diferite");
        }

        const [locSursa] = await tx
          .select()
          .from(locuriUilizare)
          .where(
            and(
              eq(locuriUilizare.id, data.locFolosintaSursaId),
              eq(locuriUilizare.gestiuneId, data.gestiuneId)
            )
          );
        if (!locSursa) {
          throw new Error("NOT_FOUND:Locul sursa nu exista sau nu apartine gestiunii specificate");
        }

        const [locDest] = await tx
          .select()
          .from(locuriUilizare)
          .where(
            and(
              eq(locuriUilizare.id, data.locFolosintaDestinatieId),
              eq(locuriUilizare.gestiuneId, data.gestiuneId)
            )
          );
        if (!locDest) {
          throw new Error("NOT_FOUND:Locul destinatie nu exista sau nu apartine gestiunii specificate");
        }

        // 2. Find matching active assets
        let conditions = [
          eq(mijloaceFixe.gestiuneId, data.gestiuneId),
          eq(mijloaceFixe.locFolosintaId, data.locFolosintaSursaId),
          eq(mijloaceFixe.stare, "activ"),
        ];

        if (data.numarInventar) {
          conditions.push(eq(mijloaceFixe.numarInventar, data.numarInventar));
        }

        const assets = await tx
          .select({
            id: mijloaceFixe.id,
            locFolosintaId: mijloaceFixe.locFolosintaId,
          })
          .from(mijloaceFixe)
          .where(and(...conditions));

        if (assets.length === 0) {
          throw new Error("NOT_FOUND:Nu exista mijloace fixe active la locul sursa");
        }

        // 3. Update all matching assets
        const assetIds = assets.map((a) => a.id);
        await tx
          .update(mijloaceFixe)
          .set({ locFolosintaId: data.locFolosintaDestinatieId })
          .where(inArray(mijloaceFixe.id, assetIds));

        // 4. Create ONE operatiune header for all transfers
        const an = new Date(data.dataOperare).getFullYear();
        const numarOp = await getNextNumarOperatie(tx, an);

        const [opResult] = await tx.insert(operatiuni).values({
          numarOperatie: numarOp,
          an,
          dataOperare: new Date(data.dataOperare),
          tipOperatie: "transfer",
          stare: "finalizata",
          numarDocument: data.documentNumar || null,
          dataDocument: data.documentData ? new Date(data.documentData) : null,
          descriere: `Transfer masa loc: ${locSursa.denumire} -> ${locDest.denumire} (${assets.length} MF)`,
        });

        // 5. Create transaction records with same operatiuneId
        for (const asset of assets) {
          await tx.insert(tranzactii).values({
            mijlocFixId: asset.id,
            operatiuneId: opResult.insertId,
            tip: "transfer",
            dataOperare: new Date(data.dataOperare),
            documentNumar: data.documentNumar || null,
            documentData: data.documentData ? new Date(data.documentData) : null,
            locFolosintaSursaId: asset.locFolosintaId,
            locFolosintaDestinatieId: data.locFolosintaDestinatieId,
            descriere: `Transfer masa loc: ${locSursa.denumire} -> ${locDest.denumire}`,
            observatii: data.observatii || null,
          });
        }

        return assets.length;
      });

      return c.json<ApiResponse<{ count: number }>>({
        success: true,
        data: { count: result },
        message: `${result} mijloace fixe transferate la noul loc de folosinta`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la transfer";

      if (message.startsWith("NOT_FOUND:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(10) }, 404);
      }
      if (message.startsWith("INVALID:")) {
        return c.json<ApiResponse>({ success: false, message: message.slice(8) }, 400);
      }

      console.error("Transfer loc masa error:", error);
      return c.json<ApiResponse>({ success: false, message: "Eroare la transferul de loc" }, 500);
    }
  }
);
