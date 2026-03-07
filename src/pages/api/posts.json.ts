import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const prerender = true;

export const GET: APIRoute = async () => {
  const entries = (await getCollection("posts")).sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );

  const posts = entries.map((entry) => ({
    slug: entry.slug,
    type: entry.data.type,
    title: entry.data.title,
    publishedAt: entry.data.publishedAt.toISOString(),
    tags: entry.data.tags,
    url: entry.data.type === "blog_post" ? `/posts/${entry.slug}` : `/activity#${entry.slug}`
  }));

  return new Response(
    JSON.stringify({
      posts,
      generatedAt: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};
