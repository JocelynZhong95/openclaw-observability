# Research Notes — LangSmith & Phoenix for OpenClaw

_Last updated: 2026-06-03_

## 1. LangSmith via OpenTelemetry

LangSmith accepts OTLP from **any** OTel client — you do **not** need LangChain.

### Env wiring (non-LangChain app)

```bash
LANGSMITH_OTEL_ENABLED=true
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com   # or eu./apac./aws. variant
LANGSMITH_API_KEY=ls__...
# Optional, for multi-workspace keys:
LANGSMITH_WORKSPACE_ID=...
```

Python SDK requirement: `langsmith>=0.4.25` (OTel fixes).
Install: `pip install "langsmith[otel]" opentelemetry-sdk opentelemetry-exporter-otlp`

### Key span attributes LangSmith looks for

- `gen_ai.system` (e.g. `openai`, `anthropic`)
- `gen_ai.request.model`, `gen_ai.response.model`
- `gen_ai.usage.prompt_tokens`, `gen_ai.usage.completion_tokens`
- `gen_ai.prompt.{n}.role` / `.content`
- `gen_ai.completion.{n}.role` / `.content`

These follow the [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/).

### OTel Collector fan-out (recommended)

Send OpenClaw → local Collector → both LangSmith and Phoenix simultaneously. One instrumentation, two backends, A/B comparable.

**Doc**: https://docs.langchain.com/langsmith/trace-with-opentelemetry

---

## 2. Arize Phoenix via OpenInference

Phoenix uses **[OpenInference](https://github.com/Arize-ai/openinference)** — an OTel-compatible spec specialized for LLM/agent semantics (richer than vanilla GenAI conventions: tool calls, retrievers, embeddings, reranking, evals).

### Run Phoenix locally (one-liner)

```bash
docker run -p 6006:6006 -p 4317:4317 arizephoenix/phoenix:latest
# UI: http://localhost:6006
# OTLP gRPC: localhost:4317
```

### Point any OTel client at it

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
```

### OpenInference span kinds we care about

- `LLM` — model call
- `CHAIN` — composite step (≈ OpenClaw `agentTurn`)
- `TOOL` — function/tool invocation
- `AGENT` — agent-level span (≈ OpenClaw agent root)
- `RETRIEVER`, `EMBEDDING`, `RERANKER` — RAG plumbing

Auto-instrumentors exist for OpenAI, Anthropic, LiteLLM, MCP, LangChain, LlamaIndex, CrewAI, etc. For **custom frameworks like OpenClaw**, we'd write spans manually using `openinference-semantic-conventions`.

**Doc hubs**:
- https://docs.arize.com/phoenix
- https://github.com/Arize-ai/openinference (semantic conventions + instrumentors)

---

## 3. Mapping OpenClaw concepts → span tree

| OpenClaw concept       | OpenInference span kind | Notes                                     |
|------------------------|-------------------------|-------------------------------------------|
| Session / agent root   | `AGENT`                 | one per `agent=career` etc.               |
| `agentTurn`            | `CHAIN`                 | parent of one model call + tool calls     |
| Model invocation       | `LLM`                   | capture `gen_ai.*` + token usage          |
| Tool call (`exec`, `web_fetch`, MCP, …) | `TOOL`     | name = tool id, input/output as attrs     |
| Sub-agent spawn (`sessions_spawn`) | `CHAIN` (linked) | use OTel `links` to parent trace          |
| Cron-triggered run     | `AGENT` (root)          | attribute `openclaw.trigger = cron`       |
| Channel send (feishu)  | `TOOL`                  | redact PII on outbound                    |

---

## 4. Implementation sketch

OpenClaw is Node.js (`node v22`, runs from `/opt/homebrew/lib/node_modules/openclaw`). So the instrumentation layer is JS, not Python.

- `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/exporter-trace-otlp-http`
- Phoenix JS semantic-conventions: `@arizeai/openinference-semantic-conventions`
- Hook points (to confirm by reading OpenClaw source):
  1. Gateway request entry → start `AGENT` span
  2. `agentTurn` dispatch → start `CHAIN` span (child)
  3. Each LLM provider call → `LLM` span with token usage
  4. Each tool invocation → `TOOL` span
  5. `sessions_spawn` → start new trace, add `Link` to parent span context

Cleanest path: a **plugin** under `~/.openclaw/plugins/` that registers tracing hooks, configured via `gateway` tool's config schema.

---

## 5. Open questions

1. Does OpenClaw expose middleware/hook APIs for tool dispatch, or do we need to fork?
2. How are streaming tokens accounted? (need usage at stream end, not start)
3. Trace propagation across `sessions_spawn` isolated sessions — does OpenClaw pass any context envelope we can piggyback on?
4. PII handling: secrets in tool args (e.g. `git push` URLs with tokens) — need a redaction layer before export.

---

## 6. Reading list

- ✅ LangSmith OTel guide — https://docs.langchain.com/langsmith/trace-with-opentelemetry
- ⬜ OpenInference spec — https://github.com/Arize-ai/openinference/blob/main/spec/README.md
- ⬜ OTel GenAI semconv — https://opentelemetry.io/docs/specs/semconv/gen-ai/
- ⬜ Phoenix custom instrumentation — https://docs.arize.com/phoenix/tracing/llm-traces-1/manual-instrumentation
- ⬜ Phoenix evals — https://docs.arize.com/phoenix/evaluation/llm-evals
- ⬜ LangSmith eval datasets — https://docs.smith.langchain.com/evaluation
- ⬜ OpenClaw source — https://github.com/openclaw/openclaw (find dispatch/hook surface)
