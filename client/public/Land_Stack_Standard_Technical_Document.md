# Land Stack Standard Technical Document

**Document scope:** This document describes repository behavior observed in the current implementation. It is not an approved government specification, a legal opinion, or evidence of compliance with an external standard.

## Status vocabulary

- **IMPLEMENTED** — behavior exists in the repository and is used by the application.
- **PROTOTYPE** — an application workflow or interface demonstrates a capability but is not connected to an authoritative operational service.
- **SIMULATED** — sample or synthetic behavior/data is explicitly used instead of a real integration.
- **PLANNED** — an architectural extension or requirement is identified but not delivered.
- **NOT IMPLEMENTED** — no implementation exists in this repository.

These labels describe technical scope, not production readiness, legal effect, or government endorsement. “Standard Technical Document” is a project document name; no compliance certification is claimed.

**PLANNED:** The repository does not define an approved or scheduled roadmap. Any capability described as not implemented is a gap, not a committed plan.

## 1. System Architecture

**IMPLEMENTED:** The repository is an npm-workspace application with a React 18/Vite client (`client/`), an Express API (`server/`), Mongoose models backed by MongoDB, and a separate Solidity/Ethers contract workspace (`contracts/`). The browser calls the API under `/api`; Vite proxies those calls to port 4000 during development. The API configures CORS, JSON parsing, request logging, authentication-context parsing, CSRF checks, route groups, and shared error handlers in `server/src/index.js`.

The application is a single deployable API and single-page client, not a network of independently deployed state services. The GIS interface uses React-Leaflet/Leaflet and server-provided parcel records.

## 2. National/State Federation Model

**PROTOTYPE:** `NationalLandExchange` queries a list of adapter objects and maps a found local parcel into a national-shaped record while preserving source state fields and source metadata. The label “national” refers to this application model and user interface.

**NOT IMPLEMENTED:** Federated identity, state-to-state data exchange, production national gateway, state agency service connections, consent/legal data-sharing agreements, distributed synchronization, or conflict-resolution protocol. No national or state government system is queried by the state-adapter or interoperability features described here.

## 3. State Adapter Architecture

**PROTOTYPE / SIMULATED:** `StateLandAdapter` defines methods for parcel, ownership, encumbrance, mutation, registration, and spatial lookups. Karnataka, Tamil Nadu, Chandigarh, and generic adapters extend `GenericStateAdapter`, which queries the same local `Parcel` collection. Adapter metadata uses “style” or “demo” labels for state systems, and explicitly says data is local seeded demonstration data.

**NOT IMPLEMENTED:** Network clients, credentials, state-specific live API contracts, message queues, retries, circuit breakers, or live source authentication. `server/src/services/integrations/` also contains fixture-style RTC, registration, and survey snapshots derived from local parcel records, not remote calls.

## 4. Parcel-Centric Architecture

**IMPLEMENTED:** Parcel records are the hub for geometry, identifiers, ownership, state profile, essential/additional layer data, workflows, restrictions, subdivision data, and related documents, ownership events, RCCMS cases, and survey submissions. `parcelCentricRecordService.js` assembles these into modules and correlates them using the existing parcel ULPIN when present. Module status and source provenance distinguish available, pending, unavailable, and restricted data.

This assembly is an application data view, not a federated real-time view. A source label does not imply that an external authority has supplied or certified the value.

## 5. ULPIN Data Model

**IMPLEMENTED:** `Parcel.ulpin` is an optional, trimmed, unique, sparse string field. Parcel records also hold a local `parcelId`, survey/hissa/khata identifiers, property ID, and administrative location. The interoperability route validates that a requested ULPIN contains exactly 14 digits and performs a local record lookup.

**NOT IMPLEMENTED:** Official ULPIN generation, semantic validation against a government-issued registry, coordinate-derived identifier generation, or proof that any seeded identifier is officially allocated. The 14-digit route check is syntactic only. Subdivision child identifiers are project-generated identifiers and are explicitly not official ULPINs.

## 6. Canonical Land Schema

**PROTOTYPE:** `canonicalLandRecord.js` defines a versioned (`1.0`) record shape with national identifiers, location, land category, tenure, ownership, encumbrance, mutation, registration, restrictions, spatial feature, source record, and snapshots. Harmonization preserves source values and identifies deterministic keyword mappings.

Land classification and tenure mappings are keyword rules; restrictions are collected from local record fields. `legalEquivalence` is explicitly false for land/tenure mapping. This is not a formally governed national schema, complete controlled vocabulary, or validated conversion between state legal concepts.

## 7. GIS Architecture

**IMPLEMENTED:** Parcel geometry is stored as GeoJSON `Feature` data whose model accepts `Polygon` geometry and numeric coordinate pairs. The client renders parcel geometry using Leaflet and React-Leaflet, with parcel selection, search, layer controls, planning visualization based on the selected parcel, and simulated change-detection markers.

