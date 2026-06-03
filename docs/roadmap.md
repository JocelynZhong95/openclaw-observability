# Roadmap

## Phase 0 — Spike (Week 1-2)
- [ ] Read OpenClaw source: locate agentTurn dispatch, tool invocation, sessions_spawn points
- [ ] Stand up Phoenix locally via Docker, verify OTLP ingest with a hello-world Node script
- [ ] Sign up for LangSmith, send the same hello-world trace, compare UX

## Phase 1 — Manual instrumentation POC (Week 3-4)
- [ ] Wrap a single agent (`career`) end-to-end: AGENT → CHAIN → LLM/TOOL spans
- [ ] Confirm traces render correctly in both Phoenix and LangSmith
- [ ] Document semantic-attribute mapping (OpenClaw → OpenInference)

## Phase 2 — Plugin (Week 5-8)
- [ ] Package as an OpenClaw plugin under `~/.openclaw/plugins/observability/`
- [ ] Config via `gateway` tool: enable/disable, endpoint, sampling, redaction rules
- [ ] Cross-session trace linking for `sessions_spawn`
- [ ] Cron-triggered run attribution
- [ ] Streaming-aware token accounting

## Phase 3 — Eval harness (Week 9-12)
- [ ] Export OpenClaw traces as LangSmith datasets
- [ ] LLM-as-judge scorers for: tool-call correctness, response quality, safety
- [ ] CI integration: replay-on-PR regression detection

## Phase 4 — Polish & publish
- [ ] Docs site, install guide, screenshots
- [ ] Submit to ClawHub (https://clawhub.ai)
- [ ] Blog post: "Bringing LangSmith/Phoenix to OpenClaw"
