import { randInt, shuffle } from './rng.js';
import {
  N, E, S, W,
  DIRS, DELTA, OPPOSITE,
  STRAIGHT, CURVE, ENDPOINT,
  minRotationsTo,
} from './tiles.js';
import { seedForDate } from './daily.js';
import { makeRng } from './rng.js';

export const DIFFICULTIES = {
  easy: { w: 5, h: 5, minPathLen: 7, decoys: 3 },
  medium: { w: 6, h: 6, minPathLen: 11, decoys: 5 },
  hard: { w: 8, h: 8, minPathLen: 18, decoys: 8 },
};

function inBounds(x, y, w, h) {
  return x >= 0 && y >= 0 && x < w && y < h;
}

function neighbors(cell, w, h) {
  const out = [];
  for (const dir of DIRS) {
    const [dx, dy] = DELTA[dir];
    const nx = cell.x + dx, ny = cell.y + dy;
    if (inBounds(nx, ny, w, h)) out.push({ x: nx, y: ny });
  }
  return out;
}

function dirBetween(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (dx === 1 && dy === 0) return E;
  if (dx === -1 && dy === 0) return W;
  if (dx === 0 && dy === 1) return S;
  if (dx === 0 && dy === -1) return N;
  throw new Error('cells not adjacent');
}

function buildPath(w, h, minLen, rng) {
  const start = { x: 0, y: randInt(rng, h) };
  const key = (p) => p.y * w + p.x;
  const visited = new Set([key(start)]);
  const path = [start];
  while (true) {
    const cur = path[path.length - 1];
    const options = shuffle(neighbors(cur, w, h), rng).filter((p) => !visited.has(key(p)));
    if (options.length === 0) break;
    const next = options[0];
    visited.add(key(next));
    path.push(next);
    if (path.length > minLen && rng() < 0.15) break;
  }
  return path;
}

export function generateBoard(cfg, rng) {
  const { w, h, minPathLen, decoys } = cfg;

  let path = null;
  for (let attempt = 0; attempt < 200; attempt++) {
    const p = buildPath(w, h, minPathLen, rng);
    if (p.length >= minPathLen) { path = p; break; }
  }
  if (!path) path = buildPath(w, h, 2, rng);

  const grid = new Array(w * h).fill(null);
  const idx = (x, y) => y * w + x;
  let par = 0;

  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    if (i === 0 || i === path.length - 1) {
      const neighbor = i === 0 ? path[1] : path[path.length - 2];
      grid[idx(cell.x, cell.y)] = {
        type: ENDPOINT, orientation: 0,
        mask: dirBetween(cell, neighbor),
        rotatable: false, role: i === 0 ? 'start' : 'end',
      };
    } else {
      const toPrev = dirBetween(cell, path[i - 1]);
      const toNext = dirBetween(cell, path[i + 1]);
      const correctMask = toPrev | toNext;
      const type = OPPOSITE[toPrev] === toNext ? STRAIGHT : CURVE;
      const orientation = randInt(rng, 4);
      grid[idx(cell.x, cell.y)] = { type, orientation, correctMask, rotatable: true };
      par += minRotationsTo(type, orientation, correctMask);
    }
  }

  const empties = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!grid[idx(x, y)]) empties.push({ x, y });
  shuffle(empties, rng);
  for (let i = 0; i < Math.min(decoys, empties.length); i++) {
    const c = empties[i];
    grid[idx(c.x, c.y)] = {
      type: rng() < 0.5 ? STRAIGHT : CURVE,
      orientation: randInt(rng, 4), rotatable: true, decoy: true,
    };
  }

  const moveLimit = par + Math.ceil(par * 0.5) + 2;
  const timeLimitMs = (60 + w * h * 2) * 1000;

  return {
    w, h, grid,
    start: path[0], end: path[path.length - 1], path,
    par, moveLimit, timeLimitMs,
  };
}

function difficultySalt(difficulty) {
  let h = 0;
  for (let i = 0; i < difficulty.length; i++) h = (h * 31 + difficulty.charCodeAt(i)) | 0;
  return h >>> 0;
}

export function generateDailyBoard(dateStr, difficulty = 'medium') {
  const cfg = DIFFICULTIES[difficulty];
  const rng = makeRng((seedForDate(dateStr) ^ difficultySalt(difficulty)) >>> 0);
  return generateBoard(cfg, rng);
}
