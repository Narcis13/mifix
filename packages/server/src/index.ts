import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./routes/health";

const app = new Hono();

// Middleware
app.use("/*", cors());

// Routes
app.route("/api/health", healthRoutes);

// Root route
app.get("/", (c) => {
  return c.json({ message: "MiFix API", version: "1.0.0" });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
