// LLM call wrapper: fetch -> hardened JSON extraction -> schema validation -> model failover.
// All stage calls go through callStage() in prompts.js, which delegates here.

import { getMockResponse } from "./mocks.js";

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Models are tried in order. Swap the first entry if it rate-limits mid-demo.
// OpenRouter's free-tier lineup changes often — models here were live-verified
// against https://openrouter.ai/api/v1/models at build time. If all three ever
// start failing, re-run that endpoint and filter for `id.endsWith(":free")`.
export const MODELS = [
  "openai/gpt-oss-120b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",
];

const TIMEOUT_MS = 90_000;

export const isDemoMode = !API_KEY || API_KEY.trim() === "";

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

async function callModel(model, systemPrompt, userPrompt, signal) {
  const res = await fetch(API_URL, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      // OpenRouter attribution headers (optional but recommended)
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "Adaptive Learning Companion",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const detail = res.status === 429 ? "rate limited" : `HTTP ${res.status}`;
    throw new LLMError(`${model} failed (${detail}).`);
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let lastError = null;

  try {
    for (const model of MODELS) {
      try {
        const json = await callModel(model, systemPrompt, userPrompt, controller.signal);
        return validate ? validate(json) : json;
      } catch (err) {
        if (err.name === "AbortError") {
          throw new LLMError("Request timed out. Check your connection and retry.");
        }
        console.warn(`Model ${model} failed, trying next:`, err.message);
        lastError = err;
      }
    }
  } finally {
    clearTimeout(timer);
  }

  throw new LLMError(
    `All models failed (last error: ${lastError?.message ?? "unknown"}). Wait a few seconds and retry.`
  );
}

// ---------------------------------------------------------------------------
// Streaming chat (plain markdown, not JSON) — used by the follow-up chat panel.
// ---------------------------------------------------------------------------

async function streamModel(model, messages, signal, onToken) {
  const res = await fetch(API_URL, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "Adaptive Learning Companion",
    },
    body: JSON.stringify({ model, messages, temperature: 0.5, stream: true }),
  });

  if (!res.ok || !res.body) {
    const detail = res.status === 429 ? "rate limited" : `HTTP ${res.status}`;
    throw new LLMError(`${model} failed (${detail}).`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
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
  if (!full.trim()) throw new LLMError(`${model} returned an empty response.`);
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let lastError = null;
  try {
    for (const model of MODELS) {
      try {
        return await streamModel(model, messages, controller.signal, onToken);
      } catch (err) {
        if (err.name === "AbortError") throw new LLMError("Request timed out. Retry.");
        console.warn(`Stream model ${model} failed, trying next:`, err.message);
        lastError = err;
      }
    }
  } finally {
    clearTimeout(timer);
  }
  throw new LLMError(`All models failed (last: ${lastError?.message ?? "unknown"}). Retry.`);
}
