const STATS = ["HP","Atk","Def","SpA","SpD","Spe"];

const NEW_TOTAL = 66;
const NEW_MAX = 32;
const OLD_TOTAL = 508;
const OLD_MAX = 252;

function validateEvs(evs) {
  const errors = [];
  let sum = 0;
  for (const s of STATS) {
    const v = Number(evs[s] || 0);
    if (!Number.isInteger(v) || v < 0) {
      errors.push(`${s} is not a non-negative integer: ${evs[s]}`);
    }
    if (v > NEW_MAX) {
      errors.push(`${s} exceeds ${NEW_MAX}: ${v}`);
    }
    sum += v;
  }
  if (sum > NEW_TOTAL) errors.push(`Total SPs ${sum} exceeds ${NEW_TOTAL}`);
  return {ok: errors.length === 0, errors, sum};
}

function spToEv(sp) {
  const s = Number(sp || 0);
  if (s <= 0) return 0;
  if (s === 1) return 4;
  // For 2 or more SP: EV = SP * 8 - 4
  return Math.min(OLD_MAX, s * 8 - 4);
}

function convertEvs(evs) {
  // evs: object with STATS keys representing SP values (0-32)
  const validation = validateEvs(evs);
  if (!validation.ok) return {error: 'validation', details: validation};

  const out = {};
  let total = 0;
  for (const s of STATS) {
    const sp = Number(evs[s] || 0);
    const ev = spToEv(sp);
    out[s] = ev;
    total += ev;
  }

  return {ok: true, evs: out, total};
}

module.exports = {STATS, validateEvs, convertEvs};
