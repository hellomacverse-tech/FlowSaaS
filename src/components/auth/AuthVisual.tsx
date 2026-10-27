import { GradientSpheres } from "@/components/layout/GradientSpheres";
import { HeroFlowVisual } from "@/components/home/HeroFlowVisual";

export function AuthVisual() {
  return (
    <div className="relative hidden items-center justify-center overflow-hidden bg-surface lg:flex">
      <GradientSpheres variant="hero" />
      <div className="relative z-10 max-w-sm px-8">
        <HeroFlowVisual />
        <p className="mt-8 text-center text-sm text-ink-2">
          Join agencies and founders automating Messenger, lead gen, and order workflows with n8n.
        </p>
      </div>
    </div>
  );
}
