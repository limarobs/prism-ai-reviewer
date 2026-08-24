# PRism AI Reviewer

Evidence-based AI code review for public GitHub pull requests, powered by
Gemini and deployed at the edge.

PRism reads a pull request diff, identifies concrete engineering risks, suggests
missing tests, and links every finding back to the relevant source file.

## Features

- GitHub pull request URL validation and normalized diff ingestion
- Structured Gemini output with runtime validation
- Findings categorized by severity, type, and confidence
- Evidence links pinned to the pull request head commit
- Explicit prompt injection boundary for repository content
- Bounded pagination and model context
- Responsive React report interface
- Tests, linting, type checking, and reproducible CI

## Stack

- React 19 and Vite
- TypeScript
- Hono on Cloudflare Workers
- Gemini API
- Vitest and ESLint

See [the architecture notes](docs/architecture.md) for design and security
decisions.

## Local development

Requirements:

- Node.js 22+
- npm 10+
- A Gemini API key from Google AI Studio

Install dependencies:

```bash
npm install
```

Create the local Worker secrets file:

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

Set `GEMINI_API_KEY` in that file. `GITHUB_TOKEN` is optional for public
repositories but provides a higher API rate limit.

Start the web app and API together:

```bash
npm run dev
```

The web application runs at `http://localhost:5173`; Vite proxies `/api` calls
to the Worker at `http://localhost:8787`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deploy

Deploy the API from `apps/api`:

```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put GITHUB_TOKEN
npx wrangler deploy
```

Deploy `apps/web` as a Cloudflare Pages project with:

- Build command: `npm run build -w @prism/web`
- Output directory: `apps/web/dist`
- Node version: `22`

Route `/api/*` to the Worker through a custom domain or configure the frontend
proxy for the deployed Worker URL.

## Privacy

The MVP accepts public repositories only. Gemini free-tier requests may be used
by Google to improve its products, so do not submit private or sensitive code.

## License

MIT
