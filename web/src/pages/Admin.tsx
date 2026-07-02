import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { RequireAdmin } from "../components/RequireAdmin";
import { useAdminAuth } from "../context/AdminAuthContext";
import { PHASE_LABELS, type Game, type Team } from "../types";

export default function Admin() {
  return (
    <RequireAdmin>
      <AdminContent />
    </RequireAdmin>
  );
}

function AdminContent() {
  const { adminEmail, logout } = useAdminAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { home: string; away: string; penalties: boolean; winner: string }>>({});
  const [antecedencia, setAntecedencia] = useState(120);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function reload() {
    const [g, t, c, s] = await Promise.all([api.getGames(), api.getTeams(), api.getConfig(), api.getLastSync()]);
    setGames(g);
    setTeams(t);
    setAntecedencia(c.antecedenciaMinutos);
    setLastSyncedAt(s.lastSyncedAt);
  }

  useEffect(() => {
    reload();
  }, []);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  async function launch(game: Game) {
    const draft = drafts[game.id];
    if (!draft) return;
    await api.launchResult(game.id, Number(draft.home), Number(draft.away), draft.penalties, draft.penalties ? draft.winner : null);
    await reload();
  }

  async function saveConfig() {
    await api.setConfig(antecedencia);
    setSavedMsg("Configuração salva.");
    setTimeout(() => setSavedMsg(null), 2000);
  }

  async function sync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const { synced } = await api.triggerSync();
      setSyncMsg(`${synced} jogos sincronizados com a fonte real da Copa 2026.`);
      await reload();
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : "Falha ao sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col gap-gutter max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-2 m-0">
          <span className="material-symbols-outlined text-secondary-fixed text-3xl">admin_panel_settings</span>
          Administração do Bolão
        </h2>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-error transition-colors"
        >
          {adminEmail} <span className="material-symbols-outlined text-base">logout</span>
        </button>
      </div>

      <section className="glass-panel rounded-2xl p-6">
        <h3 className="font-headline-md text-headline-md text-white m-0 mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">sync</span>
          Sincronização automática — Copa 2026
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4">
          Times, jogos e resultados oficiais são buscados automaticamente da{" "}
          <a
            className="text-primary underline"
            href="https://github.com/openfootball/worldcup.json"
            target="_blank"
            rel="noreferrer"
          >
            base pública openfootball
          </a>{" "}
          a cada 20 minutos — não é mais necessário cadastrar jogos ou digitar placares na mão. O lançamento manual
          abaixo continua disponível como reserva, caso a fonte externa esteja fora do ar ou atrasada.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            className="bg-primary text-on-primary font-bold py-2 px-5 rounded-lg glow-button text-sm flex items-center gap-2 disabled:opacity-50"
            onClick={sync}
            disabled={syncing}
          >
            <span className="material-symbols-outlined text-[18px]">{syncing ? "hourglass_top" : "sync"}</span>
            {syncing ? "Sincronizando..." : "Sincronizar agora"}
          </button>
          <span className="font-label-md text-label-md text-on-surface-variant">
            {lastSyncedAt ? `Última sincronização: ${new Date(lastSyncedAt).toLocaleString("pt-BR")}` : "Ainda não sincronizado"}
          </span>
        </div>
        {syncMsg && <p className="text-sm text-primary mt-3">{syncMsg}</p>}
      </section>

      <section className="glass-panel rounded-2xl p-6">
        <h3 className="font-headline-md text-headline-md text-white m-0 mb-2">Configurações</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4">
          Janela de antecedência para o bônus &quot;Madrugador&quot; (HU-04.3).
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="score-input rounded-lg w-24 h-14 font-stats-xl text-xl"
            type="number"
            min={0}
            value={antecedencia}
            onChange={(e) => setAntecedencia(Number(e.target.value))}
          />
          <span className="font-label-md text-label-md text-on-surface-variant">minutos antes do início do jogo</span>
          <button
            className="border-2 border-secondary-fixed/60 text-white font-bold py-2 px-5 rounded-lg hover:bg-secondary-fixed/10 transition-colors text-sm"
            onClick={saveConfig}
          >
            Salvar
          </button>
          {savedMsg && (
            <div className="bg-primary-container/20 text-primary border border-primary/50 px-3 py-1 rounded-full flex items-center space-x-1">
              <span className="material-symbols-outlined icon-filled text-[16px]">check_circle</span>
              <span className="font-label-md text-label-md text-xs font-bold">{savedMsg}</span>
            </div>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-6">
        <h3 className="font-headline-md text-headline-md text-white m-0 mb-1">Lançar resultado manualmente (reserva)</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4">
          Só use isto se a sincronização automática acima estiver indisponível ou atrasada.
        </p>
        <div className="space-y-4">
          {games.map((game) => {
            const home = teamById.get(game.homeTeamId);
            const away = teamById.get(game.awayTeamId);
            const draft = drafts[game.id] ?? { home: "", away: "", penalties: false, winner: game.homeTeamId };

            return (
              <div key={game.id} className="bg-surface-container/50 border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="px-2 py-1 rounded bg-tertiary-container/20 text-tertiary-fixed text-xs font-bold">{PHASE_LABELS[game.phase]}</span>
                  <div className="font-headline-md text-body-md text-on-surface font-bold mt-1">
                    {home?.flag} {home?.name} <span className="text-on-surface-variant">x</span> {away?.name} {away?.flag}
                  </div>
                </div>

                {game.finished ? (
                  <div className="bg-primary-container/20 text-primary border border-primary/50 px-3 py-1 rounded-full flex items-center space-x-1">
                    <span className="material-symbols-outlined icon-filled text-[16px]">check_circle</span>
                    <span className="font-label-md text-label-md text-xs font-bold">
                      {game.officialHome} x {game.officialAway}
                      {game.wentToPenalties && ` (pên. ${teamById.get(game.penaltyWinnerTeamId ?? "")?.name})`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      className="score-input rounded-lg w-14 h-14 font-stats-xl text-xl"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={draft.home}
                      onChange={(e) => setDrafts((d) => ({ ...d, [game.id]: { ...draft, home: e.target.value } }))}
                    />
                    <span className="text-on-surface-variant font-bold">x</span>
                    <input
                      className="score-input rounded-lg w-14 h-14 font-stats-xl text-xl"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={draft.away}
                      onChange={(e) => setDrafts((d) => ({ ...d, [game.id]: { ...draft, away: e.target.value } }))}
                    />
                    <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2">
                      <input
                        className="w-4 h-4 accent-primary"
                        type="checkbox"
                        checked={draft.penalties}
                        onChange={(e) => setDrafts((d) => ({ ...d, [game.id]: { ...draft, penalties: e.target.checked } }))}
                      />
                      pênaltis
                    </label>
                    {draft.penalties && (
                      <select
                        className="score-input rounded-lg px-2 py-2 text-sm"
                        value={draft.winner}
                        onChange={(e) => setDrafts((d) => ({ ...d, [game.id]: { ...draft, winner: e.target.value } }))}
                      >
                        <option value={game.homeTeamId}>{home?.name}</option>
                        <option value={game.awayTeamId}>{away?.name}</option>
                      </select>
                    )}
                    <button
                      className="bg-primary text-on-primary font-bold py-2 px-5 rounded-lg glow-button text-sm"
                      onClick={() => launch(game)}
                    >
                      Lançar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
