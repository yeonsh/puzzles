export const N = 1, E = 2, S = 4, W = 8;
export const DIRS = [N, E, S, W];
export const DELTA = { [N]: [0, -1], [E]: [1, 0], [S]: [0, 1], [W]: [-1, 0] };
export const OPPOSITE = { [N]: S, [E]: W, [S]: N, [W]: E };

export const STRAIGHT = 'STRAIGHT';
export const CURVE = 'CURVE';
export const ENDPOINT = 'ENDPOINT';

export function rotateMask(mask, steps) {
  let m = mask & 0xf;
  const n = (((steps % 4) + 4) % 4);
  for (let i = 0; i < n; i++) m = ((m << 1) | (m >> 3)) & 0xf;
  return m;
}

export function baseMask(type) {
  if (type === STRAIGHT) return N | S;
  if (type === CURVE) return N | E;
  if (type === ENDPOINT) return N; // overridden by tile.mask via exitsOf
  throw new Error('unknown tile type: ' + type);
}

export function exitsOf(tile) {
  if (tile.type === ENDPOINT) return tile.mask & 0xf;
  return rotateMask(baseMask(tile.type), tile.orientation);
}

export function orientationCount(type) {
  if (type === STRAIGHT) return 2;
  if (type === CURVE) return 4;
  return 1;
}

export function connects(exitsA, exitsB, dir) {
  return (exitsA & dir) !== 0 && (exitsB & OPPOSITE[dir]) !== 0;
}

export function minRotationsTo(type, fromOrientation, targetMask) {
  const base = baseMask(type);
  let best = Infinity;
  for (let steps = 0; steps < 4; steps++) {
    const o = (fromOrientation + steps) % 4;
    if (rotateMask(base, o) === targetMask) best = Math.min(best, steps);
  }
  return best;
}

export function correctOrientation(type, targetMask) {
  const base = baseMask(type);
  for (let o = 0; o < 4; o++) if (rotateMask(base, o) === targetMask) return o;
  return -1;
}
