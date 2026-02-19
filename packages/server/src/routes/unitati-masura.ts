import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { unitatiMasura } from "../db/schema";
import { insertUnitateMasuraSchema, updateUnitateMasuraSchema } from "../validation/schemas";
import type { ApiResponse, UnitateMasura } from "shared";

export const unitatiMasuraRoutes = new Hono();

// GET / - List all unitati masura ordered by cod
unitatiMasuraRoutes.get("/", async (c) => {
  const result = await db.select().from(unitatiMasura).orderBy(unitatiMasura.cod);

  const data: UnitateMasura[] = result.map((um) => ({
    id: um.id,
    cod: um.cod,
    denumire: um.denumire,
    activ: um.activ ?? true,
  }));

  return c.json<ApiResponse<UnitateMasura[]>>({ success: true, data });
});

// GET /:id - Get single unitate masura by id
unitatiMasuraRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);

  if (isNaN(id)) {
    return c.json<ApiResponse>({ success: false, message: "ID invalid" }, 400);
  }

  const [result] = await db.select().from(unitatiMasura).where(eq(unitatiMasura.id, id));

  if (!result) {
    return c.json<ApiResponse>({ success: false, message: "Unitatea de masura nu a fost gasita" }, 404);
  }

  const data: UnitateMasura = {
    id: result.id,
    cod: result.cod,
    denumire: result.denumire,
    activ: result.activ ?? true,
  };

  return c.json<ApiResponse<UnitateMasura>>({ success: true, data });
});

// POST / - Create new unitate masura
unitatiMasuraRoutes.post(
  "/",
  zValidator("json", insertUnitateMasuraSchema, (result, c) => {
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

    const [{ id: insertId }] = await db.insert(unitatiMasura).values(data).$returningId();
    const [created] = await db.select().from(unitatiMasura).where(eq(unitatiMasura.id, insertId));

    const responseData: UnitateMasura = {
      id: created.id,
      cod: created.cod,
      denumire: created.denumire,
      activ: created.activ ?? true,
    };

    return c.json<ApiResponse<UnitateMasura>>({ success: true, data: responseData }, 201);
  }
);

// PUT /:id - Update unitate masura
unitatiMasuraRoutes.put(
  "/:id",
  zValidator("json", updateUnitateMasuraSchema, (result, c) => {
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

    const [existing] = await db.select().from(unitatiMasura).where(eq(unitatiMasura.id, id));
    if (!existing) {
      return c.json<ApiResponse>({ success: false, message: "Unitatea de masura nu a fost gasita" }, 404);
    }

    await db.update(unitatiMasura).set(data).where(eq(unitatiMasura.id, id));

    const [updated] = await db.select().from(unitatiMasura).where(eq(unitatiMasura.id, id));

    const responseData: UnitateMasura = {
      id: updated.id,
      cod: updated.cod,
      denumire: updated.denumire,
      activ: updated.activ ?? true,
    };

    return c.json<ApiResponse<UnitateMasura>>({ success: true, data: responseData });
  }
);
