import type { HttpRequest, HttpResponseInit } from "@azure/functions";

type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "INVALID_CREDENTIALS"
  | "NOT_CONFIGURED";

const allowedOriginForRequest = (req?: HttpRequest): string => {
  const configured = process.env.APP_CORS_ALLOWED_ORIGINS || "*";
  const allowedOrigins = configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
    return "*";
  }

  const requestOrigin = req?.headers.get("origin");

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return allowedOrigins[0];
};

export const corsHeaders = (req?: HttpRequest): Record<string, string> => ({
  "Access-Control-Allow-Origin": allowedOriginForRequest(req),
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
});

const json = (status: number, body: unknown): HttpResponseInit => ({
  status,
  jsonBody: body,
  headers: {
    "Content-Type": "application/json",
    ...corsHeaders(),
  },
});

export const withCors = (req: HttpRequest, response: HttpResponseInit): HttpResponseInit => ({
  ...response,
  headers: {
    ...response.headers,
    ...corsHeaders(req),
  },
});

export const noContent = (req?: HttpRequest): HttpResponseInit => ({
  status: 204,
  headers: corsHeaders(req),
});

export const isOptions = (req: HttpRequest): boolean => req.method.toUpperCase() === "OPTIONS";

export const ok = (data: unknown): HttpResponseInit => json(200, data);

export const created = (data: unknown): HttpResponseInit => json(201, data);

export const badRequest = (message: string, details?: unknown): HttpResponseInit =>
  json(400, {
    error: "BAD_REQUEST",
    message,
    ...(details ? { details } : {}),
  });

export const unauthorized = (message = "Unauthorized", error: ErrorCode = "UNAUTHORIZED"): HttpResponseInit =>
  json(401, {
    error,
    message,
  });

export const conflict = (message: string): HttpResponseInit =>
  json(409, {
    error: "CONFLICT",
    message,
  });

export const notFound = (message: string): HttpResponseInit =>
  json(404, {
    error: "NOT_FOUND",
    message,
  });

export const serverError = (message = "Internal server error"): HttpResponseInit =>
  json(500, {
    error: "SERVER_ERROR",
    message,
  });

export const notConfigured = (message: string): HttpResponseInit =>
  json(500, {
    error: "NOT_CONFIGURED",
    message,
  });
