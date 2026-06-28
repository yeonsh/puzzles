import {
  DIRS, DELTA, exitsOf, connects, minRotationsTo,
} from './tiles.js';

export function createGame(board) {
  const grid = board.grid.map((c) => (c ? { ...c } : null));
  return { ...board, grid, movesUsed: 0, status: 'playing' };
}

export function rotateTile(game, x, y) {
  if (game.status !== 'playing') return false;
  const cell = game.grid[y * game.w + x];
  if (!cell || !cell.rotatable) return false;
  cell.orientation = (cell.orientation + 1) % 4;
  game.movesUsed++;
  return true;
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

export function pressGo(game) {
  if (game.status !== 'playing') return game.status;
  game.status = isSolved(game) ? 'won' : 'dead';
  return game.status;
}

export function isOutOfMoves(game) {
  return game.movesUsed >= game.moveLimit;
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
