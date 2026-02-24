import { sql } from "drizzle-orm";
import { db } from "../db";

/**
 * Asset info returned by stoc queries.
 */
export interface StocAsset {
  mijlocFixId: number;
  numarInventar: string;
  denumire: string;
  stare: string;
  gestiuneId: number;
  gestiuneCod: string;
  gestiuneDenumire: string;
  locFolosintaId: number | null;
  locFolosintaCod: string | null;
  locFolosintaDenumire: string | null;
  contId: number | null;
  contSimbol: string | null;
  contDenumire: string | null;
  sursaFinantareCod: string | null;
  dataAchizitie: string;
  valoareInventar: string;
}

/**
 * Stocul curent la o gestiune (si optional loc/cont).
 * Simplu: citeste direct starea curenta a asset-ului din mijloace_fixe.
 */
export async function getStocCurent(params: {
  gestiuneId: number;
  locFolosintaId?: number;
  contId?: number;
}): Promise<StocAsset[]> {
  const conditions: ReturnType<typeof sql>[] = [];
  conditions.push(sql`mf.gestiune_id = ${params.gestiuneId}`);
  conditions.push(sql`mf.stare = 'activ'`);

  if (params.locFolosintaId) {
    conditions.push(sql`mf.loc_folosinta_id = ${params.locFolosintaId}`);
  }
  if (params.contId) {
    conditions.push(sql`mf.cont_id = ${params.contId}`);
  }

  const whereClause = conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`);

  const result = await db.execute(sql`
    SELECT
      mf.id as mijloc_fix_id,
      mf.numar_inventar,
      mf.denumire,
      mf.stare,
      mf.gestiune_id,
      g.cod as gestiune_cod,
      g.denumire as gestiune_denumire,
      mf.loc_folosinta_id,
      lf.cod as loc_folosinta_cod,
      lf.denumire as loc_folosinta_denumire,
      mf.cont_id,
      c.simbol as cont_simbol,
      c.denumire as cont_denumire,
      sf.cod as sursa_finantare_cod,
      mf.data_achizitie,
      mf.valoare_inventar
    FROM mijloace_fixe mf
    LEFT JOIN gestiuni g ON mf.gestiune_id = g.id
    LEFT JOIN locuri_folosinta lf ON mf.loc_folosinta_id = lf.id
    LEFT JOIN conturi c ON mf.cont_id = c.id
    LEFT JOIN surse_finantare sf ON mf.sursa_finantare_id = sf.id
    WHERE ${whereClause}
    ORDER BY mf.numar_inventar
  `);

  return mapStocRows(result[0] as unknown as any[]);
}

/**
 * Stocul la o data istorica la o gestiune (si optional loc/cont).
 *
 * Algoritmul:
 * 1. Pentru fiecare MF, cauta ultima tranzactie cu data <= dataSnapshot
 *    care indica "locatia" MF-ului (intrare sau transfer).
 * 2. Daca ultima tranzactie de intrare/transfer plaseaza MF-ul la gestiunea ceruta,
 *    si MF-ul nu a fost casat/iesit dupa aceasta tranzactie (tot inainte de data),
 *    atunci MF-ul era la gestiune la data respectiva.
 *
 * Abordarea concreta (subquery per-asset):
 * - Ultima tranzactie de tip intrare/transfer cu gestiune_destinatie_id = G, data <= D
 *   = data la care MF-ul a ajuns ultima oara in gestiunea G
 * - Nu exista tranzactie cu data > aceasta data si <= D care sa mute MF-ul
 *   din gestiunea G (transfer cu gestiune_sursa_id = G, sau casare/iesire)
 */
export async function getStocLaData(params: {
  dataSnapshot: string;
  gestiuneId: number;
  locFolosintaId?: number;
  contId?: number;
}): Promise<StocAsset[]> {
  const { dataSnapshot, gestiuneId } = params;

  // Optional filters on asset itself
  const assetConditions: ReturnType<typeof sql>[] = [];
  if (params.contId) {
    assetConditions.push(sql`AND mf.cont_id = ${params.contId}`);
  }
  const assetWhere = assetConditions.length > 0
    ? assetConditions.reduce((acc, cond) => sql`${acc} ${cond}`)
    : sql``;

  // For loc_folosinta filtering, we check the destination loc on the last transaction
  const locFilter = params.locFolosintaId
    ? sql`AND last_t.loc_folosinta_destinatie_id = ${params.locFolosintaId}`
    : sql``;

  // The query:
  // 1. Find the last "placement" transaction for each MF at gestiunea G before dataSnapshot.
  //    A "placement" = intrare with gestiune_destinatie_id=G OR transfer with gestiune_destinatie_id=G.
  //    For intrare, gestiune_destinatie_id may be NULL in legacy data, so we also check
  //    the asset's current gestiune for intrare transactions.
  // 2. Ensure no "removal" transaction after the placement and before dataSnapshot.
  //    A "removal" = transfer OUT (gestiune_sursa_id=G) or casare/iesire.

  const result = await db.execute(sql`
    SELECT
      mf.id as mijloc_fix_id,
      mf.numar_inventar,
      mf.denumire,
      mf.stare,
      ${gestiuneId} as gestiune_id,
      g.cod as gestiune_cod,
      g.denumire as gestiune_denumire,
      last_t.loc_folosinta_destinatie_id as loc_folosinta_id,
      lf.cod as loc_folosinta_cod,
      lf.denumire as loc_folosinta_denumire,
      mf.cont_id,
      c.simbol as cont_simbol,
      c.denumire as cont_denumire,
      sf.cod as sursa_finantare_cod,
      mf.data_achizitie,
      mf.valoare_inventar
    FROM mijloace_fixe mf
    INNER JOIN (
      -- Last placement transaction at gestiunea G before dataSnapshot
      SELECT t1.mijloc_fix_id, t1.id as tranzactie_id,
             t1.data_operare as last_placement_date,
             t1.loc_folosinta_destinatie_id
      FROM tranzactii t1
      WHERE t1.data_operare <= ${dataSnapshot}
        AND (
          (t1.tip = 'intrare' AND t1.gestiune_destinatie_id = ${gestiuneId})
          OR
          (t1.tip = 'transfer' AND t1.gestiune_destinatie_id = ${gestiuneId})
        )
        AND t1.id = (
          -- Get the LAST such placement for this MF
          SELECT t2.id
          FROM tranzactii t2
          WHERE t2.mijloc_fix_id = t1.mijloc_fix_id
            AND t2.data_operare <= ${dataSnapshot}
            AND (
              (t2.tip = 'intrare' AND t2.gestiune_destinatie_id = ${gestiuneId})
              OR
              (t2.tip = 'transfer' AND t2.gestiune_destinatie_id = ${gestiuneId})
            )
          ORDER BY t2.data_operare DESC, t2.id DESC
          LIMIT 1
        )
    ) last_t ON last_t.mijloc_fix_id = mf.id
    LEFT JOIN gestiuni g ON g.id = ${gestiuneId}
    LEFT JOIN locuri_folosinta lf ON lf.id = last_t.loc_folosinta_destinatie_id
    LEFT JOIN conturi c ON c.id = mf.cont_id
    LEFT JOIN surse_finantare sf ON sf.id = mf.sursa_finantare_id
    WHERE 1=1
      ${assetWhere}
      ${locFilter}
      -- Exclude assets that were removed from G after their last placement and before snapshot
      AND NOT EXISTS (
        SELECT 1 FROM tranzactii t3
        WHERE t3.mijloc_fix_id = mf.id
          AND t3.data_operare <= ${dataSnapshot}
          AND (t3.data_operare > last_t.last_placement_date
               OR (t3.data_operare = last_t.last_placement_date AND t3.id > last_t.tranzactie_id))
          AND (
            -- Transferred OUT of gestiunea G
            (t3.tip = 'transfer' AND t3.gestiune_sursa_id = ${gestiuneId})
            OR
            -- Exited entirely (casare/iesire)
            t3.tip IN ('casare', 'iesire')
          )
      )
    ORDER BY mf.numar_inventar
  `);

  return mapStocRows(result[0] as unknown as any[]);
}

/**
 * Map raw DB rows to StocAsset[].
 */
function mapStocRows(rows: any[]): StocAsset[] {
  return rows.map((row) => ({
    mijlocFixId: row.mijloc_fix_id,
    numarInventar: row.numar_inventar,
    denumire: row.denumire,
    stare: row.stare,
    gestiuneId: row.gestiune_id,
    gestiuneCod: row.gestiune_cod,
    gestiuneDenumire: row.gestiune_denumire,
    locFolosintaId: row.loc_folosinta_id ?? null,
    locFolosintaCod: row.loc_folosinta_cod ?? null,
    locFolosintaDenumire: row.loc_folosinta_denumire ?? null,
    contId: row.cont_id ?? null,
    contSimbol: row.cont_simbol ?? null,
    contDenumire: row.cont_denumire ?? null,
    sursaFinantareCod: row.sursa_finantare_cod ?? null,
    dataAchizitie: row.data_achizitie ? String(row.data_achizitie) : "",
    valoareInventar: String(row.valoare_inventar ?? "0.00"),
  }));
}
