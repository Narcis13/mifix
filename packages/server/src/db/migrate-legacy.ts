/**
 * Legacy Data Migration Script
 * Migrates data from FoxPro SQLite export to modern MySQL schema
 *
 * Run: bun run packages/server/src/db/migrate-legacy.ts
 *
 * Migration order:
 *   1. Reference tables (gestiuni, dispus, conturi, acte, finantat, provenie, stoc_uz, unit_mas, stare)
 *   2. Materials -> Mijloace Fixe (asset-centered transform)
 *   3. Operatii + Tranzact -> Operatiuni + Tranzactii
 *   4. Verification: cross-check record counts and totals
 */
import { Database } from "bun:sqlite";
import { eq, sql } from "drizzle-orm";
import { resolve, dirname } from "path";
import { db, poolConnection } from "./index";
import * as schema from "./schema";

// ============================================================================
// Configuration
// ============================================================================

// Resolve path relative to project root (4 levels up from this file)
const PROJECT_ROOT = resolve(dirname(import.meta.path), "../../../..");
const LEGACY_DB_PATH = resolve(PROJECT_ROOT, "import/mf/legacy_data.sqlite");
const BATCH_SIZE = 100;

// ============================================================================
// Types
// ============================================================================

/** Maps legacy integer codes to modern auto-increment IDs */
interface IdMaps {
  gestiuni: Map<number, number>; // legacy cod -> modern id
  dispus: Map<number, number>; // legacy cod -> modern id (locuri_folosinta)
  conturi: Map<number, number>; // legacy cod_cont -> modern id
  acte: Map<number, number>; // legacy cod -> modern id (tipuri_document)
  finantat: Map<number, number>; // legacy cod -> modern id (surse_finantare)
  provenie: Map<number, number>; // legacy cod -> modern id (provenienta)
  stocUz: Map<number, number>; // legacy cod -> modern id (tipuri_stoc)
  unitMas: Map<number, number>; // legacy cod_u -> modern id (unitati_masura)
  material: Map<number, number>; // legacy cod -> modern id (mijloace_fixe)
  operatii: Map<number, number>; // legacy c_operat -> modern id (operatiuni)
}

interface MigrationStats {
  table: string;
  legacyCount: number;
  migratedCount: number;
  skippedCount: number;
  errors: string[];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Clear all target tables before migration (reverse dependency order).
 * This makes the migration idempotent - safe to re-run.
 */
async function cleanTargetTables(): Promise<void> {
  console.log("Cleaning target tables...");

  // Disable FK checks for truncation
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

  // Truncate in reverse dependency order
  const tables = [
    "tranzactii",
    "amortizari",
    "mijloace_fixe",
    "operatiuni",
    "locuri_folosinta",
    "gestiuni",
    "conturi",
    "tipuri_document",
    "surse_finantare",
    "provenienta",
    "tipuri_stoc",
    "unitati_masura",
  ];

  for (const table of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE \`${table}\``));
    console.log(`  Truncated ${table}`);
  }

  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
  console.log("  Done.\n");
}

function openLegacyDb(): Database {
  console.log(`Opening legacy database: ${LEGACY_DB_PATH}`);
  const legacyDb = new Database(LEGACY_DB_PATH, { readonly: true });
  return legacyDb;
}

function logStats(stats: MigrationStats) {
  const status = stats.errors.length > 0 ? "WARNINGS" : "OK";
  console.log(
    `  [${status}] ${stats.table}: ${stats.migratedCount}/${stats.legacyCount} migrated` +
      (stats.skippedCount > 0 ? `, ${stats.skippedCount} skipped` : "")
  );
  for (const err of stats.errors) {
    console.log(`    ! ${err}`);
  }
}

// ============================================================================
// Phase 2.2: Reference Tables Migration
// ============================================================================

