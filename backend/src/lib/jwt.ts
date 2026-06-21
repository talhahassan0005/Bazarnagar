import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type AuthRole = "seller" | "admin";

export interface TokenPayload {
  sub: string;
  role: AuthRole;
}

export function signToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
