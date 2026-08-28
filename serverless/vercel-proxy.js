// Vercel serverless function to proxy a URL and return its text content with CORS
// Safety notes:
// - To reduce privacy and abuse risk this function ONLY allows pokepast.es URLs by default.
// - It returns text/plain and sets Access-Control-Allow-Origin: * so the static frontend can fetch it.
// - Deploy to Vercel (or adapt to another provider) and set SERVER_PROXY_URL in the frontend to point at this API.

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Set CORS headers for all responses (frontend expects this)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const url = (req.query && req.query.url) || (req.body && req.body.url);
    if (!url) return res.status(400).send('Missing url parameter');

    // Basic safety: allow only http(s)
    if (!/^https?:\/\//i.test(url)) return res.status(400).send('Invalid url scheme');

    // Only allow pokepast.es to reduce risk of abuse. Adjust this whitelist if you want more domains.
    let parsed;
    try { parsed = new URL(url); } catch (e) { return res.status(400).send('Malformed url'); }
    const hostname = (parsed.hostname || '').toLowerCase();
    if (!hostname.endsWith('pokepast.es')) {
      return res.status(403).send('Only pokepast.es URLs are allowed');
    }

    // Fetch the target page server-side (not subject to browser CORS)
    const r = await fetch(url, { timeout: 12000 });
    if (!r.ok) return res.status(502).send('Upstream fetch failed: ' + r.status);
    const text = await r.text();

    // Return as plain text
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(text);
  } catch (err) {
    return res.status(500).send('Proxy fetch failed: ' + (err.message || 'Unknown'));
  }
};
