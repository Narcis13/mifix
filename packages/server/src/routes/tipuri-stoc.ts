import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tipuriStoc } from "../db/schema";
import { insertTipStocSchema, updateTipStocSchema } from "../validation/schemas";
import type { ApiResponse, TipStoc } from "shared";

export const tipuriStocRoutes = new Hono();

// GET / - List all tipuri stoc ordered by cod
tipuriStocRoutes.get("/", async (c) => {
  const result = await db.select().from(tipuriStoc).orderBy(tipuriStoc.cod);

  const data: TipStoc[] = result.map((ts) => ({
    id: ts.id,
    cod: ts.cod,
    denumire: ts.denumire,
    activ: ts.activ ?? true,
  }));

  return c.json<ApiResponse<TipStoc[]>>({ success: true, data });
});

// GET /:id - Get single tip stoc by id
tipuriStocRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  const [result] = await db.select().from(tipuriStoc).where(eq(tipuriStoc.id, id));

  if (!result) {
    return c.json<ApiResponse>({ success: false, message: "Tipul de stoc nu a fost gasit" }, 404);
  }

  const data: TipStoc = {
    id: result.id,
    cod: result.cod,
    denumire: result.denumire,
    activ: result.activ ?? true,
  };

  return c.json<ApiResponse<TipStoc>>({ success: true, data });
});

// POST / - Create new tip stoc
tipuriStocRoutes.post(
  "/",
  zValidator("json", insertTipStocSchema, (result, c) => {
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

    const [{ id: insertId }] = await db.insert(tipuriStoc).values(data).$returningId();
    const [created] = await db.select().from(tipuriStoc).where(eq(tipuriStoc.id, insertId));

    const responseData: TipStoc = {
      id: created.id,
      cod: created.cod,
      denumire: created.denumire,
      activ: created.activ ?? true,
    };

    return c.json<ApiResponse<TipStoc>>({ success: true, data: responseData }, 201);
  }
);

// PUT /:id - Update tip stoc
tipuriStocRoutes.put(
  "/:id",
  zValidator("json", updateTipStocSchema, (result, c) => {
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

    const [existing] = await db.select().from(tipuriStoc).where(eq(tipuriStoc.id, id));
    if (!existing) {
      return c.json<ApiResponse>({ success: false, message: "Tipul de stoc nu a fost gasit" }, 404);
    }

    await db.update(tipuriStoc).set(data).where(eq(tipuriStoc.id, id));

    const [updated] = await db.select().from(tipuriStoc).where(eq(tipuriStoc.id, id));

    const responseData: TipStoc = {
      id: updated.id,
      cod: updated.cod,
      denumire: updated.denumire,
      activ: updated.activ ?? true,
    };

    return c.json<ApiResponse<TipStoc>>({ success: true, data: responseData });
  }
);
