import { Router } from "express";
import {
  anchorDocument,
  blockchainStatus,
  scanParcelQr,
  verifyDocumentHash
} from "../controllers/verificationController.js";

const router = Router();

router.post("/scan/:parcelId", scanParcelQr);
router.post("/document-hash", verifyDocumentHash);
router.post("/blockchain/anchor-document", anchorDocument);
router.get("/blockchain/status", blockchainStatus);

export default router;

