/**
 * Usage:
 *    npx tsx seed.ts
 * Creates one test document in each collection to verify Firebase connection and initialize all collections.
 * Docs are deleted after initialisation of collections.(Collections are not deleted, only the seeded docs are deleted).
 */

import "dotenv/config";
import * as admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const db = admin.firestore();

async function seed() {
  console.log("Connecting to Firestore...\n");

  try {
    // students
    await db.collection("students").doc("_init").set({
      name: "Seed Student",
      email: "seed@csea.com",
      password: "hashed_placeholder",
      rollNumber: "SEED001",
      role: "student",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("students collection ready");

    // events
    await db
      .collection("events")
      .doc("_init")
      .set({
        title: "Seed Event",
        description: "This is a seed event to initialize the collection.",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        venue: "CS Seminar Hall",
        maxParticipants: 50,
        createdBy: "seed",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    console.log("events collection ready");

    // registrations
    await db.collection("registrations").doc("_init").set({
      eventId: "_init",
      studentId: "_init",
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("registrations collection ready");

    console.log("\nAll collections initialized in Firestore!");
    console.log("Open Firebase Console → Firestore Database to verify.");
    console.log("https://console.firebase.google.com\n");

    // cleanup seed docs
    console.log("Cleaning up seed documents...");
    await db.collection("students").doc("_init").delete();
    await db.collection("events").doc("_init").delete();
    await db.collection("registrations").doc("_init").delete();
    console.log("Seed documents removed. Collections remain.\n");
  } catch (err: any) {
    console.error("Firestore connection failed:\n", err.message ?? err);
    console.log("\nCheck your .env values:");
    console.log(
      "  FIREBASE_PROJECT_ID =",
      process.env.FIREBASE_PROJECT_ID ?? "MISSING",
    );
    console.log(
      "  FIREBASE_CLIENT_EMAIL =",
      process.env.FIREBASE_CLIENT_EMAIL ?? "MISSING",
    );
    console.log(
      "  FIREBASE_PRIVATE_KEY =",
      process.env.FIREBASE_PRIVATE_KEY ? "(set)" : "MISSING",
    );
  } finally {
    process.exit(0);
  }
}

seed();
