/**
 * Backfill script: Link orphaned transactions to operatiuni headers.
 *
 * Finds all tranzactii with operatiune_id = NULL, groups them logically
 * (by data_operare + tip + document_numar), creates operatiune headers,
 * and sets operatiune_id on the transactions.
 *
 * Run: bun run --cwd packages/server src/scripts/backfill-operatiuni.ts
 */

import { db } from "../db";
import { operatiuni, tranzactii } from "../db/schema";
import { sql, eq, isNull } from "drizzle-orm";
import { getNextNumarOperatie } from "../utils/operatiuni-helpers";

// Map transaction tip -> operatiune tipOperatie
function tipToTipOperatie(tip: string): "intrare" | "iesire" | "transfer" | "inventar" | "ajustare" {
  switch (tip) {
    case "intrare":
      return "intrare";
    case "casare":
    case "iesire":
      return "iesire";
    case "transfer":
      return "transfer";
    case "declasare":
    case "reevaluare":
    case "modernizare":
      return "ajustare";
    default:
      return "transfer";
  }
}

interface OrphanedTrx {
  id: number;
  tip: string;
  dataOperare: Date;
  documentNumar: string | null;
}

async function main() {
  console.log("=== Backfill Operatiuni: Start ===\n");

  // 1. Count orphaned transactions
  const [countResult] = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM tranzactii WHERE operatiune_id IS NULL
  `);
  const totalOrphaned = (countResult as any[])[0]?.cnt ?? 0;
  console.log(`Tranzactii orfane (operatiune_id = NULL): ${totalOrphaned}`);

  if (totalOrphaned === 0) {
    console.log("Nimic de facut. Toate tranzactiile au operatiune_id setat.");
    process.exit(0);
  }

  // 2. Fetch all orphaned transactions
  const [orphanedRows] = await db.execute(sql`
    SELECT id, tip, data_operare, document_numar
    FROM tranzactii
    WHERE operatiune_id IS NULL
    ORDER BY data_operare, tip, document_numar, id
  `);

  const orphaned = (orphanedRows as any[]).map((r): OrphanedTrx => ({
    id: r.id,
    tip: r.tip,
    dataOperare: new Date(r.data_operare),
    documentNumar: r.document_numar ?? null,
  }));

  // 3. Group transactions logically:
  //    Key = dataOperare(YYYY-MM-DD) + tip + documentNumar
  //    If no documentNumar, each transaction becomes its own group
  const groups = new Map<string, OrphanedTrx[]>();

  for (const trx of orphaned) {
    const dateStr = trx.dataOperare.toISOString().split("T")[0];
    const docKey = trx.documentNumar || `_solo_${trx.id}`;
    const key = `${dateStr}|${trx.tip}|${docKey}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(trx);
  }

  console.log(`Grupuri logice de tranzactii: ${groups.size}\n`);

  // 4. Process each group: create operatiune + link transactions
  let created = 0;
  let linked = 0;
  let errors = 0;

  // Process in batches using DB transactions
  const groupEntries = Array.from(groups.entries());

  // Process in chunks of 50 groups per DB transaction
  const BATCH_SIZE = 50;
  for (let i = 0; i < groupEntries.length; i += BATCH_SIZE) {
    const batch = groupEntries.slice(i, i + BATCH_SIZE);

    await db.transaction(async (tx) => {
      for (const [_key, trxGroup] of batch) {
        try {
          const first = trxGroup[0];
          const an = first.dataOperare.getFullYear();
          const tipOperatie = tipToTipOperatie(first.tip);

          // Get next number for this year
          const numarOp = await getNextNumarOperatie(tx, an);

          // Create operatiune header
          const [opResult] = await tx.insert(operatiuni).values({
            numarOperatie: numarOp,
            an,
            dataOperare: first.dataOperare,
            tipOperatie,
            stare: "finalizata",
            numarDocument: first.documentNumar,
            descriere: `Backfill: ${trxGroup.length} tranzactii ${first.tip}`,
          });

          const opId = (opResult as any).insertId;

          // Link all transactions in this group
          for (const trx of trxGroup) {
            await tx
              .update(tranzactii)
              .set({ operatiuneId: opId })
              .where(eq(tranzactii.id, trx.id));
          }

          created++;
          linked += trxGroup.length;
        } catch (err) {
          errors++;
          console.error(`Eroare la grup ${_key}:`, err);
        }
      }
    });

    // Progress
    const processed = Math.min(i + BATCH_SIZE, groupEntries.length);
    console.log(`  Procesat ${processed}/${groupEntries.length} grupuri (${created} operatiuni, ${linked} tranzactii linkuite)`);
  }

  // 5. Verify
  const [verifyResult] = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM tranzactii WHERE operatiune_id IS NULL
  `);
  const remaining = (verifyResult as any[])[0]?.cnt ?? 0;

  console.log("\n=== Backfill Operatiuni: Rezultat ===");
  console.log(`Operatiuni create:      ${created}`);
  console.log(`Tranzactii linkuite:    ${linked}`);
  console.log(`Erori:                  ${errors}`);
  console.log(`Tranzactii ramase orfane: ${remaining}`);

  if (remaining > 0) {
    console.warn(`\nATENTIE: ${remaining} tranzactii inca nu au operatiune_id!`);
  } else {
    console.log("\nToate tranzactiile au acum operatiune_id setat.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill FATAL:", err);
  process.exit(1);
});
