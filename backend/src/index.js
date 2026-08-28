const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {fetchText} = require('./fetcher');
const {parse} = require('./pokepaste-parser');
const {validateEvs, convertEvs, STATS} = require('./ev-convert');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// POST { url: 'https://pokepast.es/abcdef' } or { raw: 'text...' }
app.post('/api/convert', async (req, res) => {
  try {
    const {url, raw} = req.body || {};
    let text;
    if (raw) text = raw;
    else if (url) text = await fetchText(url);
    else return res.status(400).json({error: 'Provide url or raw text in request body.'});

    const sets = parse(text);
    const converted = [];
    const errors = [];

    for (const s of sets) {
      const v = validateEvs(s.evs);
      if (!v.ok) {
        errors.push({name: s.name, details: v.errors});
        continue;
      }
      const conv = convertEvs(s.evs);
      if (conv.error) {
        errors.push({name: s.name, details: conv});
        continue;
      }
      // Build converted set text by replacing the EVs line in rawLines if present,
      // otherwise append an EVs line.
      const outLines = s.rawLines.map(l => {
        if (/^EVs?:/i.test(l)) {
          const evText = STATS.map(st => `${conv.evs[st]} ${st}`).join(' / ');
          return `EVs: ${evText}`;
        }
        return l;
      });
      // If EVs line wasn't present, append
      if (!s.rawLines.some(l=>/^EVs?:/i.test(l))) {
        const evText = STATS.map(st => `${conv.evs[st]} ${st}`).join(' / ');
        outLines.splice(1,0,`EVs: ${evText}`);
      }

      converted.push({name: s.name, original: s, convertedText: outLines.join('\n')});
    }

    res.json({converted, errors});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'server_error', message: err.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server listening on ${PORT}`));

module.exports = app;
