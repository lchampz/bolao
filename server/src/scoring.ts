import type { Config, Game, ParticipantBreakdown, Participant, Phase, Pick } from "./types.js";

/** Teto de bônus por fase — ver docs/backlog/HU-04-bonus.md (HU-04.1). */
export const PHASE_CAPS: Record<Phase, number> = {
  OITAVAS: 3,
  QUARTAS: 4,
  SEMIFINAL: 5,
  FINAL: 0,
};

export const CHAMPION_BONUS = 6;
export const ROUND_HIGH_SCORE_BONUS = 2;
export const STREAK_BONUS = 2;
export const STREAK_LENGTH = 3;

export type Winner = string | "DRAW" | null;

/** Vencedor oficial. `null` se o jogo ainda não terminou. */
export function officialWinner(game: Game): Winner {
  if (!game.finished || game.officialHome == null || game.officialAway == null) return null;
  if (game.officialHome > game.officialAway) return game.homeTeamId;
  if (game.officialAway > game.officialHome) return game.awayTeamId;
  if (game.wentToPenalties && game.penaltyWinnerTeamId) return game.penaltyWinnerTeamId;
  return "DRAW";
}

function predictedWinner(pick: Pick, game: Game): Winner {
  if (pick.homeScore > pick.awayScore) return game.homeTeamId;
  if (pick.awayScore > pick.homeScore) return game.awayTeamId;
  return "DRAW";
}

export interface PickScore {
  exact: boolean;
  correctWinner: boolean;
  points: number;
}

/** Pontuação de um palpite: +3 placar exato, +2 só o vencedor, 0 se errar. */
export function scorePick(pick: Pick, game: Game): PickScore {
  const winner = officialWinner(game);
  if (winner === null) return { exact: false, correctWinner: false, points: 0 };

  const exact =
    !game.wentToPenalties &&
    pick.homeScore === game.officialHome &&
    pick.awayScore === game.officialAway;

  const predicted = predictedWinner(pick, game);
  const correctWinner = winner !== "DRAW" && predicted === winner;

  const points = exact ? 3 : correctWinner ? 2 : 0;
  return { exact, correctWinner, points };
}

/** Bônus por fase (HU-04.1): +1 por classificado correto, até o teto da fase. */
export function phaseBonus(
  phase: Phase,
  gamesInPhase: Game[],
  picksByGameId: Map<string, Pick>,
): number {
  const cap = PHASE_CAPS[phase];
  if (cap === 0) return 0;
  let correct = 0;
  for (const game of gamesInPhase) {
    const pick = picksByGameId.get(game.id);
    if (!pick) continue;
    if (scorePick(pick, game).correctWinner) correct += 1;
  }
  return Math.min(correct, cap);
}

/** Bônus de campeão (HU-04.2): +6 se acertar o vencedor da FINAL. */
export function championBonus(finalGame: Game | undefined, pick: Pick | undefined): number {
  if (!finalGame || !pick) return 0;
  return scorePick(pick, finalGame).correctWinner ? CHAMPION_BONUS : 0;
}

/** Bônus de antecedência (HU-04.3): +1 se enviado antes da janela configurada. */
export function earlyBirdBonus(pick: Pick, game: Game, config: Config): number {
  const kickoff = new Date(game.kickoff).getTime();
  const submitted = new Date(pick.submittedAt).getTime();
  const deadline = kickoff - config.antecedenciaMinutos * 60_000;
  return submitted <= deadline ? 1 : 0;
}

/**
 * Bônus de sequência (HU-04.5): +2 a cada múltiplo de N (padrão 3) acertos
 * consecutivos, na ordem cronológica dos jogos. Quebra no primeiro erro.
 */
export function streakBonus(correctInOrder: boolean[]): number {
  let streak = 0;
  let bonus = 0;
  for (const correct of correctInOrder) {
    if (correct) {
      streak += 1;
      if (streak % STREAK_LENGTH === 0) bonus += STREAK_BONUS;
    } else {
      streak = 0;
    }
  }
  return bonus;
}

/**
 * Bônus de maior pontuação da rodada (HU-04.4): todos os participantes com a
 * pontuação máxima da rodada (empatados inclusive) recebem o bônus. Só é
 * calculado quando todos os jogos da rodada já têm resultado oficial.
 */
export function roundHighScoreBonus(
  roundGames: Game[],
  pointsByParticipantForRound: Map<string, number>,
): Map<string, number> {
  const bonuses = new Map<string, number>();
  const roundFinished = roundGames.length > 0 && roundGames.every((g) => g.finished);
  if (!roundFinished || pointsByParticipantForRound.size === 0) return bonuses;

  const max = Math.max(...pointsByParticipantForRound.values());
  if (max <= 0) return bonuses;

  for (const [participantId, points] of pointsByParticipantForRound) {
    if (points === max) bonuses.set(participantId, ROUND_HIGH_SCORE_BONUS);
  }
  return bonuses;
}

export interface ComputeInput {
  participants: Participant[];
  games: Game[];
  picks: Pick[];
  config: Config;
}

