import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { gestiuniRoutes } from "./routes/gestiuni";
import { surseFinantareRoutes } from "./routes/surse-finantare";
import { clasificariRoutes } from "./routes/clasificari";
import { conturiRoutes } from "./routes/conturi";
import { locuriRoutes } from "./routes/locuri";
import { tipuriDocumentRoutes } from "./routes/tipuri-document";
import { mijloaceFixeRoutes } from "./routes/mijloace-fixe";
import { operatiuniRoutes } from "./routes/operatiuni";
import { amortizariRoutes } from "./routes/amortizari";
import { rapoarteRoutes } from "./routes/rapoarte";
import { authMiddleware } from "./middleware/auth";

const app = new Hono();

// Middleware
app.use("/*", cors());

// Apply auth middleware to all /api/* routes
// Middleware skips /api/auth/login, /api/auth/logout, /api/health internally
app.use("/api/*", authMiddleware);

// Routes - auth routes first (before other /api/* routes)
app.route("/api/health", healthRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/gestiuni", gestiuniRoutes);
app.route("/api/surse-finantare", surseFinantareRoutes);
app.route("/api/clasificari", clasificariRoutes);
app.route("/api/conturi", conturiRoutes);
app.route("/api/locuri", locuriRoutes);
app.route("/api/tipuri-document", tipuriDocumentRoutes);
app.route("/api/mijloace-fixe", mijloaceFixeRoutes);
app.route("/api/operatiuni", operatiuniRoutes);
app.route("/api/amortizari", amortizariRoutes);
app.route("/api/rapoarte", rapoarteRoutes);

// Root route
app.get("/", (c) => {
  return c.json({ message: "MiFix API", version: "1.0.0" });
});

export default {
  port: 3000,
  fetch: app.fetch,
};
