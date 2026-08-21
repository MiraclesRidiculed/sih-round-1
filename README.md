# Karnataka Landchain MVP

Tamper-evident Karnataka land parcel verification platform focused exclusively on 2D land parcels in Karnataka. The app combines authoritative-record style datasets, document fingerprinting, GeoJSON parcel visualization, and an Ethereum Sepolia audit layer.

## What this MVP does

- Models Karnataka-specific land parcels using ULPIN/Bhu-Aadhaar where available, plus survey number, hissa, khata, village, hobli, taluk, and district.
- Stores current parcel state and searchable metadata in MongoDB.
- Records parcel/document audit events on Ethereum Sepolia through a Solidity smart contract.
- Verifies internal consistency between RTC-style data, mutation history, registration details, encumbrance state, and ownership timeline.
- Generates parcel QR codes and supports QR scan based verification.
- Keeps large documents off-chain and stores only their SHA-256 fingerprints plus storage references.
- Uses clearly labelled demo adapters for Karnataka government system integrations when no official API is configured.

## Important legal note

This MVP does **not** treat blockchain as proof of legal ownership.

- Authoritative land records come from Karnataka revenue, registration, survey, and related authorities.
- Blockchain is used only as a tamper-evident audit layer, document hash layer, provenance layer, and verification aid.
- MongoDB stores searchable application state, document metadata, analytics, and verification outputs.
- IPFS/object storage references are stored for large files rather than placing full records on Ethereum.

## Monorepo structure

- `client/` React + Vite + Tailwind + React Router + Leaflet UI
- `server/` Express + MongoDB + Mongoose REST API
- `contracts/` Hardhat + Solidity + Sepolia deployment scripts

## Demo Karnataka scope

This MVP includes seeded demo parcels only from Karnataka districts and intentionally avoids:

- buildings, apartments, floors, individual units, parking, or any vertical ownership
- 3D or underground rights
- multi-state support
- generic state adapters

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment templates:

   - `server/.env.example` to `server/.env`
   - `client/.env.example` to `client/.env`
   - `contracts/.env.example` to `contracts/.env`

3. Start MongoDB locally or point `MONGODB_URI` to an existing instance.

   If you do not already have MongoDB running, you can start the included container:

   ```bash
   docker compose up -d mongo
   ```

4. Seed demo Karnataka parcels:

   ```bash
   npm run seed
   ```

5. Start the backend and frontend:

   ```bash
   npm run dev
   ```

6. Optional: compile and deploy the smart contract to Sepolia:

   ```bash
   npm run chain:compile
   npm run chain:deploy
   ```

## Key URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`

## Demo flow

1. Search a Karnataka parcel by ULPIN, survey number, village, or district.
2. Open parcel detail to inspect map geometry, RTC-style summary, mutation state, ownership history, and registered documents.
3. Scan or generate a QR code tied to the parcel.
4. Upload a document to compare its SHA-256 fingerprint with stored on-chain/off-chain metadata.
5. Review the verification report to see whether records are consistent and what remains pending.

## Backend environment

See [server/.env.example](./server/.env.example).

## Contract environment

See [contracts/.env.example](./contracts/.env.example).

## Frontend environment

See [client/.env.example](./client/.env.example).
