import { generateDailyBoard } from './shared/generator.js';
import { kstDateString } from './shared/daily.js';
import { createGame, rotateTile, pressGo, isOutOfMoves } from './shared/engine.js';
import { computeScore, starsFor } from './shared/scoring.js';
import { buildSprites } from './sprites.js';
import { drawBoard, animateTrain, cellAtPixel } from './render.js';
import { hasSubmitted, markSubmitted, getNickname, setNickname } from './storage.js';
import { renderLeaderboard, submitScore } from './leaderboard.js';

const TILE = 48;
const today = kstDateString(Date.now());
const board = generateDailyBoard(today);
const layout = { tileSize: TILE, w: board.w, h: board.h };
const sprites = buildSprites(TILE);

const canvas = document.getElementById('board');
canvas.width = board.w * TILE;
canvas.height = board.h * TILE;
const ctx = canvas.getContext('2d');

let game, startTime, timerId, attemptMoves = [];

const el = (id) => document.getElementById(id);
el('date').textContent = today;

function startAttempt() {
  game = createGame(board);
  attemptMoves = [];
  startTime = Date.now();
  el('retry').hidden = true;
  el('go').disabled = false;
  el('result').hidden = true;
  updateHud();
  drawBoard(ctx, game, sprites, layout);
  clearInterval(timerId);
  timerId = setInterval(tick, 100);
}

function updateHud() {
  el('moves').textContent = `Moves: ${game.movesUsed} / ${board.moveLimit}`;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  el('timer').textContent = `Time: ${elapsed}s`;
}

function tick() {
  updateHud();
  if (Date.now() - startTime >= board.timeLimitMs) die();
}

canvas.addEventListener('click', (e) => {
  if (!game || game.status !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const cell = cellAtPixel(px, py, layout);
  if (!cell) return;
  if (rotateTile(game, cell.x, cell.y)) {
    attemptMoves.push({ x: cell.x, y: cell.y });
    drawBoard(ctx, game, sprites, layout);
    updateHud();
    if (isOutOfMoves(game)) die();
  }
});

el('go').addEventListener('click', () => {
  if (!game || game.status !== 'playing') return;
  const result = pressGo(game);
  el('go').disabled = true;
  clearInterval(timerId);
  if (result === 'won') win();
  else die();
});

el('retry').addEventListener('click', startAttempt);

function die() {
  clearInterval(timerId);
  if (game.status === 'playing') game.status = 'dead';
  el('go').disabled = true;
  el('retry').hidden = false;
  el('result').hidden = false;
  el('result').textContent = '💥 CRASH — try again';
  showLeaderboard();
}

function win() {
  const timeMs = Date.now() - startTime;
  const movesSnapshot = attemptMoves.slice();
  animateTrain(ctx, game, sprites, layout, () => {
    const score = computeScore({ ...board, movesUsed: game.movesUsed, timeMs });
    const stars = starsFor({ par: board.par, movesUsed: game.movesUsed, timeMs, timeLimitMs: board.timeLimitMs });
    el('result').hidden = false;
    el('result').textContent = `🚉 ARRIVED — ${'★'.repeat(stars)} score ${score}`;

    if (!hasSubmitted(localStorage, today)) {
      let nickname = getNickname(localStorage);
      if (!nickname) {
        nickname = (window.prompt('Enter a nickname for the leaderboard:') || '').trim();
        if (nickname) setNickname(localStorage, nickname);
      }
      if (nickname) {
        submitScore(today, { movesUsed: game.movesUsed, timeMs, replay: movesSnapshot, nickname })
          .then((result) => { if (result) markSubmitted(localStorage, today, { score, stars }); })
          .finally(showLeaderboard);
      } else {
        showLeaderboard();
      }
    } else {
      showLeaderboard();
    }
  });
}

function showLeaderboard() {
  renderLeaderboard(today, el('lb-list'));
}

startAttempt();
showLeaderboard();
