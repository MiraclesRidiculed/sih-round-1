import assert from "node:assert/strict";
import express from "express";
import { test } from "node:test";
import { loginRateLimit } from "../middleware/loginRateLimit.js";

test("throttles repeated unsuccessful login attempts", async () => {
  const app = express();
  app.post("/login", loginRateLimit, (_req, res) => res.status(401).json({ error: "INVALID_CREDENTIALS" }));
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const address = server.address();
    const url = `http://127.0.0.1:${address.port}/login`;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await fetch(url, { method: "POST" });
      assert.equal(response.status, 401);
    }
    const limited = await fetch(url, { method: "POST" });
    assert.equal(limited.status, 429);
    assert.equal((await limited.json()).error, "LOGIN_RATE_LIMITED");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
