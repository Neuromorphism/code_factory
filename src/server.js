import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHarnessApp } from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 3000);

const app = createHarnessApp({
  repoRoot,
  publicDir: path.resolve(__dirname, "../public")
});

app.start(port).then(() => {
  const session = app.store.listSessions()[0];
  console.log(`Code Factory harness listening on http://localhost:${port}`);
  console.log(`Seed session: ${session.id} (${session.systemName})`);
});
