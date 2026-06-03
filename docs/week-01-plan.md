# Week 1 — OpenClaw Observability 学习计划

> 起始：2026-06-03（周三）  
> 目标：吃透 OTel + LangSmith + Phoenix 基础，为下周给 OpenClaw 加 hook 做准备

## 本周节奏（每天 30-60min）

| 日期 | 主题 | 任务 | 产出 |
|---|---|---|---|
| **周三 6/3** ✅ | LangSmith 接入 | 跑通 example 01/02/03，配额 guard 上线 | 已完成，3 个 commit 推送 |
| **周四 6/4** | OTel 核心概念 | 读 OTel Spec：Trace / Span / Context / Propagation | `docs/notes/otel-basics.md` 一页笔记 |
| **周五 6/5** | GenAI 语义约定 | 读 [OTel GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/)，对比 OpenInference | 整理 `docs/notes/semconv-compare.md` |
| **周六 6/6** | Phoenix 本地跑起来 | `docker run phoenix` + 改 example 04，trace 双发 LangSmith + Phoenix | example 04 + 截图 |
| **周日 6/7** | 阅读 OpenClaw 源码 | grep dispatch / agentTurn / tool 调用入口，找 hook 点 | `docs/notes/openclaw-hook-points.md` 候选清单 |
| **周一 6/8** | 周报 + 复盘 | 总结一周，决定下周是直接 fork OpenClaw 还是写 wrapper | 周报推送到 career 群 |

## 推荐阅读优先级

🔥 **必读**（本周）
1. https://opentelemetry.io/docs/concepts/signals/traces/ — Trace/Span 核心模型
2. https://docs.langchain.com/langsmith/trace-with-opentelemetry — LangSmith OTel 完整流程
3. https://github.com/Arize-ai/openinference/tree/main/spec — OpenInference 规范

📖 **选读**（有时间再看）
4. https://docs.arize.com/phoenix/tracing/concepts-tracing — Phoenix tracing 概念
5. https://www.honeycomb.io/blog/series/opentelemetry-intro — 业界 OTel 实战经验
6. LangChain 的 `langsmith-sdk` JS 源码：https://github.com/langchain-ai/langsmith-sdk/tree/main/js

## 不要做的事

- ❌ 不要去学 LangChain / LangGraph（不是路径上的东西）
- ❌ 不要现在就 fork OpenClaw 改源码（先理解 hook 点）
- ❌ 不要追求"一周搞定 plugin"——R&D 节奏，先理解再动手

## 卡点求助

任何一天卡住超过 30min，直接喊我："我卡在 X"。
