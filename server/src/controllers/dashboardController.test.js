import assert from "node:assert/strict";
import test from "node:test";
import { Parcel } from "../models/Parcel.js";
import { RccmsCase } from "../models/RccmsCase.js";
import { getDashboard } from "./dashboardController.js";

const parcelRecords = [{
  parcelId: "PARCEL-1",
  state: "Tamil Nadu",
  district: "Kanchipuram",
  landUse: "Agricultural",
  disputeRecord: {},
  departmentalWorkflows: [],
  subdivisionData: { subdivisions: [] },
  aiGeospatial: {},
  additionalLayers: {},
  essentialLayers: {}
}];

const makeQuery = (records) => ({
  select() { return this; },
  sort() { return this; },
  lean: async () => records
});

const makeResponse = () => ({
  body: null,
  json(body) {
    this.body = body;
    return this;
  }
});

const invoke = async (handler, req, res) => {
  let error;
  await handler(req, res, (nextError) => { error = nextError; });
  if (error) throw error;
};

test("returns role-scoped summaries to staff without parcel directory details", async (t) => {
  t.mock.method(Parcel, "find", () => makeQuery(parcelRecords));
  t.mock.method(RccmsCase, "find", () => makeQuery([]));
  const res = makeResponse();

  await invoke(getDashboard, { user: { role: "surveyor" } }, res);

  assert.equal(res.body.role, "surveyor");
  assert.equal(res.body.metrics.totalParcels, 1);
  assert.equal("subdivisions" in res.body.metrics, true);
  assert.equal("pendingRegistrations" in res.body.metrics, false);
  assert.equal("featuredParcels" in res.body, false);
  assert.equal(res.body.authoritative, false);
});

test("includes the parcel directory only in the administrator dashboard response", async (t) => {
  t.mock.method(Parcel, "find", () => makeQuery(parcelRecords));
  t.mock.method(RccmsCase, "find", () => makeQuery([]));
  const res = makeResponse();

  await invoke(getDashboard, { user: { role: "admin" } }, res);

  assert.equal(res.body.metrics.totalParcels, 1);
  assert.equal(res.body.featuredParcels.length, 1);
  assert.equal(res.body.featuredParcels[0].parcelId, "PARCEL-1");
});
