import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import eventRoutes from "./routes/event.routes";
import registrationRoutes from "./routes/registration.routes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes); // CRUD for events
app.use("/api/events", registrationRoutes); // registrations for events

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "CSEA Event Management System backend is running.",
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Unhandled Error]", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});

// Start server
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

export default app;
