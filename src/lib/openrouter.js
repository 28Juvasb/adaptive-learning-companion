// LLM call wrapper: fetch -> hardened JSON extraction -> schema validation -> model failover.
// All stage calls go through callStage() in prompts.js, which delegates here.

import { getMockResponse } from "./mocks.js";

const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const NVIDIA_KEY = import.meta.env.VITE_NVIDIA_API_KEY;

// Each provider speaks the same OpenAI-compatible chat/completions shape,
// just at a different URL/key. Add a provider here, then reference it by
// name in MODELS below.
const PROVIDERS = {
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    key: OPENROUTER_KEY,
    // OpenRouter attribution headers (optional but recommended).
    extraHeaders: { "HTTP-Referer": "http://localhost:5173", "X-Title": "Adaptive Learning Companion" },
  },
  // NOT usable from this app: build.nvidia.com's NIM API key/verified working
  // server-side (Node), but its actual POST response has no CORS headers, so
  // the browser blocks it after preflight (net::ERR_FAILED). Only reachable
  // from this SPA via a backend proxy, which this project doesn't have. Left
  // here for reference / future proxy use — do not add to MODELS below.
  nvidia: {
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    key: NVIDIA_KEY,
    extraHeaders: {},
  },
};

// Models are tried in order. Swap/reorder entries if one rate-limits mid-demo.
// OpenRouter's free-tier lineup changes often — models here were live-verified
// against https://openrouter.ai/api/v1/models at build time. If all three ever
// start failing, re-run that endpoint and filter for `id.endsWith(":free")`.
export const MODELS = [
  { id: "meta-llama/llama-2-70b-chat:free", provider: "openrouter" },
  { id: "mistralai/mistral-7b-instruct:free", provider: "openrouter" },
  { id: "microsoft/phi-3-medium-128k-instruct:free", provider: "openrouter" },
  { id: "nousresearch/nous-hermes-2-mixtral-8x7b-dpo:free", provider: "openrouter" },
  { id: "meta-llama/llama-3-8b-instruct:free", provider: "openrouter" },
];

// Per-model attempt timeout — NOT a shared budget across the whole failover
// chain. Each model in MODELS gets its own fresh clock, so a rate-limited or
// hung first attempt can't starve the fallback models of time to answer.
const TIMEOUT_MS = 90_000;
const MAX_TOKENS = 4096;

export const isDemoMode = !OPENROUTER_KEY?.trim();

export class LLMError extends Error {
  constructor(message, { retryable = true } = {}) {
    super(message);
    this.name = "LLMError";
    this.retryable = retryable;
  }
}

// Pull a JSON object out of a model response that may include markdown
// fences, preamble text, or trailing commentary.
export function extractJSON(raw) {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new LLMError("Model returned an empty response.");
  }
  const attempts = [];
  attempts.push(raw.trim());
  attempts.push(raw.replace(/```json|```/gi, "").trim());
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) {
    attempts.push(raw.slice(first, last + 1));
  }
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {
      /* try next */
    }
  }
  throw new LLMError("Model returned malformed JSON.");
}

async function callModel({ id, provider }, systemPrompt, userPrompt, signal) {
  const cfg = PROVIDERS[provider];
  if (!cfg.key?.trim()) {
    throw new LLMError(`${id} skipped (no ${provider} API key configured).`);
  }

  const res = await fetch(cfg.url, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      ...cfg.extraHeaders,
    },
    body: JSON.stringify({
      model: id,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: MAX_TOKENS,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const detail = res.status === 429 ? "rate limited" : `HTTP ${res.status}`;
    throw new LLMError(`${id} failed (${detail}).`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  return extractJSON(raw);
}

/**
 * Call the LLM with automatic model failover and schema validation.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} opts
 * @param {(json: object) => object} opts.validate - throws or returns normalized json
 * @param {string} opts.mockKey - which canned response to use in demo mode
 */
export async function callLLM(systemPrompt, userPrompt, { validate, mockKey, mockContext } = {}) {
  if (isDemoMode) {
    // No API key: simulate latency and return a canned, topic-aware response.
    await new Promise((r) => setTimeout(r, 700));
    const mock = getMockResponse(mockKey, mockContext);
    return validate ? validate(mock) : mock;
  }

  let lastError = null;

  for (const model of MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const json = await callModel(model, systemPrompt, userPrompt, controller.signal);
      return validate ? validate(json) : json;
    } catch (err) {
      const message =
        err.name === "AbortError" ? `${model.id} timed out after ${TIMEOUT_MS / 1000}s.` : err.message;
      console.warn(`Model ${model.id} failed, trying next:`, message);
      lastError = new LLMError(message);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new LLMError(
    `All models failed (last error: ${lastError?.message ?? "unknown"}). Wait a few seconds and retry.`
  );
}

// ---------------------------------------------------------------------------
// Streaming chat (plain markdown, not JSON) — used by the follow-up chat panel.
// ---------------------------------------------------------------------------

async function streamModel({ id, provider }, messages, signal, onToken) {
  const cfg = PROVIDERS[provider];
  if (!cfg.key?.trim()) {
    throw new LLMError(`${id} skipped (no ${provider} API key configured).`);
  }

  const res = await fetch(cfg.url, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      ...cfg.extraHeaders,
    },
    body: JSON.stringify({ model: id, messages, temperature: 0.5, stream: true, max_tokens: MAX_TOKENS }),
  });

  if (!res.ok || !res.body) {
    const detail = res.status === 429 ? "rate limited" : `HTTP ${res.status}`;
    throw new LLMError(`${id} failed (${detail}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    let chunk;
    try {
      chunk = await reader.read();
    } catch (err) {
      // Timed out mid-stream. Whatever the student already saw stream in is a
      // real, usable (if truncated) answer — return it instead of discarding
      // it for a bare "timed out" error.
      if (err.name === "AbortError" && full.trim()) return full;
      throw err;
    }
    const { done, value } = chunk;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // OpenRouter streams SSE: lines beginning with "data: ".
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // keep the trailing partial line
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onToken(delta);
        }
      } catch {
        /* ignore keep-alive / partial chunks */
      }
    }
  }
  if (!full.trim()) throw new LLMError(`${id} returned an empty response.`);
  return full;
}

/**
 * Stream a chat completion, calling onToken(chunk) as text arrives.
 * Falls back across MODELS. In demo mode, simulates streaming from a canned answer.
 * @param {Array<{role,content}>} messages - full message list incl. system prompt
 * @returns {Promise<string>} the full accumulated text
 */
export async function callLLMStream(messages, onToken, { mockAnswer } = {}) {
  if (isDemoMode) {
    const text =
      mockAnswer ??
      "**Demo mode.** Add your OpenRouter API key to `.env.local` for live, in-depth answers with streaming.";
    for (const word of text.split(/(\s+)/)) {
      onToken(word);
      await new Promise((r) => setTimeout(r, 12));
    }
    return text;
  }

  let lastError = null;
  for (const model of MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await streamModel(model, messages, controller.signal, onToken);
    } catch (err) {
      const message =
        err.name === "AbortError" ? `${model.id} timed out after ${TIMEOUT_MS / 1000}s.` : err.message;
      console.warn(`Stream model ${model.id} failed, trying next:`, message);
      lastError = new LLMError(message);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new LLMError(`All models failed (last: ${lastError?.message ?? "unknown"}). Retry.`);
}