async function migrateGestiuni(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "gestiuni",
    legacyCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const rows = legacyDb
    .query("SELECT cod, denumire FROM gestiuni ORDER BY cod")
    .all() as { cod: number; denumire: string }[];
  stats.legacyCount = rows.length;

  for (const row of rows) {
    const denumire = row.denumire?.trim() || `Gestiune ${row.cod}`;

    const [result] = await db
      .insert(schema.gestiuni)
      .values({
        cod: String(row.cod),
        denumire,
        activ: !!row.denumire?.trim(), // inactive if name was empty
      })
      .$returningId();

    if (!row.denumire?.trim()) {
      stats.errors.push(
        `Gestiune cod=${row.cod}: empty denumire, created as inactive with placeholder name`
      );
    }

    idMaps.gestiuni.set(row.cod, result.id);
    stats.migratedCount++;
  }

  return stats;
}

async function migrateDispus(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "dispus -> locuri_folosinta",
    legacyCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const rows = legacyDb
    .query("SELECT cod, denumire FROM dispus ORDER BY cod")
    .all() as { cod: number; denumire: string }[];
  stats.legacyCount = rows.length;

  // Legacy DISPUS has no gestiune relationship - assign to first gestiune as default
  const defaultGestiuneId = idMaps.gestiuni.values().next().value;
  if (!defaultGestiuneId) {
    stats.errors.push("No gestiuni migrated yet, cannot assign default");
    return stats;
  }

  for (const row of rows) {
    const denumire = row.denumire?.trim() || `Loc ${row.cod}`;

    const [result] = await db
      .insert(schema.locuriUilizare)
      .values({
        gestiuneId: defaultGestiuneId,
        cod: String(row.cod),
        denumire,
        activ: !!row.denumire?.trim(),
      })
      .$returningId();

    if (!row.denumire?.trim()) {
      stats.errors.push(
        `Dispus cod=${row.cod}: empty denumire, created as inactive with placeholder name`
      );
    }

    idMaps.dispus.set(row.cod, result.id);
    stats.migratedCount++;
  }

  return stats;
}

async function migrateConturi(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "conturi",
    legacyCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const rows = legacyDb
    .query(
      "SELECT cod_cont, denumire, titlu, cont, val1, val2, val3 FROM conturi ORDER BY cod_cont"
    )
    .all() as {
    cod_cont: number;
    denumire: string;
    titlu: number;
    cont: string;
    val1: number;
    val2: number;
    val3: number;
  }[];
  stats.legacyCount = rows.length;

  for (const row of rows) {
    const simbol = row.cont?.trim() || String(row.cod_cont);
    const denumire = row.denumire?.trim() || `Cont ${row.cod_cont}`;

    const [result] = await db
      .insert(schema.conturi)
      .values({
        simbol,
        denumire,
        tip: "activ", // default; legacy doesn't store account type
        titlu: row.titlu === 1,
        amortizabil: false,
        activ: true,
      })
      .$returningId();

    idMaps.conturi.set(row.cod_cont, result.id);
    stats.migratedCount++;
  }

  return stats;
}

async function migrateActe(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "acte -> tipuri_document",
    legacyCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const rows = legacyDb
    .query("SELECT cod, den, scurt FROM acte ORDER BY cod")
    .all() as { cod: number; den: string; scurt: string }[];
  stats.legacyCount = rows.length;

  for (const row of rows) {
    const denumire = row.den?.trim() || row.scurt?.trim() || `Act ${row.cod}`;

    const [result] = await db
      .insert(schema.tipuriDocument)
      .values({
        cod: String(row.cod),
        denumire,
        activ: true,
      })
      .$returningId();

    idMaps.acte.set(row.cod, result.id);
    stats.migratedCount++;
  }

  return stats;
}

async function migrateFinantat(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "finantat -> surse_finantare",
    legacyCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const rows = legacyDb
    .query("SELECT cod, den, cap, cod_cap1, cod_cap2 FROM finantat ORDER BY cod")
    .all() as {
    cod: number;
    den: string;
    cap: number;
    cod_cap1: number;
    cod_cap2: number;
  }[];
  stats.legacyCount = rows.length;

  for (const row of rows) {
    const denumire = row.den?.trim() || `Sursa ${row.cod}`;

    const [result] = await db
      .insert(schema.surseFinantare)
      .values({
        cod: String(row.cod),
        denumire,
        capitol: row.cap === 1,
        codCapitol1: row.cod_cap1 || null,
        codCapitol2: row.cod_cap2 || null,
        activ: true,
      })
      .$returningId();

    idMaps.finantat.set(row.cod, result.id);
    stats.migratedCount++;
  }

  return stats;
}

