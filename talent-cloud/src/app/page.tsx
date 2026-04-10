"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// Types

interface CharSample {
  pts: { x: number; y: number }[];
}

interface SideCloud {
  ox: number;
  oy: number;
  s: number;
  sp: number;
}

interface Blade {
  x: number;
  baseY: number;
  h: number;
  w: number;
  phase: number;
  speed: number;
  lean: number;
  hue: number;
  sat: number;
  lit: number;
  layer: "deep" | "midB" | "midF" | "front";
  pxMul: number;
  curve: number;
}

interface Flower {
  x: number;
  y: number;
  size: number;
  color: string;
  stemH: number;
  phase: number;
  speed: number;
  petals: number;
  front: boolean;
  pxMul: number;
}

// Constants

const FONT_SIZE = 72;
const CHAR_RW = FONT_SIZE * 0.82;
const LETTER_GAP = FONT_SIZE * 0.14;
const WORD_GAP = FONT_SIZE * 0.35;

const PUFF_OFFSETS = [
  { dx: 0,   dy: 0,   rx: 50, ry: 29 },
  { dx: 40,  dy: -17, rx: 40, ry: 30 },
  { dx: -36, dy: -11, rx: 34, ry: 25 },
  { dx: 76,  dy: 3,   rx: 34, ry: 22 },
  { dx: -66, dy: 7,   rx: 30, ry: 20 },
  { dx: 20,  dy: 10,  rx: 44, ry: 18 },
];

const SIDE_CLOUDS: SideCloud[] = [
  { ox: 0.05, oy: 0.10, s: 1.05, sp: 0.008 },
  { ox: 0.88, oy: 0.08, s: 0.95, sp: 0.007 },
];

const FLOWER_COLORS = [
  "#f9c74f", "#ff9f1c", "#f7b2bd", "#ffcbf2",
  "#fff9a0", "#ff70a6", "#ffd6e0", "#c9f0c8",
];

const BLADE_ALPHA: Record<Blade["layer"], number> = {
  deep: 0.65, midB: 0.72, midF: 0.82, front: 0.90,
};

// Helpers

function sampleChar(ch: string, size: number): CharSample {
  const tc = document.createElement("canvas");
  tc.width = size * 1.4;
  tc.height = size * 1.4;
  const tx = tc.getContext("2d")!;
  tx.fillStyle = "#000";
  tx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
  tx.textAlign = "center";
  tx.textBaseline = "middle";
  tx.fillText(ch, size * 0.7, size * 0.7);
  const d = tx.getImageData(0, 0, tc.width, tc.height).data;
  const pts: { x: number; y: number }[] = [];
  const step = 4;
  for (let y = 0; y < tc.height; y += step)
    for (let x = 0; x < tc.width; x += step)
      if (d[(y * tc.width + x) * 4 + 3] > 100)
        pts.push({ x: x / tc.width, y: y / tc.height });
  return { pts };
}

function makeBlade(layer: Blade["layer"]): Blade {
  const cfg = {
    deep:  { yMin:0.73,yMax:0.80,hMin:0.055,hMax:0.09, wMin:0.8,wMax:1.8, hueMin:95, hueMax:118,satMin:42,satMax:58,litMin:14,litMax:22,pxMul:-8  },
    midB:  { yMin:0.74,yMax:0.82,hMin:0.07, hMax:0.11, wMin:1.0,wMax:2.5, hueMin:100,hueMax:125,satMin:50,satMax:65,litMin:18,litMax:28,pxMul:-11 },
    midF:  { yMin:0.78,yMax:0.86,hMin:0.09, hMax:0.135,wMin:1.3,wMax:3.2, hueMin:105,hueMax:130,satMin:55,satMax:72,litMin:22,litMax:34,pxMul:-16 },
    front: { yMin:0.82,yMax:0.90,hMin:0.10, hMax:0.155,wMin:1.6,wMax:4.0, hueMin:108,hueMax:135,satMin:58,satMax:78,litMin:26,litMax:40,pxMul:-22 },
  }[layer];
  const r = Math.random;
  return {
    x: r(), baseY: cfg.yMin + r() * (cfg.yMax - cfg.yMin),
    h: cfg.hMin + r() * (cfg.hMax - cfg.hMin),
    w: cfg.wMin + r() * (cfg.wMax - cfg.wMin),
    phase: r() * Math.PI * 2, speed: 0.28 + r() * 1.1,
    lean: (r() - 0.5) * 0.55,
    hue: cfg.hueMin + r() * (cfg.hueMax - cfg.hueMin),
    sat: cfg.satMin + r() * (cfg.satMax - cfg.satMin),
    lit: cfg.litMin + r() * (cfg.litMax - cfg.litMin),
    layer, pxMul: cfg.pxMul, curve: (r() - 0.5) * 0.25,
  };
}

