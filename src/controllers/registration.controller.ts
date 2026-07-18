import { Response } from "express";
import { db, Collections } from "../config/firebase";
import { AuthRequest } from "../types";

// POST /api/events/:id/register
export const registerForEvent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const eventId = req.params.id;
    const studentId = req.student!.id;

    // Check event exists
    const eventDoc = await db.collection(Collections.EVENTS).doc(eventId).get();
    if (!eventDoc.exists) {
      res.status(404).json({ success: false, message: "Event not found." });
      return;
    }

    const eventData = eventDoc.data()!;

    // Check event is in the future
    if (new Date(eventData.date) < new Date()) {
      res
        .status(400)
        .json({ success: false, message: "Cannot register for a past event." });
      return;
    }

    // Check duplicate registration
    const duplicateSnap = await db
      .collection(Collections.REGISTRATIONS)
      .where("eventId", "==", eventId)
      .where("studentId", "==", studentId)
      .limit(1)
      .get();

    if (!duplicateSnap.empty) {
      res.status(409).json({
        success: false,
        message: "Already registered for this event.",
      });
      return;
    }

    // Check max participants
    const regSnap = await db
      .collection(Collections.REGISTRATIONS)
      .where("eventId", "==", eventId)
      .get();

    if (regSnap.size >= eventData.maxParticipants) {
      res.status(400).json({
        success: false,
        message: "Event is full. Registration closed.",
      });
      return;
    }

    const registration = {
      eventId,
      studentId,
      registeredAt: new Date(),
    };

    const docRef = await db
      .collection(Collections.REGISTRATIONS)
      .add(registration);

    res.status(201).json({
      success: true,
      message: "Successfully registered for the event.",
      data: { id: docRef.id, ...registration },
    });
  } catch (err) {
    console.error("[registerForEvent]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// GET /api/events/:id/participants
export const getParticipants = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const eventId = req.params.id;

    // Check event exists
    const eventDoc = await db.collection(Collections.EVENTS).doc(eventId).get();
    if (!eventDoc.exists) {
      res.status(404).json({ success: false, message: "Event not found." });
      return;
    }

    const regSnap = await db
      .collection(Collections.REGISTRATIONS)
      .where("eventId", "==", eventId)
      .orderBy("registeredAt", "asc")
      .get();

    // Fetch student details for each registration
    const participants = await Promise.all(
      regSnap.docs.map(async (regDoc) => {
        const regData = regDoc.data();
        const studentDoc = await db
          .collection(Collections.STUDENTS)
          .doc(regData.studentId)
          .get();
        const studentData = studentDoc.data();

        return {
          registrationId: regDoc.id,
          registeredAt: regData.registeredAt,
          student: {
            id: regData.studentId,
            name: studentData?.name ?? "Unknown",
            email: studentData?.email ?? "Unknown",
            rollNumber: studentData?.rollNumber ?? "Unknown",
          },
        };
      }),
    );

    res.status(200).json({
      success: true,
      message: "Participants fetched successfully.",
      data: {
        event: { id: eventId, title: eventDoc.data()?.title },
        totalRegistered: participants.length,
        maxParticipants: eventDoc.data()?.maxParticipants,
        participants,
      },
    });
  } catch (err) {
    console.error("[getParticipants]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
