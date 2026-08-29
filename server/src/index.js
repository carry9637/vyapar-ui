/* global process */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import googleAuthRoutes from "./routes/googleAuth.js";
import googleBusinessRoutes from "./routes/googleBusiness.js";
import marketingStudioRoutes from "./routes/marketingStudio.js";
import metaAdsRoutes from "./routes/metaAds.js";
import metaAuthRoutes from "./routes/metaAuth.js";
import metaBusinessRoutes from "./routes/metaBusiness.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });
dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 5000;
const DEFAULT_CLIENT_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"];
const CLIENT_ORIGINS = [...(process.env.CLIENT_ORIGIN || "").split(","), ...DEFAULT_CLIENT_ORIGINS]
  .map((origin) => origin.trim())
  .filter(Boolean)
  .filter((origin, index, origins) => origins.indexOf(origin) === index);

app.use(cors({ origin: CLIENT_ORIGINS }));
app.use("/api/marketing-studio", marketingStudioRoutes);
app.use(express.json({ limit: "35mb" }));
app.use("/api/auth", googleAuthRoutes);
app.use("/api/auth", metaAuthRoutes);
app.use("/api/google-business", googleBusinessRoutes);
app.use("/api/meta-business", metaBusinessRoutes);
app.use("/api/meta/ads", metaAdsRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Vyapar backend is running",
  });
});

const server = app.listen(PORT, () => {
  console.log(`Vyapar backend running on port ${PORT}`);
});

server.on("error", (error) => {
  console.error("Vyapar backend failed to start", {
    message: error.message,
  });
});
