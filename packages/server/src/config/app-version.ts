import { APP_VERSION, type AppVersionInfo } from "shared";
import { poolConnection } from "../db";

const APP_VERSION_DB_TABLE = process.env.APP_VERSION_DB_TABLE?.trim();
const APP_VERSION_DB_KEY = process.env.APP_VERSION_DB_KEY?.trim() || "app_version";

/**
 * Validate the optional table name used for database-backed version lookups.
 */
function getVersionTableName(): string | null {
  if (!APP_VERSION_DB_TABLE) {
    return null;
  }

  return /^[A-Za-z0-9_]+$/.test(APP_VERSION_DB_TABLE) ? APP_VERSION_DB_TABLE : null;
}

/**
 * Read the manually managed app version from a key/value table when configured.
 * Expected schema: `key` VARCHAR, `value` VARCHAR with a row for `app_version`.
 */
async function readVersionFromDatabase(tableName: string): Promise<string | null> {
  const [rows] = await poolConnection.query(
    `SELECT \`value\` FROM \`${tableName}\` WHERE \`key\` = ? LIMIT 1`,
    [APP_VERSION_DB_KEY]
  );

  const value = (rows as Array<{ value?: string | null }>)[0]?.value?.trim();
  return value || null;
}

/**
 * Resolve the app version from the configured source.
 * Default behavior reads the shared version file and falls back to it whenever
 * the optional database source is unavailable.
 */
export async function getAppVersionInfo(): Promise<AppVersionInfo> {
  const tableName = getVersionTableName();

  if (!tableName) {
    return {
      version: APP_VERSION,
      source: "file",
    };
  }

  try {
    const databaseVersion = await readVersionFromDatabase(tableName);

    if (databaseVersion) {
      return {
        version: databaseVersion,
        source: "database",
      };
    }
  } catch (error) {
    console.warn("Failed to read app version from database, falling back to file.", error);
  }

  return {
    version: APP_VERSION,
    source: "file",
  };
}