async function migrateProvenie(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "provenie -> provenienta",
    legacyCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const rows = legacyDb
    .query("SELECT cod, den FROM provenie ORDER BY cod")
    .all() as { cod: number; den: string }[];
  stats.legacyCount = rows.length;

  for (const row of rows) {
    const denumire = row.den?.trim() || `Provenienta ${row.cod}`;

    const [result] = await db
      .insert(schema.provenienta)
      .values({
        cod: String(row.cod),
        denumire,
        activ: true,
      })
      .$returningId();

    idMaps.provenie.set(row.cod, result.id);
    stats.migratedCount++;
  }

  return stats;
}

async function migrateStocUz(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "stoc_uz -> tipuri_stoc",
    legacyCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const rows = legacyDb
    .query("SELECT cod, den FROM stoc_uz ORDER BY cod")
    .all() as { cod: number; den: string }[];
  stats.legacyCount = rows.length;

  for (const row of rows) {
    const denumire = row.den?.trim() || `Tip stoc ${row.cod}`;

    const [result] = await db
      .insert(schema.tipuriStoc)
      .values({
        cod: String(row.cod),
        denumire,
        activ: true,
      })
      .$returningId();

    idMaps.stocUz.set(row.cod, result.id);
    stats.migratedCount++;
  }

  return stats;
}

async function migrateUnitMas(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    table: "unit_mas -> unitati_masura",
    legacyCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const rows = legacyDb
    .query("SELECT cod_u, nume_u FROM unit_mas ORDER BY cod_u")
    .all() as { cod_u: number; nume_u: string }[];
  stats.legacyCount = rows.length;

  for (const row of rows) {
    const denumire = row.nume_u?.trim() || `UM ${row.cod_u}`;

    const [result] = await db
      .insert(schema.unitatiMasura)
      .values({
        cod: String(row.cod_u),
        denumire,
        activ: true,
      })
      .$returningId();

    idMaps.unitMas.set(row.cod_u, result.id);
    stats.migratedCount++;
  }

  return stats;
}

