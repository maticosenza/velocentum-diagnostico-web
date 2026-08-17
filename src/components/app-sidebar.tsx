import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutList, FilePlus2, PanelLeftClose, PanelLeft, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import logoVelocentum from "@/assets/velocentum-icon.png";

const items = [
  { title: "Diagnósticos", url: "/", icon: LayoutList, exact: true },
  { title: "Nuevo diagnóstico", url: "/diagnosticos/nuevo", icon: FilePlus2, exact: false },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  async function cerrarSesion() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }


  const isActive = (url: string, exact: boolean) =>
    exact ? pathname === url : pathname.startsWith(url);

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <img
          src={logoVelocentum}
          alt="Velocentum"
          className="size-7 shrink-0 rounded-[6px] object-contain"
        />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium leading-5 text-foreground">Velocentum</p>
            <p className="truncate text-[11.5px] leading-4 text-muted-foreground">
              Diagnóstico e-commerce
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {!collapsed && (
          <p className="px-2 pb-2 pt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            Trabajo
          </p>
        )}
        {items.map((item) => {
          const active = isActive(item.url, item.exact);
          return (
            <Link
              key={item.url}
              to={item.url}
              title={item.title}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-2.5 py-2.5 text-[14px] transition-colors",
                active
                  ? "bg-violet-soft font-medium text-violet"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-[18px] shrink-0" strokeWidth={1.75} />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <button
          type="button"
          onClick={cerrarSesion}
          title="Cerrar sesión"
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-[18px] shrink-0" strokeWidth={1.75} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
        <button

          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[13.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
        >
          {collapsed ? (
            <PanelLeft className="size-[18px]" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="size-[18px]" strokeWidth={1.75} />
          )}
          {!collapsed && <span>Contraer</span>}
        </button>
      </div>
    </aside>
  );
}
