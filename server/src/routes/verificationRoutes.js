import { Router } from "express";
import {
  anchorDocument,
  blockchainStatus,
  scanParcelQr,
  verifyDocumentHash
} from "../controllers/verificationController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/scan/:parcelId", scanParcelQr);
router.post("/document-hash", verifyDocumentHash);
router.post("/blockchain/anchor-document", authenticateToken, requireRole(["admin"]), anchorDocument);
router.get("/blockchain/status", authenticateToken, blockchainStatus);

export default router;
