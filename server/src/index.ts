import dotenv from "dotenv";
import path from "path";
import express from "express";
import cors from "cors";
import { dialogueRouter } from "./routes/dialogue";
import { progressRouter } from "./routes/progress";
import { generateRouter } from "./routes/generate";
import { isUsingDatabase } from "./db";
import { ensurePlayer } from "./services/gameService";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();


const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors({ origin: true }));
app.use(express.json({ limit: "100kb" }));

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

async function main() {
  await ensurePlayer();
  app.listen(PORT, () => {
    console.log(`Duck Dating API on http://localhost:${PORT} (${isUsingDatabase() ? "postgres" : "memory"})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
