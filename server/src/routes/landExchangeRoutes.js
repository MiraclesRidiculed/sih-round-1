import { Router } from "express";
import { lookupNationalLandRecord, searchNationalLandRecords } from "../controllers/landExchangeController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// This endpoint queries only local seeded adapter data. It does not call state
// or national government production systems.
router.get("/land-record", authenticateToken, requireRole(["admin"]), lookupNationalLandRecord);
router.get("/land-records", authenticateToken, requireRole(["admin"]), searchNationalLandRecords);

export default router;
