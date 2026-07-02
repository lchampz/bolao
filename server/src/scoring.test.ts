import { describe, expect, it } from "vitest";
import {
  championBonus,
  computeBreakdowns,
  earlyBirdBonus,
  officialWinner,
  phaseBonus,
  rankBreakdowns,
  roundHighScoreBonus,
  scorePick,
  streakBonus,
} from "./scoring.js";
import type { Config, Game, Participant, Pick } from "./types.js";

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "g1",
    externalId: null,
    phase: "OITAVAS",
    round: "OITAVAS",
    homeTeamId: "BRA",
    awayTeamId: "FRA",
    kickoff: "2026-07-05T18:00:00Z",
    finished: true,
    officialHome: 2,
    officialAway: 1,
    wentToPenalties: false,
    penaltyWinnerTeamId: null,
    ...overrides,
  };
}

function makePick(overrides: Partial<Pick> = {}): Pick {
  return {
    id: "p1",
    participantId: "part1",
    gameId: "g1",
    homeScore: 2,
    awayScore: 1,
    submittedAt: "2026-07-05T10:00:00Z",
    ...overrides,
  };
}

describe("officialWinner", () => {
  it("returns null when game not finished", () => {
    expect(officialWinner(makeGame({ finished: false }))).toBeNull();
  });

  it("returns the team with more goals", () => {
    expect(officialWinner(makeGame())).toBe("BRA");
  });

  it("uses the penalty winner when scores are tied and it went to penalties", () => {
    const game = makeGame({ officialHome: 1, officialAway: 1, wentToPenalties: true, penaltyWinnerTeamId: "FRA" });
    expect(officialWinner(game)).toBe("FRA");
  });

  it("returns DRAW when tied with no penalties recorded", () => {
    const game = makeGame({ officialHome: 1, officialAway: 1 });
    expect(officialWinner(game)).toBe("DRAW");
  });
});

describe("scorePick", () => {
  it("awards 3 points for an exact score", () => {
    const result = scorePick(makePick({ homeScore: 2, awayScore: 1 }), makeGame());
    expect(result).toEqual({ exact: true, correctWinner: true, points: 3 });
  });

  it("awards 2 points for correct winner only", () => {
    const result = scorePick(makePick({ homeScore: 3, awayScore: 0 }), makeGame());
    expect(result).toEqual({ exact: false, correctWinner: true, points: 2 });
  });

  it("awards 0 points when the winner is wrong", () => {
    const result = scorePick(makePick({ homeScore: 0, awayScore: 1 }), makeGame());
    expect(result).toEqual({ exact: false, correctWinner: false, points: 0 });
  });

  it("never awards exact score when the match went to penalties", () => {
    const game = makeGame({ officialHome: 1, officialAway: 1, wentToPenalties: true, penaltyWinnerTeamId: "BRA" });
    const pick = makePick({ homeScore: 1, awayScore: 1 });
    expect(scorePick(pick, game)).toEqual({ exact: false, correctWinner: false, points: 0 });
  });

  it("awards correct winner via penalties even without exact score", () => {
    const game = makeGame({ officialHome: 1, officialAway: 1, wentToPenalties: true, penaltyWinnerTeamId: "BRA" });
    const pick = makePick({ homeScore: 2, awayScore: 0 });
    expect(scorePick(pick, game)).toEqual({ exact: false, correctWinner: true, points: 2 });
  });

  it("gives 0 points for an unfinished game", () => {
    expect(scorePick(makePick(), makeGame({ finished: false, officialHome: null, officialAway: null }))).toEqual({
      exact: false,
      correctWinner: false,
      points: 0,
    });
  });
});

describe("phaseBonus (HU-04.1)", () => {
  it("matches the example from the original document: 6 correct in oitavas -> 3 points (capped)", () => {
    const games = Array.from({ length: 8 }, (_, i) => makeGame({ id: `g${i}`, homeTeamId: "A", awayTeamId: "B" }));
    const picks = new Map(
      games.map((g, i) => [
        g.id,
        makePick({ id: `p${i}`, gameId: g.id, homeScore: i < 6 ? 2 : 0, awayScore: i < 6 ? 1 : 3 }),
      ]),
    );
    expect(phaseBonus("OITAVAS", games, picks)).toBe(3);
  });

  it("caps quartas at 4 and semifinal at 5", () => {
    const quartas = Array.from({ length: 4 }, (_, i) => makeGame({ id: `q${i}`, phase: "QUARTAS" }));
    const quartasPicks = new Map(quartas.map((g) => [g.id, makePick({ gameId: g.id, homeScore: 2, awayScore: 1 })]));
    expect(phaseBonus("QUARTAS", quartas, quartasPicks)).toBe(4);

    const semi = Array.from({ length: 2 }, (_, i) => makeGame({ id: `s${i}`, phase: "SEMIFINAL" }));
    const semiPicks = new Map(semi.map((g) => [g.id, makePick({ gameId: g.id, homeScore: 2, awayScore: 1 })]));
    expect(phaseBonus("SEMIFINAL", semi, semiPicks)).toBe(2);
  });
});

