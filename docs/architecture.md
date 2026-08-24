# Architecture

PRism is a small, edge-native application with explicit boundaries around
untrusted repository content and model output.

```text
Browser
  │ POST /api/reviews { url }
  ▼
Cloudflare Worker (Hono)
  ├── validates the GitHub URL
  ├── fetches PR metadata and patches from GitHub
  ├── truncates oversized review inputs
  ├── requests structured output from Gemini
  └── validates the model result before returning it
  ▼
React report UI
```

## Design decisions

### Server-side model access

The browser never receives the Gemini or optional GitHub API keys. Both are
stored as Cloudflare Worker secrets.

### Evidence over prose

Each finding contains a file and optional line number. The UI resolves that
evidence to the exact commit blob on GitHub instead of presenting unsupported
free-form advice.

### Structured output at two layers

Gemini receives a JSON Schema, and the API validates the parsed result again at
runtime. An invalid provider response fails closed with a generic error.

### Prompt injection boundary

Pull request metadata and patches are explicitly marked as untrusted. The model
is instructed never to follow commands inside that boundary. Secrets and tools
are not made available to model-generated content.

### Bounded work

GitHub pagination and total diff characters are capped. This protects upstream
quotas, model context, latency, and Worker resources. A partial-analysis flag is
shown in the report when the file limit is reached.

## Future work

- Cache results by head commit SHA in Cloudflare D1.
- Add an evaluation dataset with labeled defects and false-positive scoring.
- Verify reported lines against parsed diff hunks.
- Add GitHub App authentication for private repositories.
- Process very large pull requests asynchronously with Cloudflare Queues.
