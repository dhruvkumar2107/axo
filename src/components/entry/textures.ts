import * as THREE from 'three';

/**
 * ============================================================================
 *  PROCEDURAL ARCHITECTURAL TEXTURES
 * ============================================================================
 *
 *  The palace doors are carved, not painted. Since no texture assets exist, the
 *  wood grain, the panel mouldings, the cusped arch motif and the brass studs
 *  are all drawn into a canvas at runtime and used as colour + bump maps.
 *
 *  This is why the doors read as *wood* rather than as brown boxes: the relief
 *  is in the bump map, and the grain runs continuously across every panel, so
 *  the eye reads one large carved surface instead of tiled graphics.
 *
 *  Everything is generated once, disposed on teardown, and costs no network.
 */

type Ctx = CanvasRenderingContext2D;

function makeCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return { canvas, ctx };
}

/** Deterministic pseudo-random, so the doors look identical on every load. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/* ---------------------------------------------------------------------------
   Wood grain
   --------------------------------------------------------------------------- */

function paintGrain(ctx: Ctx, w: number, h: number, rand: () => number, strength: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  // Long, slightly wandering fibres running with the grain of the timber.
  for (let i = 0; i < 260 * strength; i += 1) {
    const x = rand() * w;
    const amplitude = 4 + rand() * 16;
    const frequency = 0.004 + rand() * 0.012;
    const phase = rand() * Math.PI * 2;
    const lightness = rand() > 0.5 ? 255 : 0;

    ctx.strokeStyle = `rgba(${lightness},${lightness},${lightness},${0.018 + rand() * 0.05})`;
    ctx.lineWidth = 0.6 + rand() * 2.4;
    ctx.beginPath();
    for (let y = 0; y <= h; y += 14) {
      const px = x + Math.sin(y * frequency + phase) * amplitude;
      if (y === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();
  }

  // A few knots, each a tight spiral of darker fibre.
  for (let i = 0; i < 3; i += 1) {
    const kx = rand() * w;
    const ky = rand() * h;
    const kr = 8 + rand() * 18;
    for (let r = kr; r > 0; r -= 1.6) {
      ctx.strokeStyle = `rgba(0,0,0,${0.03 + (1 - r / kr) * 0.05})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(kx, ky, r, r * 0.62, rand() * 0.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ---------------------------------------------------------------------------
   A cusped (multifoil) arch — the signature motif of the carving
   --------------------------------------------------------------------------- */

function cuspedArchPath(ctx: Ctx, x: number, y: number, w: number, h: number, lobes = 5) {
  const r = w / 2;
  const cx = x + r;
  const springY = y + h - r;

  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, springY);

  // The arch is drawn as a series of small arcs — the cusped ogee silhouette.
  const segments = lobes * 2;
  for (let i = 0; i <= segments; i += 1) {
    const a0 = Math.PI - (i / segments) * Math.PI;
    const a1 = Math.PI - ((i + 1) / segments) * Math.PI;
    const mid = (a0 + a1) / 2;
    const outward = i % 2 === 0 ? 1.18 : 0.86;
    const px = cx + Math.cos(mid) * r * outward;
    const py = springY - Math.sin(mid) * r * outward * 0.94;
    ctx.quadraticCurveTo(px, py, cx + Math.cos(a1) * r, springY - Math.sin(a1) * r * 0.94);
  }

  ctx.lineTo(cx + r, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

/* ---------------------------------------------------------------------------
   The door face
   --------------------------------------------------------------------------- */

interface Panel {
  x: number;
  y: number;
  w: number;
  h: number;
}

function panelLayout(w: number, h: number): Panel[] {
  const marginX = w * 0.085;
  const marginTop = h * 0.055;
  const marginBottom = h * 0.045;
  const gutterX = w * 0.045;
  const gutterY = h * 0.028;
  const cols = 2;
  const rows = 3;

  const cellW = (w - marginX * 2 - gutterX * (cols - 1)) / cols;
  const cellH = (h - marginTop - marginBottom - gutterY * (rows - 1)) / rows;

  const panels: Panel[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      panels.push({
        x: marginX + c * (cellW + gutterX),
        y: marginTop + r * (cellH + gutterY),
        w: cellW,
        h: cellH,
      });
    }
  }
  return panels;
}

/** Raised moulding: light on the light side, shadow on the dark side. */
function paintMoulding(ctx: Ctx, path: () => void, depth: number, bright: boolean) {
  ctx.save();
  path();
  ctx.strokeStyle = bright
    ? `rgba(214,168,96,${0.5 * depth})`
    : `rgba(0,0,0,${0.55 * depth})`;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.restore();
}

export interface DoorTextures {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  dispose: () => void;
}

export function createDoorTextures(width = 1024, height = 2048): DoorTextures {
  const rand = seeded(20251017);

  /* --- Colour map ------------------------------------------------------- */
  const { canvas: colourCanvas, ctx: colour } = makeCanvas(width, height);

  // Base timber: warm, dark, with a vertical light fall-off.
  const base = colour.createLinearGradient(0, 0, width * 0.35, height);
  base.addColorStop(0, '#3A2416');
  base.addColorStop(0.42, '#2C1A10');
  base.addColorStop(0.72, '#241409');
  base.addColorStop(1, '#180D06');
  colour.fillStyle = base;
  colour.fillRect(0, 0, width, height);

  paintGrain(colour, width, height, rand, 1);

  // Ambient occlusion towards the frame edges — nothing is ever evenly lit.
  const edge = colour.createLinearGradient(0, 0, 0, height);
  edge.addColorStop(0, 'rgba(0,0,0,0.5)');
  edge.addColorStop(0.18, 'rgba(0,0,0,0)');
  edge.addColorStop(0.82, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(0,0,0,0.55)');
  colour.fillStyle = edge;
  colour.fillRect(0, 0, width, height);

  const sideEdge = colour.createLinearGradient(0, 0, width, 0);
  sideEdge.addColorStop(0, 'rgba(0,0,0,0.55)');
  sideEdge.addColorStop(0.16, 'rgba(0,0,0,0)');
  sideEdge.addColorStop(0.84, 'rgba(0,0,0,0)');
  sideEdge.addColorStop(1, 'rgba(0,0,0,0.55)');
  colour.fillStyle = sideEdge;
  colour.fillRect(0, 0, width, height);

  const panels = panelLayout(width, height);

  for (const [index, panel] of panels.entries()) {
    const inset = width * 0.018;
    const px = panel.x + inset;
    const py = panel.y + inset;
    const pw = panel.w - inset * 2;
    const ph = panel.h - inset * 2;

    // Recessed field
    colour.fillStyle = 'rgba(0,0,0,0.34)';
    colour.fillRect(px, py, pw, ph);

    // The raised rail around the recess
    colour.strokeStyle = 'rgba(0,0,0,0.6)';
    colour.lineWidth = 5;
    colour.strokeRect(px, py, pw, ph);
    colour.strokeStyle = 'rgba(196,150,88,0.22)';
    colour.lineWidth = 1.6;
    colour.strokeRect(px + 3, py + 3, pw - 6, ph - 6);

    // Cusped arch carved into the panel
    const archW = pw * 0.56;
    const archH = ph * 0.58;
    const archX = px + (pw - archW) / 2;
    const archY = py + ph - archH - ph * 0.16;
    const lobes = index % 2 === 0 ? 5 : 3;
    const traceArch = () => cuspedArchPath(colour, archX, archY, archW, archH, lobes);

    colour.save();
    // Recessed field for the carving
    traceArch();
    colour.fillStyle = 'rgba(0,0,0,0.24)';
    colour.fill();

    // Relief: a warm highlight offset up-left, a shadow offset down-right.
    // Together they read as a cut groove, not a printed line.
    colour.save();
    colour.translate(-2.5, -2.5);
    paintMoulding(colour, traceArch, 0.85, true);
    colour.restore();

    colour.save();
    colour.translate(2.5, 2.5);
    paintMoulding(colour, traceArch, 1, false);
    colour.restore();

    colour.restore();

    // Brass studs along the panel border
    const studs = 5;
    for (let i = 0; i < studs; i += 1) {
      const t = (i + 0.5) / studs;
      const sx = px + pw * t;
      for (const sy of [py + ph * 0.045, py + ph - ph * 0.045]) {
        const g = colour.createRadialGradient(sx - 2, sy - 2, 0, sx, sy, 7);
        g.addColorStop(0, 'rgba(232,214,160,0.75)');
        g.addColorStop(0.55, 'rgba(150,116,42,0.55)');
        g.addColorStop(1, 'rgba(0,0,0,0.5)');
        colour.fillStyle = g;
        colour.beginPath();
        colour.arc(sx, sy, 7, 0, Math.PI * 2);
        colour.fill();
      }
    }
  }

  /* --- Bump map: the relief, without colour ---------------------------- */
  const { canvas: bumpCanvas, ctx: bump } = makeCanvas(width, height);
  bump.fillStyle = '#6E6E6E';
  bump.fillRect(0, 0, width, height);

  for (const panel of panels) {
    const inset = width * 0.018;
    const px = panel.x + inset;
    const py = panel.y + inset;
    const pw = panel.w - inset * 2;
    const ph = panel.h - inset * 2;

    // Recessed field: darker (= pressed in)
    bump.fillStyle = '#4A4A4A';
    bump.fillRect(px, py, pw, ph);

    // Raised rail: lighter, with a lit top-left edge and a dark bottom-right
    bump.strokeStyle = '#C8C8C8';
    bump.lineWidth = 7;
    bump.strokeRect(px, py, pw, ph);
    bump.strokeStyle = '#2E2E2E';
    bump.lineWidth = 3;
    bump.strokeRect(px + 5, py + 5, pw - 10, ph - 10);

    const archW = pw * 0.56;
    const archH = ph * 0.58;
    const archX = px + (pw - archW) / 2;
    const archY = py + ph - archH - ph * 0.16;
    const lobes = panel.x % 7 === 0 ? 3 : 5;

    bump.save();
    cuspedArchPath(bump, archX, archY, archW, archH, lobes);
    bump.fillStyle = '#8A8A8A';
    bump.fill();
    bump.strokeStyle = '#D8D8D8';
    bump.lineWidth = 4;
    bump.stroke();
    bump.restore();
  }

  /* --- Roughness: polished rails, matte recesses ------------------------ */
  const { canvas: roughCanvas, ctx: rough } = makeCanvas(width / 2, height / 2);
  rough.fillStyle = '#B4B4B4';
  rough.fillRect(0, 0, width / 2, height / 2);
  for (const panel of panels) {
    rough.fillStyle = '#D2D2D2';
    rough.fillRect(panel.x / 2, panel.y / 2, panel.w / 2, panel.h / 2);
  }
  paintGrain(rough, width / 2, height / 2, rand, 0.4);

  const map = new THREE.CanvasTexture(colourCanvas);
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);

  for (const tex of [map, bumpMap, roughnessMap]) {
    tex.anisotropy = 4;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
  }
  map.colorSpace = THREE.SRGBColorSpace;
  bumpMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.colorSpace = THREE.NoColorSpace;

  return {
    map,
    bump: bumpMap,
    roughness: roughnessMap,
    dispose: () => {
      map.dispose();
      bumpMap.dispose();
      roughnessMap.dispose();
    },
  };
}

/* ---------------------------------------------------------------------------
   Sprites: dust motes and petals
   --------------------------------------------------------------------------- */

export function createMoteTexture(): THREE.CanvasTexture {
  const size = 64;
  const { canvas, ctx } = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,244,214,1)');
  g.addColorStop(0.28, 'rgba(255,238,198,0.55)');
  g.addColorStop(1, 'rgba(255,230,180,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** An asymmetric petal, so falling petals never look like snow. */
export function createPetalTexture(): THREE.CanvasTexture {
  const size = 64;
  const { canvas, ctx } = makeCanvas(size, size);
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-0.4);
  const g = ctx.createRadialGradient(0, -8, 2, 0, 0, 30);
  g.addColorStop(0, 'rgba(246,226,178,0.95)');
  g.addColorStop(0.6, 'rgba(212,166,74,0.55)');
  g.addColorStop(1, 'rgba(168,132,43,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A soft vertical shaft of light, for the volumetric beams behind the doors. */
export function createShaftTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 512;
  const { canvas, ctx } = makeCanvas(w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,232,178,0.55)');
  g.addColorStop(0.45, 'rgba(240,206,132,0.2)');
  g.addColorStop(1, 'rgba(200,164,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Feather the vertical edges so the beam has no hard sides.
  const side = ctx.createLinearGradient(0, 0, w, 0);
  side.addColorStop(0, 'rgba(0,0,0,1)');
  side.addColorStop(0.5, 'rgba(0,0,0,0)');
  side.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Carved stone for the door surround. */
export function createStoneTexture(): THREE.CanvasTexture {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size, size);
  const rand = seeded(770);
  ctx.fillStyle = '#1A1712';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1 + rand() * 7;
    ctx.fillStyle = `rgba(${140 + rand() * 60},${126 + rand() * 50},${104 + rand() * 40},${0.02 + rand() * 0.05})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  paintGrain(ctx, size, size, rand, 0.3);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}
