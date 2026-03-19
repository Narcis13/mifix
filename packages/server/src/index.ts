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
import { provenientaRoutes } from "./routes/provenienta";
import { tipuriStocRoutes } from "./routes/tipuri-stoc";
import { unitatiMasuraRoutes } from "./routes/unitati-masura";
import { mijloaceFixeRoutes } from "./routes/mijloace-fixe";
import { operatiuniRoutes } from "./routes/operatiuni";
import { operatiuniHeaderRoutes } from "./routes/operatiuni-header";
import { amortizariRoutes } from "./routes/amortizari";
import { rapoarteRoutes } from "./routes/rapoarte";
import { verificareRoutes } from "./routes/verificare";
import { dispozitiveMedicaleRoutes } from "./routes/dispozitive-medicale";
import { authMiddleware } from "./middleware/auth";
import { getAppVersionInfo } from "./config/app-version";

const app = new Hono();

// CORS - in production, restrict to client origin
const allowedOrigin = process.env.CORS_ORIGIN || "*";
app.use(
  "/*",
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

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
app.route("/api/provenienta", provenientaRoutes);
app.route("/api/tipuri-stoc", tipuriStocRoutes);
app.route("/api/unitati-masura", unitatiMasuraRoutes);
app.route("/api/mijloace-fixe", mijloaceFixeRoutes);
app.route("/api/operatiuni", operatiuniRoutes);
app.route("/api/operatiuni-acte", operatiuniHeaderRoutes);
app.route("/api/amortizari", amortizariRoutes);
app.route("/api/rapoarte", rapoarteRoutes);
app.route("/api/verificare", verificareRoutes);
app.route("/api/dispozitive-medicale", dispozitiveMedicaleRoutes);

// Root route
app.get("/", async (c) => {
  const { version } = await getAppVersionInfo();
  return c.json({ message: "MiFix API", version });
});

const port = parseInt(process.env.PORT || "3000");

export default {
  port,
  fetch: app.fetch,
};
