import type { Area, Game, Invite, InviteStatus, Participant, Pick, Prize, RankingEntry, Team } from "./types";

// Em produção (Render) o front e o back são serviços separados — aponte para
// a URL pública do backend via VITE_API_URL. Em dev/docker-compose local,
// deixe vazio: a chamada relativa é resolvida pelo proxy do Vite/nginx.
// O `fromService`/`property: host` do Render devolve só o slug do serviço
// (ex. "bolao-server-8bi1"), sem o domínio — sem isso o fetch tenta resolver
// esse nome como host de verdade e falha com ERR_NAME_NOT_RESOLVED.
function resolveRenderHost(raw: string): string {
  if (!raw || raw.startsWith("http")) return raw;
  const withDomain = raw.includes(".") ? raw : `${raw}.onrender.com`;
  return `https://${withDomain}`;
}
const API_BASE = resolveRenderHost(import.meta.env.VITE_API_URL ?? "");

const ADMIN_TOKEN_KEY = "bolao.adminToken";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : `Erro ${res.status}`);
  }
  return res.json();
}

/** Anexa o token de admin (ver AdminAuthContext) e limpa a sessão em caso de 401. */
async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  try {
    return await request<T>(path, {
      ...init,
      headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token ?? ""}` },
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("401")) localStorage.removeItem(ADMIN_TOKEN_KEY);
    throw e;
  }
}

export const api = {
  getTeams: () => request<Team[]>("/teams"),
  getGames: () => request<Game[]>("/games"),
  getParticipants: () => request<Participant[]>("/participants"),
  getPicks: (participantId: string) => request<Pick[]>(`/picks?participantId=${participantId}`),
  submitPick: (participantId: string, gameId: string, homeScore: number, awayScore: number) =>
    request<Pick>("/picks", { method: "POST", body: JSON.stringify({ participantId, gameId, homeScore, awayScore }) }),
  getRanking: () => request<RankingEntry[]>("/ranking"),
  getAreaRanking: () => request<Record<Area, number>>("/ranking/areas"),
  getPrizes: () => request<Prize[]>("/prizes"),
  getConfig: () => request<{ antecedenciaMinutos: number }>("/config"),

  getInviteByToken: (token: string) => request<{ email: string; status: InviteStatus }>(`/invites/${token}`),
  acceptInvite: (token: string, name: string, area: Area) =>
    request<Participant>(`/invites/${token}/accept`, { method: "POST", body: JSON.stringify({ name, area }) }),

  loginStart: (email: string) =>
    request<{ type: "admin" | "participant" | "unknown" }>("/login/start", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verifyLoginToken: (token: string) =>
    request<Participant>("/login/verify", { method: "POST", body: JSON.stringify({ token }) }),

  adminLogin: (email: string, password: string) =>
    request<{ token: string; email: string }>("/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  launchResult: (
    gameId: string,
    officialHome: number,
    officialAway: number,
    wentToPenalties: boolean,
    penaltyWinnerTeamId: string | null,
  ) =>
    adminRequest<Game>(`/admin/games/${gameId}/result`, {
      method: "POST",
      body: JSON.stringify({ officialHome, officialAway, wentToPenalties, penaltyWinnerTeamId }),
    }),
  setConfig: (antecedenciaMinutos: number) =>
    adminRequest<{ antecedenciaMinutos: number }>("/admin/config", {
      method: "PUT",
      body: JSON.stringify({ antecedenciaMinutos }),
    }),
  getLastSync: () => adminRequest<{ lastSyncedAt: string | null }>("/admin/sync"),
  triggerSync: () => adminRequest<{ synced: number; syncedAt: string }>("/admin/sync", { method: "POST" }),

  getInvites: () => adminRequest<Invite[]>("/admin/invites"),
  createInvite: (email: string) =>
    adminRequest<Invite>("/admin/invites", { method: "POST", body: JSON.stringify({ email }) }),
  bulkInvite: (csv: string) =>
    adminRequest<{ created: number; resent: number; alreadyAccepted: number; total: number }>("/admin/invites/bulk", {
      method: "POST",
      body: JSON.stringify({ csv }),
    }),
  resendInvite: (id: string) => adminRequest<{ ok: true }>(`/admin/invites/${id}/resend`, { method: "POST" }),
};
