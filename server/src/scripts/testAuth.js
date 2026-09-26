import assert from "node:assert";
import jwt from "jsonwebtoken";
import { connectMongo } from "../config/db.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { deriveDemoUserPassword } from "../utils/demoSeedCredentials.js";
import { generateToken, verifyToken } from "../utils/jwt.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";
import axios from "axios";

const API_BASE = `http://localhost:${env.port}/api`;
const adminPassword = deriveDemoUserPassword("admin@landstack.gov.in");
const citizenPassword = deriveDemoUserPassword("ananya.citizen@gmail.com");
const getSession = (response) => {
  const cookies = response.headers["set-cookie"] || [];
  const csrfPair = cookies.map((cookie) => cookie.split(";")[0]).find((cookie) => cookie.startsWith("landstack_csrf="));
  assert.ok(csrfPair, "Login must set a CSRF cookie.");
  return {
    cookie: cookies.map((cookie) => cookie.split(";")[0]).join("; "),
    csrfToken: csrfPair.slice("landstack_csrf=".length)
  };
};

const runTests = async () => {
  console.log("=== STARTING BACKEND AUTHENTICATION TEST SUITE ===");
  await connectMongo();

  // Test 1: Password hashing via User model pre-save hook
  console.log("TEST 1: Password hashing & double-hashing prevention...");
  const testEmail = `test_officer_${Date.now()}@test.gov.in`;
  const rawPassword = "SecurePassword@2026";

  const user = new User({
    name: "Test Verification Officer",
    email: testEmail,
    role: "revenue_officer",
    department: "Survey & Revenue",
    passwordHash: rawPassword
  });

  await user.save();
  assert.ok(user.passwordHash.startsWith("$2a$") || user.passwordHash.startsWith("$2b$"), "Password should be bcrypt hashed on save");
  const firstHash = user.passwordHash;

  // Double hashing prevention check: saving again shouldn't re-hash an existing bcrypt hash
  user.name = "Test Verification Officer Updated";
  await user.save();
  assert.strictEqual(user.passwordHash, firstHash, "Password should NOT be double-hashed on subsequent saves");
  console.log("✓ TEST 1 PASSED: Hashing and double-hash prevention verified.");

  // Test 2: Password comparison (valid and invalid)
  console.log("TEST 2: Password comparison...");
  const matchValid = await user.comparePassword(rawPassword);
  assert.strictEqual(matchValid, true, "comparePassword should return true for correct password");

  const matchInvalid = await user.comparePassword("WrongPassword123");
  assert.strictEqual(matchInvalid, false, "comparePassword should return false for wrong password");
  console.log("✓ TEST 2 PASSED: Password comparison verified.");

  // Test 3: JWT token generation and signature verification
  console.log("TEST 3: JWT generation and signature verification...");
  const token = generateToken(user);
  assert.ok(typeof token === "string" && token.length > 20, "JWT token must be a non-empty string");

  const decoded = verifyToken(token);
  assert.strictEqual(decoded.email, testEmail, "Decoded token email must match user email");
  assert.strictEqual(decoded.role, "revenue_officer", "Decoded token role must match user role");
  console.log("✓ TEST 3 PASSED: JWT generation and payload verification passed.");

  // Test 4: Invalid and tampered JWT token handling
  console.log("TEST 4: Tampered/invalid JWT handling...");
  let invalidCaught = false;
  try {
    verifyToken("tampered.fake.token");
  } catch (err) {
    invalidCaught = true;
  }
  assert.strictEqual(invalidCaught, true, "verifyToken must throw error on tampered token");
  console.log("✓ TEST 4 PASSED: Invalid JWT throws verification error.");

  // Test 5: Middleware - Missing Authorization Header (HTTP 401)
  console.log("TEST 5: Middleware missing Authorization header...");
  let missingStatus = null;
  let missingPayload = null;
  const mockReqMissing = { headers: {} };
  const mockResMissing = {
    status: (code) => {
      missingStatus = code;
      return {
        json: (data) => {
          missingPayload = data;
        }
      };
    }
  };
  authenticateToken(mockReqMissing, mockResMissing, () => {});
  assert.strictEqual(missingStatus, 401, "Missing Authorization header must return HTTP 401");
  assert.strictEqual(missingPayload.error, "UNAUTHORIZED");
  console.log("✓ TEST 5 PASSED: Missing token yields HTTP 401.");

  // Test 6: Middleware - Invalid Bearer Token (HTTP 401)
  console.log("TEST 6: Middleware invalid Bearer token...");
  let invalidStatus = null;
  const mockReqInvalid = { headers: { authorization: "Bearer invalid_signature_token" } };
  const mockResInvalid = {
    status: (code) => {
      invalidStatus = code;
      return { json: () => {} };
    },
    clearCookie: () => {}
  };
  authenticateToken(mockReqInvalid, mockResInvalid, () => {});
  assert.strictEqual(invalidStatus, 401, "Invalid Bearer token must return HTTP 401");
  console.log("✓ TEST 6 PASSED: Invalid token yields HTTP 401.");

  // Test 7: Middleware - Role-Based Access Control (HTTP 403 on insufficient privilege)
  console.log("TEST 7: Middleware role authorization (403 on insufficient privilege)...");
  let forbiddenStatus = null;
  let forbiddenPayload = null;
  const mockReqForbidden = {
    user: { id: "test-user-id", role: "citizen", jti: "test-session" },
    headers: { authorization: `Bearer ${token}` }
  };
  const mockResForbidden = {
    status: (code) => {
      forbiddenStatus = code;
      return {
        json: (data) => {
          forbiddenPayload = data;
        }
      };
    }
  };
  const guardCourtOnly = requireRole(["court", "admin"]);
  guardCourtOnly(mockReqForbidden, mockResForbidden, () => {});
  assert.strictEqual(forbiddenStatus, 403, "Citizen role attempting court operation must yield HTTP 403");
  assert.strictEqual(forbiddenPayload.error, "ACCESS_RESTRICTED");
  console.log("✓ TEST 7 PASSED: Insufficient role correctly yields HTTP 403.");

  // Test 8: Middleware - Sufficient role succeeds
  console.log("TEST 8: Middleware role authorization (Sufficient role succeeds)...");
  let nextCalled = false;
  const mockReqAllowed = {
    user: { id: "test-user-id", role: "admin", jti: "test-session" },
    headers: { authorization: `Bearer ${token}` }
  };
  guardCourtOnly(mockReqAllowed, {}, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true, "Admin role must pass guardCourtOnly");
  console.log("✓ TEST 8 PASSED: Authorized role passes through to next().");

  // Test 9: HTTP Integration via Axios against running Express server
  console.log("TEST 9: HTTP API Integration tests against running server...");

  // 9a: Login with valid credentials
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: "admin@landstack.gov.in",
    password: adminPassword
  });
  assert.strictEqual(loginRes.status, 200);
  assert.equal("token" in loginRes.data, false, "Login must not expose JWT tokens to JavaScript.");
  assert.strictEqual(loginRes.data.user.role, "admin");
  const adminSession = getSession(loginRes);
  console.log("  ✓ 9a: POST /api/auth/login with valid credentials succeeded.");

  // 9b: Login with invalid password fails with 401
  let badLoginStatus = null;
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@landstack.gov.in",
      password: "WrongPassword999"
    });
  } catch (err) {
    badLoginStatus = err.response?.status;
  }
  assert.strictEqual(badLoginStatus, 401, "Invalid password must return HTTP 401");
  console.log("  ✓ 9b: POST /api/auth/login with bad password returned HTTP 401.");

  // 9c: GET /api/auth/me with valid Bearer token
  const meRes = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Cookie: adminSession.cookie }
  });
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.data.user.role, "admin");
  console.log("  ✓ 9c: GET /api/auth/me with Bearer token authenticated successfully.");

  // 9d: GET /api/auth/me without token returns 401
  let meMissingStatus = null;
  try {
    await axios.get(`${API_BASE}/auth/me`);
  } catch (err) {
    meMissingStatus = err.response?.status;
  }
  assert.strictEqual(meMissingStatus, 401, "GET /api/auth/me without token must return HTTP 401");
  console.log("  ✓ 9d: GET /api/auth/me without token returned HTTP 401.");

  // 9e: Sensitive endpoint (e.g. POST /api/court/:parcelId/injunction) with citizen token returns 403
  const citizenLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: "ananya.citizen@gmail.com",
    password: citizenPassword
  });
  const citizenSession = getSession(citizenLogin);

  let forbiddenApiStatus = null;
  try {
    await axios.post(
      `${API_BASE}/court/TN-KPM-0001/injunction`,
      { injunctionTerms: "Unauthorized test" },
      {
        headers: {
          Cookie: citizenSession.cookie,
          Origin: env.clientUrl,
          "X-CSRF-Token": citizenSession.csrfToken
        }
      }
    );
  } catch (err) {
    forbiddenApiStatus = err.response?.status;
  }
  assert.strictEqual(forbiddenApiStatus, 403, "Citizen token attempting court injunction must return HTTP 403");
  console.log("  ✓ 9e: Sensitive court endpoint blocked citizen with HTTP 403.");

  for (const session of [adminSession, citizenSession]) {
    await axios.post(`${API_BASE}/auth/logout`, {}, {
      headers: {
        Cookie: session.cookie,
        Origin: env.clientUrl,
        "X-CSRF-Token": session.csrfToken
      }
    });
  }

  // Clean up test user
  await User.deleteOne({ email: testEmail });

  console.log("=== ALL 9 AUTHENTICATION TESTS PASSED SUCCESSFULLY! ===");
  process.exit(0);
};

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