describe("championBonus (HU-04.2)", () => {
  it("awards 6 points when the champion pick is correct", () => {
    const final = makeGame({ id: "final", phase: "FINAL" });
    const pick = makePick({ gameId: "final", homeScore: 5, awayScore: 0 });
    expect(championBonus(final, pick)).toBe(6);
  });

  it("awards 0 when there is no pick for the final", () => {
    const final = makeGame({ id: "final", phase: "FINAL" });
    expect(championBonus(final, undefined)).toBe(0);
  });
});

describe("earlyBirdBonus (HU-04.3)", () => {
  const config: Config = { antecedenciaMinutos: 120 };

  it("awards the bonus when submitted at/before the configured window", () => {
    const game = makeGame({ kickoff: "2026-07-05T18:00:00Z" });
    const pick = makePick({ submittedAt: "2026-07-05T15:59:00Z" });
    expect(earlyBirdBonus(pick, game, config)).toBe(1);
  });

  it("does not award the bonus when submitted inside the window", () => {
    const game = makeGame({ kickoff: "2026-07-05T18:00:00Z" });
    const pick = makePick({ submittedAt: "2026-07-05T17:00:00Z" });
    expect(earlyBirdBonus(pick, game, config)).toBe(0);
  });
});

describe("streakBonus (HU-04.5)", () => {
  it("awards 2 points every 3 consecutive correct picks", () => {
    expect(streakBonus([true, true, true])).toBe(2);
    expect(streakBonus([true, true, true, true, true, true])).toBe(4);
    expect(streakBonus([true, true, false, true, true, true])).toBe(2);
    expect(streakBonus([false, true, true])).toBe(0);
  });
});

describe("roundHighScoreBonus (HU-04.4)", () => {
  it("awards the bonus to every tied leader once the round is finished", () => {
    const games = [makeGame({ id: "g1" }), makeGame({ id: "g2" })];
    const points = new Map([
      ["a", 5],
      ["b", 5],
      ["c", 3],
    ]);
    const bonuses = roundHighScoreBonus(games, points);
    expect(bonuses.get("a")).toBe(2);
    expect(bonuses.get("b")).toBe(2);
    expect(bonuses.get("c")).toBeUndefined();
  });

  it("awards nothing while the round is still open", () => {
    const games = [makeGame({ id: "g1", finished: false })];
    const bonuses = roundHighScoreBonus(games, new Map([["a", 5]]));
    expect(bonuses.size).toBe(0);
  });
});

describe("computeBreakdowns + rankBreakdowns (integration)", () => {
  const config: Config = { antecedenciaMinutos: 120 };
  const participants: Participant[] = [
    { id: "a", name: "Ana", area: "TI", email: null, createdAt: "2026-07-01T00:00:00Z", lastSeenAt: null },
    { id: "b", name: "Bruno", area: "RH", email: null, createdAt: "2026-07-01T00:00:00Z", lastSeenAt: null },
  ];
  const game = makeGame();

  it("ranks the exact-score participant above the winner-only participant on equal totals", () => {
    const picks: Pick[] = [
      makePick({ id: "pa", participantId: "a", homeScore: 2, awayScore: 1, submittedAt: "2026-07-05T10:00:00Z" }),
      makePick({ id: "pb", participantId: "b", homeScore: 5, awayScore: 0, submittedAt: "2026-07-05T09:00:00Z" }),
    ];
    const breakdowns = computeBreakdowns({ participants, games: [game], picks, config });
    const ranked = rankBreakdowns(breakdowns);
    expect(ranked[0].participantId).toBe("a"); // 3 pts, placar exato
    expect(ranked[1].participantId).toBe("b"); // 2 pts, só vencedor
  });
});
