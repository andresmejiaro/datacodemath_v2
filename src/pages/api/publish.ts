import type { APIRoute } from "astro";
export const prerender = false;

type PublishPayload = {
  type: "blog_post" | "activity";
  title?: string;
  slug?: string;
  content_markdown?: string;
  published_at?: string;
  tags?: string[];
  platform_variants?: {
    linkedin?: string;
  };
};

function normalizeOrigin(input: string): string {
  return input.replace(/\/$/, "");
}

function resolveAllowedOrigin(site: URL | undefined, request: Request): string {
  const fromEnv = import.meta.env.SITE_URL;

  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return normalizeOrigin(fromEnv.trim());
  }

  if (site) {
    return normalizeOrigin(site.toString());
  }

  return normalizeOrigin(new URL(request.url).origin);
}

function corsHeaders(allowedOrigin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Authorization, Content-Type"
  };
}

function json(status: number, payload: Record<string, unknown>, allowedOrigin: string): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(allowedOrigin)
    }
  });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function yamlQuote(value: string): string {
  return JSON.stringify(value);
}

function toBase64Utf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function markdownFromPayload(payload: Required<PublishPayload>, slug: string, publishedAt: string): string {
  const tags = payload.tags ?? [];
  const linkedin = payload.platform_variants?.linkedin ?? "";
  const title = payload.title ?? slug;

  const lines = [
    "---",
    `type: ${payload.type}`,
    `title: ${yamlQuote(title)}`,
    `publishedAt: ${yamlQuote(publishedAt)}`,
    "tags:",
    ...(tags.length ? tags.map((tag) => `  - ${yamlQuote(tag)}`) : ["  - general"]),
    "platformVariants:",
    `  linkedin: ${yamlQuote(linkedin)}`,
    "---",
    "",
    payload.content_markdown.trim(),
    ""
  ];

  return lines.join("\n");
}

async function getExistingSha(url: string, headers: Record<string, string>): Promise<string | null> {
  const res = await fetch(url, { method: "GET", headers });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to read existing file: ${res.status} ${text}`);
  }

  const body = (await res.json()) as { sha?: string };
  return body.sha ?? null;
}

const handlePost: APIRoute = async ({ request, site }) => {
  const allowedOrigin = resolveAllowedOrigin(site, request);
  const secret = import.meta.env.BLOG_API_SECRET;
  const auth = request.headers.get("authorization") ?? "";

  if (!secret || !auth.startsWith("Bearer ") || auth.slice(7) !== secret) {
    return json(401, { error: "Unauthorized" }, allowedOrigin);
  }

  let payload: PublishPayload;
  try {
    payload = (await request.json()) as PublishPayload;
  } catch {
    return json(400, { error: "Invalid JSON body" }, allowedOrigin);
  }

  if (payload.type !== "blog_post" && payload.type !== "activity") {
    return json(400, { error: "type must be blog_post or activity" }, allowedOrigin);
  }

  if (!payload.content_markdown || typeof payload.content_markdown !== "string") {
    return json(400, { error: "content_markdown is required" }, allowedOrigin);
  }

  if (payload.type === "blog_post" && (!payload.title || !payload.slug)) {
    return json(400, { error: "title and slug are required for blog_post" }, allowedOrigin);
  }

  const nowIso = new Date().toISOString();
  const publishedAt = payload.published_at ?? nowIso;
  const publishedMs = Date.parse(publishedAt);

  if (Number.isNaN(publishedMs)) {
    return json(400, { error: "published_at must be a valid ISO8601 date" }, allowedOrigin);
  }

  const rawSlug = payload.slug ?? `${payload.type}-${publishedAt}`;
  const safeSlug = slugify(rawSlug);

  if (!safeSlug) {
    return json(400, { error: "Could not derive a valid slug" }, allowedOrigin);
  }

  const repoOwner = import.meta.env.GITHUB_OWNER;
  const repoName = import.meta.env.GITHUB_REPO;
  const repoToken = import.meta.env.GITHUB_TOKEN;
  const branch = import.meta.env.GITHUB_BRANCH || "main";

  if (!repoOwner || !repoName || !repoToken) {
    return json(
      500,
      {
        error: "Missing GitHub configuration env vars (GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN)"
      },
      allowedOrigin
    );
  }

  const title = payload.title ?? `Activity ${new Date(publishedMs).toISOString().slice(0, 10)}`;
  const markdown = markdownFromPayload(
    {
      type: payload.type,
      title,
      slug: safeSlug,
      content_markdown: payload.content_markdown,
      published_at: publishedAt,
      tags: payload.tags ?? [],
      platform_variants: payload.platform_variants ?? {}
    },
    safeSlug,
    publishedAt
  );

  const contentPath = `src/content/posts/${safeSlug}.md`;
  const encodedPath = contentPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${encodedPath}`;

  const ghHeaders = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${repoToken}`,
    "X-GitHub-Api-Version": "2022-11-28"
  };

  let sha: string | null;
  try {
    sha = await getExistingSha(url, ghHeaders);
  } catch (error) {
    return json(
      502,
      {
        error: error instanceof Error ? error.message : "Failed to fetch existing file from GitHub"
      },
      allowedOrigin
    );
  }

  const commitMessage = sha
    ? `chore(content): update ${payload.type} ${safeSlug}`
    : `chore(content): add ${payload.type} ${safeSlug}`;

  const putPayload: Record<string, string> = {
    message: commitMessage,
    content: toBase64Utf8(markdown),
    branch
  };

  if (sha) {
    putPayload.sha = sha;
  }

  const putRes = await fetch(url, {
    method: "PUT",
    headers: {
      ...ghHeaders,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(putPayload)
  });

  if (!putRes.ok) {
    const errorBody = await putRes.text();
    return json(502, { error: `GitHub write failed: ${putRes.status} ${errorBody}` }, allowedOrigin);
  }

  const baseUrl = site?.toString().replace(/\/$/, "") ?? new URL(request.url).origin;
  const publishedUrl =
    payload.type === "blog_post" ? `${baseUrl}/posts/${safeSlug}` : `${baseUrl}/activity#${safeSlug}`;

  return json(200, { url: publishedUrl }, allowedOrigin);
};

export const ALL: APIRoute = async (context) => {
  const method = context.request.method.toUpperCase();

  if (method === "POST") {
    return handlePost(context);
  }

  const allowedOrigin = resolveAllowedOrigin(context.site, context.request);
  const requestOrigin = context.request.headers.get("origin");

  if (method === "OPTIONS") {
    if (!requestOrigin || normalizeOrigin(requestOrigin) !== allowedOrigin) {
      return json(403, { error: "Forbidden" }, allowedOrigin);
    }

    return new Response(null, {
      status: 204,
      headers: corsHeaders(allowedOrigin)
    });
  }

  return json(405, { error: "Method Not Allowed" }, allowedOrigin);
};
