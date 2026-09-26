import { Router } from "express";
import { getStreamStatus, handleSseStream, simulateDpiEvent } from "../controllers/streamController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticateToken, requireRole(["admin"]), handleSseStream);
router.get("/status", getStreamStatus);
router.post("/simulate", authenticateToken, requireRole(["admin", "revenue_officer", "surveyor", "sro"]), simulateDpiEvent);

export default router;
