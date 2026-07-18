import { z } from "zod";

export const createEventSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be under 150 characters")
    .trim(),

  description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters")
    .trim(),

  date: z
    .string({ required_error: "Date is required" })
    .datetime({
      message:
        "Date must be a valid ISO 8601 datetime (e.g. 2025-08-01T10:00:00Z)",
    })
    .refine((val) => new Date(val) > new Date(), {
      message: "Event date must be in the future",
    }),

  venue: z
    .string({ required_error: "Venue is required" })
    .min(2, "Venue must be at least 2 characters")
    .trim(),

  maxParticipants: z
    .number({ required_error: "Max participants is required" })
    .int("Max participants must be a whole number")
    .min(1, "At least 1 participant required")
    .max(10000, "Max participants cannot exceed 10,000"),
});

// All fields optional for PATCH-style update
export const updateEventSchema = createEventSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