**LIMITATION:** Geometry is local/demo data and is not a surveyed authoritative cadastre. The schema does not establish a repository-wide CRS registry or geometry-quality assurance. Base-map tiles are requested from configured external ArcGIS World Imagery and OpenStreetMap tile URLs; their availability and licensing are external dependencies. The planning display is not a separate authoritative zoning-boundary layer.

## 8. Three Land Stack Layers

**IMPLEMENTED AS APPLICATION GROUPINGS:** The product presents:

1. **Base cadastral layer:** parcel identifiers, locality, area, and polygon geometry.
2. **Essential governance layer:** RoR/rights, registration, planning, building permissions, encumbrances, restrictions, and related records where present.
3. **Additional/use-case layer:** property tax, utilities, infrastructure, valuation, transaction, and other local fields where present.

These are application concepts assembled from current parcel fields. They are not a published geospatial layer standard, complete dataset guarantee, or evidence that every category is connected.

## 9. API Standards

**IMPLEMENTED:** Express JSON APIs are grouped under `/api` for authentication, parcels, court/RCCMS, dashboard, land exchange, land interoperability, verification, and event streaming. The interoperability API uses GET endpoints, a common success/error envelope, timestamps, ULPIN correlation, source metadata, and role projection.

**NOT IMPLEMENTED:** An OpenAPI/Swagger specification, generated client, public version negotiation, a formal error taxonomy across every route, OGC API/WFS conformance, or a conformance test suite. The interoperability metadata reports API version `1.0`; its URL is not `/api/v1`.

## 10. Interoperability

**PROTOTYPE:** Authenticated, read-only local endpoints are documented in `README.md`, including:

- `GET /api/land/parcels/:ulpin`
- `GET /api/land/parcels/:ulpin/:module`, with mapped modules such as `cadastral`, `rights`, `registration`, `planning`, `encumbrances`, `restrictions`, `transactions`, `change-detection`, and `decision-support`.

Responses include ULPIN correlation, source mode/authority, API metadata, module information, and role-specific records. Modules the caller may not access return a forbidden response.

**NOT IMPLEMENTED:** Real agency adapters, synchronous exchange with external departments, event subscriptions from state systems, or a production interoperability agreement. The API reads local MongoDB and demo records.

## 11. Authentication

**IMPLEMENTED:** Login verifies a stored bcrypt password hash, sets a session cookie, updates login time, and exposes a session identity endpoint. Session records are stored in MongoDB and checked during authenticated requests. Logout revokes the session. Login attempts are rate-limited.

Demo account seeding derives credentials from `DEMO_SEED_PASSWORD`; do not use demo identities as production identity proofing.

## 12. JWT Security

**IMPLEMENTED:** Tokens are signed with HS256, include a random JWT ID (`jti`), and have a configured expiration constrained to 60 seconds through seven days. Startup requires at least 32 bytes of `JWT_SECRET`. The token is stored in an HttpOnly session cookie and is not returned to browser JavaScript by login. The server accepts the configured session cookie or a bearer token, verifies the JWT, and requires an active, unexpired server-side session record.

Cookie settings include `Secure` outside development (and for `SameSite=None`) and configured `SameSite`; state-changing cookie-authenticated requests require an allowed Origin and matching CSRF cookie/header token.

This implementation is not a claim of security certification. Production secret management, key rotation, token audience/issuer policy, and operational session monitoring are not documented or delivered as a complete deployment system.

## 13. RBAC

**IMPLEMENTED:** Server routes use `authenticateToken` and `requireRole`. Roles include `admin`, `revenue_officer`, `surveyor`, `sro`, `court`, `bank`, and `citizen`. Parcel records are projected by role, and the interoperability API applies module-level permissions. Citizens do not receive the decision-support report; institutional role labels describe demo application access, not legal authority.

**LIMITATION:** Authorization is application role-based. Fine-grained jurisdiction/attribute policy and agency identity lifecycle integration are not implemented. Any endpoint should be reviewed independently; a role label is not proof of official status.

## 14. Audit Trails

**IMPLEMENTED:** RCCMS transitions append state changes with from/to state, timestamp, responsible officer, and note. `RccmsCase` stores the transition trail. Ownership events and verification scans are also persisted; some parcel workflows emit in-process events.

**OPTIONAL PROTOTYPE:** Document hash anchoring and lookup through the Sepolia contract can be enabled by configuration. The default state is demo-ready/disabled. Some workflow values named `txHash` are generated application metadata and do not prove an on-chain transaction.

**NOT IMPLEMENTED:** A general immutable append-only audit log for every application mutation, durable event broker, tamper-proof database audit, or guaranteed chain anchoring of all records. MongoDB audit fields are not immutable by virtue of being stored.

