import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const walk = (directory, predicate = () => true) => {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(relative, predicate) : predicate(relative) ? [relative] : [];
  });
};

const jsFiles = walk("src", (file) => /\.js$/.test(file));
const sourceFiles = [...jsFiles, "index.html", "src/style.css", "src/shop-reference.css"];
const source = new Map(sourceFiles.map((file) => [file, read(file)]));
const linesFor = (file, pattern) => source.get(file).split(/\r?\n/).flatMap((line, index) => pattern.test(line) ? [{ file, line: index + 1, text: line.trim() }] : []);

const html = read("index.html");
const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicateHtmlIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].sort();

const sceneFiles = walk("src/scenes", (file) => /Scene\.js$/.test(file));
const sceneDefinitions = sceneFiles.flatMap((file) => {
  const text = read(file);
  return [...text.matchAll(/export\s+class\s+(\w+)\s+extends\s+Phaser\.Scene[\s\S]*?super\(["']([^"']+)["']\)/g)]
    .map((match) => ({ file, className: match[1], key: match[2] }));
});
const sceneKeyGroups = Object.groupBy(sceneDefinitions, (scene) => scene.key);
const duplicateSceneKeys = Object.entries(sceneKeyGroups).filter(([, definitions]) => definitions.length > 1);
const lazySource = read("src/scenes/lazyScenes.js");
const lazyKeys = [...lazySource.matchAll(/^\s{2}(\w+Scene):\s*\(\)\s*=>/gm)].map((match) => match[1]);
const directSceneKeys = ["BootScene", "TownScene"];
const registeredSceneKeys = new Set([...directSceneKeys, ...lazyKeys]);
const unregisteredSceneDefinitions = sceneDefinitions.filter((scene) => !registeredSceneKeys.has(scene.key));
const missingSceneDefinitions = [...registeredSceneKeys].filter((key) => !sceneDefinitions.some((scene) => scene.key === key));
const referencedSceneKeys = [...new Set(jsFiles.flatMap((file) => {
  const text = read(file);
  return [
    ...[...text.matchAll(/(?:scene\.start|scene\.launch|scene\.switch|startLazyScene|ensureLazyScene)\([^\n]*?["'](\w+Scene)["']/g)].map((match) => match[1]),
    ...[...text.matchAll(/sceneKey:\s*["'](\w+Scene)["']/g)].map((match) => match[1]),
  ];
}))].sort();
const unknownSceneReferences = referencedSceneKeys.filter((key) => !registeredSceneKeys.has(key));

const missingRelativeImports = [];
for (const file of jsFiles) {
  const text = read(file);
  for (const match of text.matchAll(/(?:from\s+|import\s*\()["'](\.{1,2}\/[^"']+)["']/g)) {
    const candidate = path.resolve(root, path.dirname(file), match[1]);
    const candidates = [candidate, `${candidate}.js`, path.join(candidate, "index.js")];
    if (!candidates.some((target) => fs.existsSync(target))) missingRelativeImports.push({ file, specifier: match[1] });
  }
}

const publicFiles = walk("public", () => true).map((file) => file.replace(/^public\//, "/"));
const referencedPublicAssets = [...new Set(sourceFiles.flatMap((file) => {
  const text = source.get(file);
  return [...text.matchAll(/["'`](\/assets\/[^"'`)\s]+)["'`)]?/g)].map((match) => match[1]);
}))].sort();
const missingPublicAssets = referencedPublicAssets.filter((asset) => !fs.existsSync(path.join(root, "public", asset)));
const unusedPublicAssets = publicFiles.filter((asset) => !referencedPublicAssets.includes(asset));

const emptyCatches = jsFiles.flatMap((file) => linesFor(file, /catch\s*(?:\([^)]*\))?\s*\{\s*\}|\.catch\(\s*(?:\([^)]*\)|\w+)\s*=>\s*(?:\{\s*\}|undefined|null)\s*\)/));
const todoMarkers = sourceFiles.flatMap((file) => linesFor(file, /\b(?:TODO|FIXME|HACK|XXX)\b/i));
const randomCalls = jsFiles.flatMap((file) => linesFor(file, /\bMath\.random\s*\(/));
const listenerFiles = jsFiles.flatMap((file) => {
  const text = read(file);
  const adds = (text.match(/addEventListener\s*\(/g) || []).length;
  const removes = (text.match(/removeEventListener\s*\(/g) || []).length;
  return adds ? [{ file, adds, removes }] : [];
});
const intervalFiles = jsFiles.flatMap((file) => {
  const text = read(file);
  const creates = (text.match(/setInterval\s*\(/g) || []).length;
  const clears = (text.match(/clearInterval\s*\(/g) || []).length;
  return creates ? [{ file, creates, clears }] : [];
});
const qaQueryFiles = jsFiles.flatMap((file) => {
  const text = read(file);
  if (!/(?:[?&]|get\(["'])qa/.test(text)) return [];
  return [{ file, guardedByDev: /import\.meta\.env\.DEV/.test(text) }];
});
const suspiciousPlayerCopy = sourceFiles.flatMap((file) => linesFor(file, /["'`][^"'`]*(?:vertical slice|raw coordinates?|backend ids?|legacy catalogue|milestone\s+\d+)[^"'`]*["'`]/i));

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    sourceJsFiles: jsFiles.length,
    htmlIds: ids.length,
    sceneDefinitions: sceneDefinitions.length,
    registeredSceneKeys: registeredSceneKeys.size,
    publicAssets: publicFiles.length,
    referencedPublicAssets: referencedPublicAssets.length,
  },
  html: { duplicateIds: duplicateHtmlIds },
  scenes: {
    definitions: sceneDefinitions,
    directKeys: directSceneKeys,
    lazyKeys,
    duplicateKeys: duplicateSceneKeys,
    unregisteredDefinitions: unregisteredSceneDefinitions,
    missingDefinitions: missingSceneDefinitions,
    referencedKeys: referencedSceneKeys,
    unknownReferences: unknownSceneReferences,
  },
  imports: { missingRelative: missingRelativeImports },
  assets: { publicFiles, referenced: referencedPublicAssets, missing: missingPublicAssets, unused: unusedPublicAssets },
  errorHandling: { emptyCatches },
  markers: { todoFixmeHack: todoMarkers, suspiciousPlayerCopy },
  randomness: { calls: randomCalls },
  lifecycle: { listeners: listenerFiles, intervals: intervalFiles },
  productionGuards: { qaQueryFiles },
};

console.log(JSON.stringify(report, null, 2));
