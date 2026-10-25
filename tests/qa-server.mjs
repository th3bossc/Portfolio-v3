// Isolated browser-QA fixture. Never connects to the user's database or OAuth app.
// Creates a short-lived test session using Auth.js' own JWT implementation.
import { MongoMemoryServer } from "mongodb-memory-server";
import { encode } from "next-auth/jwt";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { writeFile, rm, mkdtemp } from "node:fs/promises";

import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const qaDirectory = await mkdtemp(join(tmpdir(), "portfolio-browser-qa-"));
const mongo = await MongoMemoryServer.create({ binary: { version: "8.2.6" } });
if (process.argv.includes("--content")) {
  const file = process.argv[process.argv.indexOf("--content") + 1];
  if (!file) throw new Error("--content needs a file path.");
  const result = spawnSync(process.execPath, ["--import", import.meta.resolve("tsx"), resolve("scripts/migrate-content.ts"), "--input", resolve(file), "--apply", "--publish"], {
    cwd: qaDirectory, stdio: "inherit", env: { ...process.env, MONGODB_URI: mongo.getUri(), MONGODB_DB: "portfolio_browser_qa" },
  });
  if (result.status !== 0) { await mongo.stop(); await rm(qaDirectory, { recursive: true, force: true }); process.exit(1); }
}
const secret = randomBytes(32).toString("hex");
const salt = "authjs.session-token";
const token = await encode({ secret, salt, token: { sub: "portfolio-qa", adminId: "123456789", name: "Portfolio QA" }, maxAge: 3600 });
const sessionPath = "/tmp/portfolio-qa-session.json";
await writeFile(sessionPath, JSON.stringify({ token, cookie: salt }), { mode: 0o600 });
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3107"], {
  stdio: "inherit", env: { ...process.env, MONGODB_URI: mongo.getUri(), MONGODB_DB: "portfolio_browser_qa", AUTH_SECRET: secret, ADMIN_GITHUB_ID: "123456789", AUTH_GITHUB_ID: "qa-only", AUTH_GITHUB_SECRET: "qa-only", AUTH_TRUST_HOST: "true", NEXT_PUBLIC_SITE_URL: "http://localhost:3107" },
});
console.log("Isolated QA app: http://localhost:3107. Test session stored locally; no real OAuth credentials used.");
let stopping = false;
async function stop() { if (stopping) return; stopping = true; app.kill("SIGTERM"); await mongo.stop(); await rm(sessionPath, { force: true }); await rm(qaDirectory, { recursive: true, force: true }); process.exit(0); }
process.on("SIGINT", stop); process.on("SIGTERM", stop); app.on("exit", stop);
