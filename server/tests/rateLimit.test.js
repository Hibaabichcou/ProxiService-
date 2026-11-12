import assert from "node:assert/strict";
import { it } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config/env.js";

it("limits repeated API requests", async () => {
  const app = createApp(loadConfig({
    NODE_ENV: "test",
    FRONTEND_ORIGINS: "https://hibaabichcou.github.io",
    RATE_LIMIT_WINDOW_MS: "60000",
    RATE_LIMIT_MAX: "1",
  }));

  await request(app).get("/api/health").expect(200);
  const limited = await request(app)
    .get("/api/health")
    .expect(429);
  assert.match(limited.body.error.message, /Too many requests/);
});
