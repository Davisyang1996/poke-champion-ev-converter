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
  // If HTML, try to extract <pre> contents (pokepast and similar use <pre>)
  if (/\<\/?html/i.test(text)) {
    const preMatch = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    if (preMatch && preMatch[1]) {
      // Replace <br> with newline and decode entities
      let inner = preMatch[1].replace(/<br\s*\/?>(\s*)/gi, '\n');
      // strip any remaining tags
      inner = inner.replace(/<[^>]+>/g, '');
      inner = decodeHtmlEntities(inner);
      return inner.trim();
    }
    // fallback: return full text
    return text;
  }
  return text;
}

module.exports = {fetchText};
