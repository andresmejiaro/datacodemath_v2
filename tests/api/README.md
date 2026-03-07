# API Tests

**DO NOT MODIFY THESE FILES — managed by Claude Code (architecture).**
Codex: read these to understand expected API behavior. Run them to verify your implementation.

## Setup

Start the dev server first:
```
npm run dev
```

Then in a second terminal, run the integration tests:
```
bash tests/api/integration.sh
```

Set `BASE_URL` to test against a deployed URL:
```
BASE_URL=https://your-deployment.vercel.app bash tests/api/integration.sh
```

## What is tested

- `POST /api/publish` — auth, validation, happy path
- `GET /api/posts.json` — public read, shape validation

## What is NOT tested here

- GitHub API write side-effects (tested manually via curl after deployment)
- Vercel rate limiting (platform concern)
