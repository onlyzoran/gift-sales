import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { loadSourcesConfig } from "./config";
import { formatCollectLog, runCollect } from "./run";

function repoRoot(): string {
  return resolve(import.meta.dirname, "../../..");
}

function parseArgs(argv: string[]): {
  dryRun: boolean;
  configPath: string;
  dbPath: string;
} {
  const root = repoRoot();
  let dryRun =
    process.env.GIFT_SALES_DRY_RUN === "1" ||
    process.env.GIFT_SALES_DRY_RUN === "true";
  let configPath = join(root, "sources.yaml");
  let dbPath = join(root, "data/quotes.db");

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--config") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--config requires a path");
      }
      configPath = resolve(value);
      index += 1;
      continue;
    }

    if (arg === "--db") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--db requires a path");
      }
      dbPath = resolve(value);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { dryRun, configPath, dbPath };
}

async function main(): Promise<void> {
  const { dryRun, configPath, dbPath } = parseArgs(process.argv.slice(2));

  if (!existsSync(configPath)) {
    throw new Error(`Config not found: ${configPath}`);
  }

  const config = loadSourcesConfig(configPath);
  const { result, exitCode } = await runCollect({
    config,
    dbPath,
    dryRun,
  });

  process.stdout.write(`${formatCollectLog(result, dbPath)}\n`);
  process.exitCode = exitCode;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
