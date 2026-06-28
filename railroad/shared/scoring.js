const SCORE_BASE = 2000; // points; decays with completion time
const STAR3_MS = 20000;  // <= 20s -> 3 stars
const STAR2_MS = 45000;  // <= 45s -> 2 stars

export function computeScore({ timeMs }) {
  return Math.max(0, SCORE_BASE - Math.floor(timeMs / 100));
}

export function starsFor({ timeMs }) {
  if (timeMs <= STAR3_MS) return 3;
  if (timeMs <= STAR2_MS) return 2;
  return 1;
}
