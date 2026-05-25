import type { HttpRequest } from "@azure/functions";
import * as argon2 from "argon2";
import { createHash } from "node:crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

type AccessTokenPayload = JwtPayload & {
  sub: string;
  email?: string;
};

type RefreshTokenPayload = JwtPayload & {
  sub: string;
  jti: string;
};

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const accessSecret = (): string => requiredEnv("JWT_ACCESS_SECRET");
const refreshSecret = (): string => requiredEnv("JWT_REFRESH_SECRET");

const assertDifferentSecrets = (): void => {
  if (accessSecret() === refreshSecret()) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different");
  }
};

const jwtExpiresIn = (name: string, fallback: string): SignOptions["expiresIn"] =>
  (process.env[name] || fallback) as SignOptions["expiresIn"];

const isObjectPayload = (payload: string | JwtPayload): payload is JwtPayload => typeof payload !== "string";

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const hashEmail = (email: string): string =>
  `emailhash_${createHash("sha256").update(normalizeEmail(email)).digest("hex")}`;

export const hashPassword = (password: string): Promise<string> =>
  argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

export const verifyPassword = (password: string, passwordHash: string): Promise<boolean> =>
  argon2.verify(passwordHash, password);

export const createAccessToken = (userId: string, email: string): string => {
  assertDifferentSecrets();

  return jwt.sign({ sub: userId, email }, accessSecret(), {
    expiresIn: jwtExpiresIn("JWT_ACCESS_EXPIRES_IN", "15m"),
  });
};

export const createRefreshToken = (userId: string, refreshTokenId: string): string => {
  assertDifferentSecrets();

  return jwt.sign({ sub: userId, jti: refreshTokenId }, refreshSecret(), {
    expiresIn: jwtExpiresIn("JWT_REFRESH_EXPIRES_IN", "30d"),
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, accessSecret());

  if (!isObjectPayload(payload) || typeof payload.sub !== "string") {
    throw new Error("Invalid access token payload");
  }

  return payload as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const payload = jwt.verify(token, refreshSecret());

  if (!isObjectPayload(payload) || typeof payload.sub !== "string" || typeof payload.jti !== "string") {
    throw new Error("Invalid refresh token payload");
  }

  return payload as RefreshTokenPayload;
};

export const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export const getBearerToken = (req: HttpRequest): string | null => {
  const authorization = req.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

export const requireUser = (req: HttpRequest): string => {
  const token = getBearerToken(req);

  if (!token) {
    throw new AuthenticationError("Missing access token");
  }

  try {
    return verifyAccessToken(token).sub;
  } catch {
    throw new AuthenticationError("Invalid or expired access token");
  }
};
