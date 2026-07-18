import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = (result.error as ZodError).flatten().fieldErrors;
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
      return;
    }

    // Replace req.body with sanitized + coerced data from Zod
    req.body = result.data;
    next();
  };
