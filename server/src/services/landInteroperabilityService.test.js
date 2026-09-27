import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessInteroperabilityModule,
  createInteroperabilityError,
  createInteroperabilityResponse,
  INTEROPERABILITY_MODULES
} from "./landInteroperabilityService.js";

test("builds a consistent local-prototype response envelope with ULPIN metadata", () => {
  const response = createInteroperabilityResponse({
    data: { schemaVersion: 1 },
    ulpin: "33030400100482",
    role: "citizen",
    now: new Date("2026-09-27T00:00:00.000Z")
  });

  assert.deepEqual(response, {
    success: true,
    data: { schemaVersion: 1 },
    meta: {
      api: "land-stack-interoperability",
      version: "1.0",
      generatedAt: "2026-09-27T00:00:00.000Z",
      correlation: { key: "ulpin", value: "33030400100482" },
      source: {
        mode: "local-demo",
        authoritative: false,
        realTime: false,
        disclaimer: "Assembled from local Land Stack records and demonstration seed data; no external government systems are queried."
      },
      access: { role: "citizen", policy: "application-demo-rbac" }
    }
  });
});

test("maps interoperability module paths to existing record modules and enforces module roles", () => {
  assert.equal(INTEROPERABILITY_MODULES.rights, "ror");
  assert.equal(INTEROPERABILITY_MODULES.encumbrances, "encumbrance");
  assert.equal(INTEROPERABILITY_MODULES["change-detection"], "changeDetection");
  assert.equal(INTEROPERABILITY_MODULES["decision-support"], "decisionSupport");
  assert.equal(canAccessInteroperabilityModule("admin", "property-tax"), true);
  assert.equal(canAccessInteroperabilityModule("citizen", "change-detection"), true);
  assert.equal(canAccessInteroperabilityModule("surveyor", "change-detection"), true);
  assert.equal(canAccessInteroperabilityModule("revenue_officer", "decision-support"), true);
  assert.equal(canAccessInteroperabilityModule("citizen", "decision-support"), false);
  assert.equal(canAccessInteroperabilityModule("revenue_officer", "rights"), true);
  assert.equal(canAccessInteroperabilityModule("citizen", "registration"), true);
  assert.equal(canAccessInteroperabilityModule("citizen", "property-tax"), false);
  assert.equal(canAccessInteroperabilityModule("surveyor", "encumbrances"), false);
});

test("formats API errors consistently and does not expose internal error details", () => {
  const response = createInteroperabilityError({
    code: "PARCEL_NOT_FOUND",
    message: "No parcel was found for this ULPIN.",
    ulpin: "missing",
    now: new Date("2026-09-27T00:00:00.000Z")
  });

  assert.deepEqual(response, {
    success: false,
    error: { code: "PARCEL_NOT_FOUND", message: "No parcel was found for this ULPIN." },
    meta: {
      api: "land-stack-interoperability",
      version: "1.0",
      generatedAt: "2026-09-27T00:00:00.000Z",
      correlation: { key: "ulpin", value: "missing" }
    }
  });
  assert.equal("stack" in response, false);
});
