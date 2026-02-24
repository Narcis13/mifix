import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "../db";
import type { ApiResponse } from "shared";

export const verificareRoutes = new Hono();

// ============================================================================
// Types
// ============================================================================

interface VerificationDetail {
  id: number;
  numarInventar?: string;
  denumire?: string;
  detaliu: string;
}

interface VerificationCheck {
  id: string;
  categorie: "integritate" | "balante" | "amortizari";
  nume: string;
  descriere: string;
  status: "ok" | "atentie" | "eroare";
  numar: number;
  detalii: VerificationDetail[];
}

interface VerificationResult {
  timestamp: string;
  durata: number;
  sumar: { total: number; ok: number; atentie: number; eroare: number };
  verificari: VerificationCheck[];
}

// ============================================================================
// Helper: run a check and return structured result
// ============================================================================

function buildCheck(
  id: string,
  categorie: VerificationCheck["categorie"],
  nume: string,
  descriere: string,
  detalii: VerificationDetail[],
  severity: "atentie" | "eroare" = "eroare"
): VerificationCheck {
  return {
    id,
    categorie,
    nume,
    descriere,
    status: detalii.length === 0 ? "ok" : severity,
    numar: detalii.length,
    detalii: detalii.slice(0, 50), // Limit details to 50 items
  };
}

// ============================================================================
// GET / - Run ALL verification checks
// ============================================================================

