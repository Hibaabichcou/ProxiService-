import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config/env.js";

const allowedOrigin = "https://hibaabichcou.github.io";
let app;

before(() => {
  app = createApp(loadConfig({
    NODE_ENV: "test",
    FRONTEND_ORIGINS: allowedOrigin,
    RATE_LIMIT_WINDOW_MS: "60000",
    RATE_LIMIT_MAX: "100",
  }));
});

after(() => {
  app = undefined;
});

describe("API security and health", () => {
  it("returns an API health response", async () => {
    const response = await request(app).get("/api/health").expect(200);
    assert.equal(response.body.status, "ok");
    assert.equal(response.body.service, "proxiservice-api");
    assert.equal(Number.isNaN(Date.parse(response.body.timestamp)), false);
  });

  it("sets Helmet headers and does not expose Express", async () => {
    const response = await request(app).get("/api/health").expect(200);
    assert.equal(response.headers["x-content-type-options"], "nosniff");
    assert.equal(response.headers["x-powered-by"], undefined);
  });

  it("allows only configured browser origins", async () => {
    const allowed = await request(app)
      .get("/api/health")
      .set("Origin", allowedOrigin)
      .expect(200);
    assert.equal(allowed.headers["access-control-allow-origin"], allowedOrigin);

    const denied = await request(app)
      .get("/api/health")
      .set("Origin", "https://untrusted.example")
      .expect(403);
    assert.equal(denied.headers["access-control-allow-origin"], undefined);
  });

  it("rejects oversized JSON requests", async () => {
    const response = await request(app)
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send({ payload: "x".repeat(11 * 1024) })
      .expect(413);
    assert.equal(response.body.error.message, "Request body exceeds the allowed size.");
  });

  it("rejects wildcard and non-HTTPS production origins", () => {
    assert.throws(
      () => loadConfig({ NODE_ENV: "test", FRONTEND_ORIGINS: "*" }),
      /exact origins/,
    );
    assert.throws(
      () => loadConfig({
        NODE_ENV: "production",
        FRONTEND_ORIGINS: "http://example.com",
        OPENAI_API_KEY: "test-key",
      }),
      /must use HTTPS/,
    );
    assert.throws(
      () => loadConfig({
        NODE_ENV: "test",
        FRONTEND_ORIGINS: allowedOrigin,
        PORT: "70000",
      }),
      /between 1 and 65535/,
    );
  });
});
