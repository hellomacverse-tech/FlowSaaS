import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DesktopSidebar, MobileTabBar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, credits_included, credits_used, email")
    .eq("id", user.id)
    .single();

  const tier = (profile?.tier as "free" | "vip" | "enterprise") ?? "free";
  const creditsIncluded = profile?.credits_included ?? 50;
  const creditsRemaining = Math.max(0, creditsIncluded - (profile?.credits_used ?? 0));

  return (
    <div className="flex min-h-screen bg-surface">
      <DesktopSidebar tier={tier} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar email={profile?.email ?? user.email ?? ""} creditsRemaining={creditsRemaining} creditsIncluded={creditsIncluded} />
        <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:px-6 md:pb-8">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
