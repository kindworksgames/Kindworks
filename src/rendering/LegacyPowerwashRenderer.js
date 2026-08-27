import {
  POWERWASH_CANVAS,
  POWERWASH_GRID,
  POWERWASH_NOZZLES,
  POWERWASH_SOAP_TOOL,
  powerwashDifficulty,
} from "../data/playgroundPowerwash.js";

export const LEGACY_POWERWASH_RENDER_REVISION = "phase-3-full-resolution-layers-v1";

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function seeded(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function makeLayer(canvasFactory) {
  const canvas = canvasFactory();
  canvas.width = POWERWASH_CANVAS.width;
  canvas.height = POWERWASH_CANVAS.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = false;
  return { canvas, context };
}

export class LegacyPowerwashRenderer {
  constructor({ canvas, masterArtwork, referenceDirtArtwork, level, state, canvasFactory = () => document.createElement("canvas") }) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.masterArtwork = masterArtwork;
    this.referenceDirtArtwork = referenceDirtArtwork;
    this.level = level;
    this.layers = Object.fromEntries(["dirt", "dirtMask", "resistant", "resistantMask", "soapMask", "foam", "brush", "wet"].map((name) => [name, makeLayer(canvasFactory)]));
    this.particles = [];
    this.pointer = null;
    this.soapHintUntil = 0;
    this.initialDirtySamples = 0;
    this.lastPercent = 0;
    this.build(state);
  }

  build(state) {
    for (const layer of Object.values(this.layers)) layer.context.clearRect(0, 0, POWERWASH_CANVAS.width, POWERWASH_CANVAS.height);
    const dirt = this.layers.dirt.context;
    const dirtMask = this.layers.dirtMask.context;
    dirt.drawImage(this.referenceDirtArtwork, 0, 0, POWERWASH_CANVAS.width, POWERWASH_CANVAS.height);
    dirtMask.drawImage(this.referenceDirtArtwork, 0, 0, POWERWASH_CANVAS.width, POWERWASH_CANVAS.height);
    this.restoreFullyDirtyReference(seeded(240024));
    const rng = seeded(9973 * this.level + 42);
    this.addBalancedDirtCoverage(rng, 0.62);
    this.addLevelDirtDetail(rng);
    this.addSoapRequiredStains(rng);
    this.initialDirtySamples = this.countDirtySamples();
    if (state?.strokes > 0) this.rehydrateGridProgress(state);
    this.lastPercent = this.calculatePercent();
    return this.lastPercent;
  }

  stampGrimePatch(cx, cy, radiusX, radiusY, colour, rng, density = 0.76) {
    const dirt = this.layers.dirt.context;
    const dirtMask = this.layers.dirtMask.context;
    const step = 4;
    const moss = colour.includes("55,82") || colour.includes("62,79") || colour.includes("84,69");
    dirtMask.fillStyle = "#fff";
    for (let y = -radiusY; y <= radiusY; y += step) for (let x = -radiusX; x <= radiusX; x += step) {
      const distance = (x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY);
      if (distance >= 1 || rng() > Math.pow(1 - distance, 0.62) * density) continue;
      const px = Math.round(cx + x); const py = Math.round(cy + y); const tone = rng();
      dirt.fillStyle = moss
        ? tone > 0.72 ? "rgba(47,70,34,.72)" : tone > 0.35 ? "rgba(72,77,39,.68)" : "rgba(91,67,35,.64)"
        : tone > 0.72 ? "rgba(74,52,29,.72)" : tone > 0.35 ? "rgba(101,70,36,.67)" : "rgba(126,91,48,.62)";
      dirt.fillRect(px, py, step, step); dirtMask.fillRect(px, py, step, step);
    }
  }

  restoreFullyDirtyReference(rng) {
    const patches = [
      [622,492,50,31,"rgba(105,72,36,.66)",.68],[674,455,43,28,"rgba(83,66,38,.64)",.66],[850,457,55,35,"rgba(111,76,38,.67)",.70],
      [611,557,42,48,"rgba(89,62,34,.68)",.68],[907,548,48,54,"rgba(84,69,39,.66)",.69],[642,626,38,52,"rgba(111,76,39,.62)",.66],
      [887,630,42,50,"rgba(87,61,33,.65)",.67],[695,690,38,60,"rgba(103,70,36,.62)",.64],[832,706,44,58,"rgba(93,64,35,.64)",.65],
      [742,776,56,32,"rgba(112,77,40,.62)",.64],[839,789,48,28,"rgba(83,62,37,.63)",.63],
      [711,529,24,18,"rgba(101,68,31,.72)",.73],[780,518,31,18,"rgba(86,60,29,.74)",.72],[826,555,27,23,"rgba(101,67,31,.76)",.72],
      [804,603,29,22,"rgba(87,60,30,.73)",.70],[738,610,26,19,"rgba(111,74,31,.72)",.70],
    ];
    for (const [x, y, radiusX, radiusY, colour, density] of patches) this.stampGrimePatch(x, y, radiusX, radiusY, colour, rng, density);
    const dirt = this.layers.dirt.context; const dirtMask = this.layers.dirtMask.context;
    for (let index = 0; index < 6; index += 1) {
      const x = 738 + (index % 2 ? 38 : -12) + (rng() - 0.5) * 12; const y = 470 + index * 58; const direction = index % 2 ? -1 : 1;
      for (const context of [dirt, dirtMask]) {
        context.save(); context.fillStyle = context === dirt ? "rgba(75,54,31,.68)" : "#fff";
        context.fillRect(x - 7, y - 11, 14, 20); context.fillRect(x - 10, y - 7, 20, 10);
        context.fillRect(x - 9 * direction, y - 17, 5, 6); context.fillRect(x - 2 * direction, y - 20, 5, 6); context.fillRect(x + 5 * direction, y - 18, 5, 6); context.restore();
      }
    }
    for (let index = 0; index < 150; index += 1) {
      const x = Math.round(760 + (rng() + rng() + rng() - 1.5) * 150); const y = Math.round(425 + rng() * 375); const size = rng() > 0.82 ? 4 : rng() > 0.45 ? 3 : 2;
      dirt.fillStyle = rng() > 0.72 ? "rgba(62,79,40,.67)" : "rgba(96,66,35,.66)"; dirt.fillRect(x, y, size, size); dirtMask.fillStyle = "#fff"; dirtMask.fillRect(x, y, size, size);
    }
  }

  addBalancedDirtCoverage(rng, intensity = 1) {
    const zones = [
      [205,220,72,56,false],[470,230,92,60,false],[720,205,78,48,false],[1035,220,94,58,true],[1320,235,78,55,true],
      [225,470,82,68,true],[485,500,92,68,false],[760,470,72,58,false],[1045,490,94,70,true],[1320,500,84,66,true],
      [235,735,92,62,true],[505,735,98,64,false],[770,720,82,62,false],[1040,730,98,64,true],[1310,730,92,62,true],
    ];
    for (const [x, y, radiusX, radiusY, moss] of zones) {
      const scale = 0.86 + rng() * 0.28; const density = clamp((0.43 + rng() * 0.13) * intensity, 0.28, 0.78);
      this.stampGrimePatch(x, y, Math.round(radiusX * scale), Math.round(radiusY * scale), moss ? "rgba(55,82,39,.64)" : "rgba(101,69,35,.66)", rng, density);
    }
    const wash = POWERWASH_CANVAS.wash; const dirt = this.layers.dirt.context; const dirtMask = this.layers.dirtMask.context;
    for (let index = 0; index < Math.round(38 * intensity); index += 1) {
      const edge = index % 4;
      const x = edge < 2 ? Math.round(wash.x + 18 + rng() * (wash.width - 36)) : Math.round(edge === 2 ? wash.x + 24 : wash.x + wash.width - 30);
      const y = edge >= 2 ? Math.round(wash.y + 20 + rng() * (wash.height - 40)) : Math.round(edge === 0 ? wash.y + 24 : wash.y + wash.height - 30);
      const leafWidth = 5 + Math.floor(rng() * 6); const leafHeight = 3 + Math.floor(rng() * 4);
      dirt.fillStyle = ["#8f5728", "#b16d2c", "#6e4824"][index % 3]; dirt.fillRect(x, y, leafWidth, leafHeight); dirt.fillStyle = "#4e351e"; dirt.fillRect(x + leafWidth - 2, y - 2, 2, 4);
      dirtMask.fillStyle = "#fff"; dirtMask.fillRect(x - 1, y - 2, leafWidth + 2, leafHeight + 4);
    }
  }

  addLevelDirtDetail(rng) {
    const difficulty = powerwashDifficulty(this.level); const wash = POWERWASH_CANVAS.wash; const dirt = this.layers.dirt.context; const dirtMask = this.layers.dirtMask.context;
    for (let index = 0; index < Math.round(difficulty.blobs * difficulty.t); index += 1) {
      const x = Math.round(wash.x + 24 + rng() * (wash.width - 48)); const y = Math.round(wash.y + 24 + rng() * (wash.height - 48));
      const radiusX = 10 + Math.round(rng() * (14 + 20 * difficulty.t)); const radiusY = 8 + Math.round(rng() * (12 + 18 * difficulty.t)); const moss = rng() > 0.72;
      this.stampGrimePatch(x, y, radiusX, radiusY, moss ? `rgba(55,82,39,${difficulty.stainOpacity})` : `rgba(93,62,32,${difficulty.stainOpacity})`, rng, 0.58 + rng() * 0.16);
    }
    for (let index = 0; index < Math.round(difficulty.grit * difficulty.t); index += 1) {
      const x = Math.round(wash.x + 7 + rng() * (wash.width - 14)); const y = Math.round(wash.y + 7 + rng() * (wash.height - 14)); const size = rng() > 0.9 ? 5 : rng() > 0.55 ? 3 : 2;
      dirt.fillStyle = rng() > 0.8 ? `rgba(55,83,39,${difficulty.stainOpacity + 0.12})` : `rgba(91,61,31,${difficulty.stainOpacity + 0.12})`; dirt.fillRect(x, y, size, size); dirtMask.fillStyle = "#fff"; dirtMask.fillRect(x, y, size, size);
    }
    for (let index = 0; index < Math.round(difficulty.t * 18); index += 1) {
      const x = Math.round(wash.x + 30 + rng() * (wash.width - 60)); const y = Math.round(wash.y + 30 + rng() * (wash.height - 60)); const leafWidth = 5 + Math.floor(rng() * 6); const leafHeight = 3 + Math.floor(rng() * 4);
      dirt.fillStyle = ["#8f5728", "#b16d2c", "#6e4824"][index % 3]; dirt.fillRect(x, y, leafWidth, leafHeight); dirt.fillStyle = "#4e351e"; dirt.fillRect(x + leafWidth - 2, y - 2, 2, 4); dirtMask.fillStyle = "#fff"; dirtMask.fillRect(x - 1, y - 2, leafWidth + 2, leafHeight + 4);
    }
  }

  stampResistantStain(cx, cy, radiusX, radiusY, rng) {
    const resistant = this.layers.resistant.context; const mask = this.layers.resistantMask.context; const step = 4;
    for (let y = -radiusY; y <= radiusY; y += step) for (let x = -radiusX; x <= radiusX; x += step) {
      const distance = (x * x) / (radiusX * radiusX) + (y * y) / (radiusY * radiusY);
      if (distance >= 1 || rng() > Math.pow(1 - distance, 0.42) * 0.91) continue;
      const px = Math.round(cx + x); const py = Math.round(cy + y); const tone = rng();
      resistant.fillStyle = tone > 0.72 ? "rgba(28,62,43,.92)" : tone > 0.34 ? "rgba(49,76,41,.9)" : "rgba(73,67,34,.9)";
      resistant.fillRect(px, py, step, step); mask.fillStyle = "#fff"; mask.fillRect(px, py, step, step);
      if (tone > 0.88) { resistant.fillStyle = "rgba(151,139,61,.8)"; resistant.fillRect(px + 1, py + 1, 2, 2); }
    }
  }

  addSoapRequiredStains(rng) {
    const zones = [[345,250,58,40],[1190,245,62,42],[515,620,68,46],[1035,625,66,46],[770,475,55,39],[245,730,58,38],[1300,700,61,41],[850,735,54,38],[640,330,52,36],[1115,455,57,39]];
    const count = Math.min(zones.length, 5 + Math.floor(powerwashDifficulty(this.level).t * 5));
    for (let index = 0; index < count; index += 1) {
      const [x, y, radiusX, radiusY] = zones[index]; const jitter = this.level === 1 ? 0 : Math.round((rng() - 0.5) * 18);
      this.stampResistantStain(x + jitter, y - jitter, radiusX, radiusY, rng);
    }
  }

  eraseCircle(context, x, y, radius, alpha = 1) {
    context.save(); context.globalCompositeOperation = "destination-out"; context.globalAlpha = clamp(alpha, 0.18, 1);
    context.fillStyle = "#000"; context.beginPath(); context.arc(x, y, radius * 0.74, 0, Math.PI * 2); context.fill();
    const gradient = context.createRadialGradient(x, y, radius * 0.62, x, y, radius * 1.08);
    gradient.addColorStop(0, "rgba(0,0,0,1)"); gradient.addColorStop(0.72, "rgba(0,0,0,.94)"); gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient; context.beginPath(); context.arc(x, y, radius * 1.08, 0, Math.PI * 2); context.fill(); context.restore();
  }

  insideBoard(x, y) {
    const wash = POWERWASH_CANVAS.wash;
    return x >= wash.x && x <= wash.x + wash.width && y >= wash.y && y <= wash.y + wash.height;
  }

  washAt(x, y, radius, eraseAlpha = 1) {
    if (!this.insideBoard(x, y)) return false;
    this.eraseCircle(this.layers.dirt.context, x, y, radius, eraseAlpha); this.eraseCircle(this.layers.dirtMask.context, x, y, radius, eraseAlpha);
    const brush = this.layers.brush.context; brush.clearRect(0, 0, POWERWASH_CANVAS.width, POWERWASH_CANVAS.height); brush.save(); brush.fillStyle = "#fff"; brush.beginPath(); brush.arc(x, y, radius * 0.78, 0, Math.PI * 2); brush.fill(); brush.globalCompositeOperation = "destination-in"; brush.drawImage(this.layers.soapMask.canvas, 0, 0); brush.restore();
    for (const name of ["resistant", "resistantMask", "soapMask", "foam"]) { const context = this.layers[name].context; context.save(); context.globalCompositeOperation = "destination-out"; context.globalAlpha = clamp(eraseAlpha, 0.18, 1); context.drawImage(this.layers.brush.canvas, 0, 0); context.restore(); }
    const sampleX = Math.round(clamp(x, 0, POWERWASH_CANVAS.width - 1)); const sampleY = Math.round(clamp(y, 0, POWERWASH_CANVAS.height - 1));
    if (this.layers.resistantMask.context.getImageData(sampleX, sampleY, 1, 1).data[3] > 45 && this.layers.soapMask.context.getImageData(sampleX, sampleY, 1, 1).data[3] < 45) this.soapHintUntil = performance.now() + 1100;
    const wet = this.layers.wet.context; const wash = POWERWASH_CANVAS.wash; wet.save(); wet.beginPath(); wet.rect(wash.x, wash.y, wash.width, wash.height); wet.clip(); wet.fillStyle = "rgba(103,211,237,.22)"; wet.beginPath(); wet.arc(x, y, radius * 0.86, 0, Math.PI * 2); wet.fill();
    for (let index = 0; index < 5; index += 1) { const offsetX = (Math.random() - 0.5) * radius * 1.15; const offsetY = (Math.random() - 0.5) * radius * 0.85; wet.fillStyle = index < 2 ? "rgba(242,255,255,.52)" : "rgba(91,211,245,.42)"; wet.fillRect(Math.round(x + offsetX), Math.round(y + offsetY), 2 + index % 2, 2); }
    wet.restore(); return true;
  }

  soapAt(x, y, radius) {
    if (!this.insideBoard(x, y)) return false;
    const brush = this.layers.brush.context; brush.clearRect(0, 0, POWERWASH_CANVAS.width, POWERWASH_CANVAS.height); brush.save(); brush.fillStyle = "#fff"; brush.beginPath(); brush.arc(x, y, radius * 0.82, 0, Math.PI * 2); brush.fill(); brush.globalCompositeOperation = "destination-in"; brush.drawImage(this.layers.resistantMask.canvas, 0, 0); brush.restore();
    this.layers.soapMask.context.drawImage(this.layers.brush.canvas, 0, 0);
    const foam = this.layers.foam.context; const wash = POWERWASH_CANVAS.wash; foam.save(); foam.beginPath(); foam.rect(wash.x, wash.y, wash.width, wash.height); foam.clip(); foam.fillStyle = "rgba(224,255,239,.78)"; foam.beginPath(); foam.arc(x, y, radius * 0.72, 0, Math.PI * 2); foam.fill();
    for (let index = 0; index < 9; index += 1) { const angle = index * 2.399; const distance = radius * (0.18 + (index % 4) * 0.13); const size = 3 + (index % 3) * 2; foam.fillStyle = index % 3 ? "rgba(248,255,249,.94)" : "rgba(166,239,224,.9)"; foam.fillRect(Math.round(x + Math.cos(angle) * distance), Math.round(y + Math.sin(angle) * distance), size, size); }
    foam.globalCompositeOperation = "destination-in"; foam.drawImage(this.layers.resistantMask.canvas, 0, 0); foam.restore(); return true;
  }

  applySegment(from, to, state) {
    if (!from || !to || !this.insideBoard(to.x, to.y)) return false;
    const config = state.toolMode === "soap" ? POWERWASH_SOAP_TOOL : POWERWASH_NOZZLES[state.nozzle]; const difficulty = powerwashDifficulty(this.level); const radius = difficulty.baseRadius * config.radius; const eraseAlpha = state.toolMode === "soap" ? 1 : clamp(difficulty.cleanStrength * config.power, 0.18, 1);
    const distance = Math.hypot(to.x - from.x, to.y - from.y); const steps = Math.max(1, Math.ceil(distance / Math.max(4, radius * 0.28))); let applied = false;
    for (let index = 0; index <= steps; index += 1) { const progress = index / steps; const x = from.x + (to.x - from.x) * progress; const y = from.y + (to.y - from.y) * progress; applied = (state.toolMode === "soap" ? this.soapAt(x, y, radius) : this.washAt(x, y, radius, eraseAlpha)) || applied; }
    if (applied) this.spawnMist(to.x, to.y, 6);
    return applied;
  }

  spawnMist(x, y, count) {
    for (let index = 0; index < count && this.particles.length <= 180; index += 1) this.particles.push({ x: x + (Math.random() - 0.5) * 16, y: y + (Math.random() - 0.5) * 16, vx: (Math.random() - 0.5) * 46, vy: -12 - Math.random() * 52, life: 0.22 + Math.random() * 0.28, max: 0.5, size: 2 + Math.random() * 4 });
  }

  tick(deltaMs) {
    const seconds = clamp(Number(deltaMs) / 1000, 0, 0.05); const wet = this.layers.wet.context; wet.save(); wet.globalCompositeOperation = "destination-out"; wet.fillStyle = `rgba(0,0,0,${Math.min(0.13, seconds * 0.52)})`; wet.fillRect(0, 0, POWERWASH_CANVAS.width, POWERWASH_CANVAS.height); wet.restore();
    for (let index = this.particles.length - 1; index >= 0; index -= 1) { const particle = this.particles[index]; particle.life -= seconds; particle.x += particle.vx * seconds; particle.y += particle.vy * seconds; particle.vy += 70 * seconds; if (particle.life <= 0) this.particles.splice(index, 1); }
  }

  countDirtySamples() {
    const wash = POWERWASH_CANVAS.wash; const step = 6; const normal = this.layers.dirtMask.context.getImageData(wash.x, wash.y, wash.width, wash.height).data; const resistant = this.layers.resistantMask.context.getImageData(wash.x, wash.y, wash.width, wash.height).data; let dirty = 0;
    for (let y = 0; y < wash.height; y += step) for (let x = 0; x < wash.width; x += step) { const offset = (y * wash.width + x) * 4; if (normal[offset + 3] > 45 || resistant[offset + 3] > 45) dirty += 1; }
    return dirty;
  }

  calculatePercent() {
    if (this.initialDirtySamples <= 0) return 0;
    this.lastPercent = clamp(Math.round(100 * (1 - this.countDirtySamples() / this.initialDirtySamples)), 0, 100);
    return this.lastPercent;
  }

  rehydrateGridProgress(state) {
    const normal = new Map(state.normal); const resistant = new Set(state.resistant); const soaped = new Set(state.soaped); const wash = POWERWASH_CANVAS.wash; const cellWidth = wash.width / POWERWASH_GRID.columns; const cellHeight = wash.height / POWERWASH_GRID.rows;
    for (let row = 0; row < POWERWASH_GRID.rows; row += 1) for (let col = 0; col < POWERWASH_GRID.columns; col += 1) {
      const cell = row * POWERWASH_GRID.columns + col; const x = wash.x + col * cellWidth; const y = wash.y + row * cellHeight;
      if (!normal.has(cell)) for (const name of ["dirt", "dirtMask"]) this.layers[name].context.clearRect(x, y, cellWidth + 1, cellHeight + 1);
      if (!resistant.has(cell)) for (const name of ["resistant", "resistantMask", "soapMask", "foam"]) this.layers[name].context.clearRect(x, y, cellWidth + 1, cellHeight + 1);
      else if (soaped.has(cell)) this.soapAt(x + cellWidth / 2, y + cellHeight / 2, Math.max(cellWidth, cellHeight));
    }
  }

  drawNozzle(context, active, state) {
    if (!this.pointer) return;
    const originX = 770; const originY = 828; const dx = this.pointer.x - originX; const dy = this.pointer.y - originY; const length = Math.max(1, Math.hypot(dx, dy)); const ux = dx / length; const uy = dy / length; const px = -uy; const py = ux; const gripX = originX - ux * 6; const gripY = originY - uy * 6; const tipX = originX + ux * 150; const tipY = originY + uy * 150;
    context.save(); context.beginPath(); context.rect(0, 100, POWERWASH_CANVAS.width, 752); context.clip(); context.lineCap = "square"; context.lineJoin = "miter";
    context.strokeStyle = "#020813"; context.lineWidth = 20; context.beginPath(); context.moveTo(originX + 10, POWERWASH_CANVAS.height + 6); context.quadraticCurveTo(originX + 64, 925, gripX, gripY); context.stroke(); context.strokeStyle = "#14537f"; context.lineWidth = 9; context.stroke();
    context.strokeStyle = "#09111d"; context.lineWidth = 19; context.beginPath(); context.moveTo(gripX, gripY); context.lineTo(tipX, tipY); context.stroke(); context.strokeStyle = "#7f929d"; context.lineWidth = 10; context.stroke(); context.strokeStyle = "#c1ccd0"; context.lineWidth = 3; context.stroke();
    const handleX = Math.round(gripX + px * 5); const handleY = Math.round(gripY + py * 5); context.fillStyle = "#09111c"; context.fillRect(handleX - 13, handleY - 5, 26, 28); context.fillStyle = "#1686bd"; context.fillRect(handleX - 8, handleY, 16, 18); context.fillStyle = "#66c9ed"; context.fillRect(handleX - 5, handleY + 2, 5, 12); context.fillStyle = "#0a111a"; context.fillRect(Math.round(tipX) - 8, Math.round(tipY) - 7, 16, 14); context.fillStyle = "#9aa9ae"; context.fillRect(Math.round(tipX) - 4, Math.round(tipY) - 5, 8, 10);
    const config = state.toolMode === "soap" ? POWERWASH_SOAP_TOOL : POWERWASH_NOZZLES[state.nozzle]; const radius = powerwashDifficulty(this.level).baseRadius * config.radius;
    if (active) { const soapMode = state.toolMode === "soap"; context.strokeStyle = soapMode ? "rgba(112,195,156,.8)" : "rgba(22,117,177,.72)"; context.lineWidth = 13; context.beginPath(); context.moveTo(tipX, tipY); context.lineTo(this.pointer.x, this.pointer.y); context.stroke(); context.strokeStyle = soapMode ? "rgba(211,250,221,.96)" : "rgba(83,210,245,.95)"; context.lineWidth = 7; context.stroke(); context.strokeStyle = "rgba(246,255,255,.98)"; context.lineWidth = 3; context.stroke(); context.fillStyle = soapMode ? "rgba(213,250,224,.5)" : "rgba(99,220,249,.42)"; context.beginPath(); context.moveTo(this.pointer.x - px * radius * 0.18, this.pointer.y - py * radius * 0.18); context.lineTo(this.pointer.x + px * radius * 0.58, this.pointer.y + py * radius * 0.58); context.lineTo(this.pointer.x - px * radius * 0.58, this.pointer.y - py * radius * 0.58); context.closePath(); context.fill(); context.fillStyle = "rgba(246,255,255,.94)"; for (let index = 0; index < 8; index += 1) { const angle = index * Math.PI / 4; const distance = radius * (0.34 + (index % 3) * 0.12); const size = soapMode ? 5 : 4; context.fillRect(Math.round(this.pointer.x + Math.cos(angle) * distance) - 2, Math.round(this.pointer.y + Math.sin(angle) * distance) - 2, size, size); } }
    else { context.strokeStyle = "rgba(55,156,205,.22)"; context.lineWidth = 2; context.beginPath(); context.moveTo(tipX, tipY); context.lineTo(this.pointer.x, this.pointer.y); context.stroke(); }
    context.restore();
  }

  draw(state, active = false) {
    const context = this.context; context.imageSmoothingEnabled = false; context.clearRect(0, 0, POWERWASH_CANVAS.width, POWERWASH_CANVAS.height); context.drawImage(this.masterArtwork, 0, 0, POWERWASH_CANVAS.width, POWERWASH_CANVAS.height); context.drawImage(this.layers.dirt.canvas, 0, 0); context.drawImage(this.layers.resistant.canvas, 0, 0); context.drawImage(this.layers.foam.canvas, 0, 0); context.drawImage(this.layers.wet.canvas, 0, 0);
    for (const particle of this.particles) { const alpha = particle.life / particle.max; context.fillStyle = `rgba(196,242,255,${alpha * 0.82})`; const size = Math.max(2, Math.round(particle.size * alpha)); context.fillRect(Math.round(particle.x), Math.round(particle.y), size, size); }
    this.drawNozzle(context, active, state);
    if (performance.now() < this.soapHintUntil && this.pointer) { const x = clamp(this.pointer.x, 170, POWERWASH_CANVAS.width - 170); const y = clamp(this.pointer.y - 72, 135, 815); context.fillStyle = "rgba(4,9,20,.9)"; context.fillRect(x - 164, y - 12, 328, 54); context.fillStyle = "#f1c34b"; context.fillRect(x - 158, y - 6, 316, 42); context.fillStyle = "#10213c"; context.fillRect(x - 152, y, 304, 30); context.fillStyle = "#fff1bc"; context.font = "900 24px ui-monospace, monospace"; context.textAlign = "center"; context.fillText("SOAP FIRST", x, y + 23); }
  }
}
