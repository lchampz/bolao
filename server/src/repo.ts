import { randomUUID } from "node:crypto";
import { pool } from "./db.js";
import type { Config, Game, Invite, Message, Participant, Phase, Pick, Team } from "./types.js";

export async function getTeams(): Promise<Team[]> {
  const { rows } = await pool.query("SELECT * FROM teams");
  return rows;
}

export async function upsertTeam(team: Team): Promise<void> {
  await pool.query(
    `
    INSERT INTO teams (id, name, flag) VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, flag = EXCLUDED.flag
    `,
    [team.id, team.name, team.flag],
  );
}

export async function getGames(): Promise<Game[]> {
  const { rows } = await pool.query('SELECT * FROM games ORDER BY kickoff ASC');
  return rows;
}

export async function getGame(id: string): Promise<Game | undefined> {
  const { rows } = await pool.query("SELECT * FROM games WHERE id = $1", [id]);
  return rows[0];
}

export async function getParticipants(): Promise<Participant[]> {
  const { rows } = await pool.query('SELECT * FROM participants ORDER BY "createdAt" ASC');
  return rows;
}

export async function getParticipantByEmail(email: string): Promise<Participant | undefined> {
  const { rows } = await pool.query("SELECT * FROM participants WHERE lower(email) = lower($1)", [email]);
  return rows[0];
}

export async function getParticipant(id: string): Promise<Participant | undefined> {
  const { rows } = await pool.query("SELECT * FROM participants WHERE id = $1", [id]);
  return rows[0];
}

export async function touchParticipantLastSeen(id: string): Promise<void> {
  await pool.query('UPDATE participants SET "lastSeenAt" = $1 WHERE id = $2', [new Date().toISOString(), id]);
}

export async function createParticipant(participant: Participant): Promise<void> {
  await pool.query(
    'INSERT INTO participants (id, name, area, email, "createdAt") VALUES ($1, $2, $3, $4, $5)',
    [participant.id, participant.name, participant.area, participant.email, participant.createdAt],
  );
}

/** Cria um convite novo ou reenvia um pendente existente para o mesmo e-mail. */
export async function upsertInvite(email: string): Promise<{ invite: Invite; alreadyAccepted: boolean }> {
  const existing = await pool.query("SELECT * FROM invites WHERE lower(email) = lower($1)", [email]);
  if (existing.rows[0]?.status === "ACCEPTED") {
    return { invite: existing.rows[0], alreadyAccepted: true };
  }

  const { rows } = await pool.query(
    `
    INSERT INTO invites (id, email, token, status, "createdAt")
    VALUES ($1, $2, $3, 'PENDING', $4)
    ON CONFLICT (lower(email)) DO UPDATE SET "createdAt" = EXCLUDED."createdAt"
    RETURNING *
    `,
    [randomUUID(), email, randomUUID(), new Date().toISOString()],
  );
  return { invite: rows[0], alreadyAccepted: false };
}

export async function getInvites(): Promise<Invite[]> {
  const { rows } = await pool.query('SELECT * FROM invites ORDER BY "createdAt" DESC');
  return rows;
}

export async function getInviteById(id: string): Promise<Invite | undefined> {
  const { rows } = await pool.query("SELECT * FROM invites WHERE id = $1", [id]);
  return rows[0];
}

export async function getInviteByToken(token: string): Promise<Invite | undefined> {
  const { rows } = await pool.query("SELECT * FROM invites WHERE token = $1", [token]);
  return rows[0];
}

export async function markInviteAccepted(id: string, participantId: string): Promise<void> {
  await pool.query(
    `UPDATE invites SET status = 'ACCEPTED', "acceptedAt" = $1, "participantId" = $2 WHERE id = $3`,
    [new Date().toISOString(), participantId, id],
  );
}


export async function getPicks(): Promise<Pick[]> {
  const { rows } = await pool.query("SELECT * FROM picks");
  return rows;
}

export async function getPicksForParticipant(participantId: string): Promise<Pick[]> {
  const { rows } = await pool.query('SELECT * FROM picks WHERE "participantId" = $1', [participantId]);
  return rows;
}

export async function upsertPick(pick: Pick): Promise<void> {
  await pool.query(
    `
    INSERT INTO picks (id, "participantId", "gameId", "homeScore", "awayScore", "submittedAt")
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT ("participantId", "gameId") DO UPDATE SET
      "homeScore" = EXCLUDED."homeScore",
      "awayScore" = EXCLUDED."awayScore",
      "submittedAt" = EXCLUDED."submittedAt"
    `,
    [pick.id, pick.participantId, pick.gameId, pick.homeScore, pick.awayScore, pick.submittedAt],
  );
}

