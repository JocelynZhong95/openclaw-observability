# Week 1 — OpenClaw Observability 学习计划

> 起始：2026-06-03（周三）  
> **大目标：Agent Development Engineer**（见 `~/.openclaw/workspaces/career/CAREER-PLAN.md`）  
> 本周使命：**理解 agent 可观测性的本质**，不是学某个厂商的产品

## 为什么先做可观测性？

Agent 工程的核心难题是：**“它为什么这么回答？”**。  
Observability 是回答这个问题的唯一手段。掌握它 = 掌握了 agent 调试/评测/迭代 的基础设施。  
LangSmith / Phoenix 只是这个能力的具体载体，重点是背后的 OTel 模型 + GenAI 语义。

## 本周节奏（每天 30-60min）

| 日期 | 主题 | 学完后能回答的问题 | 任务 / 产出 |
|---|---|---|---|
| **周三 6/3** ✅ | LangSmith 走通一遍 | “OTel trace 怎么发出去的？” | 3 个 example 跱通 ✅ |
| **周四 6/4** | OTel 核心概念 | “Span 、Trace、Context Propagation 是什么？为什么 agent 需要 propagation？” | `docs/notes/otel-basics.md` |
| **周五 6/5** | GenAI 语义约定 | “为什么需要为 LLM 另定一套语义？OTel GenAI vs OpenInference 差别？” | `docs/notes/semconv-compare.md` |
| **周六 6/6** | 读 1 个开源 agent 框架源码 | “一个 agent loop 在代码里是怎么实现的？tool dispatch 怎么干的？” | 选 [smol-agents](https://github.com/huggingface/smolagents) 或 [agno](https://github.com/agno-agi/agno)，读 1 个 entry 文件 + 笔记 |
| **周日 6/7** | OpenClaw hook 点收集 | “给一个现有 agent 框架加 tracing，应该加在哪些层？” | `docs/notes/openclaw-hook-points.md` |
| **周一 6/8** | 周复盘 | “下周要不要动手写 plugin？还是再读一个框架？” | 周报推送到 career 群 |

## 阅读优先级（按对面试的价值排）

🔥 **必读**
1. [OTel Traces 概念](https://opentelemetry.io/docs/concepts/signals/traces/) — 面试常问
2. [OpenInference Spec](https://github.com/Arize-ai/openinference/tree/main/spec) — 说出 LLM/CHAIN/TOOL/AGENT 区别
3. 以上二者的同时 → 对比 OpenClaw 的 agentTurn/tool/sub-agent 怎么映射

📖 **选读**
- [《Building Effective Agents》 (Anthropic)](https://www.anthropic.com/research/building-effective-agents) — 设计哲学
- [LangSmith OTel](https://docs.langchain.com/langsmith/trace-with-opentelemetry) — 代码参考
- [Phoenix tracing concepts](https://docs.arize.com/phoenix/tracing/concepts-tracing)

## 不要做

- ❌ 不要去学 LangChain / LangGraph
- ❌ 不要记 LangSmith UI 怎么用（眼决定在哪里，不是会点里点外）
- ❌ 不要追某个文档追太深，本周是“堆概念”不是“调试”

## 卡点求助

任何一天卡住超过 30min，直接喊我：“我卡在 X”。