## 15. RCCMS Workflow

**PROTOTYPE:** Local RCCMS cases link to a parcel and optional ULPIN. Implemented states are `CASE_FILED`, `NOTICE_ISSUED`, `INTERIM_INJUNCTION`, `HEARING_DECREE`, and `STAY_VACATED`; transitions are validated and appended to the case audit trail. Court routes are role-gated, and case records can be used by local restriction logic.

**NOT IMPLEMENTED:** Connection to a real court/RCCMS system, service of legal notices, court order validation, judicial identity assurance, or legal effect. Seeded/default example content is demonstration content.

## 16. Statutory Restriction Workflow

**PROTOTYPE:** A shared restriction service derives an active transfer restriction from qualifying local RCCMS case states or parcel dispute/transaction-lock fields. Transaction, subdivision, and related operations use the shared check in implemented paths. Court-case transitions record stay issuance/vacation and update local parcel flags.

The application display and block are based on local application records. They do not constitute a legal registry search, official notice, legal determination, or guarantee that all transfers are blocked in external systems.

## 17. Cadastral Subdivision

**PROTOTYPE:** The subdivision service validates polygon positions/rings, computes a two-part split, checks containment, overlap and area conservation, and calculates area using geodesic methods. Proposed child geometries and project identifiers are stored on the parent record and submitted to a role-gated approval workflow.

Child identifiers are SHA-256-derived project identifiers, not official ULPINs. Approval is an application state transition, not official cadastral mutation, deed registration, or survey approval by a government authority. Precision, CRS transformations, complex multipolygons, and authoritative survey procedures are outside current scope.

## 18. PWA Offline Survey

**IMPLEMENTED / PROTOTYPE:** The production Vite build emits a service worker that precaches the app shell and field-survey route chunks; it serves cached same-origin shell requests offline and intentionally does not cache `/api`. A field surveyor can cache parcel identifiers and polygon coordinates, save observations in IndexedDB, and synchronize queued surveys when connected.

The offline vault encrypts stored records with Web Crypto AES-GCM; key derivation uses PBKDF2/SHA-256 and the implementation's configured iteration count. Offline operation is limited to previously cached parcel references and survey entry. It is not general offline access to all application workflows, guaranteed background synchronization, or official mobile device management.

## 19. Citizen Services

**IMPLEMENTED:** Authenticated citizen parcel lookup/detail views expose a restricted projection of cadastral, rights, registration, planning, building-permission, encumbrance, restrictions, transaction, and simulated change-detection information where allowed. The public verification routes provide limited QR/document verification behavior.

**LIMITATION:** The user experience and records are prototype services. The application does not issue official property cards or complete a state mutation/registration or citizen application with a government department.

## 20. Officer Services

**IMPLEMENTED / PROTOTYPE:** Role-specific views exist for admin, revenue officer, surveyor, SRO, court, and bank personas. Available interfaces include local parcel review, RCCMS case handling, survey/subdivision workflows, transaction tracking, dashboard summaries, and role-projected parcel information.

These tools are not connected to departmental work queues or official staff identity systems; demo roles do not confer public powers.

## 21. Data Sources

**IMPLEMENTED SOURCES:** MongoDB parcel, user/session, document, ownership-event, verification-scan, RCCMS-case, and field-survey records; local workflow and seeded demo values; user-submitted local prototype data. API modules report source availability/provenance where present.

**EXTERNAL DISPLAY SOURCE:** The map requests basemap tiles from external tile services. That does not make parcel overlays or land records externally verified.

## 22. Mock vs Real Integrations

| Capability | Current status |
| --- | --- |
| Bhoomi/Tamil Nilam/TNREGINET/Kaveri-style adapters | **SIMULATED:** local records and adapter labels only; no departmental network calls. |
| RCCMS/court records | **PROTOTYPE:** local MongoDB cases/workflow, no court integration. |
| Planning, bank/encumbrance, tax, and utility data | **SIMULATED / local records:** no live agency/bank feed. |
| Remote sensing | **SIMULATED:** existing sample flags; no imagery provider or analytical pipeline. |
| GIS base maps | **External tile requests:** Esri World Imagery and OpenStreetMap URL usage; not government land-record integrations. |
| Sepolia document anchoring | **OPTIONAL:** code path exists and requires configuration; disabled/demo-ready by default. |

## 23. AI/ML Components

**PROTOTYPE:** The parcel decision-support report runs deterministic rules for repeated normalized holder-name entries, holder-name differences against the latest recorded ownership event, pending local transactions coexisting with an active restriction, and an existing simulated change flag. It includes an explanation, source summary, generation/event timestamp, and explicit uncalculated confidence.

