const inputEl = document.getElementById('input');
const outEl = document.getElementById('output');
const convertBtn = document.getElementById('convert');
const clearBtn = document.getElementById('clear');

convertBtn.addEventListener('click', async ()=>{
  const val = inputEl.value.trim();
  if (!val) return;
  outEl.textContent = '';

  // Helper: decode HTML entities
  function decodeHtmlEntities(s) {
    if (!s) return s;
    return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
  }

  // Minimal SP->EV converter (matches backend):
  function spToEv(sp) {
    const s = Number(sp||0);
    if (s <= 0) return 0;
    if (s === 1) return 4;
    return Math.min(252, s*8 - 4);
  }

  // Parse EV line like "EVs: 2 HP / 32 Atk / 32 SpD"
  function parseEvsLine(line) {
    const evs = {HP:0, Atk:0, Def:0, SpA:0, SpD:0, Spe:0};
    const m = line.match(/EVs?:\s*(.*)/i);
    if (!m) return evs;
    const parts = m[1].split(/[\/,]/).map(p=>p.trim()).filter(p=>p.length>0);
    for (const p of parts) {
      let pm = p.match(/^(\d+)\s*([A-Za-z\.]+)$/);
      let val, stat;
      if (pm) { val = parseInt(pm[1],10); stat = pm[2]; }
      else { pm = p.match(/^([A-Za-z\.]+)\s*(\d+)$/); if (pm) { stat = pm[1]; val = parseInt(pm[2],10); } }
      if (typeof val === 'number' && !Number.isNaN(val) && stat) {
        let key = null;
        if (/^HP$/i.test(stat)) key='HP';
        else if (/^Atk$/i.test(stat) || /^Attack$/i.test(stat)) key='Atk';
        else if (/^Def$/i.test(stat) || /^Defense$/i.test(stat)) key='Def';
        else if (/^(SpA|SpAtk|Sp\.A|SpA\.)$/i.test(stat)) key='SpA';
        else if (/^(SpD|SpDef|Sp\.D|SpD\.)$/i.test(stat)) key='SpD';
        else if (/^Spe$/i.test(stat) || /^Speed$/i.test(stat)) key='Spe';
        if (key) evs[key] = val;
      }
    }
    return evs;
  }

  // Parse blocks into sets
  function parse(raw) {
    const lines = raw.split(/\r?\n/).map(l=>l.replace(/\u00A0/g,' ').trimRight());
    const starts = [];
    for (let i=0;i<lines.length;i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.indexOf('@') !== -1) { starts.push(i); continue; }
      const nextIdx = (function(){ for (let j=i+1;j<lines.length;j++) if (lines[j].trim()!=='') return j; return -1 })();
      const nextLine = nextIdx>=0 ? lines[nextIdx].trim() : '';
      if (!line.includes(':') && (/^Ability:/i.test(nextLine) || /^Level:/i.test(nextLine) || /^EVs?:/i.test(nextLine))) {
        starts.push(i); continue;
      }
    }
    const sets = [];
    if (starts.length===0) return sets;
    for (let sidx=0;sidx<starts.length;sidx++) {
      const start = starts[sidx];
      const end = (sidx+1<starts.length)?starts[sidx+1]:lines.length;
      const blockLines = lines.slice(start,end).map(l=>l.trim()).filter(l=>l.length>0);
      const set = {rawLines:blockLines, name:null, item:null, ability:null, level:null, evs:{HP:0,Atk:0,Def:0,SpA:0,SpD:0,Spe:0}, nature:null, moves:[]};
      const first = blockLines[0]||'';
      const atMatch = first.match(/^(.*?)\s*@\s*(.*)$/);
      if (atMatch) { set.name = atMatch[1].trim(); set.item = atMatch[2].trim(); } else set.name = first;
      for (let i=1;i<blockLines.length;i++) {
        const l = blockLines[i];
        if (/^Ability:/i.test(l)) { const m=l.match(/^Ability:\s*(.*)/i); if (m) set.ability=m[1].trim(); continue; }
        if (/^Level:/i.test(l)) { const m=l.match(/^Level:\s*(\d+)/i); if (m) set.level=parseInt(m[1],10); continue; }
        if (/^EVs?:/i.test(l)) { set.evs=parseEvsLine(l); continue; }
        if (/Nature$/i.test(l)) { const m=l.match(/^(.*)\s+Nature$/i); if (m) set.nature=m[1].trim(); continue; }
        if (/^-\s*/.test(l)) { set.moves.push(l.replace(/^-\s*/,'').trim()); continue; }
      }
      sets.push(set);
    }
    return sets;
  }

  function convertSetsToText(sets) {
    return sets.map(s => {
      const evText = ['HP','Atk','Def','SpA','SpD','Spe'].map(st => `${spToEv(s.evs[st]||0)} ${st}`).join(' / ');
      const lines = [];
      lines.push((s.name || '') + (s.item ? ' @ ' + s.item : ''));
      if (s.ability) lines.push('Ability: ' + s.ability);
      if (s.level) lines.push('Level: ' + s.level);
      lines.push('EVs: ' + evText);
      if (s.nature) lines.push(s.nature + ' Nature');
      for (const m of s.moves || []) lines.push('- ' + m);
      return lines.join('\n');
    }).join('\n\n');
  }

  // Only accept raw poke-paste text in the input. URL fetching is intentionally disabled for the public/static site.
  if (/\bhttps?:\/\//i.test(val)) {
    outEl.textContent = 'Please paste the raw poke-paste text (not a URL). URL fetching is not supported on the public site for privacy and reliability.';
    return;
  }

  // Parse raw text locally
  const sets = parse(val);
  if (sets.length===0) { outEl.textContent = 'No sets found in input.'; return; }
  outEl.textContent = convertSetsToText(sets);
  return;
});

// Copy All button
const copyBtn = document.getElementById('copyAll');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    const text = outEl.textContent || '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const old = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(()=> { copyBtn.textContent = old; }, 1500);
    } catch (e) {
      // fallback: select the pre text and execCommand
      try {
        const range = document.createRange();
        range.selectNodeContents(outEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
        const old = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(()=> { copyBtn.textContent = old; }, 1500);
      } catch (err) {
        console.error('Copy failed', err);
      }
    }
  });
}

clearBtn.addEventListener('click', ()=>{ inputEl.value = ''; outEl.textContent = ''; });
