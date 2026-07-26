// Seed a PHI-shaped schema with synthetic data for exercising the strategies.
// Usage: bun seed.ts [patient_count]  (default 100)
//
// Creates:
//   patients   — name, email, phone, ssn, dob, zip (the PII/PHI columns)
//   encounters — patient_id FK (non-deferrable, the shape that breaks a naive
//                id rewrite), dates, free-text notes with embedded
//                SSN/email/phone so the scrub pass has something to catch

import postgres from "postgres";

import { getDatabaseUrl } from "./db.ts";
import { buildFixture } from "./fixture.ts";

const patientCount = Number(process.argv[2] ?? "100");
if (!Number.isInteger(patientCount) || patientCount < 1) {
  throw new Error(`Invalid patient count: ${process.argv[2] ?? ""}`);
}

const { patients, encounters } = buildFixture(patientCount);
console.log(
  `Seeding ${patients.length} patients, ${encounters.length} encounters...`,
);

const sql = postgres(await getDatabaseUrl());

try {
  await sql.begin(async (transaction) => {
    await transaction`DROP TABLE IF EXISTS encounters`;
    await transaction`DROP TABLE IF EXISTS patients`;

    await transaction`
      CREATE TABLE patients (
        patient_id text PRIMARY KEY,
        first_name text NOT NULL,
        last_name  text NOT NULL,
        email      text NOT NULL,
        phone      text NOT NULL,
        ssn        text NOT NULL,
        dob        date NOT NULL,
        zip        text NOT NULL
      )
    `;

    await transaction`
      CREATE TABLE encounters (
        encounter_id   serial PRIMARY KEY,
        patient_id     text NOT NULL REFERENCES patients (patient_id),
        admit_date     date NOT NULL,
        discharge_date date NOT NULL,
        notes          text NOT NULL
      )
    `;

    await transaction`
      INSERT INTO patients ${transaction(
        patients,
        "patient_id",
        "first_name",
        "last_name",
        "email",
        "phone",
        "ssn",
        "dob",
        "zip",
      )}
    `;
    await transaction`
      INSERT INTO encounters ${transaction(
        encounters,
        "patient_id",
        "admit_date",
        "discharge_date",
        "notes",
      )}
    `;
  });

  const counts = await sql<{ table: string; count: number }[]>`
    SELECT 'patients' AS table, count(*)::int AS count FROM patients
    UNION ALL
    SELECT 'encounters', count(*)::int FROM encounters
  `;
  console.log(
    "Done.",
    Object.fromEntries(counts.map((row) => [row.table, row.count])),
  );
} finally {
  await sql.end();
}
