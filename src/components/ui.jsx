// Small shared UI pieces used across stages.

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-6 ${className}`}>
      {children}
    </div>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl bg-indigo-500 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl border border-slate-700 px-5 py-2.5 font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ label = "Thinking…" }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-slate-400">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-800/60 bg-rose-950/40 p-6 text-center">
      <p className="mb-1 font-semibold text-rose-300">Something went wrong</p>
      <p className="mb-4 text-sm text-rose-200/80">{message}</p>
      {onRetry && <PrimaryButton onClick={onRetry}>Retry</PrimaryButton>}
    </div>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-800 text-slate-300",
    green: "bg-emerald-900/60 text-emerald-300",
    red: "bg-rose-900/60 text-rose-300",
    amber: "bg-amber-900/60 text-amber-300",
    indigo: "bg-indigo-900/60 text-indigo-300",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function StageHeading({ kicker, title, subtitle }) {
  return (
    <div className="mb-6">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-400">{kicker}</p>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}
