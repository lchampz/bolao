import { flagFor } from "./countryFlags.js";
import { getLastSyncedAt, setLastSyncedAt, upsertGameFromFixture, upsertTeam } from "./repo.js";
import type { Phase } from "./types.js";

/**
 * Copa do Mundo 2026 — dataset público, gratuito e sem chave de API,
 * mantido pela comunidade (atualizado ~diariamente conforme os jogos reais
 * acontecem). Ver docs/DEPLOY.md e a HU-03.3 refinada.
 */
const SOURCE_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const ROUND_TO_PHASE: Record<string, Phase> = {
  "Round of 16": "OITAVAS",
  "Quarter-final": "QUARTAS",
  "Semi-final": "SEMIFINAL",
  Final: "FINAL",
};

interface SourceMatch {
  num?: number;
  round: string;
  date: string;
  time?: string;
  team1: string;
  team2: string;
  score?: { ft?: [number, number]; et?: [number, number]; p?: [number, number] };
}

interface ResolvedTeam {
  id: string;
  name: string;
  flag: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** "W83"/"L83" = time a definir (vencedor/perdedor do jogo 83 da fonte). */
function resolveTeam(raw: string): ResolvedTeam {
  const winner = raw.match(/^W(\d+)$/);
  if (winner) return { id: raw, name: `Vencedor Jogo ${winner[1]}`, flag: "❓" };
  const loser = raw.match(/^L(\d+)$/);
  if (loser) return { id: raw, name: `Perdedor Jogo ${loser[1]}`, flag: "❓" };
  return { id: slugify(raw), name: raw, flag: flagFor(raw) };
}

/** "13:00 UTC-6" + "2026-06-11" -> ISO 8601 em UTC. */
function parseKickoff(date: string, time: string | undefined): string {
  const match = time?.match(/^(\d{2}):(\d{2})\s*UTC([+-]\d+)?/);
  if (!match) return new Date(`${date}T12:00:00Z`).toISOString();
  const [, hh, mm, offset] = match;
  const offsetHours = offset ? Number(offset) : 0;
  const dt = new Date(`${date}T00:00:00Z`);
  dt.setUTCHours(Number(hh) - offsetHours, Number(mm), 0, 0);
  return dt.toISOString();
}

/** Placar oficial = tempo regulamentar, ou prorrogação quando houve (HU-03.1). */
function officialScore(score: SourceMatch["score"]): [number, number] | null {
  const s = score?.et ?? score?.ft;
  return s && s[0] != null && s[1] != null ? s : null;
}

export interface SyncResult {
  synced: number;
  syncedAt: string;
}

export async function syncFixtures(): Promise<SyncResult> {
  const res = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Fonte de fixtures respondeu ${res.status}`);
  const data = (await res.json()) as { matches: SourceMatch[] };

  let synced = 0;
  for (const m of data.matches) {
    const phase = ROUND_TO_PHASE[m.round];
    if (!phase || m.num == null) continue;

    const home = resolveTeam(m.team1);
    const away = resolveTeam(m.team2);
    await upsertTeam(home);
    await upsertTeam(away);

    const score = officialScore(m.score);
    const wentToPenalties = Boolean(m.score?.p);
    const penaltyWinnerTeamId = wentToPenalties && m.score?.p ? (m.score.p[0] > m.score.p[1] ? home.id : away.id) : null;

    await upsertGameFromFixture({
      externalId: m.num,
      phase,
      round: phase,
      homeTeamId: home.id,
      awayTeamId: away.id,
      kickoff: parseKickoff(m.date, m.time),
      finished: score != null,
      officialHome: score?.[0] ?? null,
      officialAway: score?.[1] ?? null,
      wentToPenalties,
      penaltyWinnerTeamId,
    });
    synced++;
  }

  const syncedAt = new Date().toISOString();
  await setLastSyncedAt(syncedAt);
  return { synced, syncedAt };
}

export { getLastSyncedAt };
