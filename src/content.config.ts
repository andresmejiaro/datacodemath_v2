import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  schema: z.object({
    type: z.enum(["blog_post", "activity"]),
    title: z.string(),
    publishedAt: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    platformVariants: z
      .object({
        linkedin: z.string().optional()
      })
      .default({})
  })
});

export const collections = {
  posts
};
