import { Router } from "express";
import { fileCase, getCase, getDisputeDetails, issueCourtInjunction, liftCourtInjunction, transitionCase } from "../controllers/courtController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/:parcelId/disputes", authenticateToken, requireRole(["court", "admin"]), getDisputeDetails);
router.post("/:parcelId/cases", authenticateToken, requireRole(["court", "admin"]), fileCase);
router.get("/cases/:caseIdentifier", authenticateToken, requireRole(["court", "admin"]), getCase);
router.post("/cases/:caseIdentifier/transitions", authenticateToken, requireRole(["court", "admin"]), transitionCase);
router.post("/:parcelId/injunction", authenticateToken, requireRole(["court", "admin"]), issueCourtInjunction);
router.post("/:parcelId/lift-injunction", authenticateToken, requireRole(["court", "admin"]), liftCourtInjunction);

export default router;
