import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./routes/health";
import { gestiuniRoutes } from "./routes/gestiuni";
import { surseFinantareRoutes } from "./routes/surse-finantare";
import { clasificariRoutes } from "./routes/clasificari";

const app = new Hono();

// Middleware
app.use("/*", cors());

// Routes
app.route("/api/health", healthRoutes);
app.route("/api/gestiuni", gestiuniRoutes);
app.route("/api/surse-finantare", surseFinantareRoutes);
app.route("/api/clasificari", clasificariRoutes);

// Root route
app.get("/", (c) => {
  return c.json({ message: "MiFix API", version: "1.0.0" });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
