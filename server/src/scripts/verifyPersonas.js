import assert from "node:assert";
import axios from "axios";
import { connectMongo } from "../config/db.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { deriveDemoUserPassword } from "../utils/demoSeedCredentials.js";

const API_BASE = `http://localhost:${env.port}/api`;
const getSession = (response) => {
  const cookies = response.headers["set-cookie"] || [];
  const csrfPair = cookies.map((cookie) => cookie.split(";")[0]).find((cookie) => cookie.startsWith("landstack_csrf="));
  assert.ok(csrfPair, "Login must set a CSRF cookie.");
  return {
    cookie: cookies.map((cookie) => cookie.split(";")[0]).join("; "),
    csrfToken: csrfPair.slice("landstack_csrf=".length)
  };
};

const EXPECTED_PERSONAS = [
  {
    role: "admin",
    name: "Dr. Rameshwar Sharma, IAS",
    designation: "DoLR National Platform Administrator",
    email: "admin@landstack.gov.in"
  },
  {
    role: "revenue_officer",
    name: "K. Annadurai, DRO",
    designation: "Tehsildar / Village Administrative Officer",
    email: "tehsildar@tamilnilam.tn.gov.in"
  },
  {
    role: "surveyor",
    name: "P. Vignesh, LIS",
    designation: "Directorate of Survey & Land Records",
    email: "surveyor@surveyofindia.gov.in"
  },
  {
    role: "sro",
    name: "Meenakshi Sundaram",
    designation: "Sub-Registrar / Registration & Stamps Department",
    email: "sro.sriperumbudur@tnreginet.gov.in"
  },
  {
    role: "court",
    name: "Hon. Justice B. Patil",
    designation: "Revenue Court / RCCMS Judicial Officer",
    email: "rccms.bench@judiciary.gov.in"
  },
  {
    role: "bank",
    name: "Vikram Malhotra",
    designation: "Financial Institution / Core Banking",
    email: "mortgages@iob.bank.in"
  },
  {
    role: "citizen",
    name: "Ananya Narayanan",
    designation: "Public Landholder / Applicant",
    email: "ananya.citizen@gmail.com"
  }
];

const verifyPersonas = async () => {
  console.log("=== VERIFYING DEMO PERSONAS AND SECURE HASHES ===");
  await connectMongo();

  const totalUsers = await User.countDocuments();
  console.log(`1. Total users in database: ${totalUsers}`);
  assert.strictEqual(totalUsers, 7, "Database must contain exactly 7 institutional demo users (no duplicates)");

  for (const expected of EXPECTED_PERSONAS) {
    const demoPassword = deriveDemoUserPassword(expected.email);
    console.log(`\nVerifying Persona: [${expected.role.toUpperCase()}] ${expected.name}...`);

    // A. Verify document exists in MongoDB
    const userDoc = await User.findOne({ email: expected.email });
    assert.ok(userDoc, `User with email ${expected.email} must exist in MongoDB`);
    assert.strictEqual(userDoc.role, expected.role, `Role must be ${expected.role}`);
    assert.strictEqual(userDoc.designation, expected.designation, `Designation must match`);

    // B. Verify password is cryptographically hashed (never plaintext)
    assert.ok(
      userDoc.passwordHash.startsWith("$2a$") || userDoc.passwordHash.startsWith("$2b$"),
      `Password for ${expected.email} must be a bcrypt hash (starts with $2a$ or $2b$), not plaintext`
    );
    assert.notStrictEqual(userDoc.passwordHash, demoPassword, "Password must not be stored in plaintext");

    // C. Verify comparePassword instance method
    const validMatch = await userDoc.comparePassword(demoPassword);
    assert.strictEqual(validMatch, true, "comparePassword must accept the derived account password.");

    const invalidMatch = await userDoc.comparePassword("WrongPassword!123");
    assert.strictEqual(invalidMatch, false, `comparePassword must return false for wrong password`);
    console.log(`  ✓ MongoDB record valid & bcrypt hash verified (${userDoc.passwordHash.substring(0, 15)}...)`);

    // D. Verify HTTP login authentication via /api/auth/login
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: expected.email,
      password: demoPassword
    });

    assert.strictEqual(loginRes.status, 200, "HTTP login must succeed with status 200");
    assert.equal("token" in loginRes.data, false, "HTTP login must not return the JWT to JavaScript.");
    assert.strictEqual(loginRes.data.user.role, expected.role, "Returned user role must match");
    assert.strictEqual(loginRes.data.user.email, expected.email, "Returned email must match");

    // E. Verify the protected identity endpoint using the cookie session.
    const session = getSession(loginRes);
    const currentUser = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Cookie: session.cookie }
    });
    assert.strictEqual(currentUser.data.user.role, expected.role);
    assert.strictEqual(currentUser.data.user.email, expected.email);
    await axios.post(`${API_BASE}/auth/logout`, {}, {
      headers: {
        Cookie: session.cookie,
        Origin: env.clientUrl,
        "X-CSRF-Token": session.csrfToken
      }
    });
    console.log(`  ✓ HTTP /api/auth/login and protected cookie session verified for '${expected.role}'`);
  }

  console.log("\n=== ALL 7 INSTITUTIONAL PERSONAS VERIFIED SUCCESSFULLY! ===");
  process.exit(0);
};

verifyPersonas().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
