/**
 * Seed script for creating default admin user
 * Run with: bun run packages/server/src/db/seed-user.ts
 */
import { eq } from "drizzle-orm";
import { db, poolConnection } from "./index";
import { users } from "./schema";

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";

async function seedUser() {
  console.log("Seeding default admin user...");

  // Check if user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, DEFAULT_USERNAME));

  if (existingUser) {
    console.log(`User '${DEFAULT_USERNAME}' already exists. Skipping.`);
    await poolConnection.end();
    process.exit(0);
  }

  // Hash password using Bun.password with argon2id algorithm
  const passwordHash = await Bun.password.hash(DEFAULT_PASSWORD, {
    algorithm: "argon2id",
    memoryCost: 65536, // 64 MiB
    timeCost: 2,
  });

  // Insert admin user
  await db.insert(users).values({
    username: DEFAULT_USERNAME,
    passwordHash,
    activ: true,
  });

  console.log(`Created user '${DEFAULT_USERNAME}' with hashed password.`);
  console.log("Seed complete!");

  await poolConnection.end();
  process.exit(0);
}

seedUser().catch((error) => {
  console.error("Failed to seed user:", error);
  process.exit(1);
});
