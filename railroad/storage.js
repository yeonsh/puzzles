const RESULT_PREFIX = 'railroad:result:';
const NICK_KEY = 'railroad:nick';

export function hasSubmitted(store, dateStr) {
  return store.getItem(RESULT_PREFIX + dateStr) != null;
}

export function markSubmitted(store, dateStr, result) {
  store.setItem(RESULT_PREFIX + dateStr, JSON.stringify(result));
}

export function getResult(store, dateStr) {
  const raw = store.getItem(RESULT_PREFIX + dateStr);
  return raw ? JSON.parse(raw) : null;
}

export function getNickname(store) {
  return store.getItem(NICK_KEY) || '';
}

export function setNickname(store, nick) {
  store.setItem(NICK_KEY, nick);
}
