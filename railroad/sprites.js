import { STRAIGHT, CURVE } from './shared/tiles.js';

const COLORS = {
  grass: '#3a5f3a', ballast: '#6b5b4b', tie: '#4a3528',
  rail: '#c9ccd1', loco: '#c0392b', locoTrim: '#f1c40f', station: '#f1c40f',
};

function makeCanvas(size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  return c;
}

function fillGrass(ctx, size) {
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, 0, size, size);
}

// Draw a straight track segment running vertically (N–S) centered on the tile.
function drawStraight(ctx, size) {
  const mid = size / 2, half = size * 0.18;
  ctx.fillStyle = COLORS.ballast;
  ctx.fillRect(mid - half * 1.6, 0, half * 3.2, size);
  ctx.fillStyle = COLORS.tie;
  for (let y = size * 0.1; y < size; y += size * 0.22) ctx.fillRect(mid - half * 1.6, y, half * 3.2, size * 0.08);
  ctx.fillStyle = COLORS.rail;
  ctx.fillRect(mid - half, 0, size * 0.06, size);
  ctx.fillRect(mid + half - size * 0.06, 0, size * 0.06, size);
}

// Draw a curve connecting N and E (top → right) centered on the tile.
function drawCurve(ctx, size) {
  const r = size * 0.5;
  ctx.strokeStyle = COLORS.ballast;
  ctx.lineWidth = size * 0.34;
  ctx.beginPath(); ctx.arc(size, 0, r, Math.PI * 0.5, Math.PI, false); ctx.stroke();
  ctx.strokeStyle = COLORS.rail;
  ctx.lineWidth = size * 0.05;
  for (const rr of [r - size * 0.12, r + size * 0.12]) {
    ctx.beginPath(); ctx.arc(size, 0, rr, Math.PI * 0.5, Math.PI, false); ctx.stroke();
  }
}

function rotations(size, drawFn) {
  const out = [];
  for (let o = 0; o < 4; o++) {
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    fillGrass(ctx, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((o * Math.PI) / 2);
    ctx.translate(-size / 2, -size / 2);
    drawFn(ctx, size);
    ctx.restore();
    out.push(c);
  }
  return out;
}

function drawEndpoint(ctx, size, color) {
  fillGrass(ctx, size);
  ctx.fillStyle = color;
  ctx.fillRect(size * 0.2, size * 0.2, size * 0.6, size * 0.6);
  ctx.fillStyle = '#222';
  ctx.fillRect(size * 0.3, size * 0.3, size * 0.4, size * 0.18);
}

function drawLocomotive(ctx, size) {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = COLORS.loco;
  ctx.fillRect(size * 0.2, size * 0.25, size * 0.6, size * 0.5);
  ctx.fillStyle = COLORS.locoTrim;
  ctx.fillRect(size * 0.2, size * 0.55, size * 0.6, size * 0.12);
  ctx.fillStyle = '#222';
  ctx.fillRect(size * 0.28, size * 0.7, size * 0.12, size * 0.12);
  ctx.fillRect(size * 0.6, size * 0.7, size * 0.12, size * 0.12);
}

export function buildSprites(tileSize) {
  const grass = makeCanvas(tileSize);
  fillGrass(grass.getContext('2d'), tileSize);

  const endpointStart = makeCanvas(tileSize);
  drawEndpoint(endpointStart.getContext('2d'), tileSize, COLORS.loco);
  const endpointEnd = makeCanvas(tileSize);
  drawEndpoint(endpointEnd.getContext('2d'), tileSize, COLORS.station);

  const locomotive = makeCanvas(tileSize);
  drawLocomotive(locomotive.getContext('2d'), tileSize);

  return {
    [STRAIGHT]: rotations(tileSize, drawStraight),
    [CURVE]: rotations(tileSize, drawCurve),
    endpointStart, endpointEnd, grass, locomotive,
  };
}
