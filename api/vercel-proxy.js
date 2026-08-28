// Thin wrapper for the serverless/vercel-proxy.js implementation
// Vercel will expose this file at /api/vercel-proxy

const handler = require('../serverless/vercel-proxy.js');
module.exports = (req, res) => handler(req, res);
