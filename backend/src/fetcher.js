const fetch = require('node-fetch');

function decodeHtmlEntities(s) {
  if (!s) return s;
  return s.replace(/&amp;/g,'&')
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'");
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'pokepaste-ev-converter/1.0 (+https://example)' } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  // If HTML, try to extract all <pre> contents (pokepast and similar use <pre>)
  if (/\<\/?html/i.test(text)) {
    const preRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
    const matches = [];
    let m;
    while ((m = preRegex.exec(text)) !== null) {
      if (m[1]) matches.push(m[1]);
    }
    if (matches.length > 0) {
      const processed = matches.map(inner => {
        let t = inner.replace(/<br\s*\/?>(\s*)/gi, '\n');
        t = t.replace(/<[^>]+>/g, '');
        t = decodeHtmlEntities(t);
        return t.trim();
      }).join('\n\n');
      return processed;
    }
    // fallback: return full text
    return text;
  }
  return text;
}

module.exports = {fetchText};

module.exports = {fetchText};
