import jwt from "jsonwebtoken";
import { Session } from "../models/Session.js";

export const createSession = async (token, userId) => {
  const payload = jwt.decode(token);
  if (typeof payload?.jti !== "string" || !Number.isFinite(payload.exp)) {
    throw new Error("A signed session token with an expiration is required.");
  }

  await Session.create({
    jti: payload.jti,
    userId: String(userId),
    expiresAt: new Date(payload.exp * 1000)
  });
};

export const revokeSession = async (jti) => {
  if (jti) await Session.deleteOne({ jti });
};
