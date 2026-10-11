import { Router } from "express";
import {
  addParcelWorkflow,
  approveSubdivision,
  createBankLien,
  createParcelTransactionApplication,
  getParcelDetail,
  getParcelQr,
  getParcelVerification,
  listParcels,
  recommendAiInspection,
  releaseBankLien,
  submitFieldSurvey,
  subdivideParcel,
  updateParcelTransactionStatus
} from "../controllers/parcelController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticateToken, listParcels);
router.get("/:parcelId", authenticateToken, getParcelDetail);
router.get(
  "/:parcelId/verification",
  authenticateToken,
  requireRole(["admin"]),
  getParcelVerification
);
router.get(
  "/:parcelId/qr",
  authenticateToken,
  requireRole(["admin"]),
  getParcelQr
);

router.post(
  "/:parcelId/workflow",
  authenticateToken,
  requireRole(["admin", "revenue_officer", "surveyor", "sro", "court", "bank", "citizen"]),
  addParcelWorkflow
);
router.post("/:parcelId/field-surveys", authenticateToken, requireRole(["surveyor", "admin"]), submitFieldSurvey);
router.post(
  "/:parcelId/transactions",
  authenticateToken,
  requireRole(["citizen", "sro", "admin"]),
  createParcelTransactionApplication
);
router.patch(
  "/:parcelId/transactions/:transactionId",
  authenticateToken,
  requireRole(["sro", "admin"]),
  updateParcelTransactionStatus
);
router.post("/:parcelId/subdivide", authenticateToken, requireRole(["surveyor", "admin"]), subdivideParcel);
router.post("/:parcelId/subdivision/approve", authenticateToken, requireRole(["revenue_officer", "admin"]), approveSubdivision);
router.post("/:parcelId/bank-lien", authenticateToken, requireRole(["bank", "admin"]), createBankLien);
router.post("/:parcelId/release-lien", authenticateToken, requireRole(["bank", "admin"]), releaseBankLien);
router.post("/:parcelId/ai-inspection-recommend", authenticateToken, requireRole(["revenue_officer", "admin"]), recommendAiInspection);

export default router;