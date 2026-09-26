import { Router } from "express";
import { getStreamStatus, handleSseStream, simulateDpiEvent } from "../controllers/streamController.js";

const router = Router();

router.get("/", handleSseStream);
router.get("/status", getStreamStatus);
router.post("/simulate", simulateDpiEvent);

export default router;
