import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: LayoutPrivado,
});

function LayoutPrivado() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
