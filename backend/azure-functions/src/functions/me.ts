import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getBearerToken, verifyAccessToken } from "../lib/auth";
import { readItem, usersContainer } from "../lib/cosmos";
import { toPublicUser, UserDocument } from "../lib/models";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

const unauthorizedResponse = (message: string): HttpResponseInit => ({
  status: 401,
  headers,
  body: JSON.stringify({ error: "UNAUTHORIZED", message }),
});

export async function me(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const token = getBearerToken(req);
  if (!token) return unauthorizedResponse("Missing access token");

  let userId: string;
  try {
    userId = verifyAccessToken(token).sub;
  } catch {
    return unauthorizedResponse("Invalid or expired access token");
  }

  try {
    const user = await readItem<UserDocument>(usersContainer(), userId, userId);
    if (!user) {
      return {
        status: 404,
        headers,
        body: JSON.stringify({ error: "NOT_FOUND", message: "User not found" }),
      };
    }

    return {
      status: 200,
      headers,
      body: JSON.stringify({ user: toPublicUser(user) }),
    };
  } catch (error) {
    context.error("Get me failed", error);
    return {
      status: 500,
      headers,
      body: JSON.stringify({ error: "INTERNAL_SERVER_ERROR", message: "Internal server error" }),
    };
  }
}

app.http("me", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "me",
  handler: me,
});
