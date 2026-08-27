import { readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const PERFORMANCE_BUDGET = Object.freeze({
  initialApplicationBytes: 3_100_000,
  phaserEngineBytes: 1_500_000,
  lazySceneBytes: 80_000,
  totalJavaScriptBytes: 5_000_000,
  minimumLazyChunks: 12,
});

export async function inspectPerformanceBuild(directory = new URL("../dist/assets/", import.meta.url)) {
  const assetDirectory = directory instanceof URL ? directory : new URL(`file://${directory.endsWith("/") ? directory : `${directory}/`}`);
  const names = await readdir(assetDirectory);
  const files = await Promise.all(names.filter((name) => name.endsWith(".js")).map(async (name) => ({
    name,
    bytes: (await stat(new URL(name, assetDirectory))).size,
  })));
  const entry = files.find(({ name }) => /^index-[^.]+\.js$/.test(name));
  const engine = files.find(({ name }) => name.startsWith("phaser-engine-"));
  const lazy = files.filter(({ name }) => ![entry?.name, engine?.name].includes(name));
  const totalJavaScriptBytes = files.reduce((total, file) => total + file.bytes, 0);
  const failures = [];
  if (!entry) failures.push("The initial application chunk is missing.");
  else if (entry.bytes > PERFORMANCE_BUDGET.initialApplicationBytes) failures.push(`Initial application chunk is ${entry.bytes} bytes.`);
  if (!engine) failures.push("The cacheable Phaser engine chunk is missing.");
  else if (engine.bytes > PERFORMANCE_BUDGET.phaserEngineBytes) failures.push(`Phaser engine chunk is ${engine.bytes} bytes.`);
  if (lazy.length < PERFORMANCE_BUDGET.minimumLazyChunks) failures.push(`Only ${lazy.length} lazy chunks were emitted.`);
  for (const file of lazy) if (file.bytes > PERFORMANCE_BUDGET.lazySceneBytes) failures.push(`Lazy chunk ${file.name} is ${file.bytes} bytes.`);
  if (totalJavaScriptBytes > PERFORMANCE_BUDGET.totalJavaScriptBytes) failures.push(`Total JavaScript is ${totalJavaScriptBytes} bytes.`);
  if (names.some((name) => name.endsWith(".map"))) failures.push("Production source maps must remain disabled.");
  return { ok: failures.length === 0, files, entry, engine, lazy, totalJavaScriptBytes, failures, budget: PERFORMANCE_BUDGET };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const result = await inspectPerformanceBuild();
  const reportPath = new URL("../dist/performance-budget.json", import.meta.url);
  await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Performance budget: ${result.ok ? "PASS" : "FAIL"}`);
  console.log(`Initial application: ${result.entry?.bytes || 0} bytes`);
  console.log(`Phaser engine: ${result.engine?.bytes || 0} bytes`);
  console.log(`Lazy chunks: ${result.lazy.length}`);
  console.log(`Total JavaScript: ${result.totalJavaScriptBytes} bytes`);
  if (!result.ok) {
    for (const failure of result.failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  }
}
