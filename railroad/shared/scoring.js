const W_MOVE = 100; // points per unused rotation
const W_TIME = 1;   // points per unused second

export function computeScore({ movesUsed, timeMs, moveLimit, timeLimitMs }) {
  const movesLeft = Math.max(0, moveLimit - movesUsed);
  const secondsLeft = Math.max(0, Math.floor((timeLimitMs - timeMs) / 1000));
  return movesLeft * W_MOVE + secondsLeft * W_TIME;
}

export function starsFor({ movesUsed, par, timeMs, timeLimitMs }) {
  if (movesUsed === par && timeMs <= timeLimitMs * 0.5) return 3;
  if (movesUsed <= Math.ceil(par * 1.5)) return 2;
  return 1;
}
