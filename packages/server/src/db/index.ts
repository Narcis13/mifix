import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Create MySQL connection pool
const poolConnection = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mifix",
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

// Create Drizzle instance with schema for relational queries
export const db = drizzle(poolConnection, { schema, mode: "default" });

// Export pool for manual operations if needed
export { poolConnection };
