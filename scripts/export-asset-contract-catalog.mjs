import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderAssetContractCatalog } from "./lib/assetContractCatalog.mjs";

const root = resolve(import.meta.dirname, "..");
const plan = JSON.parse(await readFile(resolve(root, "artwork/production/phase-10/production-migration-plan.v1.json"), "utf8"));
const target = resolve(root, "artwork/contracts/asset-category-contracts.v2.json");
await writeFile(target, renderAssetContractCatalog(plan));
console.log(`Exported ${target.replace(`${root}/`, "")}.`);
