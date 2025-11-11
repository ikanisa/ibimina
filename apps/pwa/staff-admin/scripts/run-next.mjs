import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextBin = path.resolve(
  __dirname,
  "..",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next"
);

const mode = process.argv[2] ?? "dev";
const host = process.env.HOST ?? "0.0.0.0";
const explicitPort = process.env.PORT;
const defaultPort = Number.parseInt(explicitPort ?? "3100", 10);

if (!["dev", "start"].includes(mode)) {
  console.error(`Unsupported Next.js mode "${mode}". Use "dev" or "start".`);
  process.exit(1);
}

const port =
  mode === "dev" && explicitPort === undefined
    ? await findAvailablePort(defaultPort, host)
    : defaultPort;

if (mode === "dev" && explicitPort === undefined && port !== defaultPort) {
  console.log(`Port ${defaultPort} is in use. Falling back to ${port}.`);
}

const args = [mode, "--port", String(port), "--hostname", host];
const child = spawn(nextBin, args, {
  stdio: "inherit",
  env: { ...process.env, PORT: String(port) },
});

child.on("close", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(`Failed to launch "next ${mode}":`, error);
  process.exit(1);
});

async function findAvailablePort(startPort, host) {
  let port = startPort;
  while (port < startPort + 1000) {
    const available = await isPortAvailable(port, host);
    if (available) {
      return port;
    }
    port += 1;
  }
  throw new Error(`Could not find an open port starting from ${startPort}.`);
}

function isPortAvailable(port, host) {
  return new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once("error", (error) => {
        if (error.code === "EADDRINUSE" || error.code === "EACCES") {
          resolve(false);
        } else {
          reject(error);
        }
      })
      .once("listening", () => {
        tester.once("close", () => resolve(true)).close();
      })
      .listen({ port, host });
  });
}
