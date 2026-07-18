import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, Collections } from "../config/firebase";
import { RegisterInput, LoginInput } from "../validators/auth.validator";
import { Student } from "../types";

// POST /api/auth/register
// * only student are registered
export const registerStudent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password, rollNumber } = req.body as RegisterInput;

    // Check duplicate email
    const emailSnap = await db
      .collection(Collections.STUDENTS)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!emailSnap.empty) {
      res
        .status(409)
        .json({ success: false, message: "Email already registered." });
      return;
    }

    // Check duplicate roll number
    const rollSnap = await db
      .collection(Collections.STUDENTS)
      .where("rollNumber", "==", rollNumber)
      .limit(1)
      .get();

    if (!rollSnap.empty) {
      res
        .status(409)
        .json({ success: false, message: "Roll number already registered." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newStudent: Omit<Student, "id"> = {
      name,
      email,
      password: hashedPassword,
      rollNumber,
      role: "student", // hardcoded student role
      createdAt: new Date() as unknown as FirebaseFirestore.Timestamp,
    };

    // students only are added through this, admins are to be seeded directly to db
    const docRef = await db.collection(Collections.STUDENTS).add(newStudent);

    res.status(201).json({
      success: true,
      message: "Student registered successfully.",
      data: { id: docRef.id, name, email, rollNumber },
    });
  } catch (err) {
    console.error("[registerStudent]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// POST /api/auth/login
// * Common for both student and admin, roles differ
export const loginStudent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;

    const snap = await db
      .collection(Collections.STUDENTS)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snap.empty) {
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
      return;
    }

    const studentDoc = snap.docs[0];
    const student = studentDoc.data() as Student;

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
      return;
    }

    const token = jwt.sign(
      { id: studentDoc.id, email: student.email, role: student.role }, // role will be student/admin
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? "7d" },
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        student: {
          id: studentDoc.id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          role: student.role,
        },
      },
    });
  } catch (err) {
    console.error("[loginStudent]", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
