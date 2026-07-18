import { Response } from "express";
import { db, Collections } from "../config/firebase";
import { AuthRequest } from "../types/index";
import {
  CreateEventInput,
  UpdateEventInput,
} from "../validators/event.validator";

// POST /api/events
export const createEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { title, description, date, venue, maxParticipants } =
      req.body as CreateEventInput;

    const newEvent = {
      title,
      description,
      date,
      venue,
      maxParticipants,
      createdBy: req.student!.id,
      createdAt: new Date(),
    };

    const docRef = await db.collection(Collections.EVENTS).add(newEvent);

    res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: { id: docRef.id, ...newEvent },
    });
  } catch (err) {
    console.error("[createEvent]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// GET /api/events
export const getAllEvents = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const snap = await db
      .collection(Collections.EVENTS)
      .orderBy("createdAt", "desc")
      .get();

    const events = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({
      success: true,
      message: "Events fetched successfully.",
      data: events,
    });
  } catch (err) {
    console.error("[getAllEvents]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// GET /api/events/:id
export const getEventById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const doc = await db
      .collection(Collections.EVENTS)
      .doc(req.params.id)
      .get();

    if (!doc.exists) {
      res.status(404).json({ success: false, message: "Event not found." });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Event fetched successfully.",
      data: { id: doc.id, ...doc.data() },
    });
  } catch (err) {
    console.error("[getEventById]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// PUT /api/events/:id
export const updateEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // get a ref to the doc
    const eventRef = db.collection(Collections.EVENTS).doc(req.params.id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      res.status(404).json({ success: false, message: "Event not found." });
      return;
    }

    // Only the creator(created admin) can update
    if (doc.data()?.createdBy !== req.student!.id) {
      res.status(403).json({
        success: false,
        message: "Not authorized to update this event.",
      });
      return;
    }

    const updates = req.body as UpdateEventInput;
    await eventRef.update({ ...updates, updatedAt: new Date() });

    res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      data: { id: req.params.id, ...updates },
    });
  } catch (err) {
    console.error("[updateEvent]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// DELETE /api/events/:id
export const deleteEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const eventRef = db.collection(Collections.EVENTS).doc(req.params.id);
    const doc = await eventRef.get();

    if (!doc.exists) {
      res.status(404).json({ success: false, message: "Event not found." });
      return;
    }

    // Only the creator(created admin) can delete
    if (doc.data()?.createdBy !== req.student!.id) {
      res.status(403).json({
        success: false,
        message: "Not authorized to delete this event.",
      });
      return;
    }

    // Also delete all registrations for this event
    const regSnap = await db
      .collection(Collections.REGISTRATIONS)
      .where("eventId", "==", req.params.id)
      .get();

    // ensures atomicity - all or nothing
    // all reg of a event is deleted before event
    const batch = db.batch();
    regSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(eventRef);
    await batch.commit();

    res.status(200).json({
      success: true,
      message: "Event and all its registrations deleted successfully.",
    });
  } catch (err) {
    console.error("[deleteEvent]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
