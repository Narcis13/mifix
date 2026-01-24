import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, gt, sql } from "drizzle-orm";
import { db } from "../db";
import { mijloaceFixe, amortizari } from "../db/schema";
import { Money } from "shared";
import type { ApiResponse, Amortizare, GenereazaAmortizareResult, AmortizareSumar, AmortizareVerificare } from "shared";
import { genereazaAmortizareSchema } from "../validation/amortizari-schemas";

export const amortizariRoutes = new Hono();

// ============================================================================
// POST /genereaza - Batch generate depreciation (AMO-01, AMO-02, AMO-03, AMO-06)
// ============================================================================
amortizariRoutes.post(
  "/genereaza",
  zValidator("json", genereazaAmortizareSchema, (result, c) => {
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      });
      return c.json<ApiResponse>({ success: false, message: "Validare esuata", errors }, 400);
    }
  }),
  async (c) => {
    const { an, luna } = c.req.valid("json");

    try {
      const result = await db.transaction(async (tx) => {
        // 1. Get all eligible assets: active, depreciable, has remaining value
        const assets = await tx
          .select()
          .from(mijloaceFixe)
          .where(
            and(
              eq(mijloaceFixe.stare, "activ"),
              eq(mijloaceFixe.eAmortizabil, true),
              gt(mijloaceFixe.valoareRamasa, "0")
            )
          );

        const totalEligible = assets.length;

        // 2. Check for existing entries for this month (prevent duplicates)
        const existing = await tx
          .select({ mijlocFixId: amortizari.mijlocFixId })
          .from(amortizari)
          .where(and(eq(amortizari.an, an), eq(amortizari.luna, luna)));
        const existingIds = new Set(existing.map((e) => e.mijlocFixId));

        // 3. Calculate and insert depreciation for each eligible asset
        let processed = 0;
        let skipped = existingIds.size;

        for (const asset of assets) {
          if (existingIds.has(asset.id)) continue; // Skip already processed

          const valoareInventar = Money.fromDb(asset.valoareInventar);
          const valoareAmortizataCurenta = Money.fromDb(asset.valoareAmortizata);
          const valoareRamasaCurenta = Money.fromDb(asset.valoareRamasa);

          // AMO-01: Calculate monthly depreciation (linear method)
          const cotaLunara = Money.calculateMonthlyDepreciation(valoareInventar, asset.durataNormala);

          // AMO-06: Final month protection - don't exceed remaining value
          const amortizareLunara = cotaLunara.greaterThan(valoareRamasaCurenta)
            ? valoareRamasaCurenta // Last month: depreciate only what remains
            : cotaLunara;

          // AMO-03: Calculate new cumulative and remaining values
          const nouaValoareAmortizata = valoareAmortizataCurenta.plus(amortizareLunara);
          const nouaValoareRamasa = valoareRamasaCurenta.minus(amortizareLunara);
          const nouaDurataRamasa = Math.max(0, asset.durataRamasa - 1);

          // Insert depreciation record
          await tx.insert(amortizari).values({
            mijlocFixId: asset.id,
            an,
            luna,
            valoareLunara: amortizareLunara.toDbString(),
            valoareCumulata: nouaValoareAmortizata.toDbString(),
            valoareRamasa: nouaValoareRamasa.toDbString(),
            valoareInventar: asset.valoareInventar,
            durataRamasa: nouaDurataRamasa,
            calculat: true,
            dataCalcul: new Date(),
          });

          // Update asset values
          await tx
            .update(mijloaceFixe)
            .set({
              valoareAmortizata: nouaValoareAmortizata.toDbString(),
              valoareRamasa: nouaValoareRamasa.toDbString(),
              durataRamasa: nouaDurataRamasa,
            })
            .where(eq(mijloaceFixe.id, asset.id));

          processed++;
        }

        return { processed, skipped, totalEligible };
      });

      return c.json<ApiResponse<GenereazaAmortizareResult>>({ success: true, data: result });
    } catch (error) {
      console.error("Generare amortizare error:", error);

      // Check for duplicate key error (race condition protection)
      const message = error instanceof Error ? error.message : "";
      if (message.includes("Duplicate entry")) {
        return c.json<ApiResponse>({
          success: false,
          message: "Amortizarea pentru aceasta luna a fost deja generata"
        }, 409);
      }

      return c.json<ApiResponse>({
        success: false,
        message: "Eroare la generarea amortizarii"
      }, 500);
    }
  }
);

