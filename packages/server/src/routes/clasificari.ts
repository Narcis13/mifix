import { Hono } from "hono";
import { like, or, eq, sql, and } from "drizzle-orm";
import { db } from "../db";
import { clasificari } from "../db/schema";
import type { ApiResponse, PaginatedResponse, Clasificare } from "shared";

export const clasificariRoutes = new Hono();

// GET / - List clasificari with search, filter, and pagination
clasificariRoutes.get("/", async (c) => {
  const search = c.req.query("search");
  const grupa = c.req.query("grupa");
  const page = parseInt(c.req.query("page") || "1");
  const pageSize = parseInt(c.req.query("pageSize") || "50");

  // Build conditions array
  const conditions = [];
  if (search) {
    conditions.push(
      or(
        like(clasificari.cod, `%${search}%`),
        like(clasificari.denumire, `%${search}%`)
      )
    );
  }
  if (grupa) {
    conditions.push(eq(clasificari.grupa, grupa));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count total for pagination
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(clasificari)
    .where(whereClause);
  const total = Number(countResult[0].count);

  // Get paginated results
  const result = await db
    .select()
    .from(clasificari)
    .where(whereClause)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .orderBy(clasificari.cod);

  // Map database result to API response
  const items: Clasificare[] = result.map((c) => ({
    cod: c.cod,
    denumire: c.denumire,
    grupa: c.grupa,
    durataNormalaMin: c.durataNormalaMin,
    durataNormalaMax: c.durataNormalaMax,
    cotaAmortizare: c.cotaAmortizare ?? undefined,
  }));

  return c.json<ApiResponse<PaginatedResponse<Clasificare>>>({
    success: true,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

// GET /:cod - Get single clasificare by cod (primary key)
clasificariRoutes.get("/:cod", async (c) => {
  const cod = c.req.param("cod");

  const [result] = await db
    .select()
    .from(clasificari)
    .where(eq(clasificari.cod, cod));

  if (!result) {
    return c.json<ApiResponse>({
      success: false,
      message: "Clasificarea nu a fost gasita",
    }, 404);
  }

  const data: Clasificare = {
    cod: result.cod,
    denumire: result.denumire,
    grupa: result.grupa,
    durataNormalaMin: result.durataNormalaMin,
    durataNormalaMax: result.durataNormalaMax,
    cotaAmortizare: result.cotaAmortizare ?? undefined,
  };

  return c.json<ApiResponse<Clasificare>>({ success: true, data });
});
