// Base URL of the leaderboard API. Empty string = same-origin (local dev via
// `wrangler dev`, which serves both the app and the API). The GitHub Pages
// deploy sets `window.RAILROAD_API_BASE` to the deployed Worker URL.
const API_BASE = (typeof window !== 'undefined' && window.RAILROAD_API_BASE) || '';

export async function submitScore(date, { movesUsed, timeMs, replay, nickname }) {
  try {
    const res = await fetch(API_BASE + '/api/score', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ date, movesUsed, timeMs, replay, nickname }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function renderLeaderboard(date, listEl) {
  listEl.innerHTML = '<li>loading…</li>';
  try {
    const res = await fetch(API_BASE + '/api/leaderboard?date=' + encodeURIComponent(date));
    if (!res.ok) throw new Error('http ' + res.status);
    const body = await res.json();
    if (!body.top || body.top.length === 0) {
      listEl.innerHTML = '<li>no scores yet — be the first!</li>';
      return;
    }
    listEl.innerHTML = body.top
      .map((r) => `<li>${escapeHtml(r.nickname)} — ${r.score}</li>`)
      .join('');
  } catch {
    listEl.innerHTML = '<li>leaderboard unavailable — retry later</li>';
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
