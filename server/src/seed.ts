import { randomUUID } from "node:crypto";
import { pool } from "./db.js";

const TEAMS: Array<[string, string, string]> = [
  ["BRA", "Brasil", "🇧🇷"],
  ["FRA", "França", "🇫🇷"],
  ["ALE", "Alemanha", "🇩🇪"],
  ["ESP", "Espanha", "🇪🇸"],
  ["ARG", "Argentina", "🇦🇷"],
  ["POR", "Portugal", "🇵🇹"],
  ["ING", "Inglaterra", "🏴"],
  ["ITA", "Itália", "🇮🇹"],
  ["HOL", "Holanda", "🇳🇱"],
  ["BEL", "Bélgica", "🇧🇪"],
  ["URU", "Uruguai", "🇺🇾"],
  ["CRO", "Croácia", "🇭🇷"],
  ["JAP", "Japão", "🇯🇵"],
  ["MAR", "Marrocos", "🇲🇦"],
  ["USA", "Estados Unidos", "🇺🇸"],
  ["COL", "Colômbia", "🇨🇴"],
];

/** Usado só quando a sincronização automática (fixtures.ts) falha — ver index.ts. */
export async function seedDemoFixtures(): Promise<void> {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM teams");
  if (rows[0].count > 0) return;

  for (const [id, name, flag] of TEAMS) {
    await pool.query("INSERT INTO teams (id, name, flag) VALUES ($1, $2, $3)", [id, name, flag]);
  }

  const baseDate = new Date("2026-07-05T15:00:00Z");
  const oitavasPairs: [string, string][] = [
    ["BRA", "FRA"],
    ["ALE", "ESP"],
    ["ARG", "POR"],
    ["ING", "ITA"],
    ["HOL", "BEL"],
    ["URU", "CRO"],
    ["JAP", "MAR"],
    ["USA", "COL"],
  ];

  for (let i = 0; i < oitavasPairs.length; i++) {
    const [home, away] = oitavasPairs[i];
    const kickoff = new Date(baseDate.getTime() + i * 3 * 60 * 60 * 1000);
    await pool.query(
      `
      INSERT INTO games (id, phase, round, "homeTeamId", "awayTeamId", kickoff, finished)
      VALUES ($1, 'OITAVAS', 'OITAVAS', $2, $3, $4, FALSE)
      `,
      [randomUUID(), home, away, kickoff.toISOString()],
    );
  }
}

/** Participantes de demonstração — sempre criados se a tabela estiver vazia. */
export async function seedDemoParticipants(): Promise<void> {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM participants");
  if (rows[0].count > 0) return;

  const demoParticipants: [string, string][] = [
    ["Ana Souza", "TI"],
    ["Bruno Lima", "RH"],
    ["Carla Dias", "FINANCEIRO"],
    ["Diego Alves", "TI"],
    ["Elis Rocha", "RH"],
  ];
  for (const [name, area] of demoParticipants) {
    await pool.query(
      'INSERT INTO participants (id, name, area, "createdAt") VALUES ($1, $2, $3, $4)',
      [randomUUID(), name, area, new Date().toISOString()],
    );
  }
}
