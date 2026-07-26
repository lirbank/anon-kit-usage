# anon-kit-usage

Minimal TypeScript project backed by a disposable
[Neon](https://neon.com) Postgres database. No account, signup, or config is
needed.

This repository is a manual test bed for experimenting with the
[anon-kit](https://github.com/lirbank/anon-kit) skill and project, including
installation through the shadcn registry.

## Setup

```bash
bun install
```

## Run

```bash
bun start
```

The first run provisions a temporary Postgres database through
[neon.new](https://neon.new) and saves `DATABASE_URL`,
`ANON_KIT_DATABASE_URL`, and the claim URL to the ignored `.env` file. Later
runs reuse it. The command dumps every table so you can inspect the data.

## Seed

```bash
bun run seed        # 100 patients (or: bun run seed 500)
```

This drops and recreates a PHI-shaped schema with deterministic synthetic data:
`patients` (name, email, phone, SSN, date of birth, and ZIP code) and
`encounters` (a foreign key to patients, dates, and free-text notes containing
an SSN, email address, and phone number).

## Experiment with anon-kit

Start from a clean checkout, seed the disposable database, install or invoke the
anon-kit skill, and inspect the artifacts and masked data it produces. Generated
maps, SQL, installed recipe code, and skill copies are test output; remove them
before the next clean experiment.

`seed` is destructive. Only run it against the disposable synthetic database
created for this repository.

The database expires after 72 hours unless you claim it into a free Neon
account. The claim URL is printed and saved on first run. If the database has
expired, delete `.env` and rerun.
