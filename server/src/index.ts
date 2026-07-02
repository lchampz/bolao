import { app } from "./app.js";
import { ensureAdminAccount } from "./auth.js";
import { initSchema } from "./db.js";
import { syncFixtures } from "./fixtures.js";
import { seedDemoFixtures, seedDemoParticipants } from "./seed.js";

const port = Number(process.env.PORT ?? 4000);
const SYNC_INTERVAL_MS = Number(process.env.FIXTURE_SYNC_MINUTES ?? 20) * 60_000;

async function syncOrFallback(): Promise<void> {
  try {
    const { synced } = await syncFixtures();
    console.log(`[fixtures] sincronizados ${synced} jogos da fonte externa`);
  } catch (err) {
    console.error("[fixtures] sync falhou, mantendo dados atuais:", (err as Error).message);
    await seedDemoFixtures();
  }
}

async function main() {
  await initSchema();
  await ensureAdminAccount();
  await syncOrFallback();
  await seedDemoParticipants();

  setInterval(() => {
    syncFixtures()
      .then(({ synced }) => console.log(`[fixtures] sync periódico: ${synced} jogos`))
      .catch((err) => console.error("[fixtures] sync periódico falhou:", (err as Error).message));
  }, SYNC_INTERVAL_MS);

  app.listen(port, () => {
    console.log(`bolao-server ouvindo em http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("Falha ao iniciar o servidor:", err);
  process.exit(1);
});
