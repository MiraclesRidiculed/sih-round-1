import { Router } from "express";
import { addParcelWorkflow, getParcelDetail, getParcelQr, getParcelVerification, listParcels } from "../controllers/parcelController.js";

const router = Router();

router.get("/", listParcels);
router.get("/:parcelId", getParcelDetail);
router.get("/:parcelId/verification", getParcelVerification);
router.get("/:parcelId/qr", getParcelQr);
router.post("/:parcelId/workflow", addParcelWorkflow);

export default router;

