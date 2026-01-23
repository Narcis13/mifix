import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { surseFinantare } from "../db/schema";
import { insertSursaFinantareSchema, updateSursaFinantareSchema } from "../validation/schemas";
import type { ApiResponse, SursaFinantare } from "shared";

export const surseFinantareRoutes = new Hono();

// GET / - List all surse finantare ordered by cod
surseFinantareRoutes.get("/", async (c) => {
  const result = await db.select().from(surseFinantare).orderBy(surseFinantare.cod);

  // Map database result to API response
  const data: SursaFinantare[] = result.map((s) => ({
    id: s.id,
    cod: s.cod,
    denumire: s.denumire,
    activ: s.activ ?? true,
  }));

  return c.json<ApiResponse<SursaFinantare[]>>({ success: true, data });
});

// GET /:id - Get single sursa finantare by id
surseFinantareRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  const [result] = await db.select().from(surseFinantare).where(eq(surseFinantare.id, id));

  if (!result) {
    return c.json<ApiResponse>({ success: false, message: "Sursa de finantare nu a fost gasita" }, 404);
  }

  const data: SursaFinantare = {
    id: result.id,
    cod: result.cod,
    denumire: result.denumire,
    activ: result.activ ?? true,
  };

  return c.json<ApiResponse<SursaFinantare>>({ success: true, data });
});

// POST / - Create new sursa finantare
surseFinantareRoutes.post(
  "/",
  zValidator("json", insertSursaFinantareSchema, (result, c) => {
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

    const [{ id: insertId }] = await db.insert(surseFinantare).values(data).$returningId();
    const [created] = await db.select().from(surseFinantare).where(eq(surseFinantare.id, insertId));

    const responseData: SursaFinantare = {
      id: created.id,
      cod: created.cod,
      denumire: created.denumire,
      activ: created.activ ?? true,
    };

    return c.json<ApiResponse<SursaFinantare>>({ success: true, data: responseData }, 201);
  }
);

// PUT /:id - Update sursa finantare
surseFinantareRoutes.put(
  "/:id",
  zValidator("json", updateSursaFinantareSchema, (result, c) => {
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

    // Check if sursa finantare exists
    const [existing] = await db.select().from(surseFinantare).where(eq(surseFinantare.id, id));
    if (!existing) {
      return c.json<ApiResponse>({ success: false, message: "Sursa de finantare nu a fost gasita" }, 404);
    }

    // Update
    await db.update(surseFinantare).set(data).where(eq(surseFinantare.id, id));

    // Fetch updated record
    const [updated] = await db.select().from(surseFinantare).where(eq(surseFinantare.id, id));

    const responseData: SursaFinantare = {
      id: updated.id,
      cod: updated.cod,
      denumire: updated.denumire,
      activ: updated.activ ?? true,
    };

    return c.json<ApiResponse<SursaFinantare>>({ success: true, data: responseData });
  }
);
