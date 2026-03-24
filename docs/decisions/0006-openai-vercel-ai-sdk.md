# ADR-0006: OpenAI via Vercel AI SDK (non-streaming)

## Status

Accepted (retroactive)

## Context

The AI pipeline needs to:
1. Determine if commits are "significant" (user-facing value)
2. Generate marketing content (changelog, LinkedIn, Twitter)

Both tasks run in background jobs (Inngest), not in streaming UI responses.

*Inferred from code as of 2026-03-23:* `src/lib/ai/generate.ts` uses `generateText()` from `ai` package with `openai("gpt-4o-mini")`. No `streamText()` usage found in codebase—streaming is not needed for batch processing.

## Decision

Use **Vercel AI SDK** (`ai` package) with **OpenAI** (`@ai-sdk/openai`):
- Model: `gpt-4o-mini` for cost efficiency
- Method: `generateText()` for synchronous (non-streaming) completions
- Output: JSON parsed from model response

## Consequences

**Positive:**
- Simple API for non-streaming use cases
- Easy to swap models (Claude, Gemini) via AI SDK providers
- Cost-effective with gpt-4o-mini

**Negative / Trade-offs:**
- No streaming means no partial progress in UI (acceptable for background jobs)
- JSON parsing from raw text is fragile; model must output valid JSON
- Prompt changes require testing to ensure JSON shape still parses

## Alternatives Considered

| Alternative | Why not chosen |
|-------------|----------------|
| OpenAI SDK directly | Vercel AI SDK provides unified interface across providers |
| Claude (Anthropic) | gpt-4o-mini sufficient and cheaper for this use case |
| Streaming responses | Not needed; all AI calls are in background jobs |
| Structured output (function calling) | Added complexity; string JSON output works |

## Relevant Files

- `src/lib/ai/generate.ts` — `checkSignificance()`, `generateContent()`
- `src/lib/ai/prompts.ts` — prompt builders (significance + generation)
- `src/inngest/functions/process-push.ts` — calls AI functions in steps
- `package.json` — `ai`, `@ai-sdk/openai` dependencies
