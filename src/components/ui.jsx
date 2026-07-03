// Shared UI primitives — light "warm cream" theme with per-stage accent colors.

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border p-6 ${className || "border-black/5 bg-white/60"}`}>
      {children}
    </div>
  );
}

// The one primary action per screen. Dark-navy solid, per the design reference.
export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl bg-[#16202e] px-5 py-2.5 font-semibold text-white transition hover:bg-[#26313f] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Text-link style secondary action (e.g. "Skip diagnosis").
export function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      className={`rounded-xl px-4 py-2.5 font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-800 disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ label = "Thinking…", tone = "text-slate-400" }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-slate-500">
      <div className={`h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-current ${tone}`} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
      <p className="mb-1 font-bold text-rose-700">Something went wrong</p>
      <p className="mb-4 text-sm text-rose-600">{message}</p>
      {onRetry && <PrimaryButton onClick={onRetry}>Retry</PrimaryButton>}
    </div>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    teal: "bg-teal-100 text-teal-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

// kicker (STEP N OF 6 · STAGE) in the stage accent color, then a big title.
export function StageHeading({ kicker, title, subtitle, accent = "text-slate-500" }) {
  return (
    <div className="mb-6">
      <p className={`mb-1 text-xs font-extrabold uppercase tracking-[0.18em] ${accent}`}>{kicker}</p>
      <h2 className="text-3xl font-extrabold text-[#16202e]">{title}</h2>
      {subtitle && <p className="mt-2 text-[15px] text-slate-500">{subtitle}</p>}
    </div>
  );
}
