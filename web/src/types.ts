export type Phase = "OITAVAS" | "QUARTAS" | "SEMIFINAL" | "FINAL";
export type Area = "RH" | "TI" | "FINANCEIRO" | "OUTRA";

export interface Team {
  id: string;
  name: string;
  flag: string;
}

export interface Game {
  id: string;
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

export interface Participant {
  id: string;
  name: string;
  area: Area;
  email: string | null;
  createdAt: string;
}

export type InviteStatus = "PENDING" | "ACCEPTED";

export interface Invite {
  id: string;
  email: string;
  token: string;
  status: InviteStatus;
  createdAt: string;
  acceptedAt: string | null;
  participantId: string | null;
}

export interface Pick {
  id: string;
  participantId: string;
  gameId: string;
  homeScore: number;
  awayScore: number;
  submittedAt: string;
}

export interface RankingEntry {
  participantId: string;
  gamePoints: number;
  exactCount: number;
  winnerCorrectCount: number;
  championCorrect: boolean;
  phaseBonusPoints: number;
  championBonusPoints: number;
  earlyBirdPoints: number;
  roundHighScorePoints: number;
  streakPoints: number;
  total: number;
  position: number;
  tied: boolean;
  participant: Participant;
}

export interface Prize {
  position: number;
  description: string;
}

export const PHASE_LABELS: Record<Phase, string> = {
  OITAVAS: "Oitavas de Final",
  QUARTAS: "Quartas de Final",
  SEMIFINAL: "Semifinal",
  FINAL: "Final",
};

export const AREA_LABELS: Record<Area, string> = {
  RH: "RH",
  TI: "TI",
  FINANCEIRO: "Financeiro",
  OUTRA: "Outra",
};
