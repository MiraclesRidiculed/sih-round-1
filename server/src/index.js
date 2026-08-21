import cors from "cors";
import express from "express";
import morgan from "morgan";
import { connectMongo } from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import parcelRoutes from "./routes/parcelRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "karnataka-landchain-api",
    blockchainMode: env.blockchainEnabled ? "live" : "demo-ready",
    date: new Date().toISOString()
  });
});

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/parcels", parcelRoutes);
app.use("/api/verification", verificationRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  await connectMongo();
  app.listen(env.port, () => {
    console.log(`Karnataka Landchain API running on http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

