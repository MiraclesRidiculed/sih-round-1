import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { demoUsersList } from "../middleware/authMiddleware.js";
import { env } from "../config/env.js";
import { generateToken } from "../utils/jwt.js";
import { clearAuthCookies, setAuthCookies } from "../utils/authCookies.js";
import { createSession, revokeSession } from "../services/sessionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const REVOKED_PUBLIC_DEMO_PASSWORD = "Demo@2026";
const dummyPasswordHash = bcrypt.hash(randomBytes(32).toString("hex"), 10);

/**
 * Institutional Login Handler.
 * Authenticates via email and password (or quick role identifier for official testing personas).
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (typeof password !== "string" || !password || password.length > 1024) {
      return res.status(400).json({
        error: "MISSING_CREDENTIALS",
        message: "A valid password is required for authentication."
      });
    }

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const user = normalizedEmail.length <= 254 && normalizedEmail
      ? await User.findOne({ email: normalizedEmail })
      : null;

    if (user) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch || password === REVOKED_PUBLIC_DEMO_PASSWORD) {
        return res.status(401).json({
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password."
        });
      }

      user.lastLoginAt = new Date();
      await user.save();

      const token = generateToken(user);
      await revokeSession(req.user?.jti);
      await createSession(token, user._id);
      setAuthCookies(res, token);

      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          designation: user.designation,
          jurisdiction: user.jurisdiction
        },
        message: `Welcome back, ${user.name}`
      });
    }

    await bcrypt.compare(password, await dummyPasswordHash);
    return res.status(401).json({
      error: "INVALID_CREDENTIALS",
      message: "Invalid email or password."
    });
  } catch (error) {
    console.error("Login authentication error:", error);
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "An internal error occurred during authentication."
    });
  }
};

export const logout = asyncHandler(async (req, res) => {
  await revokeSession(req.user?.jti);
  clearAuthCookies(res);
  res.status(204).end();
});

/**
 * Return current authenticated session details from decoded JWT.
 */
export const getCurrentUser = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "No active session found."
    });
  }

  res.json({
    user: req.user
  });
};

/**
 * List available demo roles and current active session.
 */
export const getRolesAndUsers = (req, res) => {
  res.json({
    activeUser: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role
    },
    availableRoles: demoUsersList.map(({ id, name, role, designation, department }) => ({
      id,
      name,
      role,
      designation,
      department
    }))
  });
};

/**
 * Switch persona session and issue a cryptographically signed JWT token for the target role.
 */
export const switchUserRole = asyncHandler(async (req, res) => {
  if (env.nodeEnv === "production") {
    return res.status(403).json({
      error: "ROLE_SWITCH_DISABLED",
      message: "Demo role switching is not available in production."
    });
  }

  const { role } = req.body;
  const user = demoUsersList.find((u) => u.role === role);

  if (!user) {
    return res.status(400).json({
      error: "UNKNOWN_ROLE",
      message: `Unknown role: ${role}`
    });
  }

  // Issue a signed session cookie for the selected demo persona.
  const token = generateToken(user);
  await revokeSession(req.user?.jti);
  await createSession(token, user.id);
  setAuthCookies(res, token);

  res.json({
    user,
    message: `Session switched to ${user.name} (${user.designation})`
  });
});
