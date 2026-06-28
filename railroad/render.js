import { STRAIGHT, CURVE, ENDPOINT } from './shared/tiles.js';

export function cellAtPixel(px, py, layout) {
  const { tileSize, w, h } = layout;
  if (px < 0 || py < 0) return null;
  const x = Math.floor(px / tileSize);
  const y = Math.floor(py / tileSize);
  if (x < 0 || y < 0 || x >= w || y >= h) return null;
  return { x, y };
}

function spriteForCell(cell, sprites) {
  if (!cell) return sprites.grass;
  if (cell.type === ENDPOINT) return cell.role === 'start' ? sprites.endpointStart : sprites.endpointEnd;
  if (cell.type === STRAIGHT) return sprites[STRAIGHT][cell.orientation];
  if (cell.type === CURVE) return sprites[CURVE][cell.orientation];
  return sprites.grass;
}

export function drawBoard(ctx, game, sprites, layout) {
  const { tileSize, w, h } = layout;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cell = game.grid[y * w + x];
      ctx.drawImage(sprites.grass, x * tileSize, y * tileSize);
      const sprite = spriteForCell(cell, sprites);
      ctx.drawImage(sprite, x * tileSize, y * tileSize);
    }
  }
}

// Interpolated train position (in cell units) along `path` at a given elapsed
// time. `seg` is clamped to [0, last]: the rAF timestamp on the first frame can
// be slightly less than the captured start time, making elapsed negative — left
// unclamped that yields i = -1 and path[-1] === undefined, which crashes the
// animation loop. Returns `done` once the train reaches the final cell.
export function trainPositionAt(path, elapsedMs, durationPerCell) {
  const last = path.length - 1;
  const seg = Math.max(0, Math.min(last, elapsedMs / durationPerCell));
  const i = Math.floor(seg);
  const t = seg - i;
  const a = path[i];
  const b = path[Math.min(last, i + 1)];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, done: seg >= last };
}

export function animateTrain(ctx, game, sprites, layout, onDone) {
  const { tileSize } = layout;
  const path = game.path;
  const durationPerCell = 180;
  const startTime = performance.now();
  function frame(now) {
    const pos = trainPositionAt(path, now - startTime, durationPerCell);
    drawBoard(ctx, game, sprites, layout);
    ctx.drawImage(sprites.locomotive, pos.x * tileSize, pos.y * tileSize);
    if (pos.done) { onDone && onDone(); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
