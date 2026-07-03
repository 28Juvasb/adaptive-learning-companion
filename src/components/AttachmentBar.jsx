import { useState } from "react";
import FileDropzone from "./FileDropzone.jsx";

// Slim, collapsible file-attach control shown on the first five stages so the
// student can ground the tutor with PDFs/DOCX at any point in the flow.
export default function AttachmentBar({ state, dispatch }) {
  const [open, setOpen] = useState(false);
  const count = state.attachments.length;

  return (
    <div className="mx-auto mb-6 max-w-2xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-black/5 bg-white/60 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white"
      >
        <span>📎 {count > 0 ? `${count} file${count > 1 ? "s" : ""} grounding the tutor` : "Attach study material (PDF / DOCX)"}</span>
        <span className="text-slate-400">{open ? "Hide" : count > 0 ? "Manage" : "Add"}</span>
      </button>
      {open && (
        <div className="mt-2">
          <FileDropzone
            attachments={state.attachments}
            onAdd={(a) => dispatch({ type: "ADD_ATTACHMENT", attachment: a })}
            onRemove={(name) => dispatch({ type: "REMOVE_ATTACHMENT", name })}
          />
        </div>
      )}
    </div>
  );
}
