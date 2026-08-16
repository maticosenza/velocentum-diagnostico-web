import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutList, FilePlus2, PanelLeftClose, PanelLeft, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        <span className="grid size-6 shrink-0 place-items-center rounded-[5px] bg-primary text-[11px] font-medium text-primary-foreground">
          V
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium leading-4 text-foreground">Velocentum</p>
            <p className="truncate text-[11px] leading-4 text-muted-foreground">
              Cockpit de Diagnóstico
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {!collapsed && (
          <p className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
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
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                active
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-border p-2">
        <button
          type="button"
          onClick={cerrarSesion}
          title="Cerrar sesión"
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
        <button

          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
        >
          {collapsed ? (
            <PanelLeft className="size-4" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="size-4" strokeWidth={1.75} />
          )}
          {!collapsed && <span>Contraer</span>}
        </button>
      </div>
    </aside>
  );
}
