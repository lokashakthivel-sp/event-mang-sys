/**
 * Usage:
 *   npx tsx seed-events.ts
 * Requires an admin to already exist in the DB (run seed-admin.ts first).
 * Skips events with duplicate titles so it's safe to re-run.
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

// events to seed
const EVENTS = [
  {
    title: "CSEA Hackathon 2025",
    description:
      "A 24-hour coding competition where teams of 2–4 build innovative solutions to real-world problems. Open to all CS department students. Prizes worth ₹50,000 up for grabs!",
    date: "2025-09-15T09:00:00Z",
    venue: "CS Seminar Hall, Block A",
    maxParticipants: 120,
  },
  {
    title: "Web Development Workshop",
    description:
      "Hands-on workshop covering modern web development with React and Node.js. Bring your laptop. Prior knowledge of HTML/CSS recommended but not required.",
    date: "2025-08-10T10:00:00Z",
    venue: "Computer Lab 3, Block B",
    maxParticipants: 40,
  },
  {
    title: "Tech Talk — AI & Machine Learning Trends",
    description:
      "An industry expert session on the latest trends in AI and ML, covering large language models, computer vision, and career opportunities in the AI space.",
    date: "2025-08-25T14:00:00Z",
    venue: "Main Auditorium",
    maxParticipants: 300,
  },
  {
    title: "DSA Bootcamp",
    description:
      "Intensive 3-day bootcamp on Data Structures and Algorithms. Covers arrays, trees, graphs, dynamic programming, and problem-solving strategies for placements and competitive programming.",
    date: "2025-09-01T09:00:00Z",
    venue: "Lecture Hall 2, Block C",
    maxParticipants: 80,
  },
  {
    title: "Open Source Contribution Drive",
    description:
      "Learn how to contribute to open source projects on GitHub. We will walk through finding good first issues, making pull requests, and building your public portfolio.",
    date: "2025-09-20T11:00:00Z",
    venue: "Computer Lab 1, Block A",
    maxParticipants: 50,
  },
  {
    title: "Code Golf Challenge",
    description:
      "Write the shortest possible code to solve a set of fun programming puzzles. Any language allowed. Individual event — top 3 win exciting prizes.",
    date: "2025-10-05T13:00:00Z",
    venue: "CS Seminar Hall, Block A",
    maxParticipants: 60,
  },
  {
    title: "Resume & LinkedIn Workshop",
    description:
      "A practical session on crafting a strong technical resume and LinkedIn profile for internships and placements. Get live feedback on your resume from seniors and alumni.",
    date: "2025-10-18T10:00:00Z",
    venue: "Seminar Room 2, Block D",
    maxParticipants: 100,
  },
  {
    title: "CSEA Annual Symposium 2025",
    description:
      "The flagship annual event of CSEA featuring paper presentations, project expos, technical quizzes, and guest lectures from industry leaders. Open to all students.",
    date: "2025-11-10T09:00:00Z",
    venue: "Main Auditorium & CS Block",
    maxParticipants: 500,
  },
];

async function seedEvents() {
  console.log("Connecting to Firestore...\n");

  // Find the seeded admin to use as createdBy
  const adminSnap = await db
    .collection("students")
    .where("role", "==", "admin")
    .limit(1)
    .get();

  if (adminSnap.empty) {
    console.error("No admin found in DB. Run seed-admin.ts first.\n");
    process.exit(1);
  }

  const adminId = adminSnap.docs[0].id;
  const adminName = adminSnap.docs[0].data().name;
  console.log(`Using admin: ${adminName} (${adminId})\n`);

  let created = 0;
  let skipped = 0;

  for (const event of EVENTS) {
    // Skip if title already exists
    const existing = await db
      .collection("events")
      .where("title", "==", event.title)
      .limit(1)
      .get();

    if (!existing.empty) {
      console.log(`Skipped  — "${event.title}" already exists`);
      skipped++;
      continue;
    }

    await db.collection("events").add({
      ...event,
      createdBy: adminId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Created  — "${event.title}"`);
    created++;
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.\n`);
  process.exit(0);
}

seedEvents().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
