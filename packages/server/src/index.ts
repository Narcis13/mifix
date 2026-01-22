import { Hono } from "hono";
import { cors } from "hono/cors";
import type { HealthResponse, ApiResponse } from "shared";

const app = new Hono();

// Middleware
app.use("/*", cors());

// Health check endpoint
app.get("/api/health", (c) => {
  const response: ApiResponse<HealthResponse> = {
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  };
  return c.json(response);
});

// Root endpoint
app.get("/", (c) => {
  return c.json({ message: "MiFix API Server" });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
