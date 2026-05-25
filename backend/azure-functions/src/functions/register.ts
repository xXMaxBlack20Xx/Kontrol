import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { v4 as uuidv4 } from "uuid";
import { createAccessToken, createRefreshToken, hashEmail, hashPassword, hashToken, normalizeEmail } from "../lib/auth";
import { authUsersContainer, readItem, refreshTokensContainer, usersContainer } from "../lib/cosmos";
import { AuthUserDocument, RefreshTokenDocument, toPublicUser, UserDocument } from "../lib/models";
import { registerSchema } from "../lib/schemas";
import { getJwtExpiresAt } from "../lib/tokens";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

export async function register(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const parsed = registerSchema.safeParse(await req.json());

    if (!parsed.success) {
      return {
        status: 400,
        headers,
        body: JSON.stringify({ error: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() }),
      };
    }

    const normalizedEmail = normalizeEmail(parsed.data.email);
    const emailHash = hashEmail(normalizedEmail);
    const existing = await readItem<AuthUserDocument>(authUsersContainer(), emailHash, emailHash);

    if (existing) {
      return {
        status: 409,
        headers,
        body: JSON.stringify({ error: "CONFLICT", message: "Email is already registered" }),
      };
    }

    const now = new Date().toISOString();
    const userId = `usr_${uuidv4()}`;
    const passwordHash = await hashPassword(parsed.data.password);
    const authUser: AuthUserDocument = {
      id: emailHash,
      emailHash,
      userId,
      normalizedEmail,
      passwordHash,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    const user: UserDocument = {
      id: userId,
      userId,
      email: normalizedEmail,
      displayName: null,
      profilePhotoId: null,
      createdAt: now,
      updatedAt: now,
    };

    await authUsersContainer().items.create(authUser);
    await usersContainer().items.create(user);

    const refreshTokenId = `rt_${uuidv4()}`;
    const accessToken = createAccessToken(userId, normalizedEmail);
    const refreshToken = createRefreshToken(userId, refreshTokenId);
    const refreshTokenDocument: RefreshTokenDocument = {
      id: refreshTokenId,
      userId,
      tokenHash: hashToken(refreshToken),
      createdAt: now,
      expiresAt: getJwtExpiresAt(refreshToken),
      revokedAt: null,
    };

    await refreshTokensContainer().items.create(refreshTokenDocument);

    return {
      status: 201,
      headers,
      body: JSON.stringify({ accessToken, refreshToken, user: toPublicUser(user) }),
    };
  } catch (error) {
    context.error("Register failed", error);
    return {
      status: 500,
      headers,
      body: JSON.stringify({ error: "INTERNAL_SERVER_ERROR", message: "Internal server error" }),
    };
  }
}

app.http("register", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/register",
  handler: register,
});
