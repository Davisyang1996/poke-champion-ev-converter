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

  // Try backend first for local dev only (skip backend on GitHub Pages/static hosts to avoid POST 405)
  let triedBackend = false;
  if (!val.startsWith('http')) {
    // raw text -> parse locally
    const sets = parse(val);
    if (sets.length===0) { outEl.textContent = 'No sets found in input.'; return; }
    outEl.textContent = convertSetsToText(sets);
    return;
  }

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost) {
    // If running locally, try backend first; otherwise skip backend to avoid POSTing to a static host
    try {
      triedBackend = true;
      const res = await fetch('/api/convert', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ url: val }) });
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (res.ok && ct.includes('application/json')) {
        const json = await res.json();
        if (json && json.converted && json.converted.length>0) {
          outEl.textContent = json.converted.map(c=>c.convertedText).join('\n\n');
          return;
        }
      }
      // If response wasn't JSON or didn't contain converted sets, fallthrough to client-side fallback
    } catch (err) {
      // ignore and try client-side fallback
    }
  }

  // Fallback: try several public proxies in sequence and extract the paste text
  async function tryProxies(targetUrl) {
    const proxies = [
      // Jina AI text gateway has proven reliable for plain-text content
      { name: 'jina', prefix: 'https://r.jina.ai/http://', rawAppend: true },
      // allorigins returning raw HTML
      { name: 'allorigins', prefix: 'https://api.allorigins.win/raw?url=', rawAppend: false },
      // codetabs proxy (JSON wrapper sometimes)
      { name: 'codetabs', prefix: 'https://api.codetabs.cn/v1/proxy?quest=', rawAppend: false },
      // thingproxy (may be unreliable)
      { name: 'thingproxy', prefix: 'https://thingproxy.freeboard.io/fetch/', rawAppend: false },
      // corsproxy.io (may return 403 depending on origin)
      { name: 'corsproxy', prefix: 'https://corsproxy.io/?', rawAppend: false }
    ];

    for (const p of proxies) {
      try {
        let fetchUrl;
        if (p.rawAppend && /^https?:\/\//i.test(targetUrl)) {
          // r.jina.ai expects the target URL without the protocol segment encoded into the path
          fetchUrl = p.prefix + targetUrl.replace(/^https?:\/\//i, '');
        } else {
          fetchUrl = p.prefix + encodeURIComponent(targetUrl);
        }
        const r = await fetch(fetchUrl);
        if (!r.ok) {
          // try next
          continue;
        }
        const txt = await r.text();
        if (!txt) continue;
        return { source: p.name, text: txt };
      } catch (e) {
        // try next proxy
        continue;
      }
    }
    return null;
  }

  try {
    // If a self-hosted proxy is configured (e.g., a Vercel function), try it first
    if (window.SERVER_PROXY_URL && typeof window.SERVER_PROXY_URL === 'string' && window.SERVER_PROXY_URL.length>0) {
      try {
        const proxyUrl = window.SERVER_PROXY_URL + (window.SERVER_PROXY_URL.includes('?') ? '&' : '?') + 'url=' + encodeURIComponent(val);
        const r = await fetch(proxyUrl);
        if (r.ok) {
          const txt = await r.text();
          // use the returned text directly
          const sets = parse(decodeHtmlEntities(txt.replace(/<br\s*\/?>(\s*)/gi,'\n').replace(/<[^>]+>/g,'')));
          if (sets.length>0) { outEl.textContent = convertSetsToText(sets); return; }
        }
      } catch (e) {
        // if server proxy failed, fall through to public proxies
      }
    }

    const result = await tryProxies(val);
    if (!result) {
      outEl.textContent = 'Could not fetch the paste via public proxies. Please paste the raw poke-paste text into the left box instead.' + (triedBackend? ' (backend attempted)' : '');
      return;
    }

    let text = result.text;
    // If proxy returned an HTML page, try to extract <pre> blocks, otherwise treat as raw/markdown
    const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
    const matches = [];
    let m;
    while ((m = preRegex.exec(text)) !== null) if (m[1]) matches.push(m[1]);
    if (matches.length===0) {
      // no <pre> blocks — try stripping HTML tags and decoding entities
      text = decodeHtmlEntities(text.replace(/<br\s*\/?>(\s*)/gi,'\n').replace(/<[^>]+>/g,''));
    } else {
      text = matches.map(inner=> decodeHtmlEntities(inner.replace(/<br\s*\/?>(\s*)/gi,'\n').replace(/<[^>]+>/g,''))).join('\n\n');
    }

    const sets = parse(text);
    if (sets.length===0) { outEl.textContent = 'No sets found in fetched paste.'; return; }
    outEl.textContent = convertSetsToText(sets);
    return;
  } catch (err) {
    outEl.textContent = 'Request failed: ' + (err.message || 'Unknown error') + (triedBackend? ' (backend attempted)' : '');
  }
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

clearBtn.addEventListener('click', ()=>{ inputEl.value = ''; outEl.textContent = ''; });
