import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { tipuriDocument } from "../db/schema";
import { insertTipDocumentSchema, updateTipDocumentSchema } from "../validation/schemas";
import type { ApiResponse, TipDocument } from "shared";

export const tipuriDocumentRoutes = new Hono();

// GET / - List all tipuri document ordered by cod
tipuriDocumentRoutes.get("/", async (c) => {
  const result = await db.select().from(tipuriDocument).orderBy(tipuriDocument.cod);

  const data: TipDocument[] = result.map((td) => ({
    id: td.id,
    cod: td.cod,
    denumire: td.denumire,
    activ: td.activ ?? true,
  }));

  return c.json<ApiResponse<TipDocument[]>>({ success: true, data });
});

// GET /:id - Get single tip document by id
tipuriDocumentRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  const [result] = await db.select().from(tipuriDocument).where(eq(tipuriDocument.id, id));

  if (!result) {
    return c.json<ApiResponse>({ success: false, message: "Tipul de document nu a fost gasit" }, 404);
  }

  const data: TipDocument = {
    id: result.id,
    cod: result.cod,
    denumire: result.denumire,
    activ: result.activ ?? true,
  };

  return c.json<ApiResponse<TipDocument>>({ success: true, data });
});

// POST / - Create new tip document
tipuriDocumentRoutes.post(
  "/",
  zValidator("json", insertTipDocumentSchema, (result, c) => {
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

    const [{ id: insertId }] = await db.insert(tipuriDocument).values(data).$returningId();
    const [created] = await db.select().from(tipuriDocument).where(eq(tipuriDocument.id, insertId));

    const responseData: TipDocument = {
      id: created.id,
      cod: created.cod,
      denumire: created.denumire,
      activ: created.activ ?? true,
    };

    return c.json<ApiResponse<TipDocument>>({ success: true, data: responseData }, 201);
  }
);

// PUT /:id - Update tip document
tipuriDocumentRoutes.put(
  "/:id",
  zValidator("json", updateTipDocumentSchema, (result, c) => {
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

    // Check if tip document exists
    const [existing] = await db.select().from(tipuriDocument).where(eq(tipuriDocument.id, id));
    if (!existing) {
      return c.json<ApiResponse>({ success: false, message: "Tipul de document nu a fost gasit" }, 404);
    }

    // Update
    await db.update(tipuriDocument).set(data).where(eq(tipuriDocument.id, id));

    // Fetch updated record
    const [updated] = await db.select().from(tipuriDocument).where(eq(tipuriDocument.id, id));

    const responseData: TipDocument = {
      id: updated.id,
      cod: updated.cod,
      denumire: updated.denumire,
      activ: updated.activ ?? true,
    };

    return c.json<ApiResponse<TipDocument>>({ success: true, data: responseData });
  }
);
