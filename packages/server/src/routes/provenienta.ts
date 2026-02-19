import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { provenienta } from "../db/schema";
import { insertProvenientaSchema, updateProvenientaSchema } from "../validation/schemas";
import type { ApiResponse, Provenienta } from "shared";

export const provenientaRoutes = new Hono();

// GET / - List all provenienta ordered by cod
provenientaRoutes.get("/", async (c) => {
  const result = await db.select().from(provenienta).orderBy(provenienta.cod);

  const data: Provenienta[] = result.map((p) => ({
    id: p.id,
    cod: p.cod,
    denumire: p.denumire,
    activ: p.activ ?? true,
  }));

  return c.json<ApiResponse<Provenienta[]>>({ success: true, data });
});

// GET /:id - Get single provenienta by id
provenientaRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  const [result] = await db.select().from(provenienta).where(eq(provenienta.id, id));

  if (!result) {
    return c.json<ApiResponse>({ success: false, message: "Provenienta nu a fost gasita" }, 404);
  }

  const data: Provenienta = {
    id: result.id,
    cod: result.cod,
    denumire: result.denumire,
    activ: result.activ ?? true,
  };

  return c.json<ApiResponse<Provenienta>>({ success: true, data });
});

// POST / - Create new provenienta
provenientaRoutes.post(
  "/",
  zValidator("json", insertProvenientaSchema, (result, c) => {
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

    const [{ id: insertId }] = await db.insert(provenienta).values(data).$returningId();
    const [created] = await db.select().from(provenienta).where(eq(provenienta.id, insertId));

    const responseData: Provenienta = {
      id: created.id,
      cod: created.cod,
      denumire: created.denumire,
      activ: created.activ ?? true,
    };

    return c.json<ApiResponse<Provenienta>>({ success: true, data: responseData }, 201);
  }
);

// PUT /:id - Update provenienta
provenientaRoutes.put(
  "/:id",
  zValidator("json", updateProvenientaSchema, (result, c) => {
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

    const [existing] = await db.select().from(provenienta).where(eq(provenienta.id, id));
    if (!existing) {
      return c.json<ApiResponse>({ success: false, message: "Provenienta nu a fost gasita" }, 404);
    }

    await db.update(provenienta).set(data).where(eq(provenienta.id, id));

    const [updated] = await db.select().from(provenienta).where(eq(provenienta.id, id));

    const responseData: Provenienta = {
      id: updated.id,
      cod: updated.cod,
      denumire: updated.denumire,
      activ: updated.activ ?? true,
    };

    return c.json<ApiResponse<Provenienta>>({ success: true, data: responseData });
  }
);
