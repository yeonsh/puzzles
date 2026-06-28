import { generateDailyBoard } from './shared/generator.js';
import { kstDateString } from './shared/daily.js';
import { createGame, rotateTile, departTrain, nextCell, advanceTrain } from './shared/engine.js';
import { computeScore, starsFor } from './shared/scoring.js';
import { buildSprites } from './sprites.js';
import { drawBoard, drawCrash, cellAtPixel } from './render.js';
import { hasSubmitted, markSubmitted, getNickname, setNickname } from './storage.js';
import { renderLeaderboard, submitScore } from './leaderboard.js';

const TILE = 48;
const STEP_MS = 600; // ms per cell of train travel
const today = kstDateString(Date.now());
const board = generateDailyBoard(today);
const layout = { tileSize: TILE, w: board.w, h: board.h };
const sprites = buildSprites(TILE);

const canvas = document.getElementById('board');
canvas.width = board.w * TILE;
canvas.height = board.h * TILE;
const ctx = canvas.getContext('2d');

let game, startTime, timerId;
const el = (id) => document.getElementById(id);
el('date').textContent = today;

function remainingMs() {
  return Math.max(0, board.timeLimitMs - (Date.now() - startTime));
}

function updateHud() {
  el('moves').textContent = game.phase === 'running' ? 'RUNNING' : 'PREP';
  el('timer').textContent = `Time: ${(remainingMs() / 1000).toFixed(1)}s`;
}

function startAttempt() {
  game = createGame(board);
  startTime = Date.now();
  el('retry').hidden = true;
  el('go').disabled = false;
  el('result').hidden = true;
  updateHud();
  drawBoard(ctx, game, sprites, layout);
  clearInterval(timerId);
  timerId = setInterval(tick, 100);
}

function tick() {
  updateHud();
  if (game.phase === 'prep' && remainingMs() <= 0) depart();
}

canvas.addEventListener('click', (e) => {
  if (game.phase !== 'prep' && game.phase !== 'running') return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const cell = cellAtPixel(px, py, layout);
  if (!cell) return;
  if (rotateTile(game, cell.x, cell.y)) drawBoard(ctx, game, sprites, layout);
});

el('go').addEventListener('click', () => { if (game.phase === 'prep') depart(); });
el('retry').addEventListener('click', startAttempt);

function depart() {
  if (game.phase !== 'prep') return;
  el('go').disabled = true;
  departTrain(game);
  updateHud();
  runSegment();
}

// Animate the locomotive from its current cell toward the onward neighbor over
// STEP_MS, then resolve the step with advanceTrain (so a tile rotated at the last
// moment still counts). The board is redrawn every frame to reflect live rotations.
function runSegment() {
  const target = nextCell(game);
  if (!target) { advanceTrain(game); finishCrash({ x: game.train.x, y: game.train.y }); return; }
  const from = { x: game.train.x, y: game.train.y };
  const segStart = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - segStart) / STEP_MS);
    drawBoard(ctx, game, sprites, layout);
    const px = (from.x + (target.x - from.x) * t) * TILE;
    const py = (from.y + (target.y - from.y) * t) * TILE;
    ctx.drawImage(sprites.locomotive, px, py);
    if (t < 1) { requestAnimationFrame(frame); return; }
    const result = advanceTrain(game);
    if (result === 'moved') runSegment();
    else if (result === 'won') finishWin();
    else finishCrash(target);
  }
  requestAnimationFrame(frame);
}

function finishWin() {
  clearInterval(timerId);
  drawBoard(ctx, game, sprites, layout);
  ctx.drawImage(sprites.locomotive, game.end.x * TILE, game.end.y * TILE);
  const timeMs = Date.now() - startTime;
  const score = computeScore({ timeMs });
  const stars = starsFor({ timeMs });
  el('result').hidden = false;
  el('result').textContent = `🚉 ARRIVED — ${'★'.repeat(stars)} score ${score}`;
  el('retry').hidden = false;
  if (!hasSubmitted(localStorage, today)) {
    let nickname = getNickname(localStorage);
    if (!nickname) {
      nickname = (window.prompt('Enter a nickname for the leaderboard:') || '').trim();
      if (nickname) setNickname(localStorage, nickname);
    }
    if (nickname) {
      submitScore(today, { score, timeMs, nickname })
        .then((r) => { if (r) markSubmitted(localStorage, today, { score, stars }); })
        .finally(showLeaderboard);
    } else {
      showLeaderboard();
    }
  } else {
    showLeaderboard();
  }
}

function finishCrash(cell) {
  clearInterval(timerId);
  drawBoard(ctx, game, sprites, layout);
  drawCrash(ctx, layout, cell);
  el('result').hidden = false;
  el('result').textContent = '💥 CRASH — try again';
  el('retry').hidden = false;
  showLeaderboard();
}

function showLeaderboard() {
  renderLeaderboard(today, el('lb-list'));
}

startAttempt();
showLeaderboard();
