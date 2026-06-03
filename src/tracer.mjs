// src/tracer.mjs
// Reusable LangSmith OTel tracer with quota guard.
// Usage:
//   import { initTracer, withSpan, shutdown } from './src/tracer.mjs';
//   await initTracer({ serviceName: 'openclaw' });
//   await withSpan('agent.turn', { 'openclaw.agent.id': 'career' }, async (span) => { ... });
//   await shutdown();

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { shouldSend, bump, getStatus } from './quota.mjs';

let sdk = null;
let tracer = null;
let enabled = false;

export async function initTracer({ serviceName = 'openclaw', tracerName = 'openclaw' } = {}) {
  const apiKey = process.env.LANGSMITH_API_KEY;
  const endpoint = process.env.LANGSMITH_ENDPOINT ?? 'https://api.smith.langchain.com';
  const project = process.env.LANGSMITH_PROJECT ?? 'openclaw-observability';

  if (!apiKey) {
    console.warn('⚠️  LANGSMITH_API_KEY missing — tracing disabled');
    return { enabled: false };
  }

  const status = getStatus();
  if (status.overLimit) {
    console.warn(`🛑 LangSmith quota exhausted for ${status.month} (${status.used}/${status.limit}) — tracing disabled`);
    return { enabled: false, quota: status };
  }

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/otel/v1/traces`,
      headers: { 'x-api-key': apiKey, 'Langsmith-Project': project },
    }),
  });
  await sdk.start();
  tracer = trace.getTracer(tracerName);
  enabled = true;
  return { enabled: true, project, quota: status };
}

export async function withSpan(name, attrs, fn) {
  if (!enabled || !tracer) {
    // tracing off — just run fn with a no-op span shim
    return fn({ setAttributes() {}, setStatus() {}, recordException() {}, end() {} });
  }
  return tracer.startActiveSpan(name, async (span) => {
    if (attrs) span.setAttributes(attrs);
    try {
      const out = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return out;
    } catch (e) {
      span.recordException(e);
      span.setStatus({ code: SpanStatusCode.ERROR, message: e.message });
      throw e;
    } finally {
      span.end();
    }
  });
}

export async function shutdown() {
  if (!sdk) return;
  if (enabled) bump(); // count this run against monthly quota (root-span granularity)
  await sdk.shutdown();
  sdk = null;
  tracer = null;
  enabled = false;
}
