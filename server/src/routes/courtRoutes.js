import { Router } from "express";
import { getDisputeDetails, issueCourtInjunction, liftCourtInjunction } from "../controllers/courtController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/:parcelId/disputes", getDisputeDetails);
router.post("/:parcelId/injunction", requireRole(["court", "admin"]), issueCourtInjunction);
router.post("/:parcelId/lift-injunction", requireRole(["court", "admin"]), liftCourtInjunction);

export default router;
