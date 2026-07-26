import postgres from "postgres";

import { getDatabaseUrl } from "./db.ts";

function display(value: unknown): string {
  if (value === null) return "NULL";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const sql = postgres(await getDatabaseUrl());

try {
  const tables = await sql<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  if (tables.length === 0) {
    console.log("No tables found. Run `bun run seed` first.");
  }

  for (const { table_name: table } of tables) {
    const rows = await sql`SELECT * FROM ${sql(table)}`;
    const columns = rows.columns.map(({ name }) => name);
    console.log(`\n== ${table} (${rows.length} rows) ==`);
    console.log(columns.join(" | "));
    for (const row of rows) {
      console.log(columns.map((column) => display(row[column])).join(" | "));
    }
  }
} finally {
  await sql.end();
}
