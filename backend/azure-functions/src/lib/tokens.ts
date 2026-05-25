import jwt from "jsonwebtoken";

export const getJwtExpiresAt = (token: string): string => {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === "string" || typeof decoded.exp !== "number") {
    throw new Error("Refresh token does not include an expiration");
  }

  return new Date(decoded.exp * 1000).toISOString();
};