export interface FixtureUpsert {
  externalId: number;
  phase: Phase;
  round: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoff: string;
  finished: boolean;
  officialHome: number | null;
  officialAway: number | null;
  wentToPenalties: boolean;
  penaltyWinnerTeamId: string | null;
}

/** Upsert por externalId — chamado pela sincronização automática (fixtures.ts). */
export async function upsertGameFromFixture(f: FixtureUpsert): Promise<void> {
  await pool.query(
    `
    INSERT INTO games (
      id, "externalId", phase, round, "homeTeamId", "awayTeamId", kickoff,
      finished, "officialHome", "officialAway", "wentToPenalties", "penaltyWinnerTeamId"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT ("externalId") WHERE "externalId" IS NOT NULL DO UPDATE SET
      phase = EXCLUDED.phase,
      round = EXCLUDED.round,
      "homeTeamId" = EXCLUDED."homeTeamId",
      "awayTeamId" = EXCLUDED."awayTeamId",
      kickoff = EXCLUDED.kickoff,
      finished = EXCLUDED.finished,
      "officialHome" = EXCLUDED."officialHome",
      "officialAway" = EXCLUDED."officialAway",
      "wentToPenalties" = EXCLUDED."wentToPenalties",
      "penaltyWinnerTeamId" = EXCLUDED."penaltyWinnerTeamId"
    `,
    [
      randomUUID(),
      f.externalId,
      f.phase,
      f.round,
      f.homeTeamId,
      f.awayTeamId,
      f.kickoff,
      f.finished,
      f.officialHome,
      f.officialAway,
      f.wentToPenalties,
      f.penaltyWinnerTeamId,
    ],
  );
}

export async function hasSyncedFixtures(): Promise<boolean> {
  const { rows } = await pool.query('SELECT 1 FROM games WHERE "externalId" IS NOT NULL LIMIT 1');
  return rows.length > 0;
}

export async function setLastSyncedAt(iso: string): Promise<void> {
  await pool.query(
    `INSERT INTO config (key, value) VALUES ('lastFixtureSyncAt', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [iso],
  );
}

export async function getLastSyncedAt(): Promise<string | null> {
  const { rows } = await pool.query("SELECT value FROM config WHERE key = 'lastFixtureSyncAt'");
  return rows[0]?.value ?? null;
}

export async function setGameResult(
  id: string,
  officialHome: number,
  officialAway: number,
  wentToPenalties: boolean,
  penaltyWinnerTeamId: string | null,
): Promise<void> {
  await pool.query(
    `
    UPDATE games SET finished = TRUE, "officialHome" = $1, "officialAway" = $2,
      "wentToPenalties" = $3, "penaltyWinnerTeamId" = $4
    WHERE id = $5
    `,
    [officialHome, officialAway, wentToPenalties, penaltyWinnerTeamId, id],
  );
}

export async function getConfig(): Promise<Config> {
  const { rows } = await pool.query("SELECT value FROM config WHERE key = 'antecedenciaMinutos'");
  return { antecedenciaMinutos: rows[0] ? Number(rows[0].value) : 120 };
}

export async function setConfig(config: Config): Promise<void> {
  await pool.query(
    `
    INSERT INTO config (key, value) VALUES ('antecedenciaMinutos', $1)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `,
    [String(config.antecedenciaMinutos)],
  );
}

export interface MessageWithAuthor extends Message {
  participantName: string;
  participantArea: string;
}

const MESSAGE_HISTORY_LIMIT = 300;

export async function getMessages(): Promise<MessageWithAuthor[]> {
  const { rows } = await pool.query(
    `
    SELECT m.id, m."participantId", m.content, m."createdAt",
           p.name AS "participantName", p.area AS "participantArea"
    FROM messages m
    JOIN participants p ON p.id = m."participantId"
    ORDER BY m."createdAt" ASC
    LIMIT $1
    `,
    [MESSAGE_HISTORY_LIMIT],
  );
  return rows;
}

export async function createMessage(message: Message): Promise<void> {
  await pool.query(
    'INSERT INTO messages (id, "participantId", content, "createdAt") VALUES ($1, $2, $3, $4)',
    [message.id, message.participantId, message.content, message.createdAt],
  );
}

export async function deleteMessage(id: string): Promise<void> {
  await pool.query("DELETE FROM messages WHERE id = $1", [id]);
}
