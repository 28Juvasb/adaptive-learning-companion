import { useState, useRef, useCallback } from "react";
import { parseFile, ACCEPTED } from "../lib/fileParse.js";

// Drag-and-drop (or click) upload for PDF / DOCX / TXT / MD.
// Parses each file to text and reports it via onAdd({name, chars, text}).
// Existing attachments are shown as removable chips.
export default function FileDropzone({ attachments, onAdd, onRemove, compact = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    async (fileList) => {
      setError(null);
      const files = Array.from(fileList);
      for (const file of files) {
        setBusy(true);
        try {
          const parsed = await parseFile(file);
          onAdd(parsed);
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }
    },
    [onAdd]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition ${
          compact ? "px-3 py-3" : "px-4 py-6"
        } ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-slate-300 bg-white/50 hover:border-slate-400 hover:bg-white"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-sm font-semibold text-slate-600">
          {busy ? "Reading file…" : "Drop a PDF or Word doc here, or click to browse"}
        </p>
        {!compact && (
          <p className="mt-0.5 text-xs text-slate-400">PDF, DOCX, TXT, MD · used to ground the tutor</p>
        )}
      </div>

      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}

      {attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((a) => (
            <span
              key={a.name}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              📄 {a.name}
              <span className="text-slate-400">{(a.chars / 1000).toFixed(1)}k chars</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(a.name);
                }}
                className="text-slate-400 transition hover:text-rose-600"
                aria-label={`Remove ${a.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
