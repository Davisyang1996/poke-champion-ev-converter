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
  if (sum > NEW_TOTAL) errors.push(`Total EVs ${sum} exceeds ${NEW_TOTAL}`);
  return {ok: errors.length === 0, errors, sum};
}

function convertEvs(evs) {
  // evs: object with STATS keys
  // Validate first
  const validation = validateEvs(evs);
  if (!validation.ok) return {error: 'validation', details: validation};

  // Scale each stat
  const factor = OLD_TOTAL / NEW_TOTAL; // ~7.69697
  const scaled = {};
  const remainders = {};
  let total = 0;
  for (const s of STATS) {
    const raw = (Number(evs[s] || 0)) * factor;
    const floored = Math.floor(raw);
    scaled[s] = floored;
    remainders[s] = raw - floored;
    total += floored;
  }

  // Clamp to OLD_MAX and collect overflow
  let overflow = 0;
  for (const s of STATS) {
    if (scaled[s] > OLD_MAX) {
      overflow += scaled[s] - OLD_MAX;
      scaled[s] = OLD_MAX;
    }
  }

  // If overflow occurred, we'll try to redistribute the overflow by adding to others where possible (very unlikely from scaling but handle anyway)
  // But first attempt to reach OLD_TOTAL by distributing based on remainder order
  function eligibleStats() {
    return STATS.filter(s => scaled[s] < OLD_MAX);
  }

  // Sort stats by remainder descending, tie-break by STATS order
  const remainderOrder = STATS.slice().sort((a,b) => {
    if (remainders[b] !== remainders[a]) return remainders[b] - remainders[a];
    return STATS.indexOf(a) - STATS.indexOf(b);
  });

  // Distribute remaining points to reach OLD_TOTAL
  let remaining = OLD_TOTAL - total;
  let idx = 0;
  while (remaining > 0) {
    // find next stat in remainderOrder that can accept +1 without exceeding OLD_MAX
    let assigned = false;
    for (const s of remainderOrder) {
      if (scaled[s] < OLD_MAX) {
        scaled[s] += 1;
        remaining -= 1;
        assigned = true;
        if (remaining <= 0) break;
      }
    }
    if (!assigned) break; // no eligible stat
  }

  // Final sanity: if still not reached OLD_TOTAL but no place to put them, return scaled as-is
  const finalTotal = STATS.reduce((a,c)=>a+scaled[c],0);

  return {ok:true, evs: scaled, total: finalTotal};
}

module.exports = {STATS, validateEvs, convertEvs};
