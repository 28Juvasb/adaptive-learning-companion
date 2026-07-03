// Per-stage color system, derived from the design reference.
// Each stage owns an accent color that flows through the progress bar,
// the kicker text, tinted cards, and badges. Tailwind class names are kept
// as static strings so the JIT compiler can see them.

export const STAGE_THEME = {
  setup: {
    label: "Setup",
    accent: "text-emerald-600",
    bar: "bg-emerald-500",
    ring: "focus:border-emerald-500",
    card: "bg-emerald-50 border-emerald-200",
    solidBtn: "bg-emerald-600 hover:bg-emerald-500",
  },
  diagnose: {
    label: "Diagnose",
    accent: "text-blue-600",
    bar: "bg-blue-500",
    ring: "focus:border-blue-500",
    card: "bg-blue-50 border-blue-200",
    solidBtn: "bg-blue-600 hover:bg-blue-500",
  },
  remediate: {
    label: "Remediate",
    accent: "text-orange-600",
    bar: "bg-orange-500",
    ring: "focus:border-orange-500",
    card: "bg-orange-50 border-orange-200",
    solidBtn: "bg-orange-600 hover:bg-orange-500",
  },
  teach: {
    label: "Teach",
    accent: "text-amber-600",
    bar: "bg-amber-400",
    ring: "focus:border-amber-500",
    card: "bg-amber-50 border-amber-200",
    solidBtn: "bg-amber-500 hover:bg-amber-400",
  },
  reinforce: {
    label: "Reinforce",
    accent: "text-teal-600",
    bar: "bg-teal-400",
    ring: "focus:border-teal-500",
    card: "bg-teal-50 border-teal-200",
    solidBtn: "bg-teal-600 hover:bg-teal-500",
  },
  review: {
    label: "Review",
    accent: "text-sky-600",
    bar: "bg-sky-400",
    ring: "focus:border-sky-500",
    card: "bg-sky-50 border-sky-200",
    solidBtn: "bg-sky-600 hover:bg-sky-500",
  },
};

export const STAGE_ORDER = ["setup", "diagnose", "remediate", "teach", "reinforce", "review"];

export function stageTheme(stage) {
  return STAGE_THEME[stage] ?? STAGE_THEME.setup;
}