// ============================================================================
// GET /istoric/:mijlocFixId - Per-asset depreciation history (AMO-04)
// ============================================================================
amortizariRoutes.get("/istoric/:mijlocFixId", async (c) => {
  const mijlocFixId = parseInt(c.req.param("mijlocFixId"));

  if (isNaN(mijlocFixId)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  try {
    const result = await db
      .select()
      .from(amortizari)
      .where(eq(amortizari.mijlocFixId, mijlocFixId))
      .orderBy(desc(amortizari.an), desc(amortizari.luna));

    const items: Amortizare[] = result.map((row) => ({
      id: row.id,
      mijlocFixId: row.mijlocFixId,
      an: row.an,
      luna: row.luna,
      valoareLunara: row.valoareLunara,
      valoareCumulata: row.valoareCumulata,
      valoareRamasa: row.valoareRamasa,
      valoareInventar: row.valoareInventar,
      durataRamasa: row.durataRamasa,
      calculat: row.calculat ?? false,
      dataCalcul: row.dataCalcul?.toISOString(),
      createdAt: row.createdAt.toISOString(),
    }));

    return c.json<ApiResponse<Amortizare[]>>({ success: true, data: items });
  } catch (error) {
    console.error("Get istoric amortizare error:", error);
    return c.json<ApiResponse>({ success: false, message: "Eroare la obtinerea istoricului" }, 500);
  }
});

// ============================================================================
// GET /sumar - Monthly/yearly summary across all assets (AMO-05)
// ============================================================================
amortizariRoutes.get("/sumar", async (c) => {
  const anParam = c.req.query("an");
  const an = anParam ? parseInt(anParam) : undefined;

  try {
    let query = db
      .select({
        an: amortizari.an,
        luna: amortizari.luna,
        totalLunar: sql<string>`cast(sum(${amortizari.valoareLunara}) as decimal(15,2))`,
        numarActive: sql<number>`count(distinct ${amortizari.mijlocFixId})`,
      })
      .from(amortizari)
      .groupBy(amortizari.an, amortizari.luna)
      .orderBy(desc(amortizari.an), desc(amortizari.luna));

    // Filter by year if provided
    const result = an
      ? await query.where(eq(amortizari.an, an))
      : await query;

    const items: AmortizareSumar[] = result.map((row) => ({
      an: row.an,
      luna: row.luna,
      totalLunar: row.totalLunar ?? "0.00",
      numarActive: Number(row.numarActive) || 0,
    }));

    return c.json<ApiResponse<AmortizareSumar[]>>({ success: true, data: items });
  } catch (error) {
    console.error("Get sumar amortizare error:", error);
    return c.json<ApiResponse>({ success: false, message: "Eroare la obtinerea sumarului" }, 500);
  }
});

// ============================================================================
// GET /verificare - Check which months are already processed
// ============================================================================
amortizariRoutes.get("/verificare", async (c) => {
  const anParam = c.req.query("an");
  const an = anParam ? parseInt(anParam) : new Date().getFullYear();

  try {
    // Get all months with depreciation for this year
    const result = await db
      .select({
        luna: amortizari.luna,
        numarActive: sql<number>`count(distinct ${amortizari.mijlocFixId})`,
      })
      .from(amortizari)
      .where(eq(amortizari.an, an))
      .groupBy(amortizari.luna)
      .orderBy(amortizari.luna);

    // Build response for all 12 months
    const processedMonths = new Map(result.map((r) => [r.luna, Number(r.numarActive)]));

    const items: AmortizareVerificare[] = [];
    for (let luna = 1; luna <= 12; luna++) {
      items.push({
        luna,
        procesat: processedMonths.has(luna),
        numarActive: processedMonths.get(luna) || 0,
      });
    }

    return c.json<ApiResponse<AmortizareVerificare[]>>({ success: true, data: items });
  } catch (error) {
    console.error("Get verificare amortizare error:", error);
    return c.json<ApiResponse>({ success: false, message: "Eroare la verificare" }, 500);
  }
});
