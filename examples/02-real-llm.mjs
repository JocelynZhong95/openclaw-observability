// examples/02-real-llm.mjs
// Real LLM call (OpenRouter free model) with OTel trace → LangSmith.
// Captures actual token usage from the model response.
//
// Run: node examples/02-real-llm.mjs
// Env: LANGSMITH_API_KEY, OPENROUTER_API_KEY (from ~/.openclaw/secrets.env)

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const LS_KEY = process.env.LANGSMITH_API_KEY;
const LS_ENDPOINT = process.env.LANGSMITH_ENDPOINT ?? 'https://api.smith.langchain.com';
const LS_PROJECT = process.env.LANGSMITH_PROJECT ?? 'openclaw-observability';
const MAESTRO_BASE = process.env.AGENT_MAESTRO_BASE ?? 'http://localhost:23333/api/anthropic';

if (!LS_KEY) { console.error('❌ LANGSMITH_API_KEY missing'); process.exit(1); }

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'openclaw-demo',
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${LS_ENDPOINT}/otel/v1/traces`,
    headers: { 'x-api-key': LS_KEY, 'Langsmith-Project': LS_PROJECT },
  }),
});
await sdk.start();
const tracer = trace.getTracer('openclaw-demo');

const MODEL = 'claude-opus-4-7';
const userMsg = 'In one sentence: why observe LLM agents?';

await tracer.startActiveSpan('agent.career', async (agentSpan) => {
  agentSpan.setAttributes({
    'openclaw.agent.id': 'career',
    'openclaw.trigger': 'manual',
  });

  await tracer.startActiveSpan('agent.turn', async (turnSpan) => {
    await tracer.startActiveSpan('llm.call', async (llmSpan) => {
      llmSpan.setAttributes({
        'gen_ai.system': 'anthropic',
        'gen_ai.request.model': MODEL,
        'gen_ai.prompt.0.role': 'user',
        'gen_ai.prompt.0.content': userMsg,
        'openclaw.gateway': 'agent-maestro',
      });

      try {
        const t0 = Date.now();
        const res = await fetch(`${MAESTRO_BASE}/v1/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 200,
            messages: [{ role: 'user', content: userMsg }],
          }),
        });
        const data = await res.json();
        const latency = Date.now() - t0;

        if (!res.ok) throw new Error(`Maestro ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);

        const reply = data.content?.[0]?.text ?? '';
        const usage = data.usage ?? {};
        const promptTok = usage.input_tokens ?? 0;
        const completionTok = usage.output_tokens ?? 0;
        llmSpan.setAttributes({
          'gen_ai.response.model': data.model ?? MODEL,
          'gen_ai.usage.prompt_tokens': promptTok,
          'gen_ai.usage.completion_tokens': completionTok,
          'gen_ai.usage.total_tokens': promptTok + completionTok,
          'gen_ai.completion.0.role': 'assistant',
          'gen_ai.completion.0.content': reply,
          'openclaw.latency_ms': latency,
        });
        llmSpan.setStatus({ code: SpanStatusCode.OK });
        console.log(`📨 Reply: ${reply}`);
        console.log(`🔢 Tokens: in=${promptTok} out=${completionTok} | ${latency}ms`);
      } catch (e) {
        llmSpan.recordException(e);
        llmSpan.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
        console.error('❌', e.message);
      } finally {
        llmSpan.end();
      }
    });
    turnSpan.end();
  });
  agentSpan.end();
});

await sdk.shutdown();
console.log(`✅ Trace sent → https://smith.langchain.com (project: ${LS_PROJECT})`);
