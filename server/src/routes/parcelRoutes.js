import { Router } from "express";
import { getParcelDetail, getParcelQr, getParcelVerification, listParcels } from "../controllers/parcelController.js";

const router = Router();

router.get("/", listParcels);
router.get("/:parcelId", getParcelDetail);
router.get("/:parcelId/verification", getParcelVerification);
router.get("/:parcelId/qr", getParcelQr);

export default router;