**NOT IMPLEMENTED:** A trained ML model, model-serving infrastructure, independently validated labels, accuracy/calibration evaluation, predictive score, or legal decision automation. Outputs may be incomplete or false positives and are staff review aids only.

## 24. Remote Sensing Change Detection

**SIMULATED:** A parcel-level report adapts existing local demo flags and available sample metadata. It identifies the affected parcel/ULPIN, recorded detection/pass date, and allowlisted imagery fields if present. The map indicator is attached to parcel geometry, not an inferred change pixel/location. The UI says simulated, does not show legacy confidence-like values as calculated scores, and states no real satellite imagery/provider is connected.

**NOT IMPLEMENTED:** Satellite data acquisition, image comparison, radar sweep, change-classification pipeline, or validated remote-sensing confidence.

## 25. UI/UX Guidelines

**IMPLEMENTED AS CURRENT DESIGN CHOICES:** Formal administrative layout, restrained status panels, role labels, warnings for local/demo data, and no gaming-style metric counters. The application uses React, Tailwind CSS, IBM Plex Sans, and Sora. These are design choices, not a mandated government UX standard.

## 26. Color Schema

**IMPLEMENTED:** Common interface colors include navy `#0B2545`, slate `#334155`, warm off-white `#F8F6EF`, white panels, and restrained amber/rose/blue status treatments. Color use varies by component; there is no centralized, versioned design-token standard covering every color.

## 27. Accessibility

**PARTIALLY IMPLEMENTED:** Components use native buttons/labels, selected ARIA landmarks/labels/live regions, and visible focus styles in several forms and parcel controls. This is not a completed accessibility conformance assessment.

**NOT IMPLEMENTED / NOT VERIFIED:** WCAG conformance claim, comprehensive keyboard/screen-reader testing, automated accessibility test suite, full color-contrast audit, or accessibility statement. Do not infer compliance from the presence of ARIA attributes.

## 28. Deployment

**IMPLEMENTED FOR LOCAL DEVELOPMENT:** `docker-compose.yml` provisions MongoDB 7 only. The API and client run as separate development processes. The Vite production build produces static client assets.

**NOT IMPLEMENTED:** Production orchestration, infrastructure-as-code, Kubernetes manifests, TLS/reverse-proxy configuration, secrets vault, backup/restore plan, monitoring/alerting, high availability, disaster recovery, deployment CI/CD, or a supported production topology. Production use requires a separate security and operations design.

## 29. Local Development

Documented project prerequisites are Node.js 22+, npm, and MongoDB 7+. `npm run dev` starts the Vite client on port 5173 and API on port 4000; the Compose file can start local MongoDB on port 27017. Configure `JWT_SECRET` (at least 32 bytes) and appropriate environment variables before API startup. `npm run seed` inserts/upserts demo data and should only be used with an intended development database. `npm run build` builds the client.

Tests are Node's built-in test runner suites in `server/` and selected client utility tests. Passing these tests does not establish production readiness.

## 30. Scalability

**NOT IMPLEMENTED / NOT MEASURED:** Horizontal scaling strategy, performance/load testing, database sharding, cache policy, durable distributed events, API quotas beyond login attempt limiting, or service-level objectives. The current server includes an in-process event bus; it is not a distributed event system. No capacity or latency guarantee is claimed.

## 31. Security Considerations

Implemented controls include bcrypt password hashing, JWT signing and server-side session revocation checks, HttpOnly cookies, CSRF origin/token validation for cookie-authenticated writes, login rate limiting, CORS origin allowlisting, route RBAC, role-specific data projection, and encrypted local offline survey records.

Security gaps and operating requirements include production secret/key lifecycle, dependency and infrastructure management, comprehensive security testing, external penetration testing, privacy/legal review, secure deployment, database backup/access policies, and an organization-wide incident response process. Do not put sensitive or real citizen data into this prototype without an approved security and privacy assessment. Development error responses may include stack details; production configuration should be used for deployment.

## 32. Limitations

- Records and most workflows are local, seeded, or demo data, not authoritative state/department data.
- State adapters and canonical mappings are prototypes; legal equivalence is not established.
- ULPIN lookup checks format and local uniqueness only; no official generation/verification exists.
- Geometry, tax, utilities, planning, restrictions, registration, and ownership may be missing or illustrative.
- GIS zoning is not a separate authoritative zoning dataset; basemaps rely on external tile services.
- RCCMS, transactions, subdivisions, audit trails, and field-review actions are application prototypes without external legal effect.
- Satellite change-detection values are simulated; decision-support rules are not ML and have no measured predictive accuracy.
- Sepolia anchoring is optional; local workflow hashes do not establish blockchain records.
- Accessibility, standards conformance, scale, uptime, and production security have not been certified or measured.
- The user interface and permission labels do not establish government approval, staff identity, statutory authority, or legal status.
