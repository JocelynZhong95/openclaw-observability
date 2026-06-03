# openclaw-observability

> Bringing LLM-native observability (LangSmith + Arize Phoenix) to [OpenClaw](https://github.com/openclaw/openclaw) agents via OpenTelemetry / OpenInference.

## Why

OpenClaw orchestrates multi-agent workflows (cron jobs, sub-agents, tool calls, MCP, channel routing). Today, debugging an agent failure means grepping logs across `gateway`, `agentTurn`, and individual tool runs. There's no unified trace view, no token/cost analytics per turn, no eval harness for regressions.

This repo explores **wiring OpenClaw runs into two industry-standard LLM observability stacks**:

- **[LangSmith](https://smith.langchain.com)** — hosted, eval-first, great for prompt iteration & dataset-driven regression tests.
- **[Arize Phoenix](https://phoenix.arize.com)** — OSS, self-hostable, OpenInference-native, strong for production tracing & drift monitoring.

Both speak **OpenTelemetry**, so a single instrumentation layer in OpenClaw can fan out to either backend.

## Goals

1. **Trace every OpenClaw turn** — capture `agentTurn`, tool calls, sub-agent spawns, cron-triggered runs as a single OTel trace tree.
2. **Cost & latency dashboards** — per-agent, per-model, per-cron-job breakdowns.
3. **Eval harness** — replay past traces against new prompts/models, score with LLM-as-judge.
4. **Zero-code instrumentation** — drop-in `OTEL_*` env vars + a small OpenClaw plugin, no agent code changes.

## Non-Goals

- Replace OpenClaw's native logging/heartbeat system.
- Build yet another observability backend — we just wire to existing ones.

## Architecture (target)

```
┌────────────────────┐    OTel spans     ┌─────────────────┐
│  OpenClaw Gateway  │ ────────────────▶ │  OTel Collector │
│  (agentTurn, tools,│                   │   (fan-out)     │
│   cron, MCP)       │                   └────────┬────────┘
└────────────────────┘                            │
                                       ┌──────────┴──────────┐
                                       ▼                     ▼
                                 ┌──────────┐         ┌──────────────┐
                                 │ LangSmith│         │ Arize Phoenix│
                                 │  (SaaS)  │         │  (self-host) │
                                 └──────────┘         └──────────────┘
```

## Status

🌱 Early R&D. **First trace verified in LangSmith UI 2026-06-03** — see `examples/`.

### What works today
- ✅ OTel → LangSmith export via OTLP/HTTP
- ✅ Real LLM call through OpenClaw's `agent-maestro` gateway with token usage capture
- ✅ Reusable tracer module (`src/tracer.mjs`) with `withSpan` helper
- ✅ Monthly 5,000-trace quota guard (auto-disables export when exhausted)

### Next
- Hook into OpenClaw runtime (not standalone scripts) — design needed
- Phoenix exporter fan-out
- Streaming token accounting

See [`docs/research.md`](docs/research.md) for the running literature review and [`docs/roadmap.md`](docs/roadmap.md) for milestones.

## Repo layout

```
docs/        # design notes, research, comparison matrices
examples/    # minimal runnable demos (custom-agent → LangSmith / Phoenix)
src/         # the OpenClaw observability plugin (WIP)
```

## License

MIT
