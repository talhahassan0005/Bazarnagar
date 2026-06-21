import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/helpers";

/** 404 handler for unmatched routes. */
export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Central error handler — converts known errors into clean JSON responses. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  // Mongoose duplicate key (e.g. email / slug already exists)
  if (typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000) {
    const fields = Object.keys((err as { keyValue?: Record<string, unknown> }).keyValue ?? {});
    return res.status(409).json({ error: `Already exists: ${fields.join(", ") || "duplicate value"}` });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Zod request-validation error → clean 400 with a readable message.
  if (err instanceof ZodError) {
    const message = err.issues
      .map((i) => {
        const field = i.path.join(".");
        return field ? `${field}: ${i.message}` : i.message;
      })
      .join("; ");
    return res.status(400).json({ error: message || "Invalid input" });
  }

  // Mongoose validation error
  if (err instanceof Error && err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  console.error("Unhandled error:", err);
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message });
}
