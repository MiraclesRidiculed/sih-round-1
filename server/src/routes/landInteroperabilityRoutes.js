import { Router } from "express";
import {
  getInteroperabilityParcel,
  getInteroperabilityParcelModule,
  interoperabilityErrorHandler,
  interoperabilityNotFoundHandler
} from "../controllers/landInteroperabilityController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";

const router = Router();
const allowedRoles = ["admin", "revenue_officer", "surveyor", "sro", "court", "bank", "citizen"];

router.use(authenticateToken, requireRole(allowedRoles));
router.get("/parcels/:ulpin", getInteroperabilityParcel);
router.get("/parcels/:ulpin/:module", getInteroperabilityParcelModule);
router.use(interoperabilityNotFoundHandler);
router.use(interoperabilityErrorHandler);

export default router;
