import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { app } from "./app";

const rootEnv = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.env.local",
);

config({ path: rootEnv });

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
