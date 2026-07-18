import { Router } from "express";
import { registerStudent, loginStudent } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { registerSchema, loginSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), registerStudent);
router.post("/login", validate(loginSchema), loginStudent);

export default router;
