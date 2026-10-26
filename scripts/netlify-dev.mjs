import { spawn } from "node:child_process";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const parent = dirname(root);
const netlifyArgs = ["dev", "--cwd", basename(root), ...process.argv.slice(2)];
const isWindows = process.platform === "win32";
const command = isWindows ? (process.env.ComSpec ?? "cmd.exe") : "netlify";
const args = isWindows
  ? ["/d", "/s", "/c", "netlify", ...netlifyArgs]
  : netlifyArgs;

const child = spawn(command, args, {
  cwd: parent,
  env: process.env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(
    "Could not start the Netlify CLI. Install it with: npm install -g netlify-cli",
  );
  console.error(error.message);
  process.exitCode = 1;
});

child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
