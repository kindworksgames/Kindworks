import { BEACH_RAKE_PATTERNS } from "../data/beachCleanup.js";

const OFFSETS = Object.freeze([
  { value: 25, tone: "main" }, { value: 50, tone: "main" }, { value: 75, tone: "main" },
  { value: 37.5, tone: "soft" }, { value: 62.5, tone: "soft" },
]);

function straightPath(pattern, offset) {
  return pattern === "v" ? `M ${offset} 0 L ${offset} 100` : `M 0 ${offset} L 100 ${offset}`;
}

function cornerPath(pattern, radius) {
  if (pattern === "nw") return `M ${radius} 0 A ${radius} ${radius} 0 0 1 0 ${radius}`;
  if (pattern === "ne") return `M 100 ${radius} A ${radius} ${radius} 0 0 1 ${100 - radius} 0`;
  if (pattern === "sw") return `M 0 ${100 - radius} A ${radius} ${radius} 0 0 1 ${radius} 100`;
  return `M ${100 - radius} 100 A ${radius} ${radius} 0 0 1 100 ${100 - radius}`;
}

export function beachRakeGroovePaths(pattern) {
  if (!BEACH_RAKE_PATTERNS.includes(pattern)) return [];
  return OFFSETS.map(({ value, tone }) => ({ tone, path: ["h", "v"].includes(pattern) ? straightPath(pattern, value) : cornerPath(pattern, value) }));
}

export function renderBeachRakeGrooves(pattern) {
  const paths = beachRakeGroovePaths(pattern);
  if (!paths.length) return "";
  return `<svg class="beach-rake-grooves rake-${pattern}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths.map(({ tone, path }) => `<path class="${tone}" d="${path}" vector-effect="non-scaling-stroke"></path>`).join("")}</svg>`;
}
