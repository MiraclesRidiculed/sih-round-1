import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

/**
 * Generate a cryptographically signed JWT for an authenticated user.
 * @param {Object} user - User document or persona object
 * @returns {string} Signed JWT token
 */
export const generateToken = (user) => {
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    department: user.department || "",
    designation: user.designation || "",
    jurisdiction: user.jurisdiction || "National / Multi-State"
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    algorithm: "HS256",
    jwtid: randomUUID()
  });
};

/**
 * Verify a JWT token signature and return the decoded payload.
 * @param {string} token
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
};
