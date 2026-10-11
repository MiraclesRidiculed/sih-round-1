# Land Stack prototype

Land Stack is a local GIS-based land-records and workflow prototype. It includes a React/Vite client, an Express/Mongoose API, MongoDB-backed parcel and workflow records, a Leaflet map, and a rules-based interoperability/canonical-record demonstration.

**Scope notice:** State and department adapters use local MongoDB/demo records; no state land-record, registration, RCCMS, planning, bank, or satellite provider is connected. Selected map basemaps are fetched from external tile services. The configured Sepolia document-anchor path is optional and is not enabled by default. Application permissions and records do not establish legal authority or authoritative government data.

## Technical documentation

See [Land Stack Standard Technical Document](client/public/Land_Stack_Standard_Technical_Document.md), also linked from the authenticated `/std` page. It describes implementation evidence and labels each capability as implemented, prototype, simulated, planned, or not implemented. “Standard Technical Document” is the project's document title, not a claim of government approval or standards compliance.

## Local development

Prerequisites documented by the project: Node.js 22+, npm, and MongoDB 7+. The Compose file starts **MongoDB only**.

```powershell
npm install
docker compose up -d mongo
```

Set local server environment variables before starting the API. At minimum, configure `JWT_SECRET` with at least 32 bytes of secret material; configure `MONGODB_URI`, `CLIENT_URL`, and `DEMO_SEED_PASSWORD` as appropriate. Do not commit real credentials. `DEMO_SEED_PASSWORD` must be private secret material and demo users are not seeded in production.

```powershell
npm run seed
npm run dev
```

The client is served at `http://localhost:5173`, the API at `http://localhost:4000/api`, and MongoDB defaults to `mongodb://127.0.0.1:27017/karnataka_landchain`. The API refuses to start without a valid JWT secret and expiry configuration. Demo seeding writes local demonstration records; inspect `server/src/scripts/seedDemoData.js` before using it against any non-disposable database.

## Build and tests

```powershell
npm run build
npm --workspace server exec -- node --test
npm run test:parcel-search --workspace client
npm run test:offline --workspace client
```

There is no production deployment topology, operational SLO, external-system onboarding guide, or formal conformance suite in this repository.