verificareRoutes.get("/", async (c) => {
  const start = Date.now();

  try {
    const checks: VerificationCheck[] = [];

    // ── 6.1 DATA INTEGRITY CHECKS ──────────────────────────────────────

    // 1. Orphaned transactions (tranzactii pointing to non-existent assets)
    const [orphanedTrx] = await db.execute(sql`
      SELECT t.id, t.mijloc_fix_id as mijlocFixId, t.tip, t.data_operare
      FROM tranzactii t
      LEFT JOIN mijloace_fixe mf ON t.mijloc_fix_id = mf.id
      WHERE mf.id IS NULL
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "trx-orfane",
        "integritate",
        "Tranzactii orfane",
        "Tranzactii care refera mijloace fixe inexistente",
        (orphanedTrx as any[]).map((r) => ({
          id: r.id,
          detaliu: `Tranzactie #${r.id} (tip: ${r.tip}) refera mijloc_fix_id=${r.mijlocFixId} inexistent`,
        }))
      )
    );

    // 2. Orphaned amortizari (amortizari pointing to non-existent assets)
    const [orphanedAmo] = await db.execute(sql`
      SELECT a.id, a.mijloc_fix_id as mijlocFixId, a.an, a.luna
      FROM amortizari a
      LEFT JOIN mijloace_fixe mf ON a.mijloc_fix_id = mf.id
      WHERE mf.id IS NULL
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "amo-orfane",
        "integritate",
        "Amortizari orfane",
        "Inregistrari amortizare care refera mijloace fixe inexistente",
        (orphanedAmo as any[]).map((r) => ({
          id: r.id,
          detaliu: `Amortizare #${r.id} (${r.an}/${r.luna}) refera mijloc_fix_id=${r.mijlocFixId} inexistent`,
        }))
      )
    );

    // 3. Assets without entry transaction
    const [noEntryTrx] = await db.execute(sql`
      SELECT mf.id, mf.numar_inventar as numarInventar, mf.denumire
      FROM mijloace_fixe mf
      LEFT JOIN tranzactii t ON t.mijloc_fix_id = mf.id AND t.tip = 'intrare'
      WHERE t.id IS NULL
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "fara-intrare",
        "integritate",
        "Mijloace fixe fara tranzactie de intrare",
        "Active care nu au nicio tranzactie de tip 'intrare' asociata",
        (noEntryTrx as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - ${r.denumire}`,
        })),
        "atentie"
      )
    );

    // 4. Invalid gestiune references on assets
    const [badGestiune] = await db.execute(sql`
      SELECT mf.id, mf.numar_inventar as numarInventar, mf.denumire, mf.gestiune_id as gestiuneId
      FROM mijloace_fixe mf
      LEFT JOIN gestiuni g ON mf.gestiune_id = g.id
      WHERE g.id IS NULL
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "gestiune-invalida",
        "integritate",
        "Gestiune invalida pe mijloace fixe",
        "Active cu gestiune_id care nu exista in tabela gestiuni",
        (badGestiune as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - gestiune_id=${r.gestiuneId} inexistent`,
        }))
      )
    );

    // 5. Invalid cont references on assets
    const [badCont] = await db.execute(sql`
      SELECT mf.id, mf.numar_inventar as numarInventar, mf.denumire, mf.cont_id as contId
      FROM mijloace_fixe mf
      LEFT JOIN conturi c ON mf.cont_id = c.id
      WHERE mf.cont_id IS NOT NULL AND c.id IS NULL
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "cont-invalid",
        "integritate",
        "Cont invalid pe mijloace fixe",
        "Active cu cont_id care nu exista in tabela conturi",
        (badCont as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - cont_id=${r.contId} inexistent`,
        }))
      )
    );

    // 6. Invalid clasificare references
    const [badClasif] = await db.execute(sql`
      SELECT mf.id, mf.numar_inventar as numarInventar, mf.denumire, mf.clasificare_cod as clasificareCod
      FROM mijloace_fixe mf
      LEFT JOIN clasificari cl ON mf.clasificare_cod = cl.cod
      WHERE cl.cod IS NULL
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "clasificare-invalida",
        "integritate",
        "Clasificare invalida pe mijloace fixe",
        "Active cu clasificare_cod care nu exista in catalogul de clasificari",
        (badClasif as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - clasificare_cod='${r.clasificareCod}' inexistent`,
        }))
      )
    );

    // 7. Operations without any transactions
    const [emptyOps] = await db.execute(sql`
      SELECT o.id, o.numar_operatie as numarOperatie, o.an, o.data_operare as dataOperare
      FROM operatiuni o
      LEFT JOIN tranzactii t ON t.operatiune_id = o.id
      WHERE t.id IS NULL
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "operatiuni-goale",
        "integritate",
        "Operatiuni fara tranzactii",
        "Operatiuni (acte) care nu au nicio tranzactie asociata",
        (emptyOps as any[]).map((r) => ({
          id: r.id,
          detaliu: `Operatiunea #${r.numarOperatie}/${r.an} din ${r.dataOperare} nu are tranzactii`,
        })),
        "atentie"
      )
    );

    // 8. Transactions without operatiuneId (should be 0 after backfill)
    const [orphanedOpTrx] = await db.execute(sql`
      SELECT t.id, t.mijloc_fix_id as mijlocFixId, t.tip, t.data_operare as dataOperare
      FROM tranzactii t
      WHERE t.operatiune_id IS NULL
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "trx-fara-operatiune",
        "integritate",
        "Tranzactii fara operatiune",
        "Tranzactii care nu sunt legate de nicio operatiune (operatiune_id = NULL)",
        (orphanedOpTrx as any[]).map((r) => ({
          id: r.id,
          detaliu: `Tranzactie #${r.id} (tip: ${r.tip}, data: ${r.dataOperare}) nu are operatiune asociata`,
        }))
      )
    );

    // 9. Open operations older than 30 days (possibly forgotten)
    const [oldOpenOps] = await db.execute(sql`
      SELECT o.id, o.numar_operatie as numarOperatie, o.an,
             o.data_operare as dataOperare, o.tip_operatie as tipOperatie
      FROM operatiuni o
      WHERE o.stare_operatie = 'deschisa'
        AND o.data_operare < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "operatiuni-deschise-vechi",
        "integritate",
        "Operatiuni deschise vechi (>30 zile)",
        "Operatiuni cu starea 'deschisa' mai vechi de 30 de zile - posibil uitate",
        (oldOpenOps as any[]).map((r) => ({
          id: r.id,
          detaliu: `OP-${r.numarOperatie}/${r.an} (${r.tipOperatie}) din ${r.dataOperare} - deschisa de peste 30 zile`,
        })),
        "atentie"
      )
    );

    // 10. Consistency: stoc curent vs stoc din tranzactii
    // Check if any active asset's gestiuneId doesn't match what transactions suggest
    const [stocInconsistent] = await db.execute(sql`
      SELECT mf.id, mf.numar_inventar as numarInventar, mf.denumire,
             mf.gestiune_id as gestiuneCurenta,
             latest_trx.gestiune_destinatie_id as ultimaGestiuneTrx
      FROM mijloace_fixe mf
      INNER JOIN (
        SELECT t1.mijloc_fix_id, t1.gestiune_destinatie_id
        FROM tranzactii t1
        INNER JOIN (
          SELECT mijloc_fix_id, MAX(id) as max_id
          FROM tranzactii
          WHERE tip IN ('intrare', 'transfer')
            AND gestiune_destinatie_id IS NOT NULL
          GROUP BY mijloc_fix_id
        ) t2 ON t1.id = t2.max_id
      ) latest_trx ON latest_trx.mijloc_fix_id = mf.id
      WHERE mf.stare = 'activ'
        AND mf.gestiune_id != latest_trx.gestiune_destinatie_id
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "stoc-gestiune-inconsistent",
        "integritate",
        "Gestiune inconsistenta intre activ si tranzactii",
        "Active cu gestiunea curenta diferita de ultima gestiune din tranzactii",
        (stocInconsistent as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - gestiune activ: ${r.gestiuneCurenta}, ultima tranzactie: ${r.ultimaGestiuneTrx}`,
        })),
        "atentie"
      )
    );

    // 11. Transactions without data_operare
    const [noDate] = await db.execute(sql`
      SELECT t.id, t.mijloc_fix_id as mijlocFixId, t.tip
      FROM tranzactii t
      WHERE t.data_operare IS NULL
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "trx-fara-data",
        "integritate",
        "Tranzactii fara data operare",
        "Tranzactii care nu au data operarii setata",
        (noDate as any[]).map((r) => ({
          id: r.id,
          detaliu: `Tranzactie #${r.id} (tip: ${r.tip}, mijloc_fix_id=${r.mijlocFixId})`,
        }))
      )
    );

    // ── 6.2 NEGATIVE BALANCE CHECKS ────────────────────────────────────

    // 9. Assets with negative valoare_ramasa
    const [negRamasa] = await db.execute(sql`
      SELECT id, numar_inventar as numarInventar, denumire,
             valoare_ramasa as valoareRamasa, valoare_inventar as valoareInventar
      FROM mijloace_fixe
      WHERE CAST(valoare_ramasa AS DECIMAL(15,2)) < 0
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "valoare-ramasa-negativa",
        "balante",
        "Valoare ramasa negativa",
        "Mijloace fixe cu valoare ramasa sub zero",
        (negRamasa as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - valoare ramasa: ${r.valoareRamasa} RON`,
        }))
      )
    );

    // 10. Assets with negative valoare_amortizata
    const [negAmort] = await db.execute(sql`
      SELECT id, numar_inventar as numarInventar, denumire,
             valoare_amortizata as valoareAmortizata
      FROM mijloace_fixe
      WHERE CAST(valoare_amortizata AS DECIMAL(15,2)) < 0
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "amortizare-negativa",
        "balante",
        "Valoare amortizata negativa",
        "Mijloace fixe cu valoare amortizata sub zero",
        (negAmort as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - valoare amortizata: ${r.valoareAmortizata} RON`,
        }))
      )
    );

    // 11. Over-depreciated assets (amortizata > inventar)
    const [overDepreciated] = await db.execute(sql`
      SELECT id, numar_inventar as numarInventar, denumire,
             valoare_inventar as valoareInventar,
             valoare_amortizata as valoareAmortizata
      FROM mijloace_fixe
      WHERE CAST(valoare_amortizata AS DECIMAL(15,2)) > CAST(valoare_inventar AS DECIMAL(15,2))
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "supra-amortizat",
        "balante",
        "Active supra-amortizate",
        "Mijloace fixe cu valoare amortizata mai mare decat valoare inventar",
        (overDepreciated as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - inventar: ${r.valoareInventar}, amortizat: ${r.valoareAmortizata}`,
        }))
      )
    );

    // 12. Value consistency: valoareRamasa != valoareInventar - valoareAmortizata
    const [valueMismatch] = await db.execute(sql`
      SELECT id, numar_inventar as numarInventar, denumire,
             valoare_inventar as valoareInventar,
             valoare_amortizata as valoareAmortizata,
             valoare_ramasa as valoareRamasa,
             CAST(valoare_inventar AS DECIMAL(15,2)) - CAST(valoare_amortizata AS DECIMAL(15,2)) as calculat
      FROM mijloace_fixe
      WHERE ABS(
        CAST(valoare_ramasa AS DECIMAL(15,2)) -
        (CAST(valoare_inventar AS DECIMAL(15,2)) - CAST(valoare_amortizata AS DECIMAL(15,2)))
      ) > 0.01
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "valori-inconsistente",
        "balante",
        "Valori inconsistente pe active",
        "Mjloace fixe unde valoare_ramasa != valoare_inventar - valoare_amortizata (toleranta 0.01)",
        (valueMismatch as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - inventar: ${r.valoareInventar}, amortizat: ${r.valoareAmortizata}, ramasa: ${r.valoareRamasa} (calculat: ${r.calculat})`,
        }))
      )
    );

    // 13. Durata ramasa negative
    const [negDurata] = await db.execute(sql`
      SELECT id, numar_inventar as numarInventar, denumire, durata_ramasa as durataRamasa
      FROM mijloace_fixe
      WHERE durata_ramasa < 0
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "durata-negativa",
        "balante",
        "Durata ramasa negativa",
        "Mijloace fixe cu durata ramasa de amortizare sub zero",
        (negDurata as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - durata ramasa: ${r.durataRamasa} luni`,
        })),
        "atentie"
      )
    );

    // ── 6.3 AMORTIZARI CONSISTENCY CHECKS ──────────────────────────────

    // 14. Asset valoareAmortizata vs latest amortizari.valoareCumulata mismatch
    const [amoMismatch] = await db.execute(sql`
      SELECT mf.id, mf.numar_inventar as numarInventar, mf.denumire,
             mf.valoare_amortizata as assetAmortizata,
             latest.valoare_cumulata as amoCumulata
      FROM mijloace_fixe mf
      INNER JOIN (
        SELECT a1.mijloc_fix_id,
               a1.valoare_cumulata,
               a1.valoare_ramasa
        FROM amortizari a1
        INNER JOIN (
          SELECT mijloc_fix_id, MAX(an * 100 + luna) as max_period
          FROM amortizari
          GROUP BY mijloc_fix_id
        ) a2 ON a1.mijloc_fix_id = a2.mijloc_fix_id
           AND (a1.an * 100 + a1.luna) = a2.max_period
      ) latest ON mf.id = latest.mijloc_fix_id
      WHERE ABS(
        CAST(mf.valoare_amortizata AS DECIMAL(15,2)) -
        CAST(latest.valoare_cumulata AS DECIMAL(15,2))
      ) > 0.01
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "amo-val-desincron",
        "amortizari",
        "Valoare amortizata desincronizata",
        "Mijloace fixe unde valoare_amortizata pe activ difera de ultima valoare_cumulata din amortizari",
        (amoMismatch as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - activ: ${r.assetAmortizata}, ultima amortizare: ${r.amoCumulata}`,
        }))
      )
    );

    // 15. Asset valoareRamasa vs latest amortizari.valoareRamasa mismatch
    const [ramasaMismatch] = await db.execute(sql`
      SELECT mf.id, mf.numar_inventar as numarInventar, mf.denumire,
             mf.valoare_ramasa as assetRamasa,
             latest.valoare_ramasa as amoRamasa
      FROM mijloace_fixe mf
      INNER JOIN (
        SELECT a1.mijloc_fix_id,
               a1.valoare_ramasa
        FROM amortizari a1
        INNER JOIN (
          SELECT mijloc_fix_id, MAX(an * 100 + luna) as max_period
          FROM amortizari
          GROUP BY mijloc_fix_id
        ) a2 ON a1.mijloc_fix_id = a2.mijloc_fix_id
           AND (a1.an * 100 + a1.luna) = a2.max_period
      ) latest ON mf.id = latest.mijloc_fix_id
      WHERE ABS(
        CAST(mf.valoare_ramasa AS DECIMAL(15,2)) -
        CAST(latest.valoare_ramasa AS DECIMAL(15,2))
      ) > 0.01
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "amo-ramasa-desincron",
        "amortizari",
        "Valoare ramasa desincronizata",
        "Mijloace fixe unde valoare_ramasa pe activ difera de ultima valoare_ramasa din amortizari",
        (ramasaMismatch as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - activ: ${r.assetRamasa}, ultima amortizare: ${r.amoRamasa}`,
        }))
      )
    );

    // 16. Non-depreciable assets with amortizari records
    const [nonDepWithAmo] = await db.execute(sql`
      SELECT mf.id, mf.numar_inventar as numarInventar, mf.denumire,
             COUNT(a.id) as numarInregistrari
      FROM mijloace_fixe mf
      INNER JOIN amortizari a ON a.mijloc_fix_id = mf.id
      WHERE mf.e_amortizabil = false
      GROUP BY mf.id, mf.numar_inventar, mf.denumire
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "neamortizabil-cu-amo",
        "amortizari",
        "Active neamortizabile cu inregistrari amortizare",
        "Mijloace fixe marcate ca neamortizabile dar care au inregistrari in tabela amortizari",
        (nonDepWithAmo as any[]).map((r) => ({
          id: r.id,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - ${r.numarInregistrari} inregistrari amortizare`,
        })),
        "atentie"
      )
    );

    // 17. Amortizari math check: valoareCumulata should equal sum of all valoareLunara
    const [amoCumulataMismatch] = await db.execute(sql`
      SELECT sub.mijloc_fix_id as mijlocFixId,
             mf.numar_inventar as numarInventar,
             mf.denumire,
             sub.max_cumulata as ultimaCumulata,
             sub.suma_lunara as sumaLunara
      FROM (
        SELECT mijloc_fix_id,
               CAST(SUM(valoare_lunara) AS DECIMAL(15,2)) as suma_lunara,
               (
                SELECT a2.valoare_cumulata
                FROM amortizari a2
                WHERE a2.mijloc_fix_id = amortizari.mijloc_fix_id
                ORDER BY a2.an DESC, a2.luna DESC
                LIMIT 1
               ) as max_cumulata
        FROM amortizari
        GROUP BY mijloc_fix_id
      ) sub
      INNER JOIN mijloace_fixe mf ON mf.id = sub.mijloc_fix_id
      WHERE ABS(CAST(sub.max_cumulata AS DECIMAL(15,2)) - sub.suma_lunara) > 0.01
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "amo-suma-gresita",
        "amortizari",
        "Suma amortizari lunare inconsistenta",
        "Active unde suma valoareLunara din amortizari nu corespunde cu ultima valoareCumulata",
        (amoCumulataMismatch as any[]).map((r) => ({
          id: r.mijlocFixId,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - cumulata: ${r.ultimaCumulata}, suma lunare: ${r.sumaLunara}`,
        }))
      )
    );

    // 18. Amortizari month gaps (for assets with multiple months)
    const [monthGaps] = await db.execute(sql`
      SELECT sub.mijloc_fix_id as mijlocFixId,
             mf.numar_inventar as numarInventar,
             mf.denumire,
             sub.nr_inregistrari as nrInregistrari,
             sub.span as span
      FROM (
        SELECT mijloc_fix_id,
               COUNT(*) as nr_inregistrari,
               (MAX(an * 12 + luna) - MIN(an * 12 + luna) + 1) as span
        FROM amortizari
        GROUP BY mijloc_fix_id
        HAVING COUNT(*) <> (MAX(an * 12 + luna) - MIN(an * 12 + luna) + 1)
      ) sub
      INNER JOIN mijloace_fixe mf ON mf.id = sub.mijloc_fix_id
      LIMIT 50
    `);
    checks.push(
      buildCheck(
        "amo-luni-lipsa",
        "amortizari",
        "Luni lipsa in secventa amortizare",
        "Active cu goluri in secventa lunara de amortizare (luni sarite)",
        (monthGaps as any[]).map((r) => ({
          id: r.mijlocFixId,
          numarInventar: r.numarInventar,
          denumire: r.denumire,
          detaliu: `${r.numarInventar} - ${r.nrInregistrari} inregistrari dar span de ${r.span} luni`,
        })),
        "atentie"
      )
    );

    // ── BUILD SUMMARY ──────────────────────────────────────────────────

    const sumar = {
      total: checks.length,
      ok: checks.filter((c) => c.status === "ok").length,
      atentie: checks.filter((c) => c.status === "atentie").length,
      eroare: checks.filter((c) => c.status === "eroare").length,
    };

    const result: VerificationResult = {
      timestamp: new Date().toISOString(),
      durata: Date.now() - start,
      sumar,
      verificari: checks,
    };

    return c.json<ApiResponse<VerificationResult>>({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Verificare integritate error:", error);
    return c.json<ApiResponse>(
      {
        success: false,
        message: "Eroare la verificarea integritatii datelor",
      },
      500
    );
  }
});
