import { appendFileSync, existsSync, readFileSync, statSync } from "node:fs";

const ENV_FILE = ".env";
const DATABASE_API = "https://neon.new/api/v1/database";

type ClaimableDatabase = {
  connection_string: string;
  claim_url: string;
  expires_at: string;
};

function isClaimableDatabase(value: unknown): value is ClaimableDatabase {
  if (!value || typeof value !== "object") return false;
  const database = value as Record<string, unknown>;
  return (
    typeof database.connection_string === "string" &&
    typeof database.claim_url === "string" &&
    typeof database.expires_at === "string"
  );
}

function existingEnvKeys(): Set<string> {
  if (!existsSync(ENV_FILE)) return new Set();
  return new Set(
    readFileSync(ENV_FILE, "utf8")
      .split(/\r?\n/)
      .flatMap((line) => {
        const match = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line);
        return match?.[1] ? [match[1]] : [];
      }),
  );
}

function appendMissingEnv(values: Record<string, string>): void {
  const keys = existingEnvKeys();
  const lines = Object.entries(values)
    .filter(([key]) => !keys.has(key))
    .map(([key, value]) => `${key}=${value}`);
  if (lines.length === 0) return;

  const needsLeadingNewline =
    existsSync(ENV_FILE) &&
    statSync(ENV_FILE).size > 0 &&
    !readFileSync(ENV_FILE, "utf8").endsWith("\n");
  appendFileSync(
    ENV_FILE,
    `${needsLeadingNewline ? "\n" : ""}${lines.join("\n")}\n`,
  );
}

export async function provision(): Promise<string> {
  const response = await fetch(DATABASE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "anon-kit-usage" }),
  });
  if (!response.ok) {
    throw new Error(
      `Could not provision a temporary database (${response.status}).`,
    );
  }

  const database: unknown = await response.json();
  if (!isClaimableDatabase(database)) {
    throw new Error("neon.new returned an unexpected response.");
  }

  appendMissingEnv({
    DATABASE_URL: database.connection_string,
    ANON_KIT_DATABASE_URL: database.connection_string,
    PUBLIC_POSTGRES_CLAIM_URL: database.claim_url,
  });
  process.env.DATABASE_URL = database.connection_string;
  process.env.ANON_KIT_DATABASE_URL = database.connection_string;
  process.env.PUBLIC_POSTGRES_CLAIM_URL = database.claim_url;

  console.log(
    `Provisioned a temporary Neon database (expires ${database.expires_at}).`,
  );
  console.log(`Claim it to keep it: ${database.claim_url}`);
  return database.connection_string;
}

export async function getDatabaseUrl(): Promise<string> {
  const databaseUrl =
    process.env.DATABASE_URL ?? process.env.ANON_KIT_DATABASE_URL;
  if (databaseUrl) {
    process.env.DATABASE_URL ??= databaseUrl;
    process.env.ANON_KIT_DATABASE_URL ??= databaseUrl;
    return databaseUrl;
  }
  return provision();
}
