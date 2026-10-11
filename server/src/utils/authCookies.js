import { randomBytes } from "node:crypto";
import { env } from "../config/env.js";

export const SESSION_COOKIE_NAME = "landstack_session";
export const CSRF_COOKIE_NAME = "landstack_csrf";

const cookieOptions = (httpOnly) => ({
  httpOnly,
  secure: env.nodeEnv !== "development" || env.cookieSameSite === "none",
  sameSite: env.cookieSameSite,
  path: "/"
});

export const setAuthCookies = (res, token) => {
  res.cookie(SESSION_COOKIE_NAME, token, cookieOptions(true));
  res.cookie(CSRF_COOKIE_NAME, randomBytes(32).toString("base64url"), cookieOptions(false));
};

export const clearAuthCookies = (res) => {
  res.clearCookie(SESSION_COOKIE_NAME, cookieOptions(true));
  res.clearCookie(CSRF_COOKIE_NAME, cookieOptions(false));
};

export const parseCookies = (cookieHeader = "") =>
  Object.fromEntries(
    cookieHeader.split(";").flatMap((part) => {
      const separator = part.indexOf("=");
      if (separator < 1) return [];
      const name = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      return name && value ? [[name, value]] : [];
    })
  );
