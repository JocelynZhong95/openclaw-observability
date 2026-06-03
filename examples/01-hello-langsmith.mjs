// examples/01-hello-langsmith.mjs
// Minimal proof: send one fake "agent turn" trace to LangSmith via OpenTelemetry.
// Run: node examples/01-hello-langsmith.mjs
//
// Env required (loaded from ~/.openclaw/secrets.env):
//   LANGSMITH_API_KEY, LANGSMITH_ENDPOINT, LANGSMITH_PROJECT

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const API_KEY = process.env.LANGSMITH_API_KEY;
const ENDPOINT = process.env.LANGSMITH_ENDPOINT ?? 'https://api.smith.langchain.com';
const PROJECT = process.env.LANGSMITH_PROJECT ?? 'openclaw-observability';

if (!API_KEY) {
  console.error('❌ LANGSMITH_API_KEY missing. Source ~/.openclaw/secrets.env first.');
  process.exit(1);
}

// LangSmith OTLP endpoint = <base>/otel/v1/traces
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'openclaw-demo',
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${ENDPOINT}/otel/v1/traces`,
    headers: {
      'x-api-key': API_KEY,
      'Langsmith-Project': PROJECT,
    },
  }),
});

await sdk.start();
const tracer = trace.getTracer('openclaw-demo');

// Simulate one OpenClaw agent turn: AGENT -> CHAIN -> LLM + TOOL
await tracer.startActiveSpan('agent.career', async (agentSpan) => {
  agentSpan.setAttributes({
    'openclaw.agent.id': 'career',
    'openclaw.trigger': 'manual',
  });

  await tracer.startActiveSpan('agent.turn', async (turnSpan) => {
    // Fake LLM call
    await tracer.startActiveSpan('llm.call', async (llmSpan) => {
      llmSpan.setAttributes({
        'gen_ai.system': 'anthropic',
        'gen_ai.request.model': 'claude-opus-4-7',
        'gen_ai.response.model': 'claude-opus-4-7',
        'gen_ai.usage.prompt_tokens': 1234,
        'gen_ai.usage.completion_tokens': 256,
        'gen_ai.prompt.0.role': 'user',
        'gen_ai.prompt.0.content': 'hello from openclaw',
        'gen_ai.completion.0.role': 'assistant',
        'gen_ai.completion.0.content': 'hello back — trace ok',
      });
      await new Promise((r) => setTimeout(r, 50));
      llmSpan.setStatus({ code: SpanStatusCode.OK });
      llmSpan.end();
    });

    // Fake tool call
    await tracer.startActiveSpan('tool.exec', async (toolSpan) => {
      toolSpan.setAttributes({
        'openclaw.tool.name': 'exec',
        'openclaw.tool.input': 'ls -la',
      });
      await new Promise((r) => setTimeout(r, 20));
      toolSpan.end();
    });

    turnSpan.end();
  });

  agentSpan.end();
});

await sdk.shutdown();
console.log(`✅ Trace sent. Open https://smith.langchain.com → project "${PROJECT}"`);
