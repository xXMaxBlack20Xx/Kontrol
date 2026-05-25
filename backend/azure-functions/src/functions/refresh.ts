import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { createAccessToken, hashToken, verifyRefreshToken } from "../lib/auth";
import { readItem, refreshTokensContainer, usersContainer } from "../lib/cosmos";
import { RefreshTokenDocument, UserDocument } from "../lib/models";
import { refreshSchema } from "../lib/schemas";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

const unauthorizedResponse = (): HttpResponseInit => ({
  status: 401,
  headers,
  body: JSON.stringify({ error: "UNAUTHORIZED", message: "Invalid or expired refresh token" }),
});

export async function refresh(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const parsed = refreshSchema.safeParse(await req.json());

    if (!parsed.success) {
      return {
        status: 400,
        headers,
        body: JSON.stringify({ error: "BAD_REQUEST", message: "Invalid request body", details: parsed.error.flatten() }),
      };
    }

    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(parsed.data.refreshToken);
    } catch {
      return unauthorizedResponse();
    }

    const savedToken = await readItem<RefreshTokenDocument>(refreshTokensContainer(), payload.jti, payload.sub);
    if (!savedToken || savedToken.revokedAt || new Date(savedToken.expiresAt).getTime() <= Date.now()) return unauthorizedResponse();
    if (hashToken(parsed.data.refreshToken) !== savedToken.tokenHash) return unauthorizedResponse();

    const user = await readItem<UserDocument>(usersContainer(), payload.sub, payload.sub);
    if (!user) return unauthorizedResponse();

    return {
      status: 200,
      headers,
      body: JSON.stringify({ accessToken: createAccessToken(user.userId, user.email) }),
    };
  } catch (error) {
    context.error("Refresh failed", error);
    return {
      status: 500,
      headers,
      body: JSON.stringify({ error: "INTERNAL_SERVER_ERROR", message: "Internal server error" }),
    };
  }
}

app.http("refresh", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/refresh",
  handler: refresh,
});
