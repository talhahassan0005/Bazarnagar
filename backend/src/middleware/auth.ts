import type { Request, Response, NextFunction } from "express";
import { verifyToken, type AuthRole } from "../lib/jwt";
import { ApiError } from "../lib/helpers";

/** Authenticated identity attached to the request by `authenticate`. */
export interface AuthUser {
  id: string;
  role: AuthRole;
}

// Augment Express Request with our `user` field.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

/** Verifies the JWT and attaches `req.user`. Rejects if missing/invalid. */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) return next(new ApiError(401, "Authentication required"));
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

/** Requires the authenticated user to have one of the given roles. */
export function requireRole(...roles: AuthRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have access to this resource"));
    }
    next();
  };
}
