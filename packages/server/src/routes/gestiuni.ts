import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { gestiuni } from "../db/schema";
import { insertGestiuneSchema, updateGestiuneSchema } from "../validation/schemas";
import type { ApiResponse, Gestiune } from "shared";

export const gestiuniRoutes = new Hono();

// GET / - List all gestiuni ordered by cod
gestiuniRoutes.get("/", async (c) => {
  const result = await db.select().from(gestiuni).orderBy(gestiuni.cod);

  // Convert boolean and timestamps for API response
  const data: Gestiune[] = result.map((g) => ({
    id: g.id,
    cod: g.cod,
    denumire: g.denumire,
    responsabil: g.responsabil ?? undefined,
    activ: g.activ ?? true,
    createdAt: g.createdAt?.toISOString(),
    updatedAt: g.updatedAt?.toISOString(),
  }));

  return c.json<ApiResponse<Gestiune[]>>({ success: true, data });
});

// GET /:id - Get single gestiune by id
gestiuniRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  const [result] = await db.select().from(gestiuni).where(eq(gestiuni.id, id));

  if (!result) {
    return c.json<ApiResponse>({ success: false, message: "Gestiunea nu a fost gasita" }, 404);
  }

  const data: Gestiune = {
    id: result.id,
    cod: result.cod,
    denumire: result.denumire,
    responsabil: result.responsabil ?? undefined,
    activ: result.activ ?? true,
    createdAt: result.createdAt?.toISOString(),
    updatedAt: result.updatedAt?.toISOString(),
  };

  return c.json<ApiResponse<Gestiune>>({ success: true, data });
});

// POST / - Create new gestiune
gestiuniRoutes.post(
  "/",
  zValidator("json", insertGestiuneSchema, (result, c) => {
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

    const [{ id: insertId }] = await db.insert(gestiuni).values(data).$returningId();
    const [created] = await db.select().from(gestiuni).where(eq(gestiuni.id, insertId));

    const responseData: Gestiune = {
      id: created.id,
      cod: created.cod,
      denumire: created.denumire,
      responsabil: created.responsabil ?? undefined,
      activ: created.activ ?? true,
      createdAt: created.createdAt?.toISOString(),
      updatedAt: created.updatedAt?.toISOString(),
    };

    return c.json<ApiResponse<Gestiune>>({ success: true, data: responseData }, 201);
  }
);

// PUT /:id - Update gestiune
gestiuniRoutes.put(
  "/:id",
  zValidator("json", updateGestiuneSchema, (result, c) => {
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

    // Check if gestiune exists
    const [existing] = await db.select().from(gestiuni).where(eq(gestiuni.id, id));
    if (!existing) {
      return c.json<ApiResponse>({ success: false, message: "Gestiunea nu a fost gasita" }, 404);
    }

    // Update
    await db.update(gestiuni).set(data).where(eq(gestiuni.id, id));

    // Fetch updated record
    const [updated] = await db.select().from(gestiuni).where(eq(gestiuni.id, id));

    const responseData: Gestiune = {
      id: updated.id,
      cod: updated.cod,
      denumire: updated.denumire,
      responsabil: updated.responsabil ?? undefined,
      activ: updated.activ ?? true,
      createdAt: updated.createdAt?.toISOString(),
      updatedAt: updated.updatedAt?.toISOString(),
    };

    return c.json<ApiResponse<Gestiune>>({ success: true, data: responseData });
  }
);
