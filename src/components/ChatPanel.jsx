import { useState, useRef, useEffect } from "react";
import { streamTutorAnswer } from "../lib/prompts.js";
import { groundingText } from "../state/sessionReducer.js";
import Markdown from "./Markdown.jsx";
import FileDropzone from "./FileDropzone.jsx";

const SUGGESTIONS = [
  "Give me a detailed case study on this",
  "Explain this more in depth",
  "Show me a worked code example",
];

// Always-available tutor chat. Streams in-depth, code-aware answers grounded in
// the session (topic, level, lesson, uploaded docs) + conversation history.
export default function ChatPanel({ state, dispatch }) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(null); // partial assistant text while generating
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [state.chat, streaming]);

  async function ask(question) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setError(null);
    setBusy(true);

    const historyBefore = state.chat;
    dispatch({ type: "ADD_CHAT_MESSAGE", message: { role: "user", content: q } });
    setStreaming("");

    let full = "";
    try {
      full = await streamTutorAnswer(
        {
          topic: state.topic,
          level: state.level,
          resources: groundingText(state),
          lesson: state.lesson,
          history: historyBefore,
          question: q,
        },
        (token) => setStreaming((prev) => (prev ?? "") + token)
      );
      dispatch({ type: "ADD_CHAT_MESSAGE", message: { role: "assistant", content: full } });
    } catch (err) {
      setError(err.message ?? "The tutor couldn't answer. Retry.");
    } finally {
      setStreaming(null);
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-black/5 bg-white/70">
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h3 className="font-bold text-[#16202e]">Ask your tutor</h3>
        </div>
        <button
          onClick={() => setShowUpload((s) => !s)}
          className="text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-800"
        >
          {state.attachments.length > 0
            ? `${state.attachments.length} file${state.attachments.length > 1 ? "s" : ""} attached`
            : "Attach a file"}
        </button>
      </div>

      {showUpload && (
        <div className="border-b border-black/5 px-5 py-3">
          <FileDropzone
            compact
            attachments={state.attachments}
            onAdd={(a) => dispatch({ type: "ADD_ATTACHMENT", attachment: a })}
            onRemove={(name) => dispatch({ type: "REMOVE_ATTACHMENT", name })}
          />
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4" style={{ maxHeight: 460 }}>
        {state.chat.length === 0 && streaming === null && (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">
              Ask anything about <span className="font-semibold">{state.topic}</span> — I'll answer in
              depth, with code and case studies where they help.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.chat.map((m, i) => (
          <ChatBubble key={i} role={m.role} content={m.content} />
        ))}

        {streaming !== null && (
          <ChatBubble role="assistant" content={streaming} streaming />
        )}

        {error && <p className="text-center text-xs font-medium text-rose-600">{error}</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-end gap-2 border-t border-black/5 px-4 py-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          rows={1}
          placeholder="Ask a follow-up… (Shift+Enter for newline)"
          className="max-h-32 flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-[#16202e] px-4 py-2 font-semibold text-white transition hover:bg-[#26313f] disabled:opacity-40"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ role, content, streaming = false }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#16202e] px-4 py-2.5 text-sm text-white">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-black/5 bg-blue-50/60 px-4 py-2.5 text-sm">
        {content ? (
          <div className={streaming ? "stream-caret" : ""}>
            <Markdown>{content}</Markdown>
          </div>
        ) : (
          <span className="text-slate-400">Thinking…</span>
        )}
      </div>
    </div>
  );
}
