import { Router } from "express";
import {
  registerForEvent,
  getParticipants,
} from "../controllers/registration.controller";
import { protect, requireRole } from "../middleware/auth.middleware";

const router = Router();

// only for students - admin cant register to events
router.post("/:id/register", protect, requireRole("student"), registerForEvent);

// only admin can view participants
router.get("/:id/participants", protect, requireRole("admin"), getParticipants);

export default router;
