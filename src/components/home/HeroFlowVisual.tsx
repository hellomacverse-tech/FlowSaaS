import { MessageCircle, Sparkles, Sheet, Bell } from "lucide-react";

const nodes = [
  { label: "Facebook Messenger", status: "Listening…", icon: MessageCircle, tone: "coral" as const },
  { label: "AI Agent", status: "Qualified lead ✓", icon: Sparkles, tone: "violet" as const },
  { label: "Google Sheets", status: "Row added", icon: Sheet, tone: "teal" as const },
  { label: "Slack alert", status: "Sent", icon: Bell, tone: "violet" as const },
];

const toneClasses = {
  coral: "bg-coral-50 text-coral-700",
  violet: "bg-violet-50 text-violet-600",
  teal: "bg-teal-50 text-teal-700",
};

/**
 * Pure SVG/CSS, no images, so it never delays the H1 (the LCP element).
 * Renders as a static frame under `prefers-reduced-motion`; the connecting
 * path plays a slow dash-offset flow animation otherwise (Section 9.1.1).
 */
export function HeroFlowVisual() {
  return (
    <div className="relative mx-auto flex max-w-sm flex-col gap-4" aria-hidden="true">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 320 420" fill="none">
        <path
          d="M 60 50 C 60 130, 260 90, 260 170 C 260 250, 60 210, 60 290 C 60 340, 160 340, 160 370"
          stroke="url(#hero-flow-gradient)"
          strokeWidth="2"
          strokeDasharray="6 6"
          className="motion-safe:animate-[dash_6s_linear_infinite]"
        />
        <defs>
          <linearGradient id="hero-flow-gradient" x1="0" y1="0" x2="320" y2="420">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>

      {nodes.map((node, index) => {
        const Icon = node.icon;
        return (
          <div
            key={node.label}
            className="relative z-10 flex items-center gap-3 rounded-2xl border border-line/70 bg-white p-3.5 shadow-md motion-safe:animate-[float-a_5s_ease-in-out_infinite_alternate]"
            style={{
              marginLeft: index % 2 === 0 ? 0 : "auto",
              width: "min(240px, 90%)",
              animationDelay: `${index * -0.6}s`,
            }}
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClasses[node.tone]}`}>
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{node.label}</p>
              <p className="truncate text-xs text-muted">{node.status}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
