import { Router } from "express";
import {
  addParcelWorkflow,
  approveSubdivision,
  createBankLien,
  getParcelDetail,
  getParcelQr,
  getParcelVerification,
  listParcels,
  recommendAiInspection,
  releaseBankLien,
  simulateSroDeedFastTrack,
  subdivideParcel
} from "../controllers/parcelController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", listParcels);
router.get("/:parcelId", getParcelDetail);
router.get("/:parcelId/verification", getParcelVerification);
router.get("/:parcelId/qr", getParcelQr);

// Workflow & Anti-Fraud Actions
router.post("/:parcelId/workflow", addParcelWorkflow);
router.post("/:parcelId/sro-fast-track", requireRole(["sro", "admin"]), simulateSroDeedFastTrack);

// Surveyor & Subdivision Actions
router.post("/:parcelId/subdivide", requireRole(["surveyor", "admin"]), subdivideParcel);
router.post("/:parcelId/subdivision/approve", requireRole(["revenue_officer", "admin"]), approveSubdivision);

// Bank & Lien Actions
router.post("/:parcelId/bank-lien", requireRole(["bank", "admin"]), createBankLien);
router.post("/:parcelId/release-lien", requireRole(["bank", "admin"]), releaseBankLien);

// AI & Inspection Actions
router.post("/:parcelId/ai-inspection-recommend", requireRole(["revenue_officer", "admin"]), recommendAiInspection);

export default router;
