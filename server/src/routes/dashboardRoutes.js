import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get(
  "/",
  authenticateToken,
  requireRole(["admin", "revenue_officer", "surveyor", "sro", "court", "bank"]),
  getDashboard
);

export default router;
