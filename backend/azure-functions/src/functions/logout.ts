import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyRefreshToken } from "../lib/auth";
import { readItem, refreshTokensContainer } from "../lib/cosmos";
import type { RefreshTokenDocument } from "../lib/models";
import { logoutSchema } from "../lib/schemas";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

const successResponse = (): HttpResponseInit => ({
  status: 200,
  headers,
  body: JSON.stringify({ success: true }),
});

export async function logout(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const parsed = logoutSchema.safeParse(await req.json());
    if (!parsed.success) return successResponse();

    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(parsed.data.refreshToken);
    } catch {
      return successResponse();
    }

    const container = refreshTokensContainer();
    const savedToken = await readItem<RefreshTokenDocument>(container, payload.jti, payload.sub);
    if (savedToken) {
      await container.item(payload.jti, payload.sub).patch([{ op: "set", path: "/revokedAt", value: new Date().toISOString() }]);
    }

    return successResponse();
  } catch (error) {
    context.error("Logout failed", error);
    return successResponse();
  }
}

app.http("logout", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth/logout",
  handler: logout,
});
