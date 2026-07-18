/**
 * Seeds admin accounts directly into Firestore.
 * This is the ONLY way to create admin accounts — the API does not allow it.
 * Usage:
 *   npx tsx seed-admin.ts
 * Already-existing emails are skipped safely (no duplicates created).
 */

import "dotenv/config";
import * as admin from "firebase-admin";
import bcrypt from "bcryptjs";

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const db = admin.firestore();

// Add admins here
const ADMINS = [
  {
    name: "CSEA Admin",
    email: "admin@csea.com",
    password: "admin@123",
    rollNumber: "ADMIN001",
  },
  // {
  //   name: 'Second Admin',
  //   email: 'admin2@csea.com',
  //   password: 'strongpassword',
  //   rollNumber: 'ADMIN002',
  // },
];

async function seedAdmins() {
  console.log("Connecting to Firestore...\n");

  let created = 0;
  let skipped = 0;

  for (const adminData of ADMINS) {
    try {
      // Check if email already exists
      const existing = await db
        .collection("students")
        .where("email", "==", adminData.email)
        .limit(1)
        .get();

      if (!existing.empty) {
        console.log(`Skipped  — ${adminData.email} already exists`);
        skipped++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(adminData.password, 12);

      await db.collection("students").add({
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        rollNumber: adminData.rollNumber,
        role: "admin",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Created  — ${adminData.email} (${adminData.name})`);
      created++;
    } catch (err: any) {
      console.error(`Failed   — ${adminData.email}:`, err.message ?? err);
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
    }
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.\n`);

  if (created > 0) {
    console.log("These admins can now log in via POST /api/auth/login");
  }

  process.exit(0);
}

seedAdmins();
