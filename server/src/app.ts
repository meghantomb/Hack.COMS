import dotenv from "dotenv";
import path from "path";
import express from "express";
import cors from "cors";
import { dialogueRouter } from "./routes/dialogue";
import { progressRouter } from "./routes/progress";
import { generateRouter } from "./routes/generate";
import { initDb, isUsingDatabase } from "./db";
import { ensurePlayer } from "./services/gameService";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "100kb" }));

/** Lazily init DB (or memory) once per cold start — required for Vercel Functions. */
let ready: Promise<void> | null = null;

export function ensureAppReady(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await initDb();
      await ensurePlayer();
    })();
  }
  return ready;
}

app.use((req, res, next) => {
  void ensureAppReady().then(() => next()).catch(next);
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    mode: isUsingDatabase() ? "postgres" : "memory",
    grok: Boolean(process.env.XAI_API_KEY),
  });
});

app.use("/api/dialogue", dialogueRouter);
app.use("/api/progress", progressRouter);
app.use("/api/generate", generateRouter);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Internal server error" });
  }
);

export default app;
