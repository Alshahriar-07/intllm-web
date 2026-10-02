# INTLLM

> Canonical machine-readable project reference for AI assistants, LLM agents, and developer tooling.

## Identity

- **Project Name:** INTLLM
- **Description:** A local-first AI runtime that extends compatible local models (via Ollama) with layered memory, optional live web retrieval, controlled browser tools, and an OpenAI-compatible local API — all executing locally on your machine.
- **Repository:** https://github.com/Alshahriar-07/INTLLM
- **Website:** https://intllm.vercel.app
- **License:** PolyForm Noncommercial License 1.0.0
- **Author:** Al Shahriar Sowan (@Alshahriar-07)
- **Current Version:** 1.0.2 (Production Release)

## Architecture

```text
User / Clients / Scripts
  │
  ▼
INTLLM Runtime (FastAPI Orchestrator, default port 8000 on 127.0.0.1)
  ├── L0 Flash Brain        — Fast micro-cache and pgvector routing index
  ├── L1 Hot Cache          — Short-lived context cache (30m TTL)
  ├── L2 Secondary Brain    — Durable PostgreSQL + pgvector knowledge store
  ├── Tool Gateway          — Permission-gated tool execution barrier
  ├── Browser Agent         — Optional Playwright automation
  ├── Internet Retrieval    — DuckDuckGo / SearXNG (opt-in per request)
  ├── Resource Governor     — Yields background jobs to interactive user requests
  └── Model Adapter         — Uniform Ollama interface (http://127.0.0.1:11434)
```

## Local API (/v1)

OpenAI-compatible local HTTP endpoints:

- `GET /v1/models` — Lists installed Ollama models.
- `GET /v1/models/{model}` — Inspects model metadata.
- `POST /v1/chat/completions` — Streaming SSE (`stream: true`) and JSON completions.

### Custom Request Fields

- `intllm_use_brain` (boolean, default: true) — Query local layered memory.
- `intllm_use_web` (boolean, default: false) — Enable live web retrieval.

### Authentication

Pass `Authorization: Bearer <key>` or `x-api-key: <key>`. Keys use salted scrypt hashes and are displayed once upon generation.

## Tool Registry

| Tool | Risk | Default Status |
| --- | --- | --- |
| `web.search` | Low | Enabled (opt-in) |
| `web.extract` | Low | Enabled (opt-in) |
| `browser.read` | Low | Enabled (Playwright required) |
| `browser.open` | Medium | Requires approval |
| `browser.click` | Medium | Requires approval |
| `brain.search` | Low | Enabled |
| `system.info` | Low | Enabled |
| `filesystem.read` | Medium | Workspace allowlist only |
| `filesystem.write` | High | Disabled by default policy |
| `terminal.execute` | Critical | Disabled by default policy |

## Installation

- **Windows (PowerShell):**
  ```powershell
  irm https://intllm.vercel.app/install.ps1 | iex
  ```
- **macOS / Linux (Shell):**
  ```bash
  curl -fsSL https://intllm.vercel.app/install.sh | bash
  ```
- **Manual (pip):**
  ```bash
  pip install intllm
  intllm doctor
  ```

## Key Principles

- **Local First:** Everything binds to loopback (`127.0.0.1`).
- **No Weight Retraining:** INTLLM manages external memory, tools, and context; it never retrains base model weights.
- **Privacy by Default:** Zero cloud sync or telemetry beacons.
- **Honest Diagnostics:** Unreachable dependencies report explicit status codes (e.g. 503 service unavailable).
