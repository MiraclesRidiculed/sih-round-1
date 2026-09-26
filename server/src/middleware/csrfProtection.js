import { timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME, parseCookies } from "../utils/authCookies.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const allowedOrigins = new Set([env.clientUrl, ...env.clientOrigins]);

export const csrfProtection = (req, res, next) => {
  if (safeMethods.has(req.method)) return next();

  const cookies = parseCookies(req.headers.cookie);
  if (!cookies[SESSION_COOKIE_NAME]) return next();

  const origin = req.get("origin");
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = req.get("x-csrf-token");
  if (
    !origin ||
    !allowedOrigins.has(origin) ||
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string" ||
    cookieToken.length !== headerToken.length ||
    !timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))
  ) {
    return res.status(403).json({
      error: "CSRF_VALIDATION_FAILED",
      message: "The request origin or CSRF token is invalid."
    });
  }

  next();
};
