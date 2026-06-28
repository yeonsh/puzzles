import {
  DIRS, DELTA, OPPOSITE, exitsOf, connects, minRotationsTo,
} from './tiles.js';

export function createGame(board) {
  const grid = board.grid.map((c) => (c ? { ...c } : null));
  return { ...board, grid, movesUsed: 0, phase: 'prep', train: null, locked: new Set() };
}

export function rotateTile(game, x, y) {
  if (game.phase !== 'prep' && game.phase !== 'running') return false;
  if (game.locked.has(y * game.w + x)) return false;
  const cell = game.grid[y * game.w + x];
  if (!cell || !cell.rotatable) return false;
  cell.orientation = (cell.orientation + 1) % 4;
  game.movesUsed++;
  return true;
}

export function isLocked(game, x, y) {
  return game.locked.has(y * game.w + x);
}

export function departTrain(game) {
  if (game.phase !== 'prep') return;
  game.phase = 'running';
  game.train = { x: game.start.x, y: game.start.y, entryDir: 0 };
  game.locked.add(game.start.y * game.w + game.start.x);
}

function onwardDir(cell, entryDir) {
  const exits = exitsOf(cell);
  for (const dir of DIRS) if ((exits & dir) && dir !== entryDir) return dir;
  return 0;
}

export function nextCell(game) {
  const { train, grid, w, h } = game;
  const cell = grid[train.y * w + train.x];
  const dir = onwardDir(cell, train.entryDir);
  if (!dir) return null;
  const [dx, dy] = DELTA[dir];
  const nx = train.x + dx, ny = train.y + dy;
  if (nx < 0 || ny < 0 || nx >= w || ny >= h) return null;
  return { x: nx, y: ny, dir };
}

export function advanceTrain(game) {
  if (game.phase !== 'running') return game.phase;
  const next = nextCell(game);
  if (!next) { game.phase = 'dead'; return 'crashed'; }
  if (game.locked.has(next.y * game.w + next.x)) { game.phase = 'dead'; return 'crashed'; } // loop: never re-enter a traveled cell
  const cell = game.grid[game.train.y * game.w + game.train.x];
  const ncell = game.grid[next.y * game.w + next.x];
  if (!ncell || !connects(exitsOf(cell), exitsOf(ncell), next.dir)) {
    game.phase = 'dead';
    return 'crashed';
  }
  game.train = { x: next.x, y: next.y, entryDir: OPPOSITE[next.dir] };
  game.locked.add(next.y * game.w + next.x);
  if (next.x === game.end.x && next.y === game.end.y) { game.phase = 'won'; return 'won'; }
  return 'moved';
}

export function isSolved(game) {
  const { grid, w, h, start, end } = game;
  const idx = (x, y) => y * w + x;
  const startCell = grid[idx(start.x, start.y)];
  if (!startCell) return false;
  const seen = new Set([idx(start.x, start.y)]);
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop();
    const ex = exitsOf(grid[idx(cur.x, cur.y)]);
    for (const dir of DIRS) {
      if (!(ex & dir)) continue;
      const [dx, dy] = DELTA[dir];
      const nx = cur.x + dx, ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ncell = grid[idx(nx, ny)];
      if (!ncell) continue;
      if (!connects(ex, exitsOf(ncell), dir)) continue;
      if (nx === end.x && ny === end.y) return true;
      const k = idx(nx, ny);
      if (!seen.has(k)) { seen.add(k); stack.push({ x: nx, y: ny }); }
    }
  }
  return false;
}

export function simulate(board, moves) {
  const game = createGame(board);
  for (const m of moves) rotateTile(game, m.x, m.y);
  return { solved: isSolved(game), movesUsed: game.movesUsed };
}

export function solutionMoves(board) {
  const moves = [];
  for (let y = 0; y < board.h; y++) {
    for (let x = 0; x < board.w; x++) {
      const c = board.grid[y * board.w + x];
      if (c && c.correctMask != null) {
        const r = minRotationsTo(c.type, c.orientation, c.correctMask);
        for (let k = 0; k < r; k++) moves.push({ x, y });
      }
    }
  }
  return moves;
}
