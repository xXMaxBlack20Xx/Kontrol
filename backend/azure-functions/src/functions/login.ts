import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { v4 as uuidv4 } from "uuid";
import { createAccessToken, createRefreshToken, hashEmail, hashToken, normalizeEmail, verifyPassword } from "../lib/auth";
import { authUsersContainer, readItem, refreshTokensContainer, usersContainer } from "../lib/cosmos";
import { AuthUserDocument, RefreshTokenDocument, toPublicUser, UserDocument } from "../lib/models";
import { loginSchema } from "../lib/schemas";
import { getJwtExpiresAt } from "../lib/tokens";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

const invalidCredentials = (): HttpResponseInit => ({
  status: 401,
  headers,
  body: JSON.stringify({ error: "INVALID_CREDENTIALS", message: "Invalid email or password" }),
});

export async function login(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const parsed = loginSchema.safeParse(await req.json());

    if (!parsed.success) {
      return {
        status: 400,
        headers,
        body: JSON.stringify({ error: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() }),
      };
    }

    const normalizedEmail = normalizeEmail(parsed.data.email);
    const emailHash = hashEmail(normalizedEmail);
    const authUser = await readItem<AuthUserDocument>(authUsersContainer(), emailHash, emailHash);

    if (!authUser || authUser.status !== "active") return invalidCredentials();

    const passwordIsValid = await verifyPassword(parsed.data.password, authUser.passwordHash);
    if (!passwordIsValid) return invalidCredentials();

    const user = await readItem<UserDocument>(usersContainer(), authUser.userId, authUser.userId);
    if (!user) return invalidCredentials();

    const now = new Date().toISOString();
    const refreshTokenId = `rt_${uuidv4()}`;
    const accessToken = createAccessToken(user.userId, user.email);
    const refreshToken = createRefreshToken(user.userId, refreshTokenId);
    const refreshTokenDocument: RefreshTokenDocument = {
      id: refreshTokenId,
      userId: user.userId,
      tokenHash: hashToken(refreshToken),
      createdAt: now,
      expiresAt: getJwtExpiresAt(refreshToken),
      revokedAt: null,
    };

    await refreshTokensContainer().items.create(refreshTokenDocument);

    return {
      status: 200,
      headers,
      body: JSON.stringify({ accessToken, refreshToken, user: toPublicUser(user) }),
    };
  } catch (error) {
    context.error("Login failed", error);
    return {
      status: 500,
      headers,
      body: JSON.stringify({ error: "INTERNAL_SERVER_ERROR", message: "Internal server error" }),
    };
  }
}

app.http("login", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/login",
  handler: login,
});
