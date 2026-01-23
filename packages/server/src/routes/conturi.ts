import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { conturi } from "../db/schema";
import { insertContSchema, updateContSchema } from "../validation/schemas";
import type { ApiResponse, Cont } from "shared";

export const conturiRoutes = new Hono();

// GET / - List all conturi ordered by simbol
conturiRoutes.get("/", async (c) => {
  const result = await db.select().from(conturi).orderBy(conturi.simbol);

  // Convert DB result to API response
  const data: Cont[] = result.map((cont) => ({
    id: cont.id,
    simbol: cont.simbol,
    denumire: cont.denumire,
    tip: cont.tip,
    amortizabil: cont.amortizabil ?? false,
    contAmortizare: cont.contAmortizare ?? undefined,
    activ: cont.activ ?? true,
  }));

  return c.json<ApiResponse<Cont[]>>({ success: true, data });
});

// GET /:id - Get single cont by id
conturiRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  const [result] = await db.select().from(conturi).where(eq(conturi.id, id));

  if (!result) {
    return c.json<ApiResponse>({ success: false, message: "Contul nu a fost gasit" }, 404);
  }

  const data: Cont = {
    id: result.id,
    simbol: result.simbol,
    denumire: result.denumire,
    tip: result.tip,
    amortizabil: result.amortizabil ?? false,
    contAmortizare: result.contAmortizare ?? undefined,
    activ: result.activ ?? true,
  };

  return c.json<ApiResponse<Cont>>({ success: true, data });
});

// POST / - Create new cont
conturiRoutes.post(
  "/",
  zValidator("json", insertContSchema, (result, c) => {
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

    // Validate contAmortizare requirement for amortizabil conturi
    if (data.amortizabil && !data.contAmortizare) {
      return c.json<ApiResponse>({
        success: false,
        message: "Contul de amortizare este obligatoriu pentru conturile amortizabile",
        errors: {
          contAmortizare: ["Contul de amortizare este obligatoriu pentru conturile amortizabile"],
        },
      }, 400);
    }

    // Clear contAmortizare if not amortizabil
    const insertData = {
      ...data,
      contAmortizare: data.amortizabil ? data.contAmortizare : null,
    };

    const [{ id: insertId }] = await db.insert(conturi).values(insertData).$returningId();
    const [created] = await db.select().from(conturi).where(eq(conturi.id, insertId));

    const responseData: Cont = {
      id: created.id,
      simbol: created.simbol,
      denumire: created.denumire,
      tip: created.tip,
      amortizabil: created.amortizabil ?? false,
      contAmortizare: created.contAmortizare ?? undefined,
      activ: created.activ ?? true,
    };

    return c.json<ApiResponse<Cont>>({ success: true, data: responseData }, 201);
  }
);

// PUT /:id - Update cont
conturiRoutes.put(
  "/:id",
  zValidator("json", updateContSchema, (result, c) => {
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

    // Check if cont exists
    const [existing] = await db.select().from(conturi).where(eq(conturi.id, id));
    if (!existing) {
      return c.json<ApiResponse>({ success: false, message: "Contul nu a fost gasit" }, 404);
    }

    // Determine effective amortizabil value (from update data or existing record)
    const effectiveAmortizabil = data.amortizabil !== undefined ? data.amortizabil : existing.amortizabil;
    const effectiveContAmortizare = data.contAmortizare !== undefined ? data.contAmortizare : existing.contAmortizare;

    // Validate contAmortizare requirement
    if (effectiveAmortizabil && !effectiveContAmortizare) {
      return c.json<ApiResponse>({
        success: false,
        message: "Contul de amortizare este obligatoriu pentru conturile amortizabile",
        errors: {
          contAmortizare: ["Contul de amortizare este obligatoriu pentru conturile amortizabile"],
        },
      }, 400);
    }

    // Clear contAmortizare if not amortizabil
    const updateData = {
      ...data,
      contAmortizare: effectiveAmortizabil ? effectiveContAmortizare : null,
    };

    // Update
    await db.update(conturi).set(updateData).where(eq(conturi.id, id));

    // Fetch updated record
    const [updated] = await db.select().from(conturi).where(eq(conturi.id, id));

    const responseData: Cont = {
      id: updated.id,
      simbol: updated.simbol,
      denumire: updated.denumire,
      tip: updated.tip,
      amortizabil: updated.amortizabil ?? false,
      contAmortizare: updated.contAmortizare ?? undefined,
      activ: updated.activ ?? true,
    };

    return c.json<ApiResponse<Cont>>({ success: true, data: responseData });
  }
);
