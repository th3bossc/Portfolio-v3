import env from "@next/env";
import { MongoClient } from "mongodb";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { ContentRepository } from "../src/lib/repository";
import type { Entry } from "../src/lib/content";
import { canonical, migrationSchema, planMigration } from "./migration";

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("npm run content:migrate -- [--input PATH] [--validate-only | --apply [--publish]]\nDefault: read-only database dry run. Default input: .local-content/approved-content.json"); return;
  }
  const allowed = new Set(["--input", "--validate-only", "--apply", "--publish"]);
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new Error("Unknown argument. Use --help.");
    if (args[i] === "--input" && (!args[++i] || args[i].startsWith("--"))) throw new Error("--input needs a file path.");
  }
  const apply = args.includes("--apply"), publish = args.includes("--publish"), validateOnly = args.includes("--validate-only");
  if ((publish && !apply) || (validateOnly && (apply || publish))) throw new Error("Use --publish with --apply; --validate-only cannot perform writes.");
  const source = resolve(args.includes("--input") ? args[args.indexOf("--input") + 1] : ".local-content/approved-content.json");
  const parsed = migrationSchema.safeParse(JSON.parse(await readFile(source, "utf8")));
  if (!parsed.success) { console.error(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n")); process.exitCode = 1; return; }
  const input = parsed.data;
  console.log(`Validated ${input.entries.length} entries.`);
  if (validateOnly) return;
  env.loadEnvConfig(process.cwd());
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required in your environment or .env file.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 8000 });
  try {
    await client.connect();
    const repository = new ContentRepository(client.db(process.env.MONGODB_DB || "portfolio").collection<Entry>("content"));
    const before = await repository.list();
    const plan = planMigration(input, before);
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ...plan }, null, 2));
    if (plan.conflicts.length) { process.exitCode = 1; return; }
    if (!apply) { console.log("No writes performed. Review the plan, then use --apply; add --publish to make matching entries public."); return; }

    const directory = resolve(".local-content", "migrations", `${Date.now()}-${randomUUID()}`);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(`${directory}/before.json`, JSON.stringify(before, null, 2), { mode: 0o600, flag: "wx" });
    const manifest = { inputHash: createHash("sha256").update(canonical(input)).digest("hex"), startedAt: new Date().toISOString(), publishRequested: publish, plan, created: [] as string[], published: [] as string[], status: "in-progress" };
    const saveManifest = async () => {
      await writeFile(`${directory}/manifest.tmp`, JSON.stringify(manifest, null, 2), { mode: 0o600 });
      await rename(`${directory}/manifest.tmp`, `${directory}/manifest.json`);
    };
    await saveManifest();
    console.log(`Backup and manifest: ${directory}`);
    try {
      await repository.indexes();
      for (const entry of input.entries) {
        if (plan.create.includes(entry.id)) {
          await repository.create(entry.content, entry.id, entry.order);
          manifest.created.push(entry.id); await saveManifest();
        }
      }
      if (publish) {
        // Recheck after import so an intervening edit cannot be silently published.
        const current = await repository.list();
        const checked = planMigration(input, current);
        if (checked.conflicts.length) throw new Error("Content changed during migration. Review the next dry run before resuming.");
        for (const id of checked.publish) {
          const entry = current.find((record) => record._id === id)!;
          await repository.publish(id, entry.revision);
          manifest.published.push(id); await saveManifest();
        }
      }
      manifest.status = "complete"; await saveManifest();
      console.log(`Created ${manifest.created.length}; published ${manifest.published.length}. Existing matching content was preserved.`);
      console.log("Reload the portfolio to read the published database content. Rerunning the same input safely resumes an interrupted migration.");
    } catch (error) {
      manifest.status = "interrupted"; await saveManifest(); throw error;
    }
  } finally { await client.close(); }
}
main().catch((error: unknown) => {
  // Driver error messages may contain connection details: never print them.
  const name = error instanceof Error ? error.name : "UnknownError";
  env.loadEnvConfig(process.cwd());
  console.error(error);
  console.error(`Migration stopped (${name}). Check input, MongoDB connectivity and permissions. Inspect any local manifest, then rerun a dry run; no existing content is automatically overwritten.`);
  process.exitCode = 1;
});
