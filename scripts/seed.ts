// Seed the SupportLoop database from the command line: `npm run seed`.
// Loads .env.local, then runs the same seeding logic the in-app reset uses.
import { config } from "dotenv";
config({ path: ".env.local" });

import { seedDatabase } from "../lib/seed-core";

async function main() {
  console.log("Seeding SupportLoop demo data (this computes real embeddings)...");
  const counts = await seedDatabase();
  console.log("Done:");
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message ?? err);
  process.exit(1);
});
