import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://bolao:bolao@localhost:5432/bolao",
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

export async function initSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      flag TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      "externalId" INTEGER,
      phase TEXT NOT NULL,
      round TEXT NOT NULL,
      "homeTeamId" TEXT NOT NULL,
      "awayTeamId" TEXT NOT NULL,
      kickoff TEXT NOT NULL,
      finished BOOLEAN NOT NULL DEFAULT FALSE,
      "officialHome" INTEGER,
      "officialAway" INTEGER,
      "wentToPenalties" BOOLEAN NOT NULL DEFAULT FALSE,
      "penaltyWinnerTeamId" TEXT
    );

    -- upsert de sincronização automática (HU-03.3 refinamento): garante uma
    -- única linha por partida da fonte externa, sem bloquear jogos manuais
    -- (externalId NULL) criados pelo seed local.
    CREATE UNIQUE INDEX IF NOT EXISTS games_external_id_idx
      ON games ("externalId") WHERE "externalId" IS NOT NULL;

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      area TEXT NOT NULL,
      email TEXT,
      "createdAt" TEXT NOT NULL
    );

    -- HU-01.1 (refinamento): adesão passa a ser por convite de e-mail em vez
    -- de auto-cadastro livre. Ver server/src/routes/invites.ts.
    CREATE TABLE IF NOT EXISTS invites (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      "createdAt" TEXT NOT NULL,
      "acceptedAt" TEXT,
      "participantId" TEXT REFERENCES participants(id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS invites_email_idx ON invites (lower(email));
    CREATE UNIQUE INDEX IF NOT EXISTS invites_token_idx ON invites (token);

    CREATE TABLE IF NOT EXISTS picks (
      id TEXT PRIMARY KEY,
      "participantId" TEXT NOT NULL REFERENCES participants(id),
      "gameId" TEXT NOT NULL REFERENCES games(id),
      "homeScore" INTEGER NOT NULL,
      "awayScore" INTEGER NOT NULL,
      "submittedAt" TEXT NOT NULL,
      UNIQUE("participantId", "gameId")
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migração aditiva para bancos criados antes do sync automático de fixtures.
  await pool.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS "externalId" INTEGER`);
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS games_external_id_idx ON games ("externalId") WHERE "externalId" IS NOT NULL`,
  );

  // Migração aditiva para bancos criados antes do módulo de convites.
  await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS email TEXT`);

  await pool.query(
    `INSERT INTO config (key, value) VALUES ('antecedenciaMinutos', '120') ON CONFLICT (key) DO NOTHING`,
  );
}

export async function dbIsEmpty(): Promise<boolean> {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM teams");
  return rows[0].count === 0;
}
