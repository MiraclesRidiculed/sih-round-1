import { Router } from "express";
import { getCurrentUser, getRolesAndUsers, switchUserRole } from "../controllers/authController.js";

const router = Router();

router.get("/roles", getRolesAndUsers);
router.get("/me", getCurrentUser);
router.post("/switch-role", switchUserRole);

export default router;