function makeFlower(index: number): Flower {
  const front = index > 16;
  return {
    x: Math.random(),
    y: (front ? 0.80 : 0.74) + Math.random() * 0.08,
    size: front ? 5 + Math.random() * 10 : 3 + Math.random() * 6,
    color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
    stemH: front ? 20 + Math.random() * 38 : 12 + Math.random() * 22,
    phase: Math.random() * Math.PI * 2,
    speed: 0.2 + Math.random() * 0.7,
    petals: 5 + Math.floor(Math.random() * 3),
    front, pxMul: front ? -20 : -12,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Draw functions

function drawSideCloud(
  ctx: CanvasRenderingContext2D,
  c: SideCloud, W: number, H: number,
  pX: number, pY: number, t: number
) {
  const cx = c.ox * W + pX * -30 + Math.sin(t * c.sp + c.ox * 8) * 8;
  const cy = c.oy * H + pY * -10 + Math.cos(t * c.sp * 1.1 + c.oy * 6) * 4;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(c.s, c.s);
  PUFF_OFFSETS.forEach((p) => {
    const g = ctx.createRadialGradient(
      p.dx - p.rx * 0.18, p.dy - p.ry * 0.22, p.rx * 0.08,
      p.dx, p.dy, Math.max(p.rx, p.ry)
    );
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.55, "rgba(238,248,255,0.96)");
    g.addColorStop(1, "rgba(190,220,242,0.4)");
    ctx.beginPath();
    ctx.ellipse(p.dx, p.dy, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  });
  ctx.restore();
}

function drawCloudChar(
  ctx: CanvasRenderingContext2D,
  charData: CharSample,
  screenX: number, screenY: number,
  charW: number, charH: number,
  t: number, idx: number,
  pX: number, pY: number
) {
  charData.pts.forEach((p, i) => {
    const px = screenX + p.x * charW + pX * -14 + Math.sin(t * 0.55 + (i + idx * 200) * 0.07) * 1.0;
    const py = screenY + p.y * charH + pY * -7  + Math.cos(t * 0.45 + (i + idx * 200) * 0.09) * 0.8;
    const r = 8 + Math.sin((i + idx * 37) * 2.1) * 2;
    const g = ctx.createRadialGradient(px - r * 0.22, py - r * 0.28, r * 0.04, px, py, r);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(250,254,255,0.98)");
    g.addColorStop(0.75, "rgba(218,238,252,0.55)");
    g.addColorStop(1, "rgba(190,220,248,0)");
    ctx.beginPath();
    ctx.arc(px, py, r * 1.35, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  });
}

function drawBlade(
  ctx: CanvasRenderingContext2D,
  b: Blade, W: number, H: number,
  pX: number, t: number
) {
  const x = b.x * W + pX * b.pxMul;
  const by = b.baseY * H;
  const h = b.h * H;
  const wind = Math.sin(t * 0.55) * 0.35;
  const sway = (Math.sin(t * b.speed + b.phase + pX * 0.04) + wind) * 7 + b.lean * 11;
  ctx.save();
  ctx.translate(x, by);
  ctx.beginPath();
  ctx.moveTo(-b.w, 0);
  ctx.bezierCurveTo(sway * 0.45, -h * 0.38, sway * 0.85 + b.curve * h * 0.2, -h * 0.65, sway * 1.05, -h);
  ctx.bezierCurveTo(sway * 0.75, -h * 0.6, sway * 0.35, -h * 0.3, b.w, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, sway * 0.5, -h);
  g.addColorStop(0,    `hsl(${b.hue},${b.sat}%,${b.lit}%)`);
  g.addColorStop(0.45, `hsl(${b.hue+9},${b.sat+10}%,${b.lit+13}%)`);
  g.addColorStop(0.78, `hsl(${b.hue+16},${b.sat+6}%,${b.lit+20}%)`);
  g.addColorStop(1,    `hsl(${b.hue+20},${b.sat+4}%,${b.lit+26}%)`);
  ctx.fillStyle = g;
  ctx.globalAlpha = BLADE_ALPHA[b.layer];
  ctx.fill();
  ctx.restore();
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  f: Flower, W: number,
  pX: number, t: number
) {
  const px = f.x * W + pX * f.pxMul;
  const py = f.y * (ctx.canvas.height);
  const sway = Math.sin(t * f.speed + f.phase) * 5;
  ctx.save();
  ctx.translate(px, py);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(sway * 0.4, -f.stemH * 0.55, sway, -f.stemH);
  ctx.strokeStyle = "#2a6a12";
  ctx.lineWidth = f.front ? 2 : 1.4;
  ctx.stroke();
  ctx.save();
  ctx.translate(sway * 0.5, -f.stemH * 0.42);
  ctx.beginPath();
  ctx.ellipse(f.size * 0.85, 0, f.size * 0.75, f.size * 0.32, -0.35, 0, Math.PI * 2);
  ctx.fillStyle = "#357510";
  ctx.globalAlpha = 0.65;
  ctx.fill();
  ctx.restore();
  ctx.translate(sway, -f.stemH);
  for (let p = 0; p < f.petals; p++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 / f.petals) * p + t * 0.12 * f.speed);
    ctx.beginPath();
    ctx.ellipse(f.size * 0.85, 0, f.size * 0.6, f.size * 0.34, 0, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, f.size * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = "#ffe03a";
  ctx.globalAlpha = 1;
  ctx.fill();
  ctx.restore();
}

function drawGrass(
  ctx: CanvasRenderingContext2D,
  blades: Blade[], flowers: Flower[],
  W: number, H: number,
  pX: number, t: number
) {
  const gTop = H * 0.73;

  // Soil shadow
  const soil = ctx.createLinearGradient(0, gTop - 18, 0, gTop + 28);
  soil.addColorStop(0, "rgba(50,30,8,0)");
  soil.addColorStop(0.55, "rgba(45,28,6,0.55)");
  soil.addColorStop(1, "rgba(30,18,4,0.88)");
  ctx.fillStyle = soil;
  ctx.fillRect(0, gTop - 18, W, 50);

  // Base fill
  const base = ctx.createLinearGradient(0, gTop, 0, H);
  base.addColorStop(0, "#387518"); base.addColorStop(0.2, "#2d6412");
  base.addColorStop(0.55, "#225010"); base.addColorStop(1, "#143208");
  ctx.fillStyle = base;
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, gTop + 8);
  for (let xi = 0; xi <= W; xi += 5) {
    const w = Math.sin(xi * 0.02 + t * 0.9) * 7 + Math.sin(xi * 0.047 + t * 1.2 + 1) * 3;
    ctx.lineTo(xi, gTop + w);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

  blades.filter(b => b.layer === "deep").forEach(b => drawBlade(ctx, b, W, H, pX, t));
  blades.filter(b => b.layer === "midB").forEach(b => drawBlade(ctx, b, W, H, pX, t));
  flowers.filter(f => !f.front).forEach(f => drawFlower(ctx, f, W, pX, t));

  // Mid sheen
  const sheen1 = ctx.createLinearGradient(0, gTop, 0, gTop + 80);
  sheen1.addColorStop(0, "rgba(100,190,45,0.2)"); sheen1.addColorStop(1, "rgba(60,140,20,0)");
  ctx.fillStyle = sheen1;
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, gTop + 8);
  for (let xi = 0; xi <= W; xi += 5) {
    const w = Math.sin(xi * 0.02 + t * 0.9) * 7 + Math.sin(xi * 0.047 + t * 1.2 + 1) * 3;
    ctx.lineTo(xi, gTop + w);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

  // Mid ridge
  const midG = ctx.createLinearGradient(0, H * 0.79, 0, H * 0.89);
  midG.addColorStop(0, "#59b832"); midG.addColorStop(0.4, "#48a420"); midG.addColorStop(1, "#2e7a10");
  ctx.fillStyle = midG;
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * 0.815);
  for (let xi = 0; xi <= W; xi += 6) {
    const w = Math.sin(xi * 0.025 + t * 1.05) * 5.5 + Math.sin(xi * 0.053 + t * 0.68 + 2) * 2.5;
    ctx.lineTo(xi, H * 0.803 + w);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

  blades.filter(b => b.layer === "midF").forEach(b => drawBlade(ctx, b, W, H, pX, t));

  // Front ridge
  const fgG = ctx.createLinearGradient(0, H * 0.865, 0, H * 0.93);
  fgG.addColorStop(0, "#6ed03e"); fgG.addColorStop(0.4, "#58bc28"); fgG.addColorStop(1, "#389015");
  ctx.fillStyle = fgG;
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * 0.888);
  for (let xi = 0; xi <= W; xi += 7) {
    const w = Math.sin(xi * 0.03 + t * 1.25 + pX * 0.05) * 4.5 + Math.sin(xi * 0.063 + t * 0.78) * 2;
    ctx.lineTo(xi, H * 0.877 + w);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

  blades.filter(b => b.layer === "front").forEach(b => drawBlade(ctx, b, W, H, pX, t));
  flowers.filter(f => f.front).forEach(f => drawFlower(ctx, f, W, pX, t));

  // Front sheen
  const fgS = ctx.createLinearGradient(0, H * 0.877, 0, H * 0.92);
  fgS.addColorStop(0, "rgba(165,248,110,0.2)"); fgS.addColorStop(1, "rgba(90,190,40,0)");
  ctx.fillStyle = fgS;
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * 0.888);
  for (let xi = 0; xi <= W; xi += 7) {
    const w = Math.sin(xi * 0.03 + t * 1.25 + pX * 0.05) * 4.5 + Math.sin(xi * 0.063 + t * 0.78) * 2;
    ctx.lineTo(xi, H * 0.877 + w);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

  // Shadow dabs
  ctx.globalAlpha = 1;
  for (let i = 0; i < 30; i++) {
    const sx = (i / 30) * W + Math.sin(t * 0.25 + i * 1.3) * 14;
    const sy = H * 0.76 + Math.sin(i * 1.9 + t * 0.2) * H * 0.045;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 18 + (i % 6) * 5);
    sg.addColorStop(0, "rgba(8,32,4,0.22)"); sg.addColorStop(1, "rgba(8,32,4,0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 24 + (i % 5) * 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Component

export default function LandingPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Mutable state via refs (avoids re-renders in rAF loop)
  const stateRef = useRef({
    mx: 0, my: 0, tx: 0, ty: 0,
    W: 0, H: 0,
    word1: [] as CharSample[],
    word2: [] as CharSample[],
    word3: [] as CharSample[],
    blades: [] as Blade[],
    flowers: [] as Flower[],
  });

  const handleBtn = useCallback((type: "brand" | "model" | "creator") => {
    const routes = {
      brand: "/onboarding/brand",
      model: "/onboarding/model",
      creator: "/onboarding/creator",
    } as const;
    const msgs = {
      brand: "Welcome, Brand - find your perfect KOLs ->",
      model: "Welcome, Model - build your credential profile ->",
      creator: "Welcome, Creator - find gigs with Job Sniper ->",
    };
    if (toastRef.current) {
      toastRef.current.textContent = msgs[type];
      toastRef.current.classList.add("show");
    }
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      toastRef.current?.classList.remove("show");
    }, 3000);
    router.push(routes[type]);
  }, [router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    if (!canvas || !scene) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    // Resize
    function resize() {
      s.W = canvas.width = scene.offsetWidth;
      s.H = canvas.height = scene.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Build character samples (runs once after mount)
    s.word1 = "WHO".split("").map(c => sampleChar(c, FONT_SIZE));
    s.word2 = "ARE".split("").map(c => sampleChar(c, FONT_SIZE));
    s.word3 = "YOU?".split("").map(c => sampleChar(c, FONT_SIZE));

    // Build blades & flowers
    (["deep", "midB", "midF", "front"] as Blade["layer"][]).forEach(layer => {
      for (let i = 0; i < 160; i++) s.blades.push(makeBlade(layer));
    });
    for (let i = 0; i < 28; i++) s.flowers.push(makeFlower(i));

    // Mouse
    function onMouseMove(e: MouseEvent) {
      const r = scene.getBoundingClientRect();
      s.mx = e.clientX - r.left;
      s.my = e.clientY - r.top;
    }
    function onMouseEnter() { if (cursorRef.current) cursorRef.current.style.display = "block"; }
    function onMouseLeave() { if (cursorRef.current) cursorRef.current.style.display = "none"; }
    scene.addEventListener("mousemove", onMouseMove);
    scene.addEventListener("mouseenter", onMouseEnter);
    scene.addEventListener("mouseleave", onMouseLeave);

    // Animation loop
    function draw(ts: number) {
      const t = ts * 0.001;
      const { W, H, word1, word2, word3, blades, flowers } = s;

      s.tx = lerp(s.tx, s.mx, 0.05);
      s.ty = lerp(s.ty, s.my, 0.05);
      const pX = (s.tx / (W || 1) - 0.5) * 2;
      const pY = (s.ty / (H || 1) - 0.5) * 2;

      ctx.clearRect(0, 0, W, H);

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.76);
      sky.addColorStop(0, "#2a8dc6"); sky.addColorStop(0.38, "#52acde");
      sky.addColorStop(0.75, "#8acbf3"); sky.addColorStop(1, "#b5e2f7");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // Sun glow
      const sg = ctx.createRadialGradient(W * 0.78, H * 0.07, 0, W * 0.78, H * 0.07, H * 0.35);
      sg.addColorStop(0, "rgba(255,248,195,0.28)"); sg.addColorStop(1, "rgba(255,215,70,0)");
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);

      // Side clouds
      SIDE_CLOUDS.forEach(c => drawSideCloud(ctx, c, W, H, pX, pY, t));

      // Cloud text row 1: WHO ARE
      const rowY1 = H * 0.04;
      const whoW = word1.length * CHAR_RW + (word1.length - 1) * LETTER_GAP;
      const areW = word2.length * CHAR_RW + (word2.length - 1) * LETTER_GAP;
      const row1TotalW = whoW + WORD_GAP + areW;
      let cx = W / 2 - row1TotalW / 2 + pX * -16;
      word1.forEach((cd, i) => {
        drawCloudChar(ctx, cd, cx, rowY1, CHAR_RW, FONT_SIZE * 1.05, t, i, pX, pY);
        cx += CHAR_RW + LETTER_GAP;
      });
      cx += WORD_GAP;
      word2.forEach((cd, i) => {
        drawCloudChar(ctx, cd, cx, rowY1, CHAR_RW, FONT_SIZE * 1.05, t, word1.length + i, pX, pY);
        cx += CHAR_RW + LETTER_GAP;
      });

      // Cloud text row 2: YOU?
      const rowY2 = H * 0.25;
      const youW = word3.length * CHAR_RW + (word3.length - 1) * LETTER_GAP;
      let cx2 = W / 2 - youW / 2 + pX * -16;
      word3.forEach((cd, i) => {
        drawCloudChar(ctx, cd, cx2, rowY2, CHAR_RW, FONT_SIZE * 1.05, t, word1.length + word2.length + i, pX, pY);
        cx2 += CHAR_RW + LETTER_GAP;
      });

      // Grass
      drawGrass(ctx, blades, flowers, W, H, pX, t);

      // Parallax buttons
      if (buttonsRef.current) {
        buttonsRef.current.style.transform =
          `translateX(calc(-50% + ${pX * -9}px)) translateY(${pY * -5}px)`;
      }

      // Cursor
      if (cursorRef.current) {
        cursorRef.current.style.left = `${s.mx}px`;
        cursorRef.current.style.top = `${s.my}px`;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      scene.removeEventListener("mousemove", onMouseMove);
      scene.removeEventListener("mouseenter", onMouseEnter);
      scene.removeEventListener("mouseleave", onMouseLeave);
      clearTimeout(toastTimerRef.current);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      style={{ position: "relative", width: "100%", height: "560px", overflow: "hidden", cursor: "none" }}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />

      {/* Logo */}
      <div style={{ position: "absolute", top: 16, left: 18, zIndex: 30, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, background: "#38a829", borderRadius: 5 }} />
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.3, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
          Boxin Global
          <span style={{ display: "block", fontWeight: 400, fontSize: 10, opacity: 0.85 }}>KOL Order Book</span>
        </div>
      </div>

      {/* Buttons */}
      <div
        ref={buttonsRef}
        style={{ position: "absolute", top: "44%", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 11, zIndex: 20, alignItems: "center" }}
      >
        {(["brand", "model", "creator"] as const).map((type) => (
          <button
            key={type}
            onClick={() => handleBtn(type)}
            style={{
              padding: "11px 46px", background: "#38a829", color: "#fff",
              fontFamily: "'Courier New', monospace", fontSize: 14, fontWeight: 700,
              letterSpacing: "0.08em", border: "none", borderRadius: 50, cursor: "pointer",
              boxShadow: "0 4px 0 #1a6610, 0 6px 18px rgba(0,0,0,0.22)",
              textTransform: "uppercase", minWidth: 180,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#46cc33";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#38a829";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            {type === "brand" ? "A Brand" : type === "model" ? "A Model" : "A Creator"}
          </button>
        ))}
      </div>

      {/* Custom cursor */}
      <div
        ref={cursorRef}
        style={{ position: "absolute", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.9)", borderRadius: "50%", background: "rgba(255,255,255,0.2)", pointerEvents: "none", zIndex: 100, transform: "translate(-50%,-50%)", display: "none" }}
      />

      {/* Toast */}
      <div
        ref={toastRef}
        className="toast"
        style={{ position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%) translateY(60px)", background: "rgba(10,10,10,0.82)", color: "#fff", padding: "9px 22px", borderRadius: 50, fontFamily: "'Courier New', monospace", fontSize: 12, zIndex: 50, transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)", whiteSpace: "nowrap" }}
      />

      {/* Toast show state via global style */}
      <style>{`
        .toast.show { transform: translateX(-50%) translateY(0) !important; }
      `}</style>
    </div>
  );
}


