import { eq, max } from "drizzle-orm";
import { operatiuni } from "../db/schema";
import type { MySqlTransaction } from "drizzle-orm/mysql-core";

/**
 * Calculeaza urmatorul numar secvential de operatie pentru un an dat.
 * Se apeleaza in cadrul unei tranzactii DB pentru atomicitate.
 *
 * @param tx - Tranzactie DB (drizzle transaction sau db instance)
 * @param an - Anul operatiei
 * @returns Urmatorul numar disponibil (1-based)
 */
export async function getNextNumarOperatie(
  tx: any,
  an: number
): Promise<number> {
  const [result] = await tx
    .select({ maxNr: max(operatiuni.numarOperatie) })
    .from(operatiuni)
    .where(eq(operatiuni.an, an));

  return (result?.maxNr ?? 0) + 1;
}
