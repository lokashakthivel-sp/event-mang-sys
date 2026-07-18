import { Router } from "express";
import { registerStudent, loginStudent } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { registerSchema, loginSchema } from "../validators/auth.validator";

const router = Router();

// only for students
router.post("/register", validate(registerSchema), registerStudent);

// for both students and admin
router.post("/login", validate(loginSchema), loginStudent);

export default router;
