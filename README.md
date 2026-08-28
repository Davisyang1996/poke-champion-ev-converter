# Davo's PokePaste Converter

Simple tool that converts Stat Point (SP) spreads from Pokemon Champion format to Effort Values (EV) used in mainline Pokémon.

Overview

- Frontend: single-page UI (frontend/) where a user can paste a Pokepaste URL or raw paste text and get converted sets.
- Backend: Node + Express API (backend/) that fetches a paste, parses Pokémon sets, validates SPs (0..32, total SPs ≤ 66), and converts each SP value to EV according to the mapping below.
- Deployment: frontend is published to GitHub Pages via a GitHub Actions workflow (.github/workflows/deploy-pages.yml).

Conversion formula (SP → EV)

- 0 SP = 0 EV
- 1 SP = 4 EV
- 2+ SP = SP × 8 − 4 (for example, 2 SP = 12 EV, 32 SP = 252 EV)

Note: This mapping is applied per-stat and caps individual stats at 252 EV. Because the mapping is per-stat, the summed total EVs for a set can exceed 508 in some cases (for example multiple stats at 32 SP each). The code preserves the SP→EV mapping rather than forcibly normalizing totals to 508; if you want a normalization/redistribution step to enforce a 508 total, that can be added.

Getting started (local)

1. Install dependencies and run tests (backend):
   - cd backend
   - npm install
   - npm test
2. Run the backend server (it serves the frontend too):
   - cd backend
   - npm start
3. Open the app in a browser:
   - Visit http://localhost:3000 and paste a Pokepaste URL or raw paste text, then click Convert.

API

- POST /api/convert
  - Body: { "url": "https://pokepast.es/abcd" } or { "raw": "<pokepaste text>" }
  - Response: JSON with { converted: [ { name, original, convertedText } ], errors: [...] }

Testing & CI

- Unit tests are in backend/test and run with `npm test`.
- A GitHub Actions workflow runs tests on pushes and another workflow deploys the frontend folder to GitHub Pages on push to main.

Security & privacy

- The server fetches public Pokepaste pages and extracts the raw paste text for parsing; it does not store or forward private data.

Contributing

- If you find a paste format that doesn't parse correctly, please open an issue with the raw paste example so the parser can be extended and tests added.

License

- MIT
