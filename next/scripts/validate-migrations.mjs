import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../drizzle/", import.meta.url);
const journal = JSON.parse(await readFile(new URL("meta/_journal.json", root), "utf8"));
const files = new Set((await readdir(root)).filter((file) => /^\d+_.+\.sql$/.test(file)));
const entries = journal.entries ?? [];

if (entries.length === 0) throw new Error("Drizzle migration journal is empty");
for (const entry of entries) {
  const file = `${entry.tag}.sql`;
  if (!files.has(file)) throw new Error(`Journal entry has no migration file: ${file}`);
  const sql = await readFile(new URL(file, root), "utf8");
  if (/\b(DROP\s+TABLE|TRUNCATE|DROP\s+SCHEMA)\b/i.test(sql)) {
    throw new Error(`Destructive statement found in forward migration: ${file}`);
  }
}

console.log(`Validated ${entries.length} forward-only migration entries.`);
