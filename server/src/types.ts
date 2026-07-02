export type Phase = "OITAVAS" | "QUARTAS" | "SEMIFINAL" | "FINAL";

export type Area = "RH" | "TI" | "FINANCEIRO" | "OUTRA";

export interface Team {
  id: string;
  name: string;
  flag: string;
}

export interface Game {
  id: string;
  externalId: number | null;
  phase: Phase;
  round: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoff: string; // ISO timestamp
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
  lastSeenAt: string | null;
}

export interface Message {
  id: string;
  participantId: string;
  content: string;
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
  submittedAt: string; // ISO timestamp
}

export interface Config {
  antecedenciaMinutos: number;
}

export interface ParticipantBreakdown {
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
  firstSubmissionAt: string | null;
}
