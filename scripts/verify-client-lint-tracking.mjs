import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const IGNORED_DIRECTORIES = new Set(["node_modules", ".next", ".git", "out", "build", "public"]);

const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".md"]);

const TODO_PATTERN = /TODO\s*\(client-lint\):\s*(.+)/gi;
const TICKET_PATTERN = /(#[0-9]+|[A-Z]+-\d+|https?:\/\/\S+)/;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const matches = [];

  for (const entry of entries) {
    if (IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      matches.push(...(await walk(fullPath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name);
    if (extension && !ALLOWED_EXTENSIONS.has(extension)) {
      continue;
    }

    const content = await readFile(fullPath, "utf8");
    let match;

    while ((match = TODO_PATTERN.exec(content)) !== null) {
      const [, note] = match;
      const hasTicket = TICKET_PATTERN.test(note);

      matches.push({
        file: fullPath,
        note: note.trim(),
        hasTicket,
      });
    }
  }

  return matches;
}

async function main() {
  const repoRoot = process.cwd();
  const clientDir = path.join(repoRoot, "apps", "client");

  try {
    const stats = await stat(clientDir);
    if (!stats.isDirectory()) {
      console.error(`Expected ${clientDir} to be a directory.`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Unable to access ${clientDir}:`, error);
    process.exit(1);
  }

  const matches = await walk(clientDir);

  if (matches.length === 0) {
    console.error(
      "Client lint failed but no TODO(client-lint) annotations with ticket references were found. Add a TODO with a tracking link or ticket ID before marking the lint step as non-blocking."
    );
    process.exit(1);
  }

  const unresolved = matches.filter((entry) => !entry.hasTicket);
  if (unresolved.length > 0) {
    console.error("The following TODO(client-lint) annotations are missing ticket references:");
    for (const entry of unresolved) {
      console.error(`- ${entry.file}: ${entry.note}`);
    }
    process.exit(1);
  }

  console.log("Found tracked client lint TODOs:");
  for (const entry of matches) {
    console.log(`- ${entry.file}: ${entry.note}`);
  }
}

main().catch((error) => {
  console.error("Failed to verify client lint tracking:", error);
  process.exit(1);
});
