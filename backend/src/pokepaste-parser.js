// Very small pokepaste parser tuned to the Pokemon Champion format used in the prompt.
// It returns an array of set objects with keys: name, item, ability, level, evs, nature, moves (array), rawLines (array)

const STAT_ALIASES = {
  HP: 'HP',
  Atk: 'Atk',
  Def: 'Def',
  'SpA': 'SpA',
  'SpD': 'SpD',
  Spe: 'Spe'
};

function parseEvsLine(line) {
  // flexible EV parser: handles "32 HP", "HP 32", separators '/' or ',' and mixed casing
  const evs = {HP:0, Atk:0, Def:0, SpA:0, SpD:0, Spe:0};
  const m = line.match(/EVs?:\s*(.*)/i);
  if (!m) return evs;
  // split on / or ,
  const parts = m[1].split(/[\/,]/).map(p => p.trim()).filter(p=>p.length>0);
  for (const p of parts) {
    // Try formats: "32 HP" or "HP 32"
    let pm = p.match(/^(\d+)\s*([A-Za-z]+)$/);
    let val, stat;
    if (pm) {
      val = parseInt(pm[1],10);
      stat = pm[2];
    } else {
      pm = p.match(/^([A-Za-z]+)\s*(\d+)$/);
      if (pm) {
        stat = pm[1];
        val = parseInt(pm[2],10);
      }
    }
    if (typeof val === 'number' && !Number.isNaN(val) && stat) {
      let key = null;
      if (/^HP$/i.test(stat)) key = 'HP';
      else if (/^Atk$/i.test(stat) || /^Attack$/i.test(stat)) key = 'Atk';
      else if (/^Def$/i.test(stat) || /^Defense$/i.test(stat)) key = 'Def';
      else if (/^(SpA|SpAtk|Sp\.A|SpA\.)$/i.test(stat)) key = 'SpA';
      else if (/^(SpD|SpDef|Sp\.D|SpD\.)$/i.test(stat)) key = 'SpD';
      else if (/^Spe$/i.test(stat) || /^Speed$/i.test(stat)) key = 'Spe';
      if (key) evs[key] = val;
    }
  }
  return evs;
}

function parseSet(block) {
  const lines = block.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);
  if (lines.length === 0) return null;
  const set = {rawLines: lines, name: null, item: null, ability: null, level: null, evs: {HP:0,Atk:0,Def:0,SpA:0,SpD:0,Spe:0}, nature: null, moves: []};

  // First line often: "Name @ Item" or "Name"
  const first = lines[0];
  const atMatch = first.match(/^(.*?)\s*@\s*(.*)$/);
  if (atMatch) {
    set.name = atMatch[1].trim();
    set.item = atMatch[2].trim();
  } else {
    set.name = first;
  }

  for (let i=1;i<lines.length;i++) {
    const l = lines[i];
    if (/^Ability:/i.test(l)) {
      const m = l.match(/^Ability:\s*(.*)/i);
      if (m) set.ability = m[1].trim();
      continue;
    }
    if (/^Level:/i.test(l)) {
      const m = l.match(/^Level:\s*(\d+)/i);
      if (m) set.level = parseInt(m[1],10);
      continue;
    }
    if (/^EVs?:/i.test(l)) {
      set.evs = parseEvsLine(l);
      continue;
    }
    if (/Nature$/i.test(l)) {
      const m = l.match(/^(.*)\s+Nature$/i);
      if (m) set.nature = m[1].trim();
      continue;
    }
    if (/^-\s*/.test(l)) {
      // move
      set.moves.push(l.replace(/^-/,'').trim());
      continue;
    }
    // fallback: other lines ignored for now
  }

  return set;
}

function parse(raw) {
  // Splits on blank lines (two or more newlines) to get sets
  const blocks = raw.split(/\n\s*\n/).map(b=>b.trim()).filter(b=>b.length>0);
  const sets = [];
  for (const b of blocks) {
    const s = parseSet(b);
    if (s) sets.push(s);
  }
  return sets;
}

module.exports = {parse, parseEvsLine};
