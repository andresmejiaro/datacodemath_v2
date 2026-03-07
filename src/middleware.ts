import { defineMiddleware } from "astro:middleware";

function normalizeOrigin(input: string): string {
  return input.replace(/\/$/, "");
}

function resolveAllowedOrigin(url: URL): string {
  const fromEnv = import.meta.env.SITE_URL;

  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return normalizeOrigin(fromEnv.trim());
  }

  return normalizeOrigin(url.origin);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;
  const url = new URL(request.url);

  if (url.pathname !== "/api/publish" || request.method.toUpperCase() !== "OPTIONS") {
    return next();
  }

  const allowedOrigin = resolveAllowedOrigin(url);
  const requestOrigin = request.headers.get("origin");

  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Authorization, Content-Type"
  };

  if (!requestOrigin || normalizeOrigin(requestOrigin) !== allowedOrigin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    });
  }

  return new Response(null, {
    status: 204,
    headers
  });
});
