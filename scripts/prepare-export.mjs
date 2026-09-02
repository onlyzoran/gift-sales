import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "src/app/api");
const backupDir = path.join(root, ".api-prod-backup");

function copyDir(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const src = path.join(from, entry);
    const dest = path.join(to, entry);
    if (statSync(src).isDirectory()) {
      copyDir(src, dest);
    } else {
      copyFileSync(src, dest);
    }
  }
}

function restoreApiRoutes() {
  if (!existsSync(backupDir)) {
    return;
  }

  rmSync(apiDir, { recursive: true, force: true });
  copyDir(backupDir, apiDir);
  rmSync(backupDir, { recursive: true, force: true });
}

function removeApiRoutesForExport() {
  if (existsSync(backupDir)) {
    return;
  }

  copyDir(apiDir, backupDir);
  rmSync(apiDir, { recursive: true, force: true });
}

const isExport = process.env.GIFT_SALES_OUTPUT === "export";
const command = process.argv[2] ?? "prepare";

if (command === "prepare") {
  if (isExport) {
    removeApiRoutesForExport();
    console.log("Removed API routes for static export preview");
  }
} else if (command === "restore") {
  restoreApiRoutes();
  console.log("Restored production API routes");
}
