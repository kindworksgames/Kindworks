export const WASTE_PARK_BACKDROP_VERSION = "72.0.1-html-authored-park";

// Deterministic code-native park composition from the authoritative HTML game.
// It remains independent from the cards so artwork can later replace it through
// the visual pipeline without changing matching geometry.
export function wasteParkBackdropDataUrl() {
  let seed = 1986;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const paverColours = ["#9d9279", "#a89b80", "#8e876f", "#b0a187"];
  let pavers = "";
  for (let row = 0; row < 12; row += 1) {
    const y = row * 72;
    const offset = (row % 2) * 42;
    for (let column = -1; column < 14; column += 1) {
      const x = 210 + column * 84 + offset;
      const fill = paverColours[(row * 3 + column + 8) % paverColours.length];
      pavers += `<rect x="${x}" y="${y}" width="82" height="70" fill="${fill}" stroke="#6e6959" stroke-width="2"/>`;
      if ((row + column) % 3 === 0) pavers += `<path d="M${x + 12} ${y + 9}h18v3h-9v8h-3" fill="none" stroke="#756f5d" stroke-width="2"/>`;
      if ((row * 2 + column) % 5 === 0) pavers += `<rect x="${x + 55}" y="${y + 50}" width="14" height="3" fill="#c0b394" opacity=".6"/>`;
    }
  }

  let tufts = "";
  let flowers = "";
  let leaves = "";
  for (let index = 0; index < 125; index += 1) {
    const x = Math.floor(random() * 1080);
    const y = Math.floor(random() * 840);
    const grassZone = x < 275 || y > 730 || (x > 930 && y > 500) || (x > 790 && y < 115);
    if (!grassZone && random() > 0.15) continue;
    const colour = index % 3 === 0 ? "#334e2e" : index % 3 === 1 ? "#4e6f37" : "#73904a";
    tufts += `<path d="M${x} ${y + 8}v-7m0 7l-6-5m6 5l6-6" stroke="${colour}" stroke-width="3" fill="none"/>`;
    if (index % 17 === 0) flowers += `<rect x="${x - 2}" y="${y - 5}" width="4" height="10" fill="#3d6034"/><rect x="${x - 6}" y="${y - 9}" width="5" height="5" fill="#e8c850"/><rect x="${x + 2}" y="${y - 9}" width="5" height="5" fill="#f0dc7c"/><rect x="${x - 2}" y="${y - 13}" width="5" height="5" fill="#f4e6a1"/>`;
    if (index % 23 === 0) leaves += `<path d="M${x - 7} ${y + 3}l9-7 8 5-9 8z" fill="#a86b32" stroke="#654b2e" stroke-width="2"/><path d="M${x - 1} ${y + 3}l5-4" stroke="#654b2e" stroke-width="2"/>`;
  }

  let weeds = "";
  for (let index = 0; index < 45; index += 1) {
    const x = 235 + Math.floor(random() * 800);
    const y = Math.floor(random() * 830);
    weeds += `<rect x="${x}" y="${y}" width="3" height="12" fill="#4d6936"/><rect x="${x - 5}" y="${y + 4}" width="7" height="3" fill="#5f7b3e"/><rect x="${x + 2}" y="${y + 7}" width="7" height="3" fill="#42602f"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 840" shape-rendering="crispEdges">
    <rect width="1080" height="840" fill="#627f43"/>
    <path d="M0 0h360v105h-66v114h52v102H218v124h72v132H185v124h93v139H0z" fill="#6f8e48"/>
    <g>${pavers}</g>
    <path d="M0 0h255v91h-31v118h61v88H194v109h52v91H161v115h76v118H0z" fill="#6e8a45"/>
    <path d="M824 0h256v107H927v58h-103zM930 534h150v306H879v-101h44zM0 713h302v127H0z" fill="#6a8744"/>
    <g fill="#775d3a"><path d="M0 245h68v-29h58v24h55v41h-34v35H42v-22H0z"/><path d="M906 640h74v-33h100v112h-61v27h-87v-38h-52z"/><path d="M945 87h72v-24h63v113h-99v-28h-62z"/></g>
    <g fill="#8f7047" opacity=".7"><rect x="18" y="233" width="102" height="14"/><rect x="37" y="281" width="91" height="12"/><rect x="928" y="656" width="126" height="15"/><rect x="958" y="700" width="96" height="13"/></g>
    <g>${tufts}${flowers}${leaves}${weeds}</g>
    <g fill="#4b6637"><rect x="303" y="69" width="5" height="17"/><rect x="299" y="75" width="13" height="4"/><rect x="548" y="504" width="4" height="18"/><rect x="541" y="510" width="17" height="4"/><rect x="770" y="286" width="4" height="19"/><rect x="764" y="294" width="16" height="4"/></g>
    <rect width="1080" height="840" fill="none" stroke="#273327" stroke-width="8"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
