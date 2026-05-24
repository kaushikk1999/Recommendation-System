import { upsertDocuments } from "../src/lib/store";
import { demoDocuments } from "../src/lib/demo-data";

async function main() {
  const count = await upsertDocuments(demoDocuments);
  console.log(`Seeded ${count} NALCO intelligence documents.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
