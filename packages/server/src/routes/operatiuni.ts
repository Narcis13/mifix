import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import {
  mijloaceFixe,
  tranzactii,
  gestiuni,
  locuriUilizare,
} from "../db/schema";
import { Money } from "shared";
import type { ApiResponse } from "shared";
import {
  transferGestiuneSchema,
  transferLocSchema,
  casareSchema,
  declasareSchema,
} from "../validation/operatiuni-schemas";

export const operatiuniRoutes = new Hono();

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

        // 5. Create transaction record
        await tx.insert(tranzactii).values({
          mijlocFixId: data.mijlocFixId,
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

        // 4. Create transaction record (no gestiune change, only loc change)
        await tx.insert(tranzactii).values({
          mijlocFixId: data.mijlocFixId,
          tip: "transfer",
          dataOperare: new Date(data.dataOperare),
          documentNumar: data.documentNumar || null,
          documentData: data.documentData ? new Date(data.documentData) : null,
          // No gestiune change for loc-only transfer
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

        // 3. Create transaction record
        await tx.insert(tranzactii).values({
          mijlocFixId: data.mijlocFixId,
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

        // 6. Create transaction record with value tracking
        await tx.insert(tranzactii).values({
          mijlocFixId: data.mijlocFixId,
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
