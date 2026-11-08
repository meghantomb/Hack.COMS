import { app, ensureAppReady } from "./app";
import { isUsingDatabase } from "./db";

const PORT = Number(process.env.PORT ?? 3001);

async function main() {
  await ensureAppReady();
  const mode = isUsingDatabase() ? "postgres" : "memory";
  app.listen(PORT, () => {
    console.log(`Duck Dating API on http://localhost:${PORT} (${mode})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
