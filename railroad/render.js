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

export function animateTrain(ctx, game, sprites, layout, onDone) {
  const { tileSize } = layout;
  const path = game.path;
  const durationPerCell = 180;
  const startTime = performance.now();
  function frame(now) {
    const elapsed = now - startTime;
    const seg = Math.min(path.length - 1, elapsed / durationPerCell);
    const i = Math.floor(seg);
    const t = seg - i;
    const a = path[i];
    const b = path[Math.min(path.length - 1, i + 1)];
    const px = (a.x + (b.x - a.x) * t) * tileSize;
    const py = (a.y + (b.y - a.y) * t) * tileSize;
    drawBoard(ctx, game, sprites, layout);
    ctx.drawImage(sprites.locomotive, px, py);
    if (seg >= path.length - 1) { onDone && onDone(); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
