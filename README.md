# Pokepaste EV Converter

This monorepo contains a small Node backend and a minimal frontend to convert Pokepaste sets from Pokemon Champion's EV system (66 total, 32 max per stat) to the classic 508 total / 252 max per stat system.

Backend (server)

- Location: backend/
- Start: cd backend && npm start
- API: POST http://localhost:3000/api/convert
  - Body: { "url": "https://pokepast.es/abcd" } or { "raw": "<pokepaste text>" }
  - Response: { converted: [ { name, original, convertedText } ], errors: [...] }

Frontend

- Location: frontend/
- Open frontend/index.html in a browser and paste a Pokepaste URL or raw paste text. The page expects the backend at http://localhost:3000.

Testing

- Unit tests are in backend/test. Run tests with:
  - cd backend && npm test

CI

- GitHub Actions workflow is installed at .github/workflows/nodejs.yml and runs backend tests on Node 18 and 20.

Notes

- The parser is intentionally pragmatic and tuned to the sample formats used in competitive play. If you encounter a paste that doesn't parse, send an example and it will be added to more tests.
- The EV conversion uses deterministic fractional-remainder rounding and clamps to 252 per stat.

