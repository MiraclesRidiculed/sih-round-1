import cors from "cors";
import express from "express";
import morgan from "morgan";
import { connectMongo } from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { parseUserContext } from "./middleware/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import courtRoutes from "./routes/courtRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import parcelRoutes from "./routes/parcelRoutes.js";
import streamRoutes from "./routes/streamRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(parseUserContext);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "landstack-dpi-api",
    version: "2026.1",
    blockchainMode: env.blockchainEnabled ? "live" : "demo-ready",
    date: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/court", courtRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/parcels", parcelRoutes);
app.use("/api/verification", verificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  await connectMongo();
  app.listen(env.port, () => {
    console.log(`Land Stack DPI API running on http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
