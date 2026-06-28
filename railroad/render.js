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
      const i = y * w + x;
      const cell = game.grid[i];
      ctx.drawImage(sprites.grass, x * tileSize, y * tileSize);
      ctx.drawImage(spriteForCell(cell, sprites), x * tileSize, y * tileSize);
      if (game.locked && game.locked.has(i)) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
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

export function drawCrash(ctx, layout, cell) {
  const { tileSize } = layout;
  const cx = cell.x * tileSize + tileSize / 2;
  const cy = cell.y * tileSize + tileSize / 2;
  ctx.font = `${Math.floor(tileSize * 0.9)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💥', cx, cy);
}
