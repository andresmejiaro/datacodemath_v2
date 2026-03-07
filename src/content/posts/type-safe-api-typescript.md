---
type: blog_post
title: "Building a Type-Safe API in TypeScript (Placeholder)"
publishedAt: "2026-03-05T09:15:00.000Z"
tags:
  - typescript
  - api
  - backend
  - placeholder
platformVariants:
  linkedin: "[Placeholder] Notes from my API rewrite: one schema, end-to-end types, fewer production surprises."
---

> Placeholder content for visual preview only. Replace before launch.

## Why I stopped trusting my API docs

The API docs looked accurate, but the code kept drifting. We had controllers expecting one shape, frontend calls sending another, and validation happening in three separate places. Every sprint had at least one avoidable bug caused by mismatched assumptions. The fix was not another document. The fix was turning the contract into executable code.

I wanted one source of truth for request and response schemas, and I wanted TypeScript to enforce that contract across handlers, tests, and client calls. If an endpoint changed, I wanted compile errors in every affected place before we deployed. That became the baseline for this rewrite.

## One schema for runtime and compile-time

The pattern that worked was pairing route definitions with runtime validation and inferred static types. In this version, we define a schema once with Zod, then infer both `RequestBody` and `ResponseBody` types from it.

```ts
import { z } from "zod";

const CreatePostSchema = z.object({
  title: z.string().min(5),
  body: z.string().min(50),
  tags: z.array(z.string()).default([])
});

type CreatePostInput = z.infer<typeof CreatePostSchema>;

const CreatePostResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  createdAt: z.string()
});

type CreatePostResponse = z.infer<typeof CreatePostResponseSchema>;
```

From there, the handler parses the incoming payload with `safeParse`, rejects invalid requests with a clear 400 response, and only then passes typed data into business logic. The service layer no longer needs to defensively re-validate fields that were already checked.

## Route handlers became boring in a good way

After moving schema logic to the boundary, each handler got dramatically simpler. That reduced branching and made tests easier to write because we could focus on behavior instead of guard clauses.

```ts
export async function createPost(req: Request): Promise<Response> {
  const payload = await req.json();
  const parsed = CreatePostSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await postService.create(parsed.data);
  return Response.json(CreatePostResponseSchema.parse(created), { status: 201 });
}
```

This pattern also improved observability. Validation errors now share the same structure, which means dashboards and alerts can group them consistently.

## What changed for the team

The biggest gain was confidence during refactors. When we renamed a field or changed a response shape, TypeScript highlighted every call site that needed updates. We also cut onboarding time because new contributors could read schemas and instantly understand what each endpoint accepts and returns.

The key lesson is straightforward: if API contracts are critical to your system, keep them in code and make them executable. The moment contracts become optional documentation, bugs re-enter through the gap.
