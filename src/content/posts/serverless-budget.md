---
type: blog_post
title: "Deploying serverless functions on a budget (Placeholder)"
publishedAt: "2026-03-01T08:05:00.000Z"
tags:
  - serverless
  - vercel
  - cost-control
  - placeholder
platformVariants:
  linkedin: "[Placeholder] Practical notes on keeping serverless costs close to zero at personal-project scale."
---

> Placeholder content for visual preview only. Replace before launch.

## Cheap infrastructure is a product constraint

When people say serverless is inexpensive, they are usually correct at small scale and accidentally vague about the details. Costs stay low when request volume is predictable, cold starts are acceptable, and you avoid accidental fan-out in your workflows. Costs spike when retries multiply silently, third-party calls are unbounded, or you store logs forever.

For personal projects, I treat cost as a first-class requirement, not an afterthought. If the project cannot run for a few euros per month, the architecture is probably too heavy for the value it delivers.

## Design for bursty, low-frequency usage

A lot of developer tools have a weekly pattern: usage spikes when you actively work, then drops close to zero. Serverless is perfect for that shape as long as functions remain short-lived and idempotent.

The baseline stack I use now is:

1. Static frontend generated at build time.
2. A small set of API routes for generation, publishing, and webhooks.
3. Managed storage only where persistence is essential.
4. Aggressive timeout and retry caps on all outbound calls.

```ts
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

export async function withBackoff<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, BASE_DELAY_MS * 2 ** attempt));
    }
  }

  throw lastError;
}
```

That retry helper prevents infinite loops and keeps failures visible.

## Practical guardrails that prevent billing surprises

I always enforce payload size limits, request authentication, and strict schema validation at the edge. Invalid traffic should fail fast and cheap. If a function calls external APIs, I log timing and status to identify expensive hotspots before they become recurring costs.

Another guardrail is writing down expected monthly usage in plain numbers. For example: 8 generation calls, 12 publish calls, 500 site visits. That estimate becomes the reference point for alerts. If traffic suddenly jumps beyond assumptions, I want a notification before the invoice arrives.

## What to optimize first

Do not start by optimizing cold starts or shaving milliseconds off every request. Start by removing unnecessary calls, reducing duplicate work, and batching writes when possible. Network round-trips and third-party API usage are usually bigger cost drivers than compute time at this stage.

Serverless on a budget works best when your architecture reflects real behavior. Build for your current scale, set sensible boundaries, and let usage justify each additional component. Simplicity is not just easier to maintain; it is usually cheaper by default.
