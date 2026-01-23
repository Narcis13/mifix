import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { locuriUilizare, gestiuni } from "../db/schema";
import { insertLocFolosintaSchema, updateLocFolosintaSchema } from "../validation/schemas";
import type { ApiResponse, LocFolosinta, Gestiune } from "shared";

export const locuriRoutes = new Hono();

// Helper to transform raw DB result to LocFolosinta
function transformLocFolosinta(
  row: {
    id: number;
    gestiuneId: number;
    cod: string;
    denumire: string;
    activ: boolean | null;
    gestiune_id: number | null;
    gestiune_cod: string | null;
    gestiune_denumire: string | null;
    gestiune_activ: boolean | null;
  }
): LocFolosinta {
  const gestiune: Gestiune | undefined = row.gestiune_id
    ? {
        id: row.gestiune_id,
        cod: row.gestiune_cod!,
        denumire: row.gestiune_denumire!,
        activ: row.gestiune_activ ?? true,
      }
    : undefined;

  return {
    id: row.id,
    gestiuneId: row.gestiuneId,
    cod: row.cod,
    denumire: row.denumire,
    activ: row.activ ?? true,
    gestiune,
  };
}

// GET / - List all locuri, optionally filtered by gestiuneId
locuriRoutes.get("/", async (c) => {
  const gestiuneId = c.req.query("gestiuneId");

  let query = db
    .select({
      id: locuriUilizare.id,
      gestiuneId: locuriUilizare.gestiuneId,
      cod: locuriUilizare.cod,
      denumire: locuriUilizare.denumire,
      activ: locuriUilizare.activ,
      gestiune_id: gestiuni.id,
      gestiune_cod: gestiuni.cod,
      gestiune_denumire: gestiuni.denumire,
      gestiune_activ: gestiuni.activ,
    })
    .from(locuriUilizare)
    .leftJoin(gestiuni, eq(locuriUilizare.gestiuneId, gestiuni.id))
    .orderBy(locuriUilizare.cod)
    .$dynamic();

  if (gestiuneId) {
    query = query.where(eq(locuriUilizare.gestiuneId, parseInt(gestiuneId)));
  }

  const result = await query;
  const data: LocFolosinta[] = result.map(transformLocFolosinta);

  return c.json<ApiResponse<LocFolosinta[]>>({ success: true, data });
});

// GET /:id - Get single loc by id
locuriRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  const [result] = await db
    .select({
      id: locuriUilizare.id,
      gestiuneId: locuriUilizare.gestiuneId,
      cod: locuriUilizare.cod,
      denumire: locuriUilizare.denumire,
      activ: locuriUilizare.activ,
      gestiune_id: gestiuni.id,
      gestiune_cod: gestiuni.cod,
      gestiune_denumire: gestiuni.denumire,
      gestiune_activ: gestiuni.activ,
    })
    .from(locuriUilizare)
    .leftJoin(gestiuni, eq(locuriUilizare.gestiuneId, gestiuni.id))
    .where(eq(locuriUilizare.id, id));

  if (!result) {
    return c.json<ApiResponse>({ success: false, message: "Locul de folosinta nu a fost gasit" }, 404);
  }

  const data = transformLocFolosinta(result);
  return c.json<ApiResponse<LocFolosinta>>({ success: true, data });
});

// POST / - Create new loc
locuriRoutes.post(
  "/",
  zValidator("json", insertLocFolosintaSchema, (result, c) => {
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

    // Verify gestiune exists
    const [existingGestiune] = await db
      .select()
      .from(gestiuni)
      .where(eq(gestiuni.id, data.gestiuneId));

    if (!existingGestiune) {
      return c.json<ApiResponse>(
        { success: false, message: "Gestiunea nu exista" },
        400
      );
    }

    // Insert the loc
    const [{ id: insertId }] = await db
      .insert(locuriUilizare)
      .values(data)
      .$returningId();

    // Fetch with join
    const [created] = await db
      .select({
        id: locuriUilizare.id,
        gestiuneId: locuriUilizare.gestiuneId,
        cod: locuriUilizare.cod,
        denumire: locuriUilizare.denumire,
        activ: locuriUilizare.activ,
        gestiune_id: gestiuni.id,
        gestiune_cod: gestiuni.cod,
        gestiune_denumire: gestiuni.denumire,
        gestiune_activ: gestiuni.activ,
      })
      .from(locuriUilizare)
      .leftJoin(gestiuni, eq(locuriUilizare.gestiuneId, gestiuni.id))
      .where(eq(locuriUilizare.id, insertId));

    const responseData = transformLocFolosinta(created);
    return c.json<ApiResponse<LocFolosinta>>({ success: true, data: responseData }, 201);
  }
);

// PUT /:id - Update loc
locuriRoutes.put(
  "/:id",
  zValidator("json", updateLocFolosintaSchema, (result, c) => {
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

    // Check if loc exists
    const [existing] = await db
      .select()
      .from(locuriUilizare)
      .where(eq(locuriUilizare.id, id));

    if (!existing) {
      return c.json<ApiResponse>(
        { success: false, message: "Locul de folosinta nu a fost gasit" },
        404
      );
    }

    // If gestiuneId is being changed, verify the new gestiune exists
    if (data.gestiuneId !== undefined) {
      const [existingGestiune] = await db
        .select()
        .from(gestiuni)
        .where(eq(gestiuni.id, data.gestiuneId));

      if (!existingGestiune) {
        return c.json<ApiResponse>(
          { success: false, message: "Gestiunea nu exista" },
          400
        );
      }
    }

    // Update
    await db.update(locuriUilizare).set(data).where(eq(locuriUilizare.id, id));

    // Fetch updated record with join
    const [updated] = await db
      .select({
        id: locuriUilizare.id,
        gestiuneId: locuriUilizare.gestiuneId,
        cod: locuriUilizare.cod,
        denumire: locuriUilizare.denumire,
        activ: locuriUilizare.activ,
        gestiune_id: gestiuni.id,
        gestiune_cod: gestiuni.cod,
        gestiune_denumire: gestiuni.denumire,
        gestiune_activ: gestiuni.activ,
      })
      .from(locuriUilizare)
      .leftJoin(gestiuni, eq(locuriUilizare.gestiuneId, gestiuni.id))
      .where(eq(locuriUilizare.id, id));

    const responseData = transformLocFolosinta(updated);
    return c.json<ApiResponse<LocFolosinta>>({ success: true, data: responseData });
  }
);
