import { Router } from "express";
import { getCurrentUser, getRolesAndUsers, login, logout, switchUserRole } from "../controllers/authController.js";
import { authenticateToken, requireRole } from "../middleware/authMiddleware.js";
import { loginRateLimit } from "../middleware/loginRateLimit.js";

const router = Router();

router.post("/login", loginRateLimit, login);
router.post("/logout", authenticateToken, logout);
router.get("/roles", authenticateToken, requireRole(["admin"]), getRolesAndUsers);
router.get("/me", authenticateToken, getCurrentUser);
router.post("/switch-role", authenticateToken, requireRole(["admin"]), switchUserRole);

export default router;
