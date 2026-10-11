import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { test } from "node:test";

process.env.JWT_SECRET = "security-controls-test-secret-with-at-least-32-bytes";
process.env.DEMO_SEED_PASSWORD = "security-controls-demo-seed-test-secret-material";

const { validateSecurityConfiguration, env } = await import("../config/env.js");
const { authenticateToken, requireRole } = await import("../middleware/authMiddleware.js");
const { csrfProtection } = await import("../middleware/csrfProtection.js");
const { logout, switchUserRole } = await import("../controllers/authController.js");
const { deriveDemoUserPassword } = await import("../utils/demoSeedCredentials.js");
const { Session } = await import("../models/Session.js");
const { setAuthCookies } = await import("../utils/authCookies.js");

const response = () => {
  const result = { statusCode: null, payload: null };
  result.status = (statusCode) => {
    result.statusCode = statusCode;
    return result;
  };
  result.json = (payload) => {
    result.payload = payload;
    return result;
  };
  result.clearCookie = () => result;
  result.end = () => result;
  return result;
};

test("requires configured high-entropy JWT secret material", () => {
  const validSettings = { cookieSameSite: "lax", jwtExpiresIn: "7d" };
  assert.throws(() => validateSecurityConfiguration({ ...validSettings, jwtSecret: "" }), /at least 32 bytes/);
  assert.throws(() => validateSecurityConfiguration({ ...validSettings, jwtSecret: "x".repeat(31) }), /at least 32 bytes/);
  assert.doesNotThrow(() => validateSecurityConfiguration({ ...validSettings, jwtSecret: "x".repeat(32) }));
  assert.throws(() => validateSecurityConfiguration({ ...validSettings, jwtSecret: "x".repeat(32), cookieSameSite: "invalid" }), /COOKIE_SAME_SITE/);
  assert.throws(() => validateSecurityConfiguration({ ...validSettings, jwtSecret: "x".repeat(32), jwtExpiresIn: "30d" }), /JWT_EXPIRES_IN/);
});

test("accepts only a single well-formed Bearer credential", () => {
  for (const authorization of ["Basic abc", "Bearer", "Bearer one two"]) {
    const res = response();
    authenticateToken({ headers: { authorization } }, res, () => assert.fail("Malformed header must not authenticate."));
    assert.equal(res.statusCode, 401);
  }

  const expiredToken = jwt.sign({ id: "user-1", role: "admin" }, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: -1
  });
  const expiredResponse = response();
  authenticateToken(
    { headers: { authorization: `Bearer ${expiredToken}` } },
    expiredResponse,
    () => assert.fail("Expired token must not authenticate.")
  );
  assert.equal(expiredResponse.statusCode, 401);
  assert.equal("details" in expiredResponse.payload, false);
});

test("returns 403 for authenticated users without the required role", () => {
  const res = response();
  requireRole(["admin"])({ user: { id: "citizen-1", role: "citizen", jti: "session-1" } }, res, () => assert.fail("Unauthorized role passed."));
  assert.equal(res.statusCode, 403);
});

test("rejects revoked signed sessions", async () => {
  const originalExists = Session.exists;
  Session.exists = async () => null;
  try {
    const token = jwt.sign({ id: "user-1", role: "admin" }, env.jwtSecret, {
      algorithm: "HS256",
      jwtid: "revoked-session",
      expiresIn: "1m"
    });
    const res = response();
    await authenticateToken({ headers: { authorization: `Bearer ${token}` } }, res, () => {
      assert.fail("Revoked session authenticated.");
    });
    assert.equal(res.statusCode, 401);
  } finally {
    Session.exists = originalExists;
  }
});

test("accepts a signed token only when its database session is active", async () => {
  const originalExists = Session.exists;
  Session.exists = async () => ({ _id: "active-session" });
  try {
    const token = jwt.sign({ id: "user-1", role: "admin" }, env.jwtSecret, {
      algorithm: "HS256",
      jwtid: "active-session",
      expiresIn: "1m"
    });
    const res = response();
    let authenticated = false;
    await authenticateToken({ headers: { authorization: `Bearer ${token}` } }, res, () => {
      authenticated = true;
    });
    assert.equal(authenticated, true);
    assert.equal(res.statusCode, null);

    let cookieAuthenticated = false;
    await authenticateToken({ headers: { cookie: `landstack_session=${token}` } }, response(), () => {
      cookieAuthenticated = true;
    });
    assert.equal(cookieAuthenticated, true);
  } finally {
    Session.exists = originalExists;
  }
});

test("logout revokes the active server-side session", async () => {
  const originalDeleteOne = Session.deleteOne;
  let revokedJti = null;
  Session.deleteOne = async ({ jti }) => {
    revokedJti = jti;
  };
  try {
    await logout({ user: { jti: "logout-session" } }, response(), (error) => {
      if (error) throw error;
    });
    assert.equal(revokedJti, "logout-session");
  } finally {
    Session.deleteOne = originalDeleteOne;
  }
});

test("requires a same-origin double-submit CSRF token for cookie-authenticated writes", () => {
  const token = "csrf-token";
  const invalidResponse = response();
  csrfProtection({
    method: "POST",
    headers: { cookie: `landstack_session=jwt; landstack_csrf=${token}` },
    get: (name) => ({ origin: "http://localhost:5173", "x-csrf-token": "wrong" }[name])
  }, invalidResponse, () => assert.fail("Invalid CSRF request passed."));
  assert.equal(invalidResponse.statusCode, 403);

  let passed = false;
  csrfProtection({
    method: "POST",
    headers: { cookie: `landstack_session=jwt; landstack_csrf=${token}` },
    get: (name) => ({ origin: "http://localhost:5173", "x-csrf-token": token }[name])
  }, response(), () => { passed = true; });
  assert.equal(passed, true);
});

test("marks the session cookie HttpOnly and production cookies Secure", () => {
  const originalNodeEnv = env.nodeEnv;
  env.nodeEnv = "production";
  const cookies = new Map();
  try {
    setAuthCookies({
      cookie: (name, value, options) => cookies.set(name, { value, options })
    }, "test-session-token");
  } finally {
    env.nodeEnv = originalNodeEnv;
  }
  assert.equal(cookies.get("landstack_session").options.httpOnly, true);
  assert.equal(cookies.get("landstack_session").options.secure, true);
  assert.equal(cookies.get("landstack_csrf").options.httpOnly, false);
  assert.equal(cookies.get("landstack_csrf").options.secure, true);
});

test("does not issue demo persona tokens in production", () => {
  const originalNodeEnv = env.nodeEnv;
  env.nodeEnv = "production";
  try {
    const res = response();
    switchUserRole({ body: { role: "admin" } }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.payload.error, "ROLE_SWITCH_DISABLED");
  } finally {
    env.nodeEnv = originalNodeEnv;
  }
});

test("derives different, repeatable demo account passwords from configured secret", () => {
  const first = deriveDemoUserPassword("admin@example.invalid");
  assert.equal(first, deriveDemoUserPassword("ADMIN@example.invalid"));
  assert.notEqual(first, deriveDemoUserPassword("citizen@example.invalid"));
  assert.notEqual(first, env.demoSeedPassword);
});
