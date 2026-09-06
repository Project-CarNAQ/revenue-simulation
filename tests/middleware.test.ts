import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";

describe("Middleware Authentication & CORS", () => {
  const originalKey = process.env.SIMULATION_API_KEY;

  beforeEach(() => {
    process.env.SIMULATION_API_KEY = "test-secret-key-123";
  });

  afterEach(() => {
    process.env.SIMULATION_API_KEY = originalKey;
  });

  it("rejects requests missing Authorization header with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/config", {
      method: "GET",
    });

    const res = middleware(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Missing or malformed");
  });

  it("rejects requests with invalid token with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/config", {
      method: "GET",
      headers: {
        Authorization: "Bearer wrong-key",
      },
    });

    const res = middleware(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("Invalid API key");
  });

  it("allows requests with valid Bearer token", async () => {
    const req = new NextRequest("http://localhost:3000/api/config", {
      method: "GET",
      headers: {
        Authorization: "Bearer test-secret-key-123",
      },
    });

    const res = middleware(req);
    // Should proceed to next()
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeDefined();
  });

  it("handles preflight OPTIONS requests with 204", async () => {
    const req = new NextRequest("http://localhost:3000/api/config", {
      method: "OPTIONS",
    });

    const res = middleware(req);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });
});
