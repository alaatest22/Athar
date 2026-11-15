# Verification — updated integration

- PASS: frontend `npm test` — 3 jsdom tests covering API listing/filtering, project details/units/inquiries, creation, network retry and file upload/gallery payload. HTTP responses are mocked for frontend tests.
- PASS: frontend production build.
- PASS: `node --test test/validation.test.js test/uploads.test.js` — 3 backend tests, including real HTTP upload, image conversion with Sharp, filesystem write, public image serving and rejection of invalid image bytes; no MongoDB required.
- MongoDB-backed full integration remains unverified: previous attempt failed because the execution environment refused MongoDB startup (exit 100).
- New UI visual browser check not completed: separate browser cannot reach local preview (ERR_CONNECTION_REFUSED). Reference site inspected visually.