/** Calcula o breakdown completo de pontuação de cada participante. */
export function computeBreakdowns({ participants, games, picks, config }: ComputeInput): ParticipantBreakdown[] {
  const gamesById = new Map(games.map((g) => [g.id, g]));
  const finalGame = games.find((g) => g.phase === "FINAL");
  const rounds = [...new Set(games.map((g) => g.round))];

  const picksByParticipant = new Map<string, Pick[]>();
  for (const pick of picks) {
    const list = picksByParticipant.get(pick.participantId) ?? [];
    list.push(pick);
    picksByParticipant.set(pick.participantId, list);
  }

  // pontos "de jogo" (sem bônus) por participante, por rodada — para o bônus de maior pontuação da rodada
  const roundPointsByParticipant = new Map<string, Map<string, number>>();
  for (const round of rounds) {
    const roundGames = games.filter((g) => g.round === round);
    const pointsMap = new Map<string, number>();
    for (const participant of participants) {
      const participantPicks = picksByParticipant.get(participant.id) ?? [];
      let sum = 0;
      for (const pick of participantPicks) {
        const game = gamesById.get(pick.gameId);
        if (game && game.round === round) sum += scorePick(pick, game).points;
      }
      pointsMap.set(participant.id, sum);
    }
    roundPointsByParticipant.set(round, pointsMap);
  }
  const roundBonuses = new Map<string, Map<string, number>>();
  for (const round of rounds) {
    const roundGames = games.filter((g) => g.round === round);
    roundBonuses.set(round, roundHighScoreBonus(roundGames, roundPointsByParticipant.get(round)!));
  }

  return participants.map((participant) => {
    const participantPicks = picksByParticipant.get(participant.id) ?? [];
    const picksByGameId = new Map(participantPicks.map((p) => [p.gameId, p]));

    let gamePoints = 0;
    let exactCount = 0;
    let winnerCorrectCount = 0;
    let earlyBirdPoints = 0;
    let firstSubmissionAt: string | null = null;

    const chronological = [...participantPicks].sort((a, b) => {
      const ga = gamesById.get(a.gameId);
      const gb = gamesById.get(b.gameId);
      return (ga ? new Date(ga.kickoff).getTime() : 0) - (gb ? new Date(gb.kickoff).getTime() : 0);
    });
    const correctInOrder: boolean[] = [];

    for (const pick of chronological) {
      const game = gamesById.get(pick.gameId);
      if (!game) continue;
      const score = scorePick(pick, game);
      gamePoints += score.points;
      if (score.exact) exactCount += 1;
      if (score.correctWinner) winnerCorrectCount += 1;
      if (game.finished) correctInOrder.push(score.correctWinner);
      earlyBirdPoints += earlyBirdBonus(pick, game, config);
      if (!firstSubmissionAt || new Date(pick.submittedAt) < new Date(firstSubmissionAt)) {
        firstSubmissionAt = pick.submittedAt;
      }
    }

    let phaseBonusPoints = 0;
    for (const phase of ["OITAVAS", "QUARTAS", "SEMIFINAL"] as Phase[]) {
      const gamesInPhase = games.filter((g) => g.phase === phase);
      phaseBonusPoints += phaseBonus(phase, gamesInPhase, picksByGameId);
    }

    const championPick = finalGame ? picksByGameId.get(finalGame.id) : undefined;
    const championBonusPoints = championBonus(finalGame, championPick);
    const championCorrect = championBonusPoints > 0;

    const streakPoints = streakBonus(correctInOrder);

    let roundHighScorePoints = 0;
    for (const round of rounds) {
      roundHighScorePoints += roundBonuses.get(round)?.get(participant.id) ?? 0;
    }

    const total =
      gamePoints + phaseBonusPoints + championBonusPoints + earlyBirdPoints + roundHighScorePoints + streakPoints;

    return {
      participantId: participant.id,
      gamePoints,
      exactCount,
      winnerCorrectCount,
      championCorrect,
      phaseBonusPoints,
      championBonusPoints,
      earlyBirdPoints,
      roundHighScorePoints,
      streakPoints,
      total,
      firstSubmissionAt,
    } satisfies ParticipantBreakdown;
  });
}

/**
 * Ranking com desempate em cascata (HU-05.2):
 * 1) total, 2) placares exatos, 3) acertos de vencedor, 4) campeão certo,
 * 5) bônus por fase, 6) quem enviou primeiro. Empate residual = `tied: true`.
 */
export function rankBreakdowns(breakdowns: ParticipantBreakdown[]): (ParticipantBreakdown & { position: number; tied: boolean })[] {
  const sorted = [...breakdowns].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
    if (b.winnerCorrectCount !== a.winnerCorrectCount) return b.winnerCorrectCount - a.winnerCorrectCount;
    if (a.championCorrect !== b.championCorrect) return a.championCorrect ? -1 : 1;
    if (b.phaseBonusPoints !== a.phaseBonusPoints) return b.phaseBonusPoints - a.phaseBonusPoints;
    const aFirst = a.firstSubmissionAt ? new Date(a.firstSubmissionAt).getTime() : Infinity;
    const bFirst = b.firstSubmissionAt ? new Date(b.firstSubmissionAt).getTime() : Infinity;
    return aFirst - bFirst;
  });

  const tieKey = (b: ParticipantBreakdown) =>
    [b.total, b.exactCount, b.winnerCorrectCount, b.championCorrect, b.phaseBonusPoints, b.firstSubmissionAt].join("|");

  return sorted.map((b, i) => ({
    ...b,
    position: i + 1,
    tied: i > 0 && tieKey(b) === tieKey(sorted[i - 1]),
  }));
}
