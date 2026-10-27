interface GradientSpheresProps {
  /**
   * "hero" renders the full 3-sphere composition (coral + teal + violet).
   * "accent" renders a single small sphere for use in other sections —
   * never combine more than one accent-variant instance in the same
   * viewport (max 3 spheres visible per viewport, Section 3.6).
   */
  variant?: "hero" | "accent";
  /** Which color to use for the "accent" variant. Ignored for "hero". */
  color?: "coral" | "teal" | "violet";
}

const ACCENT_COLOR: Record<NonNullable<GradientSpheresProps["color"]>, string> = {
  coral: "#ff6b6b",
  teal: "#14b8a6",
  violet: "#8b5cf6",
};

/**
 * Pure CSS, no JavaScript, `aria-hidden` and `pointer-events-none` so it
 * never intercepts focus or clicks. Animation is disabled globally under
 * `prefers-reduced-motion` via the `@media` rule in globals.css.
 */
export function GradientSpheres({ variant = "hero", color = "violet" }: GradientSpheresProps) {
  if (variant === "accent") {
    const hex = ACCENT_COLOR[color];
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute rounded-full blur-[60px] md:blur-[70px]"
          style={{
            width: 320,
            height: 320,
            top: "20%",
            right: "-80px",
            opacity: 0.18,
            background: `radial-gradient(circle at 30% 30%, ${hex} 0%, transparent 65%)`,
            willChange: "transform",
            animation: "float-a 24s ease-in-out infinite alternate",
          }}
        />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute rounded-full blur-[60px] md:blur-[80px]"
        style={{
          width: 520,
          height: 520,
          top: -120,
          right: -100,
          opacity: 0.28,
          background: "radial-gradient(circle at 30% 30%, #ff6b6b 0%, transparent 65%)",
          willChange: "transform",
          animation: "float-a 22s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute rounded-full blur-[60px] md:blur-[80px]"
        style={{
          width: 420,
          height: 420,
          bottom: -100,
          left: -80,
          opacity: 0.26,
          background: "radial-gradient(circle at 30% 30%, #14b8a6 0%, transparent 65%)",
          willChange: "transform",
          animation: "float-b 26s ease-in-out infinite alternate",
          animationDelay: "-6s",
        }}
      />
      <div
        className="absolute rounded-full blur-[60px] md:blur-[80px]"
        style={{
          width: 360,
          height: 360,
          top: "35%",
          left: "48%",
          opacity: 0.2,
          background: "radial-gradient(circle at 30% 30%, #8b5cf6 0%, transparent 65%)",
          willChange: "transform",
          animation: "float-c 30s ease-in-out infinite alternate",
          animationDelay: "-12s",
        }}
      />
    </div>
  );
}
