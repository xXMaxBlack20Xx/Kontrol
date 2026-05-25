import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { noContent } from "../lib/http";

export async function corsPreflight(req: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  return noContent(req);
}

app.http("corsPreflight", {
  methods: ["OPTIONS"],
  authLevel: "anonymous",
  route: "cors/preflight",
  handler: corsPreflight,
});
