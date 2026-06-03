// examples/03-with-quota.mjs
// Same as 02 but uses the reusable tracer module + quota guard.
// Run: node examples/03-with-quota.mjs

import { initTracer, withSpan, shutdown } from '../src/tracer.mjs';

const MAESTRO_BASE = process.env.AGENT_MAESTRO_BASE ?? 'http://localhost:23333/api/anthropic';
const MODEL = 'claude-opus-4-7';

const init = await initTracer({ serviceName: 'openclaw-demo' });
if (!init.enabled) {
  console.log('Tracing disabled, exiting.');
  process.exit(0);
}
console.log(`📊 Quota: ${init.quota.used}/${init.quota.limit} used this month`);

const userMsg = 'In one sentence: what is OpenTelemetry?';

await withSpan('agent.career', { 'openclaw.agent.id': 'career', 'openclaw.trigger': 'manual' }, async () => {
  await withSpan('agent.turn', {}, async () => {
    await withSpan('llm.call', {
      'gen_ai.system': 'anthropic',
      'gen_ai.request.model': MODEL,
      'gen_ai.prompt.0.role': 'user',
      'gen_ai.prompt.0.content': userMsg,
      'openclaw.gateway': 'agent-maestro',
    }, async (span) => {
      const t0 = Date.now();
      const res = await fetch(`${MAESTRO_BASE}/v1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL, max_tokens: 150, messages: [{ role: 'user', content: userMsg }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Maestro ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
      const reply = data.content?.[0]?.text ?? '';
      const usage = data.usage ?? {};
      span.setAttributes({
        'gen_ai.response.model': data.model ?? MODEL,
        'gen_ai.usage.prompt_tokens': usage.input_tokens ?? 0,
        'gen_ai.usage.completion_tokens': usage.output_tokens ?? 0,
        'gen_ai.usage.total_tokens': (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
        'gen_ai.completion.0.role': 'assistant',
        'gen_ai.completion.0.content': reply,
        'openclaw.latency_ms': Date.now() - t0,
      });
      console.log(`📨 ${reply}`);
      console.log(`🔢 in=${usage.input_tokens} out=${usage.output_tokens} | ${Date.now() - t0}ms`);
    });
  });
});

await shutdown();
console.log('✅ Done. Check LangSmith UI.');
