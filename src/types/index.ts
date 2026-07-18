import { Request } from "express";

export type Role = "student" | "admin";

export interface Student {
  id?: string;
  name: string;
  email: string;
  password: string;
  rollNumber: string;
  role: Role;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface Event {
  id?: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  maxParticipants: number;
  createdBy: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface Registration {
  id?: string;
  eventId: string;
  studentId: string;
  registeredAt: FirebaseFirestore.Timestamp;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

// Extend Express Request to carry authenticated student
export interface AuthRequest extends Request {
  student?: JwtPayload;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?: T;
}
