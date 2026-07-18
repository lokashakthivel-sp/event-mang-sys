import { Router } from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller";
import { protect, requireRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createEventSchema,
  updateEventSchema,
} from "../validators/event.validator";

const router = Router();

// Public
router.get("/", getAllEvents);
router.get("/:id", getEventById);

// Admin only
router.post(
  "/",
  protect,
  requireRole("admin"),
  validate(createEventSchema),
  createEvent,
);
router.put(
  "/:id",
  protect,
  requireRole("admin"),
  validate(updateEventSchema),
  updateEvent,
);
router.delete("/:id", protect, requireRole("admin"), deleteEvent);

export default router;
