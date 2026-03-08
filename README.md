# datacodemath

Personal developer blog and portfolio. Owned web presence, fast on mobile, no CMS.

Live at **[datacodemath.com](https://datacodemath.com)**

---

## What this is

- Portfolio + blog under a custom domain
- Activity feed for short-form posts
- Fast static site — all pages served from GitHub Pages CDN

---

## Stack

- **Astro** — static site generator with content collections
- **Tailwind CSS** — utility styling via `@tailwindcss/vite`
- **GitHub Pages** — hosting and CDN
- **GitHub Actions** — build and deploy on push to main
- **GitHub** — source of truth for all published content (posts are markdown files in the repo)

---

## Make it yours

All personal info lives in one file: `src/data/personal.ts`

```ts
export const PERSONAL_INFO = {
  siteName: "datacodemath",
  name: "[YOUR NAME]",
  avatarUrl: "/images/your-avatar.jpeg",
  description: "...",
  journey: "...",
  skills: ["AI Tooling", "..."],
  heroDescription: "I build things and write about what I learn.",
  resumeUrl: "/about",
  socialLinks: [
    { href: "https://linkedin.com/in/you", label: "LinkedIn" },
    { href: "https://github.com/you",      label: "GitHub" },
  ],
};
```

Drop your photo in `public/images/` and update `avatarUrl` to match.

Project cards are in `src/data/projects.ts`.

Experience, education, and certifications are in `src/data/experience.ts`.

---

## Local development

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # production build
npm run check      # TypeScript check
```

---

## Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to repo Settings → Pages → Source: select **GitHub Actions**
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically

For a custom domain:
1. Add a `public/CNAME` file with your domain name
2. Point your domain's DNS A records to GitHub Pages IPs:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
3. Add a CNAME record: `www` → `yourusername.github.io`
4. Set the custom domain in repo Settings → Pages and enable HTTPS

---

## Content model

All content is markdown files in `src/content/posts/` with frontmatter:

```yaml
---
type: blog_post        # or "activity"
title: "Post Title"
publishedAt: 2026-03-07T12:00:00.000Z
tags:
  - typescript
platformVariants:
  linkedin: ""         # plain text for LinkedIn cross-post, optional
---

Post body in markdown.
```

Add a file, push, site rebuilds. That's the whole publishing pipeline.

---

## Part of the Developer Visibility Stack

| Product | Status |
|---|---|
| **The Blog** (this repo) | live |
| **The App** | React Native · Android · in progress |
