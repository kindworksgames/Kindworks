import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const child = spawn(process.execPath, [resolve(root, "node_modules/vite/bin/vite.js"), "build", "--outDir", "dist-test-metrics"], {
  cwd: root,
  env: { ...process.env, VITE_KW_TEST_METRICS: "1" },
  stdio: "inherit",
});
const [code] = await once(child, "exit");
if (code) process.exitCode = code;
