// Vercel serverless function to proxy a URL and return its text content with CORS
// Deploy by connecting this repo to Vercel; the function will be available at /api/vercel-proxy

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const url = req.query.url || (req.body && req.body.url);
    if (!url) return res.status(400).send('Missing url parameter');

    // Basic safety: allow only http/https
    if (!/^https?:\/\//i.test(url)) return res.status(400).send('Invalid url');

    const r = await fetch(url, { timeout: 12000 });
    const text = await r.text();

    // Return with permissive CORS for the static frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    return res.status(200).send(text);
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).send('Proxy fetch failed: ' + (err.message || 'Unknown'));
  }
};
