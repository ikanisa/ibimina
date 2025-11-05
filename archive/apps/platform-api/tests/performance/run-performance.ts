import { spawn } from "node:child_process";

const runScript = (label: string, scriptPath: string) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn("tsx", [scriptPath], { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${label} exited with code ${code}`));
      }
    });
  });

async function main() {
  const scripts = [
    { label: "load-ingestion", path: "tests/performance/load-ingestion.ts" },
    { label: "chaos-edge", path: "tests/performance/chaos-edge.ts" },
  ];

  for (const script of scripts) {
    console.info(`performance.run ${script.label}`);
    await runScript(script.label, script.path);
  }
}

main().catch((error) => {
  console.error("performance.run_failed", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