async function migrateReferenceTables(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats[]> {
  console.log("\n=== Phase 2.2: Migrating Reference Tables ===\n");

  const allStats: MigrationStats[] = [];

  // Order matters: gestiuni first (dispus needs it)
  allStats.push(await migrateGestiuni(legacyDb, idMaps));
  logStats(allStats[allStats.length - 1]);

  allStats.push(await migrateDispus(legacyDb, idMaps));
  logStats(allStats[allStats.length - 1]);

  allStats.push(await migrateConturi(legacyDb, idMaps));
  logStats(allStats[allStats.length - 1]);

  allStats.push(await migrateActe(legacyDb, idMaps));
  logStats(allStats[allStats.length - 1]);

  allStats.push(await migrateFinantat(legacyDb, idMaps));
  logStats(allStats[allStats.length - 1]);

  allStats.push(await migrateProvenie(legacyDb, idMaps));
  logStats(allStats[allStats.length - 1]);

  allStats.push(await migrateStocUz(legacyDb, idMaps));
  logStats(allStats[allStats.length - 1]);

  allStats.push(await migrateUnitMas(legacyDb, idMaps));
  logStats(allStats[allStats.length - 1]);

  return allStats;
}

// ============================================================================
// Phase 2.3: Materials -> Mijloace Fixe
// ============================================================================

/**
 * Transform MATERIAL + first INTRARE transaction -> mijloace_fixe record.
 *
 * Legacy MATERIAL is just a catalog (name, code, durations).
 * The actual asset context (gestiune, location, account, price, etc.)
 * comes from the FIRST INTRARE transaction for that material.
 */
async function migrateMaterials(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats> {
  console.log("\n=== Phase 2.3: Migrating Materials -> Mijloace Fixe ===\n");

  const stats: MigrationStats = {
    table: "material -> mijloace_fixe",
    legacyCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const materials = legacyDb
    .query("SELECT cod, nume, cod_m, zile, zile1, zile2 FROM material ORDER BY cod")
    .all() as {
    cod: number;
    nume: string;
    cod_m: string;
    zile: number;
    zile1: number;
    zile2: number;
  }[];
  stats.legacyCount = materials.length;

  // For each material, find its first INTRARE (c_adaug=2) transaction
  // to get the dimension context (gestiune, account, price, etc.)
  const firstEntryStmt = legacyDb.query(`
    SELECT t.*, o.cod_doc, o.nr_doc, o.c_data
    FROM tranzact t
    LEFT JOIN operatii o ON t.c_operat = (CAST(substr(o.c_data, 1, 4) AS INTEGER) * 1000000 + o.nr_oper)
    WHERE t.cod_den = ? AND t.c_adaug = 2
    ORDER BY t.c_operat ASC, t.crt ASC
    LIMIT 1
  `);

  for (const mat of materials) {
    const firstEntry = firstEntryStmt.get(mat.cod) as {
      c_operat: number;
      cod_prov: number;
      cod_fin: number;
      cod_ges: number;
      c_stoc: number;
      cont: number;
      sect: number;
      cod_den: number;
      unit_mas: number;
      stare: number;
      cantit: number;
      pret: number;
      data_intr: string;
      proc: number;
      seria: string;
      pret_comp: number;
      crt: number;
      c_adaug: number;
      cod_doc: number | null;
      nr_doc: string | null;
      c_data: string | null;
    } | null;

    if (!firstEntry) {
      stats.skippedCount++;
      stats.errors.push(
        `Material cod=${mat.cod} "${mat.nume}" has no INTRARE transactions`
      );
      continue;
    }

    // Resolve FK references via idMaps
    const gestiuneId = idMaps.gestiuni.get(firstEntry.cod_ges);
    if (!gestiuneId) {
      stats.skippedCount++;
      stats.errors.push(
        `Material cod=${mat.cod}: unknown gestiune ${firstEntry.cod_ges}`
      );
      continue;
    }

    const contId = idMaps.conturi.get(firstEntry.cont) || null;
    const locFolosintaId = idMaps.dispus.get(firstEntry.sect) || null;
    const sursaFinantareId = idMaps.finantat.get(firstEntry.cod_fin) || null;
    const tipDocumentId = firstEntry.cod_doc
      ? idMaps.acte.get(firstEntry.cod_doc) || null
      : null;
    const provenientaId = idMaps.provenie.get(firstEntry.cod_prov) || null;
    const tipStocId = idMaps.stocUz.get(firstEntry.c_stoc) || null;
    const unitateMasuraId = idMaps.unitMas.get(firstEntry.unit_mas) || null;

    // Compute value: regular items use cantit*pret, COMPLET (unit_mas=6) uses pret_comp
    const isComplet = firstEntry.unit_mas === 6;
    const valoare = isComplet
      ? firstEntry.pret_comp
      : Math.round(firstEntry.cantit * firstEntry.pret * 100) / 100;

    // Duration: legacy stores days, modern stores months
    // Legacy: zile=days for c_stoc=0, zile1 for c_stoc=1, zile2 for c_stoc=2
    const zileMap: Record<number, number> = {
      0: mat.zile,
      1: mat.zile1,
      2: mat.zile2,
    };
    const durationDays = zileMap[firstEntry.c_stoc] || mat.zile || 0;
    const durationMonths = Math.max(1, Math.round(durationDays / 30));

    // Depreciation percentage from first transaction
    const procUzura = firstEntry.proc || 0;
    const valoareAmortizata =
      Math.round(valoare * (procUzura / 100) * 100) / 100;
    const valoareRamasa = Math.round((valoare - valoareAmortizata) * 100) / 100;

    // Monthly depreciation rate
    const cotaLunara =
      durationMonths > 0
        ? Math.round((valoare / durationMonths) * 100) / 100
        : 0;

    // Remaining duration estimate
    const durataRamasa =
      cotaLunara > 0
        ? Math.max(0, Math.ceil(valoareRamasa / cotaLunara))
        : durationMonths;

    // Map legacy stare to modern enum
    const stareMap: Record<number, "activ" | "casare" | "declasare" | "transfer"> = {
      1: "activ", // FOLOS.
      2: "activ", // FOLOSIT
      3: "activ", // CU NEVOI DE R.C.
      4: "activ", // CU NEVOI DE R.K.
      5: "casare", // PT. CASARE
    };
    const stare = stareMap[firstEntry.stare] || "activ";

    // Use a placeholder clasificare_cod - legacy doesn't map directly
    const clasificareCod = mat.cod_m?.trim() || "2.4.1";

    const [result] = await db
      .insert(schema.mijloaceFixe)
      .values({
        numarInventar: String(mat.cod),
        denumire: mat.nume?.trim() || `Material ${mat.cod}`,
        clasificareCod,
        gestiuneId,
        locFolosintaId,
        sursaFinantareId,
        contId,
        tipDocumentId,
        provenientaId,
        tipStocId,
        unitateMasuraId,
        dataAchizitie: firstEntry.data_intr || "2003-01-01",
        documentAchizitie: firstEntry.nr_doc || null,
        valoareInitiala: String(valoare),
        valoareInventar: String(valoare),
        valoareAmortizata: String(valoareAmortizata),
        valoareRamasa: String(valoareRamasa),
        durataNormala: durationMonths,
        durataRamasa,
        cotaAmortizareLunara: String(cotaLunara),
        eAmortizabil: durationMonths > 0,
        stare,
        dataIncepereAmortizare: firstEntry.data_intr || null,
      })
      .$returningId();

    idMaps.material.set(mat.cod, result.id);
    stats.migratedCount++;
  }

  logStats(stats);
  return stats;
}

// ============================================================================
// Phase 2.4: Operatii + Tranzact -> Operatiuni + Tranzactii
// ============================================================================

async function migrateOperatii(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats> {
  console.log("\n=== Phase 2.4a: Migrating Operatii -> Operatiuni ===\n");

  const stats: MigrationStats = {
    table: "operatii -> operatiuni",
    legacyCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const rows = legacyDb
    .query(
      "SELECT cod_doc, nr_doc, nr_oper, c_data, c_comanda, c_an FROM operatii ORDER BY c_data, nr_oper"
    )
    .all() as {
    cod_doc: number;
    nr_doc: string;
    nr_oper: number;
    c_data: string;
    c_comanda: number;
    c_an: number;
  }[];
  stats.legacyCount = rows.length;

  for (const row of rows) {
    const year = row.c_data
      ? parseInt(row.c_data.substring(0, 4))
      : row.c_an || 2003;
    const cOperat = year * 1000000 + row.nr_oper;

    const tipDocumentId = idMaps.acte.get(row.cod_doc) || null;

    const [result] = await db
      .insert(schema.operatiuni)
      .values({
        numarOperatie: row.nr_oper,
        an: year,
        dataOperare: row.c_data || `${year}-01-01`,
        tipDocumentId,
        numarDocument: row.nr_doc?.trim() || null,
      })
      .$returningId();

    idMaps.operatii.set(cOperat, result.id);
    stats.migratedCount++;
  }

  logStats(stats);
  return stats;
}

async function migrateTransactions(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats> {
  console.log("\n=== Phase 2.4b: Migrating Tranzact -> Tranzactii ===\n");

  const stats: MigrationStats = {
    table: "tranzact -> tranzactii",
    legacyCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  // Process in batches to avoid memory pressure
  const totalCount = (
    legacyDb.query("SELECT COUNT(*) as cnt FROM tranzact").get() as {
      cnt: number;
    }
  ).cnt;
  stats.legacyCount = totalCount;

  const batchStmt = legacyDb.query(`
    SELECT c_operat, cod_prov, cod_fin, cod_ges, c_stoc, cont, sect,
           c_adaug, cod_den, unit_mas, stare, cantit, pret, data_intr,
           proc, seria, pret_comp, crt
    FROM tranzact
    ORDER BY c_operat, crt
    LIMIT ? OFFSET ?
  `);

  let offset = 0;
  while (offset < totalCount) {
    const rows = batchStmt.all(BATCH_SIZE, offset) as {
      c_operat: number;
      cod_prov: number;
      cod_fin: number;
      cod_ges: number;
      c_stoc: number;
      cont: number;
      sect: number;
      c_adaug: number;
      cod_den: number;
      unit_mas: number;
      stare: number;
      cantit: number;
      pret: number;
      data_intr: string;
      proc: number;
      seria: string;
      pret_comp: number;
      crt: number;
    }[];

    const values = [];
    for (const row of rows) {
      const mijlocFixId = idMaps.material.get(row.cod_den);
      if (!mijlocFixId) {
        stats.skippedCount++;
        continue;
      }

      const operatiuneId = idMaps.operatii.get(row.c_operat) || null;

      // Map legacy direction to modern transaction type
      // c_adaug=2 = INTRARE (entry), c_adaug=1 = IESIRE (exit)
      const tip = row.c_adaug === 2 ? "intrare" : "iesire";

      // Compute value
      const isComplet = row.unit_mas === 6;
      const valoare = isComplet
        ? row.pret_comp
        : Math.round(row.cantit * row.pret * 100) / 100;

      values.push({
        mijlocFixId,
        operatiuneId,
        tip: tip as "intrare" | "iesire",
        dataOperare: row.data_intr || "2003-01-01",
        valoareOperatie: String(valoare),
        descriere: row.seria?.trim()
          ? `Serie: ${row.seria.trim()}`
          : null,
      });
    }

    if (values.length > 0) {
      await db.insert(schema.tranzactii).values(values);
      stats.migratedCount += values.length;
    }

    offset += BATCH_SIZE;
    if (offset % 1000 === 0) {
      console.log(
        `  Progress: ${Math.min(offset, totalCount)}/${totalCount} transactions processed`
      );
    }
  }

  logStats(stats);
  return stats;
}

// ============================================================================
// Phase 2.5: Compute Initial Solduri / Balances
// ============================================================================

/**
 * Cross-check net transaction quantities against legacy SOLDURI,
 * then create baseline amortizari records for each depreciable asset.
 *
 * Legacy SOLDURI stores quantity balances per dimension combination.
 * Modern system computes balances on-demand from transactions + amortizari.
 * This step:
 *   1. Verifies that our transaction data produces the same net balances as legacy SOLDURI
 *   2. Creates one baseline amortizari record per depreciable asset (snapshot of current state)
 */
async function computeInitialBalances(
  legacyDb: Database,
  idMaps: IdMaps
): Promise<MigrationStats> {
  console.log("\n=== Phase 2.5: Computing Initial Balances ===\n");

  const stats: MigrationStats = {
    table: "amortizari (baseline)",
    legacyCount: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  // --- Step 1: Cross-check net quantities with legacy SOLDURI ---
  console.log("  Step 1: Cross-checking transaction balances vs legacy SOLDURI...\n");

  // Get legacy SOLDURI net quantity per material
  const legacySolduri = legacyDb
    .query(
      `SELECT cod_den, SUM(cantit) as net_qty, COUNT(*) as records
       FROM solduri
       GROUP BY cod_den`
    )
    .all() as { cod_den: number; net_qty: number; records: number }[];

  const legacyBalances = new Map<number, number>();
  for (const row of legacySolduri) {
    legacyBalances.set(row.cod_den, row.net_qty);
  }

  // Compute net quantities from legacy TRANZACT for verification
  // (c_adaug=2 is entry/+, c_adaug=1 is exit/-)
  const tranzactBalances = legacyDb
    .query(
      `SELECT cod_den,
              SUM(CASE WHEN c_adaug = 2 THEN cantit ELSE 0 END) as entries,
              SUM(CASE WHEN c_adaug = 1 THEN cantit ELSE 0 END) as exits
       FROM tranzact
       GROUP BY cod_den`
    )
    .all() as { cod_den: number; entries: number; exits: number }[];

  let matchCount = 0;
  let mismatchCount = 0;
  for (const row of tranzactBalances) {
    const netFromTranzact = Math.round((row.entries - row.exits) * 1000) / 1000;
    const netFromSolduri = legacyBalances.get(row.cod_den) ?? 0;
    const diff = Math.abs(netFromTranzact - netFromSolduri);

    if (diff > 0.01) {
      mismatchCount++;
      if (mismatchCount <= 5) {
        stats.errors.push(
          `Balance mismatch cod_den=${row.cod_den}: TRANZACT net=${netFromTranzact}, SOLDURI net=${netFromSolduri}`
        );
      }
    } else {
      matchCount++;
    }
  }

  console.log(`  SOLDURI cross-check: ${matchCount} match, ${mismatchCount} mismatch`);
  if (mismatchCount > 5) {
    stats.errors.push(`...and ${mismatchCount - 5} more mismatches`);
  }

  // --- Step 2: Create baseline amortizari records ---
  console.log("\n  Step 2: Creating baseline amortizari records...\n");

  // Get all depreciable assets from the modern DB
  const assets = await db
    .select({
      id: schema.mijloaceFixe.id,
      valoareInventar: schema.mijloaceFixe.valoareInventar,
      valoareAmortizata: schema.mijloaceFixe.valoareAmortizata,
      valoareRamasa: schema.mijloaceFixe.valoareRamasa,
      cotaAmortizareLunara: schema.mijloaceFixe.cotaAmortizareLunara,
      durataRamasa: schema.mijloaceFixe.durataRamasa,
      eAmortizabil: schema.mijloaceFixe.eAmortizabil,
      durataNormala: schema.mijloaceFixe.durataNormala,
    })
    .from(schema.mijloaceFixe);

  stats.legacyCount = assets.length;

  // Use December 2025 as baseline month (latest transaction month)
  const baselineYear = 2025;
  const baselineMonth = 12;

  const batchValues: {
    mijlocFixId: number;
    an: number;
    luna: number;
    valoareLunara: string;
    valoareCumulata: string;
    valoareRamasa: string;
    valoareInventar: string;
    durataRamasa: number;
    calculat: boolean;
    dataCalcul: Date;
  }[] = [];

  for (const asset of assets) {
    if (!asset.eAmortizabil || asset.durataNormala <= 0) {
      stats.skippedCount++;
      continue;
    }

    batchValues.push({
      mijlocFixId: asset.id,
      an: baselineYear,
      luna: baselineMonth,
      valoareLunara: asset.cotaAmortizareLunara,
      valoareCumulata: asset.valoareAmortizata,
      valoareRamasa: asset.valoareRamasa,
      valoareInventar: asset.valoareInventar,
      durataRamasa: asset.durataRamasa,
      calculat: true,
      dataCalcul: new Date(),
    });

    // Insert in batches
    if (batchValues.length >= BATCH_SIZE) {
      await db.insert(schema.amortizari).values(batchValues);
      stats.migratedCount += batchValues.length;
      batchValues.length = 0;
    }
  }

  // Insert remaining
  if (batchValues.length > 0) {
    await db.insert(schema.amortizari).values(batchValues);
    stats.migratedCount += batchValues.length;
  }

  console.log(
    `  Baseline amortizari created: ${stats.migratedCount}/${stats.legacyCount} assets` +
      ` (${stats.skippedCount} non-depreciable skipped)`
  );

  logStats(stats);
  return stats;
}

// ============================================================================
// Phase 2.6: Verification
// ============================================================================

async function verify(legacyDb: Database): Promise<void> {
  console.log("\n=== Phase 2.6: Verification ===\n");

  // Record count checks
  const legacyCounts = {
    material: (
      legacyDb.query("SELECT COUNT(*) as cnt FROM material").get() as {
        cnt: number;
      }
    ).cnt,
    tranzact: (
      legacyDb.query("SELECT COUNT(*) as cnt FROM tranzact").get() as {
        cnt: number;
      }
    ).cnt,
    operatii: (
      legacyDb.query("SELECT COUNT(*) as cnt FROM operatii").get() as {
        cnt: number;
      }
    ).cnt,
  };

  const modernCounts = {
    mijloaceFixe: (
      await db
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(schema.mijloaceFixe)
    )[0].cnt,
    tranzactii: (
      await db
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(schema.tranzactii)
    )[0].cnt,
    operatiuni: (
      await db
        .select({ cnt: sql<number>`COUNT(*)` })
        .from(schema.operatiuni)
    )[0].cnt,
  };

  console.log("Record count comparison:");
  console.log(
    `  material (${legacyCounts.material}) -> mijloace_fixe (${modernCounts.mijloaceFixe})`
  );
  console.log(
    `  tranzact (${legacyCounts.tranzact}) -> tranzactii (${modernCounts.tranzactii})`
  );
  console.log(
    `  operatii (${legacyCounts.operatii}) -> operatiuni (${modernCounts.operatiuni})`
  );

  // Value sum checks
  const legacyValueSum = (
    legacyDb
      .query(
        `SELECT ROUND(SUM(CASE WHEN unit_mas = 6 THEN pret_comp ELSE cantit * pret END), 2) as total
       FROM tranzact WHERE c_adaug = 2`
      )
      .get() as { total: number }
  ).total;

  const modernValueSum = (
    await db
      .select({
        total: sql<string>`ROUND(SUM(CAST(valoare_operatie AS DECIMAL(15,2))), 2)`,
      })
      .from(schema.tranzactii)
      .where(eq(schema.tranzactii.tip, "intrare"))
  )[0].total;

  console.log(`\nValue sum comparison (INTRARE only):`);
  console.log(`  Legacy total:  ${legacyValueSum}`);
  console.log(`  Modern total:  ${modernValueSum}`);

  const diff = Math.abs(
    legacyValueSum - parseFloat(modernValueSum || "0")
  );
  if (diff < 1.0) {
    console.log("  MATCH (within rounding tolerance)");
  } else {
    console.log(`  MISMATCH: difference = ${diff}`);
  }
}

// ============================================================================
// Main Migration Runner
// ============================================================================

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║     MiFix Legacy Data Migration                 ║");
  console.log("║     FoxPro SQLite -> Modern MySQL               ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log();

  const startTime = Date.now();
  const legacyDb = openLegacyDb();

  const idMaps: IdMaps = {
    gestiuni: new Map(),
    dispus: new Map(),
    conturi: new Map(),
    acte: new Map(),
    finantat: new Map(),
    provenie: new Map(),
    stocUz: new Map(),
    unitMas: new Map(),
    material: new Map(),
    operatii: new Map(),
  };

  try {
    // Clean existing data for idempotent re-runs
    await cleanTargetTables();

    // Phase 2.2: Reference tables
    await migrateReferenceTables(legacyDb, idMaps);

    // Phase 2.3: Materials -> Mijloace Fixe
    await migrateMaterials(legacyDb, idMaps);

    // Phase 2.4: Operations + Transactions
    await migrateOperatii(legacyDb, idMaps);
    await migrateTransactions(legacyDb, idMaps);

    // Phase 2.5: Compute initial balances + baseline amortizari
    await computeInitialBalances(legacyDb, idMaps);

    // Phase 2.6: Verification
    await verify(legacyDb);
  } catch (error) {
    console.error("\n MIGRATION FAILED:", error);
    throw error;
  } finally {
    legacyDb.close();
    await poolConnection.end();
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nMigration completed in ${elapsed}s`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
