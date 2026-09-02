import {
  collectKupikodAppleQuotes,
  createFixtureFetch,
  createRateLimitedFetch,
} from "../packages/adapters/src/kupikod";

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const fetchHtml = dryRun ? createFixtureFetch() : createRateLimitedFetch();

  const quotes = await collectKupikodAppleQuotes({ fetchHtml });
  process.stdout.write(`${JSON.stringify(quotes, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
